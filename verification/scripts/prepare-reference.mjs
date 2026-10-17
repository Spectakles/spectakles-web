import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { repo, reference, source, sha256 } from './paths.mjs';

const commit = execFileSync('git', ['rev-parse', '0065ac0^{commit}'], { cwd: repo, encoding: 'utf8' }).trim();
if (fs.existsSync(reference)) throw new Error('Reference already exists. Refusing to overwrite the baseline.');
fs.mkdirSync(path.join(reference, 'source'), { recursive: true });
const archive = execFileSync('git', ['archive', '--format=tar', commit, 'spectackle-product'], { cwd: repo, maxBuffer: 32 * 1024 * 1024 });
fs.writeFileSync(path.join(reference, 'source.tar'), archive, { flag: 'wx' });
execFileSync('tar', ['-xf', path.join(reference, 'source.tar'), '-C', path.join(reference, 'source')]);
const tracked = execFileSync('git', ['ls-tree', '-r', '--name-only', commit, 'spectackle-product'], { cwd: repo, encoding: 'utf8' }).trim().split('\n');
const sources = Object.fromEntries(tracked.map(file => [file.replace(/^spectackle-product\//, ''), sha256(fs.readFileSync(path.join(reference, 'source', file)))]));
const metadata = {
  commit, archiveSha256: sha256(archive), createdAt: new Date().toISOString(),
  node: process.version, npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
  platform: process.platform, arch: process.arch, osRelease: os.release(),
  packageLockSha256: sha256(fs.readFileSync(path.join(source, 'package-lock.json'))),
  sourceFiles: sources,
  buildPolicy: 'Exact tracked source; synthetic public Supabase configuration; Firebase disabled; all non-font external browser requests blocked. No private local environment files copied.',
  sealed: false,
};
fs.writeFileSync(path.join(reference, 'manifest.json'), JSON.stringify(metadata, null, 2));
console.log(`Prepared isolated source for ${commit}. Install its locked dependencies and build, then seal it.`);
