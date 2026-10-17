import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { reference, source, readJSON, fileInventory } from './paths.mjs';

const manifestPath = path.join(reference, 'variants.json');
if (fs.existsSync(manifestPath)) throw new Error('Integration reference variants already exist. Refusing replacement.');
const original = readJSON(path.join(reference, 'manifest.json'));
if (!original.sealed) throw new Error('Seal the primary reference first.');
const base = { ...process.env };
for (const name of Object.keys(base)) if (name.startsWith('VITE_SUPABASE_') || name.startsWith('VITE_FIREBASE_')) delete base[name];
const publicTestConfig = {
  VITE_SUPABASE_URL: 'https://spectakles-parity.invalid', VITE_SUPABASE_ANON_KEY: 'parity-public-test-key',
  VITE_FIREBASE_API_KEY: 'parity-test-public-api-key', VITE_FIREBASE_AUTH_DOMAIN: 'spectakles-parity.invalid',
  VITE_FIREBASE_PROJECT_ID: 'spectakles-parity', VITE_FIREBASE_STORAGE_BUCKET: 'spectakles-parity.invalid',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '1234567890', VITE_FIREBASE_APP_ID: '1:1234567890:web:0123456789abcdef',
  VITE_FIREBASE_MEASUREMENT_ID: 'G-PARITYTEST1',
};
const variants = { commit: original.commit, publicTestConfig, builds: {} };
for (const [name, configuration] of Object.entries({ demo: {}, analytics: publicTestConfig })) {
  const directory = path.join(reference, `${name}-dist`);
  const result = spawnSync(path.join(source, 'node_modules/.bin/vite'), ['build', '--outDir', directory], { cwd: source, env: { ...base, ...configuration }, encoding: 'utf8' });
  fs.writeFileSync(path.join(reference, 'checks', `build-${name}.txt`), `${result.stdout}\n${result.stderr}`);
  if (result.status !== 0) throw new Error(`${name} variant failed; see recorded build output.`);
  variants.builds[name] = fileInventory(directory);
  console.log(`Built ${name} reference variant from unchanged archived source.`);
}
fs.writeFileSync(manifestPath, JSON.stringify(variants, null, 2), { flag: 'wx' });
