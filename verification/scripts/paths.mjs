import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import fs from 'node:fs';

export const repo = fileURLToPath(new URL('../../', import.meta.url));
export const reference = path.join(repo, '.parity/reference');
export const source = path.join(reference, 'source/spectackle-product');
export const dist = path.join(source, 'dist');
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
export function fileInventory(root) {
  const output = {};
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) output[path.relative(root, absolute)] = sha256(fs.readFileSync(absolute));
    }
  }
  visit(root);
  return output;
}
