import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { repo, reference } from './scripts/paths.mjs';
import { chromiumArgs } from './scripts/browser-settings.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(repo, '.parity/browsers');
const target = process.env.PARITY_TARGET_URL || 'http://127.0.0.1:4173';
export default defineConfig({
  globalSetup: './scripts/preflight.mjs',
  testDir: './tests', fullyParallel: true, workers: 2, retries: 0,
  timeout: 60_000,
  expect: { timeout: 8_000, toHaveScreenshot: { threshold: 0, maxDiffPixels: 0, animations: 'allow', caret: 'hide', scale: 'css' } },
  snapshotPathTemplate: path.join(process.env.PARITY_SNAPSHOTS || path.join(reference, 'screenshots'), '{projectName}/{arg}{ext}'),
  outputDir: path.join(repo, '.parity/runs', process.env.PARITY_RUN_ID || process.env.PARITY_MODE || 'checks'),
  reporter: [['list'], ['html', { outputFolder: path.join(repo, '.parity/report'), open: 'never' }], ['json', { outputFile: path.join(repo, '.parity/results.json') }]],
  use: {
    baseURL: target, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
    locale: 'en-IN', timezoneId: 'Asia/Kolkata', colorScheme: 'light',
    serviceWorkers: 'block', trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: { args: chromiumArgs } } },
    { name: 'firefox', use: { browserName: 'firefox' }, testMatch: /behavior\.spec\.mjs/ },
    { name: 'webkit', use: { browserName: 'webkit' }, testMatch: /behavior\.spec\.mjs/ },
  ],
  webServer: process.env.PARITY_TARGET_URL ? undefined : {
    command: 'node scripts/reference-server.mjs', url: `${target}/__parity/reference.json`,
    reuseExistingServer: false, timeout: 15_000,
  },
});
