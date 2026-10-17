import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { reference, source, readJSON } from './paths.mjs';

if (readJSON(path.join(reference, 'manifest.json')).sealed) throw new Error('Refusing to rebuild a sealed reference.');
const env = { ...process.env, VITE_SUPABASE_URL: 'https://spectakles-parity.invalid', VITE_SUPABASE_ANON_KEY: 'parity-public-test-key' };
for (const key of Object.keys(env)) if (key.startsWith('VITE_FIREBASE_')) delete env[key];
fs.mkdirSync(path.join(reference, 'checks'), { recursive: true });
for (const command of ['typecheck', 'lint', 'build']) {
  const result = spawnSync('npm', ['run', command], { cwd: source, env, encoding: 'utf8' });
  fs.writeFileSync(path.join(reference, 'checks', `${command}.txt`), `${result.stdout}\n${result.stderr}\nExit: ${result.status}\n`);
  console.log(`${command}: ${result.status === 0 ? 'PASS' : 'FAIL (recorded existing findings)'}`);
  if (command !== 'lint' && result.status !== 0) process.exit(result.status ?? 1);
}
const dependencies = spawnSync('npm', ['ls', '--depth=0', '--json'], { cwd: source, encoding: 'utf8' });
fs.writeFileSync(path.join(reference, 'checks/dependencies.json'), dependencies.stdout);
