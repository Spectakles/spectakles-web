import { expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { reference, readJSON, sha256 } from '../scripts/paths.mjs';
import { test } from '@playwright/test';
import { exactImageDiff } from '../scripts/diff-images.mjs';

export const FIXED_TIME = new Date('2026-10-16T06:00:00Z');
export const viewports = [
  { width: 320, height: 800 }, { width: 360, height: 800 }, { width: 390, height: 844 },
  { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1440, height: 900 },
];
export const themes = ['light', 'dark'];
const preparedPages = new WeakMap();
test.afterEach(async ({ page, browserName }, testInfo) => {
  const evidence = preparedPages.get(page);
  if (evidence) await assertRuntime(evidence, browserName, testInfo);
});

export async function prepare(page, { theme = 'light', controlledTime = false, reducedMotion = 'no-preference', mock = {}, analytics = false } = {}) {
  const failures = [];
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion });
  await page.addInitScript(({ theme }) => {
    try {
      if (!sessionStorage.getItem('__parityInitialized')) {
        if (theme !== null) localStorage.setItem('Spectakles-theme', theme);
        sessionStorage.setItem('__parityInitialized', 'true');
      }
    } catch {}
    // Test-only repeatable randomness; no application source changes.
    let seed = 601652;
    Math.random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
    window.__parityLayoutShifts = [];
    try { new PerformanceObserver(list => list.getEntries().forEach(entry => { if (!entry.hadRecentInput) window.__parityLayoutShifts.push(entry.value); })).observe({ type: 'layout-shift', buffered: true }); } catch {}
  }, { theme });
  if (analytics) await page.addInitScript(() => {
    window.__parityGtagEvents = [];
    window.dataLayer = [];
    const push = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = (...items) => { for (const item of items) window.__parityGtagEvents.push(Array.from(item)); return push(...items); };
  });
  const fonts = readJSON(path.join(reference, 'fonts/manifest.json'));
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (analytics && url.hostname === 'firebase.googleapis.com') {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ appId: '1:1234567890:web:0123456789abcdef', measurementId: 'G-PARITYTEST1' }) }); return;
    }
    if (analytics && url.hostname === 'firebaseinstallations.googleapis.com') {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ name: 'projects/spectakles-parity/installations/c123456789012345678901', fid: 'c123456789012345678901', refreshToken: 'parity-test-token', authToken: { token: 'parity-test-token', expiresIn: '604800s' } }) }); return;
    }
    if (analytics && url.hostname === 'www.googletagmanager.com') {
      await route.fulfill({ status: 200, contentType: 'text/javascript', body: '/* Controlled fixture: observe real Firebase SDK queue; never deliver to Google. */' }); return;
    }
    if (url.hostname === 'spectakles-parity.invalid') {
      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': '*' } }); return;
      }
      requests.push({ method: request.method(), path: url.pathname, body: request.postDataJSON() });
      if (mock.delay) await new Promise(resolve => setTimeout(resolve, mock.delay));
      await route.fulfill({ status: mock.status || 201, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(mock.status >= 400 ? { message: 'Controlled waitlist failure', code: 'PARITY_TEST' } : []) });
      return;
    }
    if (fonts[request.url()]) {
      const font = fonts[request.url()];
      const body = fs.readFileSync(path.join(reference, 'fonts', font.file));
      if (sha256(body) !== font.sha256) throw new Error(`Cached font changed: ${font.file}`);
      await route.fulfill({ status: 200, contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' }, body }); return;
    }
    const candidateHosts = [process.env.PARITY_TARGET_URL, process.env.PARITY_DEMO_URL, process.env.PARITY_ANALYTICS_URL].filter(Boolean).map(value => new URL(value).hostname);
    if (['127.0.0.1', 'localhost', ...candidateHosts].includes(url.hostname)) { await route.continue(); return; }
    failures.push(request.url());
    await route.abort('blockedbyclient');
  });
  if (controlledTime) {
    await page.clock.install({ time: FIXED_TIME });
    await page.clock.pauseAt(FIXED_TIME);
  }
  const evidence = { errors, failures, requests };
  preparedPages.set(page, evidence);
  return evidence;
}

export async function ready(page, route = '/', { controlledTime = false } = {}) {
  await page.goto(route, { waitUntil: 'networkidle' });
  await expect(page.locator('.site-shell')).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.complete ? Promise.resolve() : new Promise(resolve => { image.onload = resolve; image.onerror = resolve; })));
  });
  if (controlledTime) await page.clock.runFor(1500);
  else await page.waitForTimeout(250);
}

export async function checkpoint(page, ms = 500) {
  await page.clock.runFor(ms);
  // Native CSS animations are normalized separately from recorded normal-motion runs.
  for (const frame of page.frames()) {
    await frame.evaluate(() => {
      for (const animation of document.getAnimations()) {
        const timing = animation.effect?.getComputedTiming();
        if (timing?.iterations === Infinity) animation.cancel();
        else animation.finish();
      }
    });
  }
  // Static captures finish finite CSS transitions and cancel looping CSS
  // animations; normal-motion recordings use neither of these controls.
  // Allow compositor paint to catch up after normalizing native animations.
  // This waits in the test driver; the page's JS clock remains paused.
  await page.waitForTimeout(80);
}

export async function capture(page, name, { fullPage = false } = {}) {
  await checkpoint(page);
  const info = test.info();
  const filename = `${name.replaceAll('/', '-')}.png`;
  const destination = info.snapshotPath(filename);
  const actual = await page.screenshot({ fullPage, animations: 'allow', caret: 'hide', scale: 'css' });
  if (process.env.PARITY_MODE === 'record') {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, actual);
    return;
  }
  expect(fs.existsSync(destination), `Missing baseline ${filename}`).toBe(true);
  const expected = fs.readFileSync(destination);
  const result = exactImageDiff(expected, actual);
  if (result.pixels !== 0) {
    const { diff, overlay, ...summary } = result;
    await info.attach(`${filename}-exact-difference-summary`, { body: JSON.stringify(summary, null, 2), contentType: 'application/json' });
    await info.attach(`${filename}-expected`, { body: expected, contentType: 'image/png' });
    await info.attach(`${filename}-actual`, { body: actual, contentType: 'image/png' });
    if (result.diff) await info.attach(`${filename}-diff`, { body: result.diff, contentType: 'image/png' });
    if (result.overlay) await info.attach(`${filename}-overlay`, { body: result.overlay, contentType: 'image/png' });
  }
  expect(result.pixels, `Exact pixel comparison failed: ${filename}; bounds ${JSON.stringify(result.bounds)}`).toBe(0);
}

export async function assertRuntime(evidence, browserName, testInfo) {
  const firefoxBaselineError = 'Acquiring an exclusive Navigator LockManager lock "lock:sb-spectakles-parity-auth-token" immediately failed';
  const known = evidence.errors.filter(message => browserName === 'firefox' && message === firefoxBaselineError);
  if (known.length) await testInfo.attach('known-original-firefox-supabase-errors', { body: JSON.stringify(known, null, 2), contentType: 'application/json' });
  expect(evidence.errors.filter(message => !(browserName === 'firefox' && message === firefoxBaselineError)), 'No new/unclassified runtime errors').toEqual([]);
}

export async function scrollTo(page, locator) {
  await locator.evaluate(node => node.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await checkpoint(page, 1000);
}

export async function geometry(page) {
  return page.evaluate(() => {
    const selectors = ['html', 'body', '.site-shell', '.floating-navbar-pill', '.navbar-logo-img', '.site-main-content', 'h1', '.hero-text', '.hero-stage-mockup', '.spectakles-footer', '.waitlist-modal', '.faq-layout'];
    const properties = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color', 'backgroundColor', 'padding', 'margin', 'gap', 'borderRadius', 'boxShadow', 'maxWidth', 'display', 'position', 'transform'];
    return {
      title: document.title, theme: document.documentElement.dataset.theme,
      width: innerWidth, documentWidth: document.documentElement.scrollWidth,
      elements: Object.fromEntries(selectors.flatMap(selector => {
        const node = document.querySelector(selector);
        if (!node) return [];
        const rect = node.getBoundingClientRect();
        const computed = getComputedStyle(node);
        return [[selector, { text: ['h1', '.hero-text'].includes(selector) ? node.textContent : undefined,
          box: Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, Math.round(rect[key] * 1000) / 1000])),
          style: Object.fromEntries(properties.map(key => [key, computed[key]])),
        }]];
      })),
      css: [...document.styleSheets].map(sheet => ({ inline: !sheet.href, rules: (() => { try { return sheet.cssRules.length; } catch { return null; } })() })),
      // Asset filenames/CSS chunk counts are evidence, not cross-framework equality assertions.
      stylesheetOrder: [...document.styleSheets].map(sheet => sheet.href || '[inline]'),
      fonts: [...document.fonts].map(font => ({ family: font.family, weight: font.weight, status: font.status })),
      links: [...document.querySelectorAll('a[href]')].map(node => ({ text: node.textContent.trim(), href: node.getAttribute('href') })),
      anchors: [...document.querySelectorAll('[id]')].map(node => node.id),
      cls: window.__parityLayoutShifts?.reduce((sum, value) => sum + value, 0) || 0,
    };
  });
}

export async function assertGeometry(page, name, testInfo) {
  const evidence = await geometry(page);
  await testInfo.attach(`${name}-styles`, { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' });
  const { stylesheetOrder, css, fonts, cls, ...comparable } = evidence;
  expect(JSON.stringify(comparable, null, 2)).toMatchSnapshot(`${name}-geometry.json`);
}

export async function fillWaitlist(page) {
  await page.getByLabel('Name', { exact: true }).fill('  Parity Test  ');
  await page.getByLabel('Email', { exact: true }).fill('parity@example.invalid');
  await page.getByLabel('I am a').selectOption('Faculty');
  await page.getByLabel('College / University').fill('  Test College  ');
}
