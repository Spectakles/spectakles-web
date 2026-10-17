import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { source, reference, sha256, readJSON } from './paths.mjs';

if (readJSON(path.join(reference, 'manifest.json')).sealed) throw new Error('Cache fonts before sealing the reference.');
const html = fs.readFileSync(path.join(source, 'index.html'), 'utf8');
const urls = [...new Set(html.match(/https:\/\/fonts\.gstatic\.com\/[^\s"')]+\.woff2/g))];
const directory = path.join(reference, 'fonts');
fs.mkdirSync(directory, { recursive: true });
const entries = {};
for (const url of urls) {
  const filename = `${sha256(url).slice(0, 16)}.woff2`;
  execFileSync('curl', ['-L', '--fail', '--silent', '--show-error', '--max-time', '30', '--output', path.join(directory, filename), url]);
  entries[url] = { file: filename, sha256: sha256(fs.readFileSync(path.join(directory, filename))) };
}
fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(entries, null, 2));
console.log(`Cached ${urls.length} exact font responses for offline replay.`);
