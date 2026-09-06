const encoder = new TextEncoder();

export function hexParaBytes(hex) {
  if (typeof hex !== 'string' || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export function bytesParaHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(valor) {
  const entrada = typeof valor === 'string' ? encoder.encode(valor) : valor;
  const digest = await crypto.subtle.digest('SHA-256', entrada);
  return bytesParaHex(new Uint8Array(digest));
}

export async function pbkdf2Hex(senha, saltHex, iteracoes = 600000) {
  const salt = hexParaBytes(saltHex);
  if (!salt || salt.length < 16 || !Number.isInteger(iteracoes) || iteracoes < 310000 || iteracoes > 1000000) {
    throw new Error('configuracao-pbkdf2-invalida');
  }
  const chave = await crypto.subtle.importKey('raw', encoder.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iteracoes, hash: 'SHA-256' }, chave, 256);
  return bytesParaHex(new Uint8Array(bits));
}

export function iguaisTempoConstante(aHex, bHex) {
  const a = hexParaBytes(aHex);
  const b = hexParaBytes(bHex);
  if (!a || !b || a.length !== b.length) return false;
  let diferente = 0;
  for (let i = 0; i < a.length; i++) diferente |= a[i] ^ b[i];
  return diferente === 0;
}

export async function verificarSenhaHash(senha, hashHex, saltHex, iteracoes = 600000) {
  if (typeof senha !== 'string' || !senha.length || new TextEncoder().encode(senha).length > 512) return false;
  if (!/^[0-9a-f]{64}$/i.test(hashHex || '')) throw new Error('configuracao-hash-invalida');
  const calculado = await pbkdf2Hex(senha, saltHex, iteracoes);
  return iguaisTempoConstante(calculado, hashHex);
}

export function tokenAleatorio(bytes = 32) {
  const valor = new Uint8Array(bytes);
  crypto.getRandomValues(valor);
  return bytesParaHex(valor);
}

export function normalizarProduto(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('product/invalid-data');
  const numero = (v) => v === '' || v == null ? null : Number(v);
  const dados = {
    nome: String(p.nome || '').trim(),
    descricao: String(p.descricao || '').trim(),
    unidade: String(p.unidade || 'un.').trim(),
    imagem: String(p.imagem || 'images/em-breve.png'),
    preco: numero(p.preco),
    precoAntigo: numero(p.precoAntigo),
    catalogo: p.catalogo !== false,
    novo: p.novo === true,
    oferta: p.oferta === true,
    destaque: p.destaque === true,
    disponivel: p.disponivel !== false,
  };
  const precoValido = (v) => v === null || (Number.isFinite(v) && v >= 0 && v <= 1000000);
  if (!dados.nome || dados.nome.length > 160 || dados.descricao.length > 1000 || !dados.unidade || dados.unidade.length > 40 ||
      !precoValido(dados.preco) || !precoValido(dados.precoAntigo)) throw new Error('product/invalid-data');
  if (dados.imagem.length > 2048 || !/^(https:\/\/[^ <>]+|images\/[a-zA-Z0-9_./-]+)$/.test(dados.imagem)) {
    throw new Error('product/invalid-image');
  }
  return dados;
}
