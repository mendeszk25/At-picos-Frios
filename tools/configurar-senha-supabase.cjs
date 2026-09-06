#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function argumento(nome) {
  const i = process.argv.indexOf(nome);
  return i >= 0 ? process.argv[i + 1] : null;
}

function lerSenhaOculta(pergunta) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Execute este utilitário em um terminal interativo.');
  }
  process.stdout.write(pergunta);
  const fd = process.stdin.fd;
  const antigo = spawnSync('stty', ['-g'], { stdio: ['inherit', 'pipe', 'inherit'], encoding: 'utf8' });
  if (antigo.status !== 0) throw new Error('Não foi possível ocultar a senha no terminal.');
  try {
    spawnSync('stty', ['-echo'], { stdio: 'inherit' });
    const buffer = Buffer.alloc(1024);
    const n = fs.readSync(fd, buffer, 0, buffer.length, null);
    process.stdout.write('\n');
    return buffer.subarray(0, n).toString('utf8').replace(/[\r\n]+$/, '');
  } finally {
    spawnSync('stty', [antigo.stdout.trim()], { stdio: 'inherit' });
  }
}

async function main() {
  const projectRef = argumento('--project-ref');
  if (!projectRef || !/^[a-z0-9-]{6,80}$/i.test(projectRef)) {
    throw new Error('Use: node tools/configurar-senha-supabase.cjs --project-ref SEU_PROJECT_REF');
  }
  const senha = lerSenhaOculta('Senha administrativa: ');
  const confirma = lerSenhaOculta('Repita a senha: ');
  if (!senha || Buffer.byteLength(senha, 'utf8') > 512) throw new Error('Senha inválida.');
  if (senha !== confirma) throw new Error('As senhas não coincidem.');

  const salt = crypto.randomBytes(32);
  const iteracoes = 600000;
  const hash = await new Promise((resolve, reject) => {
    crypto.pbkdf2(senha, salt, iteracoes, 32, 'sha256', (e, r) => e ? reject(e) : resolve(r));
  });
  const pepper = crypto.randomBytes(32).toString('hex');

  const temporario = path.join(os.tmpdir(), `atipicos-secrets-${process.pid}-${Date.now()}.env`);
  const conteudo = [
    `ATIPICOS_ADMIN_PASSWORD_HASH=${hash.toString('hex')}`,
    `ATIPICOS_ADMIN_PASSWORD_SALT=${salt.toString('hex')}`,
    `ATIPICOS_ADMIN_PASSWORD_ITERATIONS=${iteracoes}`,
    `ATIPICOS_RATE_PEPPER=${pepper}`,
    '',
  ].join('\n');

  fs.writeFileSync(temporario, conteudo, { mode: 0o600 });
  try {
    console.log('Enviando hash/salt/segredo diretamente para os Secrets da Edge Function...');
    const r = spawnSync('npx', [
      '--yes', 'supabase@latest', 'secrets', 'set',
      '--env-file', temporario,
      '--project-ref', projectRef,
    ], { stdio: 'inherit' });
    if (r.status !== 0) {
      throw new Error('O Supabase CLI não conseguiu salvar os secrets. Rode antes: npx supabase login');
    }
    console.log('Secrets configurados. A senha, o hash e o salt não foram gravados nos arquivos do projeto.');
  } finally {
    try { fs.rmSync(temporario, { force: true }); } catch (_) {}
    senha.replace(/./g, '0');
  }
}

main().catch((e) => {
  console.error(`Erro: ${e.message}`);
  process.exitCode = 1;
});
