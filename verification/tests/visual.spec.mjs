import { test, expect } from '@playwright/test';
import { prepare, ready, capture, scrollTo, checkpoint, assertGeometry, fillWaitlist, viewports, themes } from './helpers.mjs';

for (const viewport of viewports) for (const theme of themes) for (const route of ['/', '/about', '/faq']) {
  const label = `${route === '/' ? 'home' : route.slice(1)}/${viewport.width}x${viewport.height}-${theme}`;
  test(`visual ${label}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const network = await prepare(page, { theme, controlledTime: true });
    await ready(page, route, { controlledTime: true });
    await capture(page, `${label}/first-viewport`);
    await assertGeometry(page, `${label}/initial`, testInfo);
    // Full-page capture belongs to the initial state, before scroll raster
    // caches and scroll-triggered reveals have been exercised.
    await capture(page, `${label}/fullpage`, { fullPage: true });
    const scenes = page.locator('main .portal-scene');
    for (let index = 0; index < await scenes.count(); index++) {
      await scrollTo(page, scenes.nth(index));
      await capture(page, `${label}/section-${index + 1}`);
    }
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await checkpoint(page);
    if (viewport.width === 320) {
      const bounds = await page.getByRole('button', { name: 'Toggle navigation' }).boundingBox();
      expect(bounds.x + bounds.width, 'Preserve the documented original 320px overflow').toBeGreaterThan(320);
      testInfo.annotations.push({ type: 'original-layout-limitation', description: 'At 320px the original navigation toggle is outside the viewport; this width records layout/overflow, not an inaccessible menu interaction.' });
      await testInfo.attach('original-320px-navigation-overflow', { body: JSON.stringify({ viewport, toggle: bounds }, null, 2), contentType: 'application/json' });
      expect(network.errors).toEqual([]);
      expect(network.failures).toEqual([]);
      return;
    }
    if (viewport.width <= 768) {
      await page.getByRole('button', { name: 'Toggle navigation' }).click({ force: true });
      await capture(page, `${label}/mobile-menu`);
      await page.getByRole('button', { name: 'Toggle navigation' }).click({ force: true });
    } else {
      await page.locator('.navbar-cta-button').hover({ force: true });
      await capture(page, `${label}/cta-hover`);
      await page.mouse.move(0, 0);
    }
    await page.locator('.navbar-cta-button').click({ force: true });
    await capture(page, `${label}/waitlist-idle`);
    await assertGeometry(page, `${label}/modal`, testInfo);
    await page.locator('.waitlist-submit').click({ force: true });
    await expect(page.getByRole('alert')).toHaveText('Please enter your name.');
    await capture(page, `${label}/waitlist-validation`);
    await page.getByRole('button', { name: 'Close dialog' }).click({ force: true });
    if (route === '/faq') {
      const categories = page.locator('.faq-category');
      for (let index = 0; index < await categories.count(); index++) {
        await categories.nth(index).click({ force: true });
        await scrollTo(page, page.locator('.faq-layout'));
        await capture(page, `${label}/faq-category-${index + 1}`);
        await page.locator('.faq-question').first().click({ force: true });
        await capture(page, `${label}/faq-category-${index + 1}-expanded`);
      }
    }
    if (route === '/') {
      for (let index = 0; index < 3; index++) {
        await page.locator('.round-tabs button').nth(index).click({ force: true });
        await scrollTo(page, page.locator('.round-feature'));
        await capture(page, `${label}/round-${index + 1}`);
      }
      const tabs = page.locator('.feature-tab-item');
      await expect(tabs).toHaveCount(4);
      for (let index = 0; index < await tabs.count(); index++) {
        await tabs.nth(index).click({ force: true });
        await scrollTo(page, page.locator('.creative-experience'));
        await capture(page, `${label}/creative-${index + 1}`);
      }
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await checkpoint(page);
      await page.locator('.navbar-cta-button').click({ force: true });
      await fillWaitlist(page);
      await page.locator('.waitlist-submit').click({ force: true });
      await expect(page.locator('.waitlist-success')).toBeVisible();
      await capture(page, `${label}/waitlist-success`);
    }
    expect(network.errors, 'No browser runtime errors').toEqual([]);
    expect(network.failures, 'No unrecorded external dependencies').toEqual([]);
  });
}

for (const width of [390, 1440]) for (const theme of themes) for (const state of ['loading', 'failure']) test(`waitlist ${width} ${theme} ${state} screenshot`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const mock = { delay: state === 'loading' ? 4000 : 0, status: state === 'failure' ? 400 : 201 };
  await prepare(page, { controlledTime: true, mock, theme });
  await ready(page, '/', { controlledTime: true });
  await page.locator('.navbar-cta-button').click({ force: true });
  await fillWaitlist(page);
  await page.locator('.waitlist-submit').click({ force: true });
  if (state === 'failure') await expect(page.getByRole('alert')).toHaveText('Controlled waitlist failure');
  else await expect(page.locator('.waitlist-submit')).toBeDisabled();
  await capture(page, `waitlist/${width}-${theme}-${state}`);
  if (state === 'loading') await expect(page.locator('.waitlist-success')).toBeVisible({ timeout: 6000 });
});
