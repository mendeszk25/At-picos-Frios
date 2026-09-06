#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

(async () => {
  const rl = readline.createInterface({ input, output });
  const ref = (await rl.question('Project ref do Supabase: ')).trim();
  const key = (await rl.question('Publishable key (ou anon key legada): ')).trim();
  rl.close();
  if (!/^[a-z0-9-]{6,80}$/i.test(ref) || !key || /\s/.test(key)) throw new Error('Dados inválidos.');
  const arquivo = path.resolve(__dirname, '..', 'supabase-config.js');
  const conteudo = `/* Configuração pública. Não coloque secrets/service_role neste arquivo. */\nwindow.ATIPICOS_BACKEND_CONFIG = {\n  supabaseUrl: 'https://${ref}.supabase.co',\n  publishableKey: ${JSON.stringify(key)},\n};\n`;
  fs.writeFileSync(arquivo, conteudo);
  console.log('supabase-config.js atualizado. Agora rode: npm run build');
})().catch((e) => { console.error(`Erro: ${e.message}`); process.exitCode = 1; });
