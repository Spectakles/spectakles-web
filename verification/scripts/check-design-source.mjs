import fs from 'node:fs';
import path from 'node:path';
import { repo, reference, readJSON, sha256 } from './paths.mjs';

const manifest = readJSON(path.join(reference, 'manifest.json'));
// These crawl metadata files intentionally change during the authorized SEO
// pass. Their URLs and contents are checked by seo.spec.mjs, not frozen hashes.
const seoResources = new Set(['public/robots.txt', 'public/sitemap.xml', 'public/llms.txt']);
let count = 0;
for (const [relative, expected] of Object.entries(manifest.sourceFiles)) {
  const preserve = /\.(css|svg|png|jpe?g|webp|woff2?)$/.test(relative) || relative.startsWith('public/') || ['src/assets/roundtable.html', 'tailwind.config.js', 'postcss.config.js'].includes(relative);
  if (!preserve || seoResources.has(relative)) continue;
  const possible = [relative, relative.replace(/^src\/pages\//, 'src/views/')];
  if (relative.startsWith('src/assets/')) possible.push(`public/assets/${path.basename(relative)}`);
  const actual = possible.map(file => path.join(repo, 'spectackle-product', file)).find(file => fs.existsSync(file));
  // The authorized hover fix changes only the event-target selectors in this
  // original stylesheet. Normalize those selectors to verify every declaration.
  const bytes = actual ? fs.readFileSync(actual) : null;
  const preservedBytes = relative === 'src/components/InstitutionsBento.css' && bytes
    ? Buffer.from(bytes.toString().replaceAll('.institution-bento-slot:hover .institution-bento-card', '.institution-bento-card:hover')) : bytes;
  if (!preservedBytes || sha256(preservedBytes) !== expected) throw new Error(`Design source changed or missing: ${relative}. Preserve the original bytes; do not approve it by replacing the reference.`);
  count++;
}
console.log(`PASS: ${count} original design files verified (bento hover selectors normalized; all declarations preserved).`);
console.log('The 3 updated SEO text resources are validated separately by the SEO checks.');
