import { test, expect } from '@playwright/test';
import { prepare, ready, fillWaitlist, capture, themes } from './helpers.mjs';

for (const width of [390, 1440]) for (const theme of themes) {
  test(`missing-configuration demo fallback ${width} ${theme}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1,
      baseURL: process.env.PARITY_DEMO_URL || 'http://127.0.0.1:4174', locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const page = await context.newPage();
    const evidence = await prepare(page, { theme, controlledTime: true });
    await ready(page, '/', { controlledTime: true });
    await page.locator('.navbar-cta-button').click({ force: true });
    await fillWaitlist(page);
    await page.locator('.waitlist-submit').click({ force: true });
    await expect(page.locator('.waitlist-success')).toBeVisible();
    expect(evidence.requests, 'Demo success must not be mistaken for persistence').toHaveLength(0);
    expect(evidence.errors).toEqual([]);
    await capture(page, `demo/${width}-${theme}-success`);
    await testInfo.attach('demo-fallback', { body: JSON.stringify({ configured: false, databaseRequests: 0, visibleSuccess: true }), contentType: 'application/json' });
    await context.close();
  });
}

async function events(page) {
  return page.evaluate(() => (window.__parityGtagEvents || []).filter(event => event[0] === 'event').map(([, name, parameters]) => {
    const values = { ...parameters };
    if (values.page_location) {
      const url = new URL(values.page_location);
      values.page_location = url.pathname + url.search + url.hash;
    }
    return { name, parameters: values };
  }));
}

async function waitForEvent(page, name, count = 1) {
  await expect.poll(async () => (await events(page)).filter(event => event.name === name).length).toBe(count);
}

test('real Firebase SDK queues the same page, click, FAQ and waitlist events', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ baseURL: process.env.PARITY_ANALYTICS_URL || 'http://127.0.0.1:4175',
    viewport: { width: 1440, height: 900 }, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
  const page = await context.newPage();
  const evidence = await prepare(page, { analytics: true });
  await ready(page);
  await waitForEvent(page, 'page_view');
  await page.locator('.navbar-nav-links').getByRole('link', { name: 'About', exact: true }).click();
  await waitForEvent(page, 'page_view', 2);
  await page.locator('.navbar-nav-links').getByRole('link', { name: 'FAQ', exact: true }).click();
  await waitForEvent(page, 'page_view', 3);
  await page.locator('.faq-category').nth(1).click();
  await page.locator('.faq-question').first().click();
  await waitForEvent(page, 'faq_question_expanded');
  await page.locator('.navbar-cta-button').click();
  await waitForEvent(page, 'waitlist_modal_opened');
  await fillWaitlist(page);
  await page.locator('.waitlist-submit').click();
  await expect(page.locator('.waitlist-success')).toBeVisible();
  await waitForEvent(page, 'waitlist_submitted');
  await page.locator('.waitlist-success .waitlist-submit').click();
  await waitForEvent(page, 'waitlist_modal_closed');
  const navigationAndForms = await events(page);
  await ready(page, '/faq?mode=parity#privacy');
  await waitForEvent(page, 'page_view');
  const queryEntry = await events(page);
  await page.locator('.navbar-nav-links').getByRole('link', { name: 'How it works' }).click();
  await waitForEvent(page, 'page_view', 2);
  await page.locator('.navbar-nav-links').getByRole('link', { name: 'The GD Reality' }).click();
  await waitForEvent(page, 'page_view', 3);
  const hashes = await events(page);
  expect(evidence.errors).toEqual([]);
  expect(evidence.failures).toEqual([]);
  const contract = { navigationAndForms, queryEntry, hashes };
  expect(JSON.stringify(contract, null, 2)).toMatchSnapshot('firebase-event-contract.json');
  await testInfo.attach('firebase-event-contract', { body: JSON.stringify(contract, null, 2), contentType: 'application/json' });
  await context.close();
});
