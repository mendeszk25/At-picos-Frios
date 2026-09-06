import test from 'node:test';
import assert from 'node:assert/strict';
import cryptoNode from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import {
  pbkdf2Hex,
  sha256Hex,
  tokenAleatorio,
  verificarSenhaHash,
  normalizarProduto,
} from '../supabase/functions/_shared/security.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('senha correta passa e senha incorreta falha usando PBKDF2', async () => {
  const senha = `teste-${cryptoNode.randomBytes(16).toString('hex')}`;
  const salt = cryptoNode.randomBytes(32).toString('hex');
  const hash = await pbkdf2Hex(senha, salt, 310000);
  assert.equal(await verificarSenhaHash(senha, hash, salt, 310000), true);
  assert.equal(await verificarSenhaHash(`${senha}-errada`, hash, salt, 310000), false);
});

test('sessões usam token aleatório e somente hash pode ser persistido', async () => {
  const a = tokenAleatorio(32);
  const b = tokenAleatorio(32);
  assert.match(a, /^[a-f0-9]{64}$/);
  assert.notEqual(a, b);
  const hash = await sha256Hex(a);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.notEqual(hash, a);
});

test('validação de produto rejeita dados e imagem inválidos', () => {
  const valido = normalizarProduto({ nome: 'Produto', descricao: '', unidade: 'un.', imagem: 'images/em-breve.png', preco: 10, precoAntigo: null, catalogo: true, novo: false, oferta: false, destaque: false, disponivel: true });
  assert.equal(valido.nome, 'Produto');
  assert.throws(() => normalizarProduto({ ...valido, nome: '' }), /product\/invalid-data/);
  assert.throws(() => normalizarProduto({ ...valido, imagem: 'javascript:alert(1)' }), /product\/invalid-image/);
});

test('todas as mutações e uploads no servidor exigem sessão', () => {
  const fonte = fs.readFileSync(path.join(root, 'supabase/functions/admin-api/index.ts'), 'utf8');
  for (const nome of ['criarProduto', 'atualizarProduto', 'removerProduto', 'importar', 'enviarImagem']) {
    const inicio = fonte.indexOf(`async function ${nome}`);
    assert.ok(inicio >= 0, `${nome} existe`);
    const trecho = fonte.slice(inicio, fonte.indexOf('\n}', inicio) + 2);
    assert.match(trecho, /await exigirSessao\(req, supabase\)/, `${nome} exige sessão`);
  }
});

test('RLS permite leitura pública de produtos e não cria escrita pública', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/202609060001_atipicos.sql'), 'utf8');
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /for select\s+to anon, authenticated\s+using \(true\)/i);
  assert.match(sql, /revoke insert, update, delete/i);
  assert.doesNotMatch(sql, /for (insert|update|delete)\s+to anon/i);
});

test('cliente limpa a sessão no logout e bloqueia alteração sem sessão', async () => {
  const codigo = fs.readFileSync(path.join(root, 'backend-client.js'), 'utf8');
  const armazenamento = new Map();
  const sessionStorage = {
    getItem: (k) => armazenamento.has(k) ? armazenamento.get(k) : null,
    setItem: (k, v) => armazenamento.set(k, String(v)),
    removeItem: (k) => armazenamento.delete(k),
  };
  const token = 'a'.repeat(64);
  const expiraEm = Date.now() + 60_000;
  const chamadas = [];
  const contexto = {
    window: { ATIPICOS_BACKEND_CONFIG: { supabaseUrl: 'https://abcdef.supabase.co', publishableKey: 'public-test-key' } },
    sessionStorage,
    navigator: { onLine: true },
    FormData, URL, TextEncoder, console, setTimeout, clearTimeout,
    fetch: async (url, opts = {}) => {
      chamadas.push([url, opts]);
      if (String(url).endsWith('/login')) return new Response(JSON.stringify({ sessao: token, expiraEm }), { status: 200, headers: { 'content-type': 'application/json' } });
      if (String(url).endsWith('/session')) return new Response(JSON.stringify({ ok: true, expiraEm }), { status: 200, headers: { 'content-type': 'application/json' } });
      if (String(url).endsWith('/logout')) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
      return new Response('{}', { status: 200 });
    },
  };
  contexto.window.window = contexto.window;
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  const api = contexto.window.AtipicosBackend;
  await api.entrar('senha-de-teste');
  assert.ok(api._sessao.ler());
  assert.equal(chamadas.filter(([u]) => /\/(login|session)$/.test(String(u))).length, 1, 'login não faz GET /session redundante');
  assert.ok(chamadas.some(([u]) => String(u).endsWith('/login')));
  assert.ok(!chamadas.some(([u]) => String(u).endsWith('/session')));
  await api.sair();
  assert.equal(api._sessao.ler(), null);
  await assert.rejects(() => api.atualizarProduto('1', { nome: 'x' }), (e) => e?.code === 'auth/session-expired');
  assert.ok(chamadas.some(([u]) => String(u).endsWith('/logout')));
});


test('mensagens distinguem senha incorreta, configuração ausente e indisponibilidade', () => {
  const codigo = fs.readFileSync(path.join(root, 'backend-client.js'), 'utf8');
  const contexto = {
    window: { ATIPICOS_BACKEND_CONFIG: { supabaseUrl: 'https://abcdef.supabase.co', publishableKey: 'public-test-key' } },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    navigator: { onLine: true }, FormData, URL, TextEncoder, console, fetch: async () => new Response('{}'),
  };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  const mensagem = contexto.window.AtipicosBackend.mensagem;
  const errada = mensagem({ code: 'auth/password-incorrect' });
  const config = mensagem({ code: 'service/not-configured' });
  const indisponivel = mensagem({ code: 'service/unavailable' });
  assert.match(errada, /Senha incorreta/);
  assert.match(config, /ainda não configurado/i);
  assert.match(indisponivel, /temporariamente indisponível/i);
  assert.notEqual(errada, config);
  assert.notEqual(config, indisponivel);
});

test('build público não contém backend privado nem senha solicitada', () => {
  const arquivos = [];
  const caminhar = (dir) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, item.name);
      if (item.isDirectory()) caminhar(p); else arquivos.push(p);
    }
  };
  caminhar(path.join(root, 'public'));
  const texto = arquivos.filter((p) => /\.(html|js|css|json|txt)$/i.test(p)).map((p) => fs.readFileSync(p, 'utf8')).join('\n');
  assert.doesNotMatch(texto, /ATIPICOS_ADMIN_PASSWORD_HASH/);
  assert.doesNotMatch(texto, /ATIPICOS_ADMIN_PASSWORD_SALT/);
  assert.equal(fs.existsSync(path.join(root, 'public', 'supabase')), false);
});


test('login visual separa carregamento verde de erros reais', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
  assert.match(html, /class="admin-login-status"/);
  assert.match(css, /\.admin-login-status--loading[\s\S]*var\(--verde-wa\)/);
  assert.match(css, /\.admin-login-status--error[\s\S]*#ff6d69/);
  assert.match(js, /if \(!form\.checkValidity\(\)\)[\s\S]*form\.reportValidity\(\)[\s\S]*definirStatus\('loading', 'Entrando…'\)/);
});

test('rate limits de IP e global continuam obrigatórios e são reservados em paralelo', () => {
  const fonte = fs.readFileSync(path.join(root, 'supabase/functions/admin-api/index.ts'), 'utf8');
  assert.match(fonte, /await Promise\.all\(\[[\s\S]*reservarTentativa\(supabase, `ip:\$\{ipHash\}`,[\s\S]*reservarTentativa\(supabase, 'global:login'/);
});
