import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { repo, reference, readJSON, fileInventory, sha256 } from './paths.mjs';

const mode = process.argv[2];
if (!['record', 'verify', 'compare'].includes(mode)) throw new Error('Use record, verify, or compare.');
const designCheck = spawnSync(process.execPath, [path.join(repo, 'verification/scripts/check-design-source.mjs')], { stdio: 'inherit' });
if (designCheck.status !== 0) process.exit(designCheck.status ?? 1);
const manifest = readJSON(path.join(reference, 'manifest.json'));
if (!manifest.sealed) throw new Error('Seal the archived production reference first.');
if (mode === 'compare' && !process.env.PARITY_TARGET_URL) throw new Error('Set PARITY_TARGET_URL to a running production candidate.');
if (mode === 'compare' && (!process.env.PARITY_DEMO_URL || !process.env.PARITY_ANALYTICS_URL)) throw new Error('Full comparison also requires PARITY_DEMO_URL and PARITY_ANALYTICS_URL for the matching public-config variants.');
if (mode === 'record' && process.argv.length > 3) throw new Error('Record the whole baseline suite; partial recording cannot seal the baseline.');
if (mode !== 'compare' && process.env.PARITY_TARGET_URL) throw new Error('Baseline commands cannot target a candidate.');
const screenshots = path.join(reference, 'screenshots');
if (mode === 'record' && fs.existsSync(screenshots)) throw new Error('Baseline screenshots already exist. Refusing to overwrite them.');
if (mode !== 'record' && !fs.existsSync(screenshots)) throw new Error('Record the immutable reference first.');
if (mode !== 'record') {
  const summaryFile = path.join(repo, 'verification/baseline-manifest.json');
  if (fs.existsSync(summaryFile)) {
    const summary = readJSON(summaryFile);
    if (sha256(fs.readFileSync(path.join(reference, 'screenshot-hashes.json'))) !== summary.snapshotManifestSha256) throw new Error('The sealed snapshot inventory no longer matches its tracked baseline summary.');
    if (summary.layoutManifestSha256 && sha256(fs.readFileSync(path.join(reference, 'layout-hashes.json'))) !== summary.layoutManifestSha256) throw new Error('The sealed layout inventory no longer matches its tracked baseline summary.');
  }
  const expected = readJSON(path.join(reference, 'screenshot-hashes.json'));
  if (JSON.stringify(fileInventory(screenshots)) !== JSON.stringify(expected)) throw new Error('Baseline snapshots have changed. Refusing comparison.');
}
const recording = mode === 'record' ? path.join(repo, '.parity/recordings', String(Date.now())) : screenshots;
const args = ['test', ...(mode === 'record' ? ['--update-snapshots=all'] : ['--update-snapshots=none']), ...process.argv.slice(3)];
const runId = process.env.PARITY_RUN_ID || `${mode}-${Date.now()}`;
const result = spawnSync(path.join(repo, 'verification/node_modules/.bin/playwright'), args, {
  cwd: path.join(repo, 'verification'), stdio: 'inherit',
  env: { ...process.env, PARITY_MODE: mode, PARITY_RUN_ID: runId, PARITY_SNAPSHOTS: recording, PLAYWRIGHT_BROWSERS_PATH: path.join(repo, '.parity/browsers') },
});
fs.mkdirSync(path.join(repo, '.parity/run-results'), { recursive: true });
if (fs.existsSync(path.join(repo, '.parity/results.json'))) fs.copyFileSync(path.join(repo, '.parity/results.json'), path.join(repo, '.parity/run-results', `${runId}.json`));
if (mode === 'record' && result.status === 0) {
  fs.renameSync(recording, screenshots);
  fs.writeFileSync(path.join(reference, 'screenshot-hashes.json'), JSON.stringify(fileInventory(screenshots), null, 2));
  console.log('Baseline snapshot set sealed. Verify/compare cannot update it.');
}
process.exit(result.status ?? 1);
