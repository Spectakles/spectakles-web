# Live reference comparison — 16 October 2026

Reference: https://spectakles.in. Candidate: http://127.0.0.1:3000.

## Design comparison

- Captured `/`, `/about`, and `/faq` at 390px and 1440px, with a 900px viewport height and device scale factor 2.
- Compared 2,420 elements across those six page/viewport combinations, including content below the fold. Checked typography, colors, backgrounds, spacing, dimensions, borders, and grid columns.
- No static style differences were found. Remaining measured differences were the phases of animated progress indicators and audio bars. The experimental hero wrapper CSS module mentioned in earlier checks has since been removed.
- The deployed stylesheet `/assets/index-CjeNpDCX.css` has SHA-256 `e470f2b1624aff6cbcb80734834658dfa73574eb1baa2a6b902b90d313f2d607`, identical to the archived original build.
- All 30 preserved original style/configuration/asset/public-resource files still pass the byte comparison. Font-face declarations and URLs remain unchanged.

## Screenshot-driven correction — 17 October 2026

The user's Safari screenshots revealed a blank hero that the earlier automated style and geometry comparisons missed. Those comparisons did not establish visual parity in the installed Safari browser. The previous CSS container/trigonometric scaling and low-density compositor workaround have both been removed, along with `RoundtableHero.module.css`.

The preview now uses the original numeric transform approach: a fixed 1120 × 860 iframe scaled to its measured container width, with ResizeObserver updates. The initial client measurement runs in a layout effect. The original iframe HTML, compiled styles, fonts, colors, and artwork remain unchanged. Correct sizing depends on client JavaScript; the earlier no-JavaScript sizing claim no longer applies.

Inspected both existing tabs in the user's installed Safari. The restored local preview visibly paints its participants, topic, caption, and sidebar. Localhost had a non-default zoom while the live tab's Actual Size control was disabled. Applying Actual Size to localhost restored the same visible logo, navigation, heading, button, and preview dimensions as the live tab. No global CSS enlargement was needed. Scroll positions and animation phases differed between the two tabs, so these observations do not claim identical complete screenshots.

## Current validation

Production build and all 27 focused checks passed: 24 behavior/hero checks across Chromium, Firefox, and WebKit, plus three SEO checks. Hero checks cover resizing at 320, 390, 768, 1440, 1453, and 1709 CSS pixels, and actual sidebar paint at display densities 1, 1.25, and 2. They no longer assert the discarded compositor technique improves sharpness. All 27 preserved design files still match their original hashes.

## Expanded comparison and SEO pass — 17 October 2026

The subsequent SEO pass repeated the live comparison at three widths and in both themes, before and after the metadata changes. All 18 combinations passed. See [SEO_REPORT.md](./SEO_REPORT.md) for scope and validation. Three crawl metadata files now intentionally differ; the remaining 27 preserved design files still pass their original hashes.
