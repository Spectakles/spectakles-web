import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { reference, dist, readJSON, sha256 } from './paths.mjs';

const manifest = readJSON(path.join(reference, 'manifest.json'));
if (!manifest.sealed) throw new Error('Reference must be sealed before serving.');
for (const [file, expected] of Object.entries(manifest.buildFiles)) {
  if (sha256(fs.readFileSync(path.join(dist, file))) !== expected) throw new Error(`Reference build changed: ${file}`);
}
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain', '.woff2': 'font/woff2' };
function serve(root, port, variant) { http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  response.setHeader('Cache-Control', 'no-store');
  if (pathname === '/__parity/reference.json') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ commit: manifest.commit, archiveSha256: manifest.archiveSha256, sealed: true, variant }));
    return;
  }
  const candidate = path.resolve(root, '.' + pathname);
  if (candidate !== root && !candidate.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
  const file = fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : path.join(root, 'index.html');
  response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`Immutable reference ${manifest.commit.slice(0, 7)} (${variant}) at http://127.0.0.1:${port}`)); }
serve(dist, 4173, 'primary');
if (fs.existsSync(path.join(reference, 'variants.json'))) {
  const variants = readJSON(path.join(reference, 'variants.json'));
  for (const [index, name] of ['demo', 'analytics'].entries()) {
    const root = path.join(reference, `${name}-dist`);
    for (const [file, expected] of Object.entries(variants.builds[name])) {
      if (sha256(fs.readFileSync(path.join(root, file))) !== expected) throw new Error(`Reference variant changed: ${name}/${file}`);
    }
    serve(root, 4174 + index, name);
  }
}
