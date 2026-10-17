import { test, expect } from '@playwright/test';
import { prepare, ready, fillWaitlist, assertRuntime } from './helpers.mjs';
import { sha256 } from '../scripts/paths.mjs';
import { PNG } from 'pngjs';
import fs from 'node:fs';

test('route refresh, shell persistence, pathname remount and history', async ({ page, browserName }, testInfo) => {
  const evidence = await prepare(page);
  await ready(page);
  await page.evaluate(() => { window.__parityShell = document.querySelector('.site-shell'); window.__parityCanvas = document.querySelector('canvas'); });
  await page.locator('.round-tabs button').nth(2).click();
  await expect(page.locator('.round-copy h3')).toHaveText('The case study roundtable');
  await page.locator('.navbar-nav-links').getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator('h1')).toContainText('silence');
  expect(await page.evaluate(() => window.__parityShell === document.querySelector('.site-shell'))).toBe(true);
  expect(await page.evaluate(() => window.__parityCanvas === document.querySelector('canvas'))).toBe(true);
  await page.locator('.navbar-brand-link').click();
  await expect(page.locator('.round-copy h3')).toHaveText('The campus placement GD');
  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/faq');
  await expect(page.locator('h1')).toContainText('Got questions?');
  await page.reload();
  await expect(page.locator('h1')).toContainText('Got questions?');
  await assertRuntime(evidence, browserName, testInfo);
});

test('mobile menu closes after navigation and waitlist resets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, { reducedMotion: 'reduce' });
  await ready(page);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(page.locator('.navbar-mobile-menu')).toBeVisible();
  await page.locator('.navbar-mobile-menu').getByRole('link', { name: 'FAQ', exact: true }).click();
  await expect(page).toHaveURL(/\/faq$/);
  await expect(page.locator('.navbar-mobile-menu')).toHaveCount(0);
  await page.locator('.navbar-cta-button').click();
  await page.getByLabel('Name', { exact: true }).fill('Temporary');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.locator('.navbar-cta-button').click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('');
  await page.locator('.waitlist-overlay').click({ position: { x: 2, y: 2 } });
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('FAQ category state, multiple questions and remount', async ({ page }) => {
  await prepare(page, { reducedMotion: 'reduce' });
  await ready(page, '/faq');
  await page.locator('.faq-question').nth(0).click();
  await page.locator('.faq-question').nth(1).click();
  await expect(page.locator('.faq-item-open')).toHaveCount(2);
  await page.locator('.faq-category').nth(1).click();
  await expect(page.locator('.faq-item-open')).toHaveCount(0);
  await page.locator('.faq-category').nth(0).click();
  await expect(page.locator('.faq-item-open')).toHaveCount(2);
  await page.locator('.navbar-brand-link').click();
  await page.locator('.navbar-nav-links').getByRole('link', { name: 'FAQ', exact: true }).click();
  await expect(page.locator('.faq-item-open')).toHaveCount(0);
});

test('same-page and cross-route anchors use the current target and offset', async ({ page }, testInfo) => {
  await prepare(page, { reducedMotion: 'reduce' });
  await ready(page, '/about');
  await page.locator('.navbar-nav-links').getByRole('link', { name: 'How it works' }).click();
  await expect(page).toHaveURL(/\/#how-it-works$/);
  await expect.poll(() => page.locator('#how-it-works').evaluate(node => Math.round(node.getBoundingClientRect().top))).toBe(92);
  await page.locator('.navbar-nav-links').getByRole('link', { name: 'The GD Reality' }).click();
  await expect(page).toHaveURL(/\/#institutions$/);
  await expect.poll(() => page.locator('#institutions').evaluate(node => Math.round(node.getBoundingClientRect().top))).toBe(92);
  await testInfo.attach('anchors', { body: JSON.stringify(await page.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id))), contentType: 'application/json' });
});

test('saved dark theme survives navigation and refresh', async ({ page }) => {
  await prepare(page, { theme: 'dark' });
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.navbar-nav-links').getByRole('link', { name: 'About', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.getItem('Spectakles-theme'))).toBe('dark');
  await expect(page.getByRole('button', { name: /theme|dark mode/i })).toHaveCount(0);
});

test('waitlist validates, sends one trimmed payload, handles failure and retries', async ({ page, browserName }, testInfo) => {
  const mock = { status: 400 };
  const evidence = await prepare(page, { mock });
  await ready(page);
  await page.locator('.navbar-cta-button').click();
  await page.locator('.waitlist-submit').click();
  await expect(page.getByRole('alert')).toHaveText('Please enter your name.');
  await page.getByLabel('Name', { exact: true }).fill('Parity');
  await page.locator('.waitlist-submit').click();
  await expect(page.getByRole('alert')).toHaveText('Please enter your email.');
  await fillWaitlist(page);
  await page.locator('.waitlist-submit').click();
  await expect(page.getByRole('alert')).toHaveText('Controlled waitlist failure');
  expect(evidence.requests).toEqual([{ method: 'POST', path: '/rest/v1/waitlist', body: [{ name: 'Parity Test', email: 'parity@example.invalid', user_type: 'Faculty', college: 'Test College' }] }]);
  mock.status = 201;
  await page.locator('.waitlist-submit').click();
  await expect(page.locator('.waitlist-success')).toBeVisible();
  expect(evidence.requests).toHaveLength(2);
  await assertRuntime(evidence, browserName, testInfo);
});

test('iframe document, static resources and disconnected routes inventory', async ({ page, request }, testInfo) => {
  await prepare(page);
  await ready(page);
  const iframe = page.locator('iframe');
  const srcDoc = await iframe.getAttribute('srcdoc');
  expect(srcDoc).toMatchSnapshot('roundtable-srcdoc.html');
  expect(srcDoc).toContain('<style>');
  expect(srcDoc).not.toContain('src="https://cdn.tailwindcss.com');
  await expect(iframe).toHaveAttribute('title', 'Roundtable Live In-Session Preview');
  const resources = {};
  for (const route of ['/favicon.svg', '/og-image.png', '/robots.txt', '/sitemap.xml', '/llms.txt']) {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    resources[route] = { status: response.status(), contentType: response.headers()['content-type'].split(';')[0].trim(), sha256: sha256(await response.body()) };
  }
  const originalResources = JSON.parse(fs.readFileSync(testInfo.snapshotPath('public-resource-hashes.json'), 'utf8'));
  // Crawl metadata now uses the canonical production host. Keep original visual
  // resource hashes immutable; validate SEO resources against their new contract.
  for (const route of ['/favicon.svg', '/og-image.png']) expect(resources[route]).toEqual(originalResources[route]);
  for (const route of ['/pricing', '/impact', '/blog', '/blog/example', '/unknown-parity-path']) {
    const response = await page.goto(route);
    expect(response.status(), 'Preserve the original empty-shell HTTP 200 fallback').toBe(200);
    await expect(page.locator('.site-shell')).toBeVisible();
    await expect(page.locator('main')).toBeEmpty();
    resources[route] = { status: response.status(), content: 'shared shell with empty main' };
  }
  await testInfo.attach('route-and-resource-inventory', { body: JSON.stringify(resources, null, 2), contentType: 'application/json' });
});

test('hero numeric scaling fits its container after loading and resizing', async ({ page }) => {
  await prepare(page);
  await ready(page);
  for (const width of [390, 320, 768, 1440, 1453, 1709, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(async () => page.locator('.hero-stage-mockup').evaluate(container => {
      const frame = container.querySelector('iframe').getBoundingClientRect();
      const box = container.getBoundingClientRect();
      const style = getComputedStyle(container);
      const contentWidth = box.width - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth);
      return Math.max(Math.abs(frame.width - contentWidth), Math.abs(frame.height - frame.width * 860 / 1120));
    })).toBeLessThan(0.05);
  }
});

test('hero paints its original document at standard and Retina densities', async ({ browser, baseURL }) => {
  for (const density of [1, 1.25, 2]) {
    const context = await browser.newContext({ baseURL, deviceScaleFactor: density,
      viewport: { width: 1453, height: 900 } });
    try {
      const page = await context.newPage();
      const evidence = await prepare(page);
      await ready(page);
      const iframe = page.locator('iframe');
      expect(await iframe.evaluate(el => getComputedStyle(el).willChange)).toBe('auto');
      expect(await iframe.evaluate(el => el.parentElement.style.transform)).toMatch(/^scale\([0-9.]+\)$/);
      await expect(iframe.contentFrame().getByRole('heading', { name: 'Talk-time arc' })).toBeVisible();
      // DOM visibility alone missed the blank Safari preview. Assert the light
      // sidebar actually paints inside the otherwise dark preview as well.
      const image = PNG.sync.read(await page.locator('.hero-stage-mockup').screenshot());
      let lightPixels = 0;
      for (let y = Math.floor(image.height * .15); y < image.height * .9; y++) {
        for (let x = Math.floor(image.width * .75); x < image.width * .95; x++) {
          const offset = (y * image.width + x) * 4;
          if (image.data[offset] > 200 && image.data[offset + 1] > 200 && image.data[offset + 2] > 180) lightPixels++;
        }
      }
      expect(lightPixels / (image.width * image.height), 'The sidebar must paint instead of a blank dark iframe').toBeGreaterThan(.1);
      expect(evidence.errors).toEqual([]);
    } finally {
      await context.close();
    }
  }
});
