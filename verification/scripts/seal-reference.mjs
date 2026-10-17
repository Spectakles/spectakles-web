import fs from 'node:fs';
import path from 'node:path';
import { reference, source, dist, readJSON, sha256, fileInventory } from './paths.mjs';

const file = path.join(reference, 'manifest.json');
const manifest = readJSON(file);
if (manifest.sealed) throw new Error('Reference is already sealed; refusing to replace its manifest.');
for (const [relative, expected] of Object.entries(manifest.sourceFiles)) {
  if (sha256(fs.readFileSync(path.join(source, relative))) !== expected) throw new Error(`Source changed: ${relative}`);
}
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Build the archived Vite source first.');
manifest.buildFiles = fileInventory(dist);
manifest.fontFiles = fileInventory(path.join(reference, 'fonts'));
manifest.sealed = true;
manifest.sealedAt = new Date().toISOString();
fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
console.log(`Sealed ${Object.keys(manifest.sourceFiles).length} source files and ${Object.keys(manifest.buildFiles).length} production files.`);
