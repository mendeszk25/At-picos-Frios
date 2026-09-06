const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const destino = path.join(root, 'public');

// Somente arquivos explicitamente públicos. A pasta supabase/, migrations,
// testes, tools e qualquer secret nunca entram no deploy estático.
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino);
for (const nome of [
  'index.html', 'style.css', 'script.js', 'catalogo.js', 'produtos.js',
  'supabase-config.js', 'backend-client.js', 'images', 'admin',
]) {
  fs.cpSync(path.join(root, nome), path.join(destino, nome), { recursive: true });
}
console.log('Site gerado em public/');
