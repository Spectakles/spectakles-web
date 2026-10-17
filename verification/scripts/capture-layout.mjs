import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { repo, reference, fileInventory } from './paths.mjs';

if (process.env.PARITY_TARGET_URL) throw new Error('Additional original measurements cannot target a candidate.');
const destination = path.join(reference, 'layout-contracts');
if (fs.existsSync(destination)) throw new Error('The original layout contracts already exist. Refusing replacement.');
if (!fs.existsSync(path.join(reference, 'screenshot-hashes.json'))) throw new Error('Seal the primary acquisition first.');
const original = JSON.stringify(fileInventory(path.join(reference, 'screenshots')));
const staging = path.join(repo, '.parity/layout-recordings', String(Date.now()));
const result = spawnSync(path.join(repo, 'verification/node_modules/.bin/playwright'), ['test', 'responsive.spec.mjs', '--project', 'chromium', '--update-snapshots=none'], {
  cwd: path.join(repo, 'verification'), stdio: 'inherit', env: { ...process.env, PARITY_MODE: 'record-layout', PARITY_LAYOUT_OUTPUT: staging,
    PLAYWRIGHT_BROWSERS_PATH: path.join(repo, '.parity/browsers') },
});
if (JSON.stringify(fileInventory(path.join(reference, 'screenshots'))) !== original) throw new Error('The sealed original snapshots must not change.');
if (result.status !== 0) process.exit(result.status ?? 1);
if (Object.keys(fileInventory(staging)).length !== 6) throw new Error('Expected six complete original layout contracts.');
fs.renameSync(staging, destination);
fs.writeFileSync(path.join(reference, 'layout-hashes.json'), JSON.stringify(fileInventory(destination), null, 2));
console.log('Sealed six additional original-source layout contracts; all 582 original snapshots were preserved.');
