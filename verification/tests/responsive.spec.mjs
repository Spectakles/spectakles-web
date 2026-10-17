import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { source, reference, readJSON } from '../scripts/paths.mjs';
import { prepare, ready, checkpoint, themes } from './helpers.mjs';

// Derive breakpoint edges from the original active stylesheet set, not from
// the candidate, so a changed candidate breakpoint cannot redefine the test.
const files = ['src/index.css', ...['FloatingNavbar', 'Footer', 'WaitlistModal', 'AsciiWavesBackground', 'CreativeExperience', 'InstitutionsBento', 'MagicBento', 'ParallaxPills', 'ScrollPortalLayout', 'TypingText'].map(name => `src/components/${name}.css`)];
const edges = [...new Set(files.flatMap(file => [...fs.readFileSync(path.join(source, file), 'utf8').matchAll(/\((?:min|max)-width:\s*(\d+)px\)/g)].map(match => Number(match[1]))))].sort((a, b) => a - b);
const widths = [...new Set(edges.flatMap(edge => [edge - 1, edge, edge + 1]))].sort((a, b) => a - b);

for (const route of ['/', '/about', '/faq']) for (const theme of themes) {
  test(`responsive breakpoint geometry ${route} ${theme}`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await prepare(page, { theme, controlledTime: true });
    await ready(page, route, { controlledTime: true });
    const observations = [];
    const layouts = [];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await checkpoint(page, 250);
      observations.push(await page.evaluate(() => {
        const selectors = ['.floating-navbar-pill', '.navbar-nav-links', '.navbar-mobile-toggle', '.hero', '.hero-copy', '.hero-stage-mockup', '.features-2-grid', '.institution-bento-grid', '.magic-bento-grid', '.experience-inner', '.round-feature', '.faq-layout', '.faq-sidebar', '.page-hero'];
        return { width: innerWidth, documentWidth: document.documentElement.scrollWidth,
          elements: Object.fromEntries(selectors.flatMap(selector => {
            const node = document.querySelector(selector);
            if (!node) return [];
            const box = node.getBoundingClientRect(), style = getComputedStyle(node);
            return [[selector, { width: box.width, height: box.height, display: style.display, gridTemplateColumns: style.gridTemplateColumns, flexDirection: style.flexDirection, gap: style.gap, fontSize: style.fontSize }]];
          })) };
      }));
      layouts.push(await page.evaluate(() => {
        const selectors = ['.floating-navbar-pill', '.navbar-nav-links', '.navbar-mobile-toggle', '.hero', '.hero-copy', '.hero-stage-mockup', '.features-2-grid', '.institution-bento-grid', '.magic-bento-grid', '.experience-inner', '.round-feature', '.faq-layout', '.faq-sidebar', '.page-hero'];
        const properties = ['width', 'height', 'padding', 'margin', 'borderWidth', 'borderRadius', 'display', 'position', 'gridTemplateColumns', 'gridTemplateRows', 'flexDirection', 'gap', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'];
        return { viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
          elements: Object.fromEntries(selectors.flatMap(selector => {
            const node = document.querySelector(selector);
            if (!node) return [];
            const style = getComputedStyle(node);
            return [[selector, { offsetWidth: node.offsetWidth, offsetHeight: node.offsetHeight,
              css: Object.fromEntries(properties.map(property => [property, style[property]])) }]];
          })) };
      }));
    }
    const name = `responsive-${route === '/' ? 'home' : route.slice(1)}-${theme}.json`;
    await testInfo.attach('animated-bounds-diagnostic', { body: JSON.stringify({ edges, observations }, null, 2), contentType: 'application/json' });
    if (process.env.PARITY_MODE === 'record') {
      expect(JSON.stringify({ edges, observations }, null, 2)).toMatchSnapshot(name);
    } else if (process.env.PARITY_MODE === 'record-layout') {
      fs.mkdirSync(process.env.PARITY_LAYOUT_OUTPUT, { recursive: true });
      fs.writeFileSync(path.join(process.env.PARITY_LAYOUT_OUTPUT, name), JSON.stringify({ edges, layouts }, null, 2), { flag: 'wx' });
    } else {
      expect({ edges, layouts }, 'Exact untransformed CSS layout; animated bounds are recorded separately').toEqual(readJSON(path.join(reference, 'layout-contracts', name)));
    }
  });
}
