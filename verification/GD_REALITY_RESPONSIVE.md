# GD Reality responsive card correction — 17 October 2026

The supplied compact-screen screenshots showed the visual previews colliding with headings and buttons, and the placement/interview indicators extending outside their cards. The original previews were absolutely positioned while the mobile text relied on fixed top padding. Preview width plus left/right offsets also exceeded the available space.

`InstitutionsBentoResponsive.css` adds scoped overrides at the existing 992px tablet breakpoint. Each card places its category, preview, text, and action in normal flex flow, with natural height and spacing. Preview widths use their available content area. Status rows and badges wrap instead of being clipped. Actions stay visible without hover. The original desktop styles, assets, typography, color treatments, and animation artwork are preserved.

Regression coverage checks all seven cards at 320, 390, 594, 720, 768, and 992 CSS pixels in Chromium, Firefox, and WebKit. It checks separation between content blocks, containment of preview panels and status labels, and visible actions after hover. Screenshots at 320 and 594 pixels were also reviewed. Existing navigation, hero, and SEO checks remain applicable.

The first combined test run overlapped a screenshot-export run using the same Playwright trace directory. Two test cleanups failed with missing trace files; their assertions did not fail. Those checks were rerun with isolated output directories.

Validation completed: production build passed; all 30 unique focused browser/SEO checks passed, including the isolated reruns; all 27 original preserved design-source hashes still match. Responsive screenshots are local test artifacts, and the earlier broad parity claims do not imply that these newly corrected compact layouts match the original broken layouts.

## Animated cards with a stable hover area

The grid now positions stationary slots, each containing the original card. Hovering a slot triggers the original 5px lift, shadows, text/button transitions, and artwork animations. Because the slot remains under the pointer when the card lifts, moving near the original card edge no longer causes repeated enter/leave transitions. Slots also exclude animated descendants from scroll anchoring to prevent the Firefox page jump reproduced during testing.

The original stylesheet's hover selectors now target the enclosing slot; all original declarations remain unchanged. The design-source guard normalizes only that selector substitution before checking the original hash. Compact-screen layout overrides remain in their separate stylesheet.

The regression test holds the pointer near every slot's bottom edge at desktop and compact widths, verifies continuous hover over 36 frames, checks that the lift never reverses, and requires the original -5px settled translation.

Restored-animation validation: production build and all 33 focused browser/SEO checks passed, including continuous edge hover with the full lift enabled in Chromium, Firefox, and WebKit. The design-source check also passed with hover selectors normalized.
