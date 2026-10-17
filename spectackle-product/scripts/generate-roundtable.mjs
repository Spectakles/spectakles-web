import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const output = new URL('generated/', root);
mkdirSync(output, { recursive: true });
const html = readFileSync(new URL('src/assets/roundtable.html', root), 'utf8');
const css = readFileSync(new URL('src/assets/roundtable-compiled.css', root), 'utf8');
writeFileSync(new URL('roundtable.ts', output), '// Generated from unchanged iframe assets. Run npm run generate:roundtable.\n' +
  'export const roundtableHtml = ' + JSON.stringify(html) + ';\n' +
  'export const roundtableCss = ' + JSON.stringify(css) + ';\n');
