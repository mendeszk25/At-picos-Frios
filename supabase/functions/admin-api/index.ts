import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  normalizarProduto,
  sha256Hex,
  tokenAleatorio,
  verificarSenhaHash,
} from '../_shared/security.js';

const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000;
const JANELA_LOGIN_SEGUNDOS = 15 * 60;
const MAX_POR_IP = 8;
const MAX_GLOBAL = 30;
const TAMANHO_MAX_IMAGEM = 1572864;
const ID_RE = /^[a-zA-Z0-9_-]{1,80}$/;

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'apikey,authorization,content-type,x-atipicos-session',
  'access-control-max-age': '86400',
};

class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;
  constructor(status: number, code: string, details?: Record<string, unknown>) {
    super(code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function json(status: number, corpo: Record<string, unknown>) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function obterChaveSecreta() {
  const moderno = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (moderno) {
    try {
      const mapa = JSON.parse(moderno);
      if (typeof mapa?.default === 'string' && mapa.default) return mapa.default;
      const primeira = Object.values(mapa || {}).find((v) => typeof v === 'string' && v);
      if (typeof primeira === 'string') return primeira;
    } catch (_) { /* usa chave legada abaixo */ }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}

function obterChavesPublicas() {
  const chaves = new Set<string>();
  const moderno = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (moderno) {
    try {
      const mapa = JSON.parse(moderno);
      for (const valor of Object.values(mapa || {})) if (typeof valor === 'string' && valor) chaves.add(valor);
    } catch (_) { /* ignora JSON inválido */ }
  }
  const legado = Deno.env.get('SUPABASE_ANON_KEY');
  if (legado) chaves.add(legado);
  return chaves;
}

function clienteAdmin() {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = obterChaveSecreta();
  if (!url || !key) throw new ApiError(503, 'service/not-configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function exigirChavePublica(req: Request) {
  const enviada = req.headers.get('apikey') || '';
  const validas = obterChavesPublicas();
  if (!validas.size) throw new ApiError(503, 'service/not-configured');
  if (!enviada || !validas.has(enviada)) throw new ApiError(401, 'app/not-configured');
}

async function corpoJson(req: Request) {
  try { return await req.json(); }
  catch (_) { throw new ApiError(400, 'request/invalid-json'); }
}

function segredoSenha() {
  const hash = Deno.env.get('ATIPICOS_ADMIN_PASSWORD_HASH') || '';
  const salt = Deno.env.get('ATIPICOS_ADMIN_PASSWORD_SALT') || '';
  const iteracoes = Number(Deno.env.get('ATIPICOS_ADMIN_PASSWORD_ITERATIONS') || '600000');
  const pepper = Deno.env.get('ATIPICOS_RATE_PEPPER') || '';
  if (!/^[a-f0-9]{64}$/i.test(hash) || !/^[a-f0-9]{32,128}$/i.test(salt) || salt.length % 2 !== 0 ||
      !Number.isInteger(iteracoes) || iteracoes < 310000 || iteracoes > 1000000 || pepper.length < 32) {
    throw new ApiError(503, 'service/not-configured');
  }
  return { hash, salt, iteracoes, pepper };
}

function ipDoRequest(req: Request) {
  return req.headers.get('cf-connecting-ip')
    || req.headers.get('x-real-ip')
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'desconhecido';
}

async function reservarTentativa(supabase: ReturnType<typeof createClient>, chave: string, limite: number) {
  const { data, error } = await supabase.rpc('atipicos_reservar_tentativa', {
    p_chave: chave,
    p_limite: limite,
    p_janela_segundos: JANELA_LOGIN_SEGUNDOS,
  });
  if (error) {
    console.error('rate_limit_error', error.code || 'unknown');
    throw new ApiError(503, 'service/not-configured');
  }
  const r = Array.isArray(data) ? data[0] : data;
  if (!r?.permitido) {
    throw new ApiError(429, 'auth/too-many-attempts', {
      tentarEmSegundos: Number(r?.tentar_em_segundos) || JANELA_LOGIN_SEGUNDOS,
    });
  }
}

async function criarSessao(supabase: ReturnType<typeof createClient>) {
  const token = tokenAleatorio(32);
  const hash = await sha256Hex(token);
  const expiraEm = Date.now() + DURACAO_SESSAO_MS;
  const { error } = await supabase.from('atipicos_sessoes').insert({
    hash,
    expira: new Date(expiraEm).toISOString(),
  });
  if (error) {
    console.error('session_create_error', error.code || 'unknown');
    throw new ApiError(503, 'service/not-configured');
  }
  return { token, hash, expiraEm };
}

async function exigirSessao(req: Request, supabase: ReturnType<typeof createClient>) {
  const token = req.headers.get('x-atipicos-session') || '';
  if (!/^[a-f0-9]{64}$/i.test(token)) throw new ApiError(401, 'auth/session-expired');
  const hash = await sha256Hex(token);
  const { data, error } = await supabase
    .from('atipicos_sessoes')
    .select('expira')
    .eq('hash', hash)
    .maybeSingle();
  if (error) {
    console.error('session_read_error', error.code || 'unknown');
    throw new ApiError(503, 'service/unavailable');
  }
  if (!data?.expira) throw new ApiError(401, 'auth/session-expired');
  const expiraEm = Date.parse(data.expira);
  if (!Number.isFinite(expiraEm) || expiraEm <= Date.now()) {
    await supabase.from('atipicos_sessoes').delete().eq('hash', hash);
    throw new ApiError(401, 'auth/session-expired');
  }
  return { hash, expiraEm };
}

async function login(req: Request, supabase: ReturnType<typeof createClient>) {
  const corpo = await corpoJson(req);
  const senha = typeof corpo?.senha === 'string' ? corpo.senha : '';
  if (!senha || new TextEncoder().encode(senha).length > 512) throw new ApiError(400, 'auth/invalid-password');

  const cfg = segredoSenha();
  const ipHash = await sha256Hex(`${cfg.pepper}:${ipDoRequest(req)}`);
  // Os dois limites são independentes. Reservá-los em paralelo mantém ambos
  // obrigatórios e evita pagar duas latências de RPC em sequência.
  await Promise.all([
    reservarTentativa(supabase, `ip:${ipHash}`, MAX_POR_IP),
    reservarTentativa(supabase, 'global:login', MAX_GLOBAL),
  ]);

  let correta = false;
  try {
    correta = await verificarSenhaHash(senha, cfg.hash, cfg.salt, cfg.iteracoes);
  } catch (_) {
    throw new ApiError(503, 'service/not-configured');
  }
  if (!correta) throw new ApiError(401, 'auth/password-incorrect');

  // Limpa lixo antigo sem depender de cron pago.
  await supabase.from('atipicos_sessoes').delete().lte('expira', new Date().toISOString());
  const sessao = await criarSessao(supabase);
  return json(200, { sessao: sessao.token, expiraEm: sessao.expiraEm });
}

function validarId(id: string) {
  if (!ID_RE.test(id)) throw new ApiError(400, 'product/invalid-data');
  return id;
}

function produtoSeguro(dados: unknown) {
  try { return normalizarProduto(dados); }
  catch (e) {
    const code = e instanceof Error && e.message === 'product/invalid-image'
      ? 'product/invalid-image' : 'product/invalid-data';
    throw new ApiError(400, code);
  }
}

function caminhoImagemPropria(url: string) {
  try {
    const alvo = new URL(url);
    const base = new URL(Deno.env.get('SUPABASE_URL') || 'https://invalid.local');
    if (alvo.origin !== base.origin) return null;
    const marcador = '/storage/v1/object/public/produtos/';
    const i = alvo.pathname.indexOf(marcador);
    if (i < 0) return null;
    const caminho = decodeURIComponent(alvo.pathname.slice(i + marcador.length));
    if (!caminho || caminho.includes('..')) return null;
    return caminho;
  } catch (_) { return null; }
}

async function apagarImagemSePropria(supabase: ReturnType<typeof createClient>, url: unknown) {
  if (typeof url !== 'string') return;
  const caminho = caminhoImagemPropria(url);
  if (!caminho) return;
  const { error } = await supabase.storage.from('produtos').remove([caminho]);
  if (error) console.error('image_cleanup_error', error.message);
}

async function criarProduto(req: Request, supabase: ReturnType<typeof createClient>) {
  await exigirSessao(req, supabase);
  const corpo = await corpoJson(req);
  const dados = produtoSeguro(corpo?.dados);
  const id = crypto.randomUUID();
  const { error } = await supabase.from('atipicos_produtos').insert({ id, dados });
  if (error) {
    console.error('product_create_error', error.code || 'unknown');
    throw new ApiError(503, 'service/unavailable');
  }
  return json(201, { id });
}

async function atualizarProduto(req: Request, supabase: ReturnType<typeof createClient>, id: string) {
  await exigirSessao(req, supabase);
  validarId(id);
  const corpo = await corpoJson(req);
  const dados = produtoSeguro(corpo?.dados);
  const { data: anterior, error: lerErro } = await supabase
    .from('atipicos_produtos').select('dados').eq('id', id).maybeSingle();
  if (lerErro) throw new ApiError(503, 'service/unavailable');
  if (!anterior) throw new ApiError(404, 'product/not-found');

  const { data, error } = await supabase.from('atipicos_produtos')
    .update({ dados, atualizado_em: new Date().toISOString() })
    .eq('id', id).select('id').maybeSingle();
  if (error) throw new ApiError(503, 'service/unavailable');
  if (!data) throw new ApiError(404, 'product/not-found');
  if (anterior?.dados?.imagem && anterior.dados.imagem !== dados.imagem) {
    await apagarImagemSePropria(supabase, anterior.dados.imagem);
  }
  return json(200, { id });
}

async function removerProduto(req: Request, supabase: ReturnType<typeof createClient>, id: string) {
  await exigirSessao(req, supabase);
  validarId(id);
  const { data: anterior, error: lerErro } = await supabase
    .from('atipicos_produtos').select('dados').eq('id', id).maybeSingle();
  if (lerErro) throw new ApiError(503, 'service/unavailable');
  if (!anterior) throw new ApiError(404, 'product/not-found');

  const { error } = await supabase.from('atipicos_produtos').delete().eq('id', id);
  if (error) throw new ApiError(503, 'service/unavailable');
  await apagarImagemSePropria(supabase, anterior?.dados?.imagem);
  return json(200, { ok: true });
}

async function importar(req: Request, supabase: ReturnType<typeof createClient>) {
  await exigirSessao(req, supabase);
  const corpo = await corpoJson(req);
  if (!Array.isArray(corpo?.produtos) || !corpo.produtos.length || corpo.produtos.length > 400) {
    throw new ApiError(400, 'product/invalid-data');
  }
  const vistos = new Set<string>();
  const linhas = corpo.produtos.map((p: { id?: unknown; dados?: unknown }) => {
    const id = validarId(String(p?.id || ''));
    if (vistos.has(id)) throw new ApiError(400, 'product/invalid-data');
    vistos.add(id);
    return { id, dados: produtoSeguro(p?.dados) };
  });
  const { error } = await supabase.from('atipicos_produtos')
    .upsert(linhas, { onConflict: 'id', ignoreDuplicates: true });
  if (error) {
    console.error('import_error', error.code || 'unknown');
    throw new ApiError(503, 'service/unavailable');
  }
  return json(200, { importados: linhas.length });
}

async function enviarImagem(req: Request, supabase: ReturnType<typeof createClient>) {
  await exigirSessao(req, supabase);
  let form: FormData;
  try { form = await req.formData(); }
  catch (_) { throw new ApiError(400, 'storage/invalid-file'); }
  const arquivo = form.get('arquivo');
  if (!(arquivo instanceof File) || arquivo.size < 1 || arquivo.size > TAMANHO_MAX_IMAGEM ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) {
    throw new ApiError(400, 'storage/invalid-file');
  }
  const ext = arquivo.type === 'image/jpeg' ? 'jpg' : arquivo.type.split('/')[1];
  const caminho = `${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const { error } = await supabase.storage.from('produtos').upload(caminho, bytes, {
    contentType: arquivo.type,
    upsert: false,
    cacheControl: '3600',
  });
  if (error) {
    console.error('image_upload_error', error.message);
    throw new ApiError(503, 'service/unavailable');
  }
  const { data } = supabase.storage.from('produtos').getPublicUrl(caminho);
  return json(201, { url: data.publicUrl });
}

async function roteador(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  try {
    exigirChavePublica(req);
    const supabase = clienteAdmin();
    const url = new URL(req.url);
    const marcador = '/admin-api';
    const indice = url.pathname.indexOf(marcador);
    const caminho = indice >= 0 ? url.pathname.slice(indice + marcador.length) || '/' : '/';

    if (req.method === 'POST' && caminho === '/login') return await login(req, supabase);
    if (req.method === 'GET' && caminho === '/session') {
      const sessao = await exigirSessao(req, supabase);
      return json(200, { ok: true, expiraEm: sessao.expiraEm });
    }
    if (req.method === 'POST' && caminho === '/logout') {
      const sessao = await exigirSessao(req, supabase);
      await supabase.from('atipicos_sessoes').delete().eq('hash', sessao.hash);
      return json(200, { ok: true });
    }
    if (req.method === 'POST' && caminho === '/products') return await criarProduto(req, supabase);
    if (req.method === 'POST' && caminho === '/import') return await importar(req, supabase);
    if (req.method === 'POST' && caminho === '/images') return await enviarImagem(req, supabase);

    const produto = caminho.match(/^\/products\/([^/]+)$/);
    if (produto && req.method === 'PUT') return await atualizarProduto(req, supabase, decodeURIComponent(produto[1]));
    if (produto && req.method === 'DELETE') return await removerProduto(req, supabase, decodeURIComponent(produto[1]));

    throw new ApiError(404, 'request/not-found');
  } catch (e) {
    if (e instanceof ApiError) return json(e.status, { code: e.code, details: e.details || null });
    console.error('admin_api_unexpected', e instanceof Error ? e.message : 'unknown');
    return json(503, { code: 'service/unavailable' });
  }
}

Deno.serve(roteador);
