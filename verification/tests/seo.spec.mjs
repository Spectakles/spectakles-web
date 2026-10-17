import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';

const origin = 'https://www.spectakles.in';
const routes = ['/', '/about', '/faq'];

async function inspect(page, html) {
  return page.evaluate(html => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const meta = name => [...doc.querySelectorAll(`meta[name="${name}"], meta[property="${name}"]`)].map(el => el.content);
    return {
      title: doc.title,
      description: meta('description'), robots: meta('robots'),
      canonical: [...doc.querySelectorAll('link[rel="canonical"]')].map(el => el.href),
      ogTitle: meta('og:title'), ogDescription: meta('og:description'), ogUrl: meta('og:url'),
      ogImage: meta('og:image'), twitterTitle: meta('twitter:title'), twitterUrl: meta('twitter:url'),
      icon: [...doc.querySelectorAll('link[rel="icon"]')].map(el => el.getAttribute('href')),
      schema: [...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap(el => {
        const value = JSON.parse(el.textContent); return value['@graph'] || [value];
      }),
      language: doc.documentElement.lang,
    };
  }, html);
}

test('each page serves unique SEO metadata and matching structured data without JavaScript', async ({ request, page }) => {
  const titles = new Set();
  const descriptions = new Set();
  for (const route of routes) {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    const head = await inspect(page, await response.text());
    expect(head.language).toBe('en');
    expect(head.title).toContain('Spectakles');
    expect(head.title.toLowerCase()).toContain(route === '/' ? 'group discussion' : route === '/about' ? 'about' : 'faq');
    titles.add(head.title);
    expect(head.description).toHaveLength(1);
    expect(head.description[0].length).toBeGreaterThan(80);
    expect(head.description[0].length).toBeLessThan(190);
    descriptions.add(head.description[0]);
    expect(head.canonical).toEqual([origin + route]);
    expect(head.ogUrl.map(url => new URL(url).href)).toEqual(head.canonical);
    expect(head.twitterUrl).toEqual(head.canonical);
    expect(head.ogTitle).toEqual([head.title]);
    expect(head.twitterTitle).toEqual([head.title]);
    expect(head.ogDescription).toEqual(head.description);
    expect(head.ogImage).toEqual([origin + '/og-image.png']);
    expect(head.robots.join(',')).toMatch(/\bindex\b/);
    expect(head.robots.join(',')).not.toContain('noindex');
    expect(head.icon).toContain('/favicon-96x96.png');
    const org = head.schema.find(item => item['@type'] === 'Organization');
    const site = head.schema.find(item => item['@type'] === 'WebSite');
    const webPage = head.schema.find(item => ['WebPage', 'AboutPage'].includes(item['@type']));
    expect(org.url).toBe(origin + '/');
    expect(site.publisher['@id']).toBe(org['@id']);
    expect(webPage.url).toBe(origin + route);
    expect(webPage.name).toBe(head.title);
    expect(webPage.isPartOf['@id']).toBe(site['@id']);
  }
  expect(titles.size).toBe(routes.length);
  expect(descriptions.size).toBe(routes.length);
  const query = await request.get('/about?utm_source=seo-test');
  expect((await inspect(page, await query.text())).canonical).toEqual([origin + '/about']);
});

test('empty fallback URLs are not indexed or canonicalized as the homepage', async ({ request, page }) => {
  for (const route of ['/pricing', '/unknown-seo-test']) {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    const head = await inspect(page, await response.text());
    expect(head.robots.join(',')).toContain('noindex');
    expect(head.canonical).toEqual([]);
    expect(head.ogUrl).toEqual([]);
    expect(head.twitterUrl).toEqual([]);
  }
});

test('crawl files list only the real canonical routes and brand icons are square', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  expect(locations).toEqual(routes.map(route => origin + route));
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);
  const llms = await request.get('/llms.txt');
  for (const route of routes) expect(await llms.text()).toContain(origin + route);
  for (const [url, size] of [['/favicon-96x96.png', 96], ['/apple-touch-icon.png', 180]]) {
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    const icon = PNG.sync.read(await response.body());
    expect([icon.width, icon.height]).toEqual([size, size]);
  }
});
