# Design comparison and technical SEO — 17 October 2026

The live reference redirects from `https://spectakles.in/` to `https://www.spectakles.in/` with HTTP 308. The production www host returns HTTP 200.

## Design parity

Before and after the SEO changes, compared all three live pages (`/`, `/about`, `/faq`) at 390px, 768px, and 1440px, in both light and dark themes. All 18 combinations passed, covering 7,260 element style comparisons per pass. The home waitlist modal and a switched/expanded FAQ state were also compared in both themes at each width.

No static component styling differences were found. Animation clocks and transitions were synchronized to avoid comparing unrelated animation phases. This is evidence for the tested states, not a guarantee that every moving pixel at every possible viewport is identical. The subsequent Safari screenshot correction removed the experimental hero clarity and CSS scaling workarounds; see LIVE_COMPARISON.md. Earlier automated style comparisons missed the installed Safari paint failure.

The live stylesheet still has SHA-256 `e470f2b1624aff6cbcb80734834658dfa73574eb1baa2a6b902b90d313f2d607`, matching the original preserved build. All 27 preserved design/configuration/asset files remain byte-identical. The three intentionally updated crawl metadata files are tested separately; the immutable original reference has not been replaced.

Local evidence: `.parity/seo-audit/parity.json` and `.parity/seo-audit-after/parity.json`.

## SEO changes

- Added distinct server-rendered titles and descriptions for Home, About, and FAQ.
- Corrected each page's canonical URL. About and FAQ no longer identify the homepage as their canonical page.
- Unified canonical, Open Graph, Twitter, structured-data, robots, sitemap, and llms.txt URLs on the actual www production host. Query parameters do not change the canonical URL.
- Added page-specific WebPage/AboutPage JSON-LD linked to the shared WebSite and Organization data. Structured data is escaped safely and does not invent prices, reviews, or other content.
- Prevented empty fallback URLs from being indexed, while preserving their existing shared shell and HTTP 200 behavior. Vercel preview builds also receive noindex metadata.
- Added square 96px PNG and 180px Apple icons rendered from the unchanged original logo artwork. The original SVG, page logos, fonts, colors, copy, and layout remain intact.
- Kept the existing 1200 × 630 social image. Simplified the sitemap to the three real canonical routes and removed unverified modification dates.

## Validation

Production build, TypeScript, focused SEO lint, 24 browser behavior/hero checks across Chromium, Firefox and WebKit, and three server-output SEO checks passed. Preview-indexing behavior and JSON-LD escaping were also checked directly.

The existing pre-migration lint findings elsewhere are outside this SEO change. No deployment or search-console submission was performed.

## References

- [Next.js metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Google canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google robots metadata](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [Google favicon requirements](https://developers.google.com/search/docs/appearance/favicon-in-search)
