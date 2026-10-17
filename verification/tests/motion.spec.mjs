import { test, expect } from '@playwright/test';
import { prepare, ready, themes } from './helpers.mjs';

for (const width of [390, 1440]) for (const reducedMotion of ['no-preference', 'reduce']) for (const theme of themes) {
  test(`motion recording ${width} ${reducedMotion} ${theme}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1,
      locale: 'en-IN', timezoneId: 'Asia/Kolkata', baseURL: process.env.PARITY_TARGET_URL || 'http://127.0.0.1:4173',
      recordVideo: { dir: testInfo.outputPath('video'), size: { width, height: 900 } } });
    const page = await context.newPage();
    const evidence = await prepare(page, { reducedMotion, theme });
    await ready(page);
    const frames = [];
    let previous = 0;
    for (const elapsed of [0, 250, 1000, 2500]) {
      if (elapsed) await page.waitForTimeout(elapsed - previous);
      previous = elapsed;
      frames.push({ elapsed, typed: await page.locator('.typing-text-content').textContent(), hero: await page.locator('.hero-stage-mockup').boundingBox() });
      await page.screenshot({ path: testInfo.outputPath(`startup-${elapsed}.png`) });
    }
    await page.mouse.move(Math.round(width * .3), 300);
    for (let index = 0; index < await page.locator('main .portal-scene').count(); index++) {
      await page.locator('main .portal-scene').nth(index).scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
    }
    await testInfo.attach('motion-observations', { body: JSON.stringify({ reducedMotion, frames, runtimeErrors: evidence.errors }, null, 2), contentType: 'application/json' });
    expect(evidence.errors).toEqual([]);
    const video = page.video();
    await context.close();
    await testInfo.attach('normal-motion-video', { path: await video.path(), contentType: 'video/webm' });
  });
}

test('controlled typing and carousel timeline', async ({ page }) => {
  await prepare(page, { controlledTime: true });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('.typing-text-content')).toBeAttached();
  const observations = [];
  let previous = 0;
  for (const elapsed of [0, 70, 350, 1050, 2200, 4300, 9000]) {
    await page.clock.runFor(elapsed - previous);
    previous = elapsed;
    observations.push({ elapsed,
      typed: await page.locator('.typing-text-content').textContent(),
      activeFeature: await page.locator('.feature-tab-item[aria-selected="true"]').getAttribute('id'),
    });
  }
  expect(JSON.stringify(observations, null, 2)).toMatchSnapshot('typing-carousel-timeline.json');
});
