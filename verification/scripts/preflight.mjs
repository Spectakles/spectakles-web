import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { chromium, firefox, webkit } from '@playwright/test';
import { reference, repo, dist, readJSON, sha256 } from './paths.mjs';
import { chromiumArgs } from './browser-settings.mjs';

export default async function preflight(config) {
  if (!['record', 'record-layout', 'verify', 'compare'].includes(process.env.PARITY_MODE)) throw new Error('Use the guarded baseline/compare npm scripts.');
  if (process.env.PARITY_MODE === 'record-layout' && (process.env.PARITY_TARGET_URL || fs.existsSync(path.join(reference, 'layout-contracts')))) throw new Error('Only new original-source layout measurements may be acquired.');
  if (process.env.PARITY_MODE === 'record' && fs.existsSync(path.join(reference, 'screenshots'))) throw new Error('The baseline is already recorded. Updating it is forbidden.');
  if (process.env.PARITY_MODE !== 'record' && config.updateSnapshots !== 'none') throw new Error('Snapshot updates are forbidden during verification/comparison.');
  const manifest = readJSON(path.join(reference, 'manifest.json'));
  if (!manifest.sealed) throw new Error('A sealed original production build is required.');
  if (sha256(fs.readFileSync(path.join(reference, 'source.tar'))) !== manifest.archiveSha256) throw new Error('Reference archive integrity check failed.');
  for (const [file, expected] of Object.entries(manifest.buildFiles)) {
    if (sha256(fs.readFileSync(path.join(dist, file))) !== expected) throw new Error(`Reference build integrity check failed: ${file}`);
  }
  for (const [file, expected] of Object.entries(manifest.fontFiles)) {
    if (sha256(fs.readFileSync(path.join(reference, 'fonts', file))) !== expected) throw new Error(`Reference font integrity check failed: ${file}`);
  }
  if (fs.existsSync(path.join(reference, 'layout-contracts'))) {
    const expected = readJSON(path.join(reference, 'layout-hashes.json'));
    for (const [file, hash] of Object.entries(expected)) if (sha256(fs.readFileSync(path.join(reference, 'layout-contracts', file))) !== hash) throw new Error(`Original layout contract changed: ${file}`);
  }
  const variants = readJSON(path.join(reference, 'variants.json'));
  if (variants.commit !== manifest.commit) throw new Error('Integration variants use a different source commit.');
  for (const [name, files] of Object.entries(variants.builds)) for (const [file, expected] of Object.entries(files)) {
    if (sha256(fs.readFileSync(path.join(reference, `${name}-dist`, file))) !== expected) throw new Error(`Reference variant changed: ${name}/${file}`);
  }
  const environment = { platform: process.platform, arch: process.arch, osRelease: os.release(), playwright: readJSON(path.join(repo, 'verification/node_modules/playwright/package.json')).version, chromiumArgs, browsers: {} };
  for (const [name, browserType] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await browserType.launch(name === 'chromium' ? { args: chromiumArgs } : {});
    environment.browsers[name] = browser.version();
    await browser.close();
  }
  const environmentFile = path.join(reference, 'environment.json');
  if (fs.existsSync(environmentFile)) {
    if (JSON.stringify(readJSON(environmentFile)) !== JSON.stringify(environment)) throw new Error('Browser/OS environment differs from the baseline. Use the recorded environment; do not replace the baseline.');
  } else {
    if (process.env.PARITY_MODE !== 'record') throw new Error('Record the baseline environment first.');
    fs.writeFileSync(environmentFile, JSON.stringify(environment, null, 2), { flag: 'wx' });
  }
  if (process.env.PARITY_MODE !== 'compare') {
    const response = await fetch('http://127.0.0.1:4173/__parity/reference.json');
    const identity = await response.json();
    if (!identity.sealed || identity.commit !== manifest.commit || identity.archiveSha256 !== manifest.archiveSha256) throw new Error('Baseline recording may only use the original sealed build.');
  }
}
