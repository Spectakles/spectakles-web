// Resume only an unsealed, original-source acquisition. Never updates a golden.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { repo, reference, readJSON, fileInventory } from './paths.mjs';

const staging = path.resolve(process.argv[2] || '');
if (!staging.startsWith(path.join(repo, '.parity/recordings') + path.sep)) throw new Error('Specify an existing local acquisition directory.');
if (fs.existsSync(path.join(reference, 'screenshots'))) throw new Error('A sealed golden already exists; resuming acquisition is forbidden.');
if (!readJSON(path.join(reference, 'manifest.json')).sealed) throw new Error('An immutable original build is required.');
const initialPath = path.join(repo, '.parity/acquisition-initial.json');
if (!fs.existsSync(initialPath)) fs.copyFileSync(path.join(repo, '.parity/results.json'), initialPath);
const initial = readJSON(initialPath);
function cases(report) {
  const output = [];
  function visit(suite) {
    for (const spec of suite.specs || []) for (const execution of spec.tests) output.push({ key: `${spec.file}:${spec.title}:${execution.projectName}`, title: spec.title, project: execution.projectName, passed: execution.results.at(-1)?.status === 'passed' });
    for (const child of suite.suites || []) visit(child);
  }
  visit(report);
  return output;
}
const all = cases(initial), failed = all.filter(entry => !entry.passed);
if (all.length !== 85 || !failed.length || initial.stats.skipped) throw new Error('Expected a complete 85-case original acquisition with explicit failures and no skipped tests.');
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const grep = `(?:${failed.map(entry => escape(entry.title)).join('|')})$`;
const args = ['test', '--update-snapshots=all', '--grep', grep, ...[...new Set(failed.map(entry => entry.project))].flatMap(project => ['--project', project])];
const runId = `acquisition-resume-${Date.now()}`;
const run = spawnSync(path.join(repo, 'verification/node_modules/.bin/playwright'), args, {
  cwd: path.join(repo, 'verification'), stdio: 'inherit', env: { ...process.env, PARITY_MODE: 'record', PARITY_RUN_ID: runId,
    PARITY_SNAPSHOTS: staging, PLAYWRIGHT_BROWSERS_PATH: path.join(repo, '.parity/browsers') },
});
const retriedReport = readJSON(path.join(repo, '.parity/results.json'));
fs.writeFileSync(path.join(repo, `.parity/${runId}.json`), JSON.stringify(retriedReport));
if (run.status !== 0) process.exit(run.status ?? 1);
const retried = cases(retriedReport);
for (const entry of failed) if (!retried.some(result => result.key === entry.key && result.passed)) throw new Error(`Acquisition case still unresolved: ${entry.key}`);
fs.renameSync(staging, path.join(reference, 'screenshots'));
fs.writeFileSync(path.join(reference, 'screenshot-hashes.json'), JSON.stringify(fileInventory(path.join(reference, 'screenshots')), null, 2));
fs.writeFileSync(path.join(reference, 'acquisition.json'), JSON.stringify({ initial: initialPath, completion: path.join(repo, `.parity/${runId}.json`), totalCases: all.length, originalPasses: all.length - failed.length, resumedPasses: failed.length, reason: 'Complete acquisition after documenting original interaction limitations; original application source/build unchanged.' }, null, 2));
console.log(`Sealed original acquisition: ${all.length - failed.length} initial passes + ${failed.length} completed cases = ${all.length}.`);
