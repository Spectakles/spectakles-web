> Execution update (2026-10-16): The first full Next.js App Router conversion pass is implemented on `conversion-to-next-js`. At the user's direction, raw pixel calibration is deferred and does not block conversion. The existing React/TypeScript language, page markup, styles, fonts, logos, copy, and asset content are preserved; Next.js replaces Vite and React Router. Production build, TypeScript, six Chromium behavior checks, original iframe-document comparison, 30 design-source hashes, and the copied font declarations pass. Existing lint issues remain. Earlier baseline procedures below are reference material, not a current implementation blocker.

# Spectakles: Next.js migration plan with design and behavior parity

**Status:** Phase 0 reference acquisition is established; strict raw-pixel repeatability remains under calibration. No application migration has been performed. See [the baseline report](verification/BASELINE_REPORT.md).

**Prepared:** 16 October 2026  
**Working branch:** `conversion-to-next-js`  
**Baseline commit:** `0065ac0b555a1be65889f674b509e3d2e4d1145c`  
**Application directory:** `spectackle-product/`

## 1. Answer and scope

The website is **not currently built with Next.js**. Its application package declares React 18.3.1, TypeScript, Vite 5.4.2, React Router 7, Tailwind CSS 3, GSAP, Firebase Analytics, and Supabase. `src/main.tsx` mounts a client-rendered application with `createRoot`; `src/App.tsx` supplies a `BrowserRouter`.

Next.js is a React framework, not a programming language. The migration will retain **TypeScript, TSX, CSS, the existing React components, and the existing design**. The changes concern application entry points, routing, rendering boundaries, build tooling, environment variables, and hosting configuration.

The objective is a Next.js App Router application whose rendered website looks and behaves like the baseline. “It builds” is insufficient: the migration is complete only when visual and interaction comparisons pass.

### 1.1 Non-negotiable preservation requirements

| Area | Preservation requirement |
| --- | --- |
| Page structure | Same sections, section order, content, links, and component hierarchy wherever framework changes do not require otherwise. |
| Geometry | Same widths, heights, margins, padding, gaps, alignment, radii, borders, shadows, and responsive layout. |
| Typography | Same font files, family names, requested weights, line heights, letter spacing, wrapping, and fallback stacks. |
| Identity | Same SVGs, images, favicon, social image, icons, logo variants, proportions, and colors. |
| Styling | Same CSS declarations, Tailwind v3 configuration, design tokens, media queries, hover states, focus styles, and theme selectors. |
| Motion | Same typing sequence, timings, scroll effects, transforms, hover interactions, carousel behavior, canvas effects, and reduced-motion behavior. |
| Navigation | Same active URLs, hash destinations, query handling, mobile menu behavior, route remount behavior, and observable scroll behavior. |
| Forms | Same fields, labels, validation, loading, success, failure, close/reset behavior, and submission payloads. |
| Integrations | Same Supabase table and Firebase events, names, parameters, and event triggers. |
| Visibility | Features and pages that are currently hidden or disconnected stay hidden or disconnected. |

### 1.2 Scope exclusions

This migration does not include a redesign, copy rewrite, new page launch, Tailwind v4 upgrade, component-library replacement, new backend, authentication, database/schema changes, waitlist API redesign, or animation rewrite. It does not add a visible theme switch, new skeletons, new empty states, or a branded error design.

Image optimization, font optimization, finer Server Component extraction, and unrelated SEO improvements are separate follow-up opportunities. They are not prerequisites for this conversion and must not be mixed into its acceptance criteria.

## 2. Verified repository inventory

### 2.1 Source of truth

Use the files under `spectackle-product/` as the application source of truth. The repository also has a root `package.json` with different React dependencies and a root README describing a broader product architecture. Neither overrides the application manifest or executable route declarations.

| File or area | Current responsibility | Migration consequence |
| --- | --- | --- |
| `spectackle-product/package.json` | Vite scripts and application dependencies | Replace the toolchain here; preserve unrelated library versions. |
| `src/main.tsx` | `createRoot`, Strict Mode, global stylesheet import | Next.js assumes entry-point ownership. |
| `src/App.tsx` | BrowserRouter, three routes, scroll reset, global background, analytics, shared layout | Distribute these responsibilities across App Router entry points and client infrastructure. |
| `src/components/Layout.tsx` | Navigation, mobile menu, waitlist context/modal, saved theme, hash scroll, pathname-keyed main | Preserve shell lifetime and DOM structure; make browser access safe. |
| `src/pages/` | Active and inactive page components | Rename to `src/views/` to avoid accidental Next.js Pages Router discovery. |
| `src/index.css` and component CSS | Global design and animation rules | Preserve declarations; explicitly verify stylesheet precedence. |
| `index.html` | Fonts, document metadata, social metadata, structured data, Vite entry | Transfer document concerns before retiring this file. |
| `src/components/RoundtableHero.tsx` | Scaled iframe using HTML/CSS imported with Vite `?raw` | Replace raw imports without changing iframe content or sizing. |
| `src/lib/firebase.ts` | Vite environment access and analytics initialization | Convert environment references; initialize analytics only in the browser. |
| `src/lib/supabase.ts` | Public browser client and optional configuration | Preserve browser submission architecture and no-config behavior. |
| `public/` | Favicon, OG image, robots, sitemap, LLM information | Preserve URLs and file contents initially. |
| `vercel.json` | Catch-all rewrite to `/index.html` | Remove this SPA rule for native Next.js routing. |

### 2.2 Routes actually registered today

| URL | Current component | Planned App Router entry |
| --- | --- | --- |
| `/` | `src/pages/Home.tsx` | `src/app/page.tsx` rendering `src/views/Home.tsx` |
| `/about` | `src/pages/About.tsx`, lazy-loaded | `src/app/about/page.tsx` rendering `src/views/About.tsx` |
| `/faq` | `src/pages/FAQ.tsx`, lazy-loaded | `src/app/faq/page.tsx` rendering `src/views/FAQ.tsx` |

`Impact.tsx`, `Pricing.tsx`, `Blog.tsx`, and `BlogArticle.tsx` exist but are **not registered in `App.tsx`**. The navbar's unused `navLinks` array also names destinations that are not rendered by the current navigation. In contrast, the rendered footer includes a `/pricing` link. Those discrepancies are baseline facts, not authorization to activate pages or change links.

Do not create `/impact`, `/pricing`, `/blog`, or `/blog/[slug]` as functioning content routes during this migration. Keep their source available under `src/views/`, adapting imports/types as needed. Review unknown-path behavior separately so a default Next.js error page does not unexpectedly change what existing broken links display.

Existing home anchors include `#top`, `#institutions`, `#how-it-works`, and `#experience`. The footer also references `/#practice` and `/faq#privacy`, `/faq#terms`, and `/faq#cookies`; target validity must be recorded from the baseline rather than assumed. Do not invent missing sections or legal content.

### 2.3 Rendering and styling details that must survive

- The global ASCII/cursor wave background is mounted outside `Layout` and persists between pages.
- `Layout` persists between routes, but `<main id="top" key={location.pathname}>` remounts page content when the pathname changes.
- Theme selection reads the exact localStorage key `Spectakles-theme`; only the stored value `dark` selects dark mode. The current rendered navigation contains no theme-toggle control.
- The body has a 320px minimum width. Global scrolling uses smooth behavior and 92px top scroll padding.
- The document defines DM Sans, Space Grotesk, and DM Mono font faces with explicit remote URLs and preloads. The Tailwind configuration separately includes Plus Jakarta Sans as its sans-family setting. Preserve both arrangements rather than “correcting” them.
- The hero iframe uses a 1120 × 860 coordinate space, an initial scale of `0.5`, a ResizeObserver, an aspect-ratio wrapper, and specific shadows and clipping.
- `RoundtableMockup.tsx` is another component, with different dimensions. It is not a drop-in replacement for the active `RoundtableHero.tsx`.
- GSAP ScrollTrigger registration currently occurs at module scope in `ScrollPortalLayout.tsx` and `CreativeExperience.tsx`.
- CSS contains many late overrides and overlapping responsive rules. Deduplication can change the site and is outside scope.
- Several intro/WebGL/particle components exist without being used by the active page tree. Preserve their availability without mounting them.

### 2.4 Checks performed while preparing this plan

| Check | Result |
| --- | --- |
| Git baseline | Branch `conversion-to-next-js`, based on `0065ac0`; clean before this document was added. |
| Application typecheck | `npm run typecheck` passed. |
| Application lint | `npm run lint` failed with 29 errors and 2 warnings. Existing issues include unused imports/variables, explicit `any`, one `prefer-const` error, and Fast Refresh export warnings. |
| Automated browser/screenshot tests | No test script is declared in the application manifest. No visual baselines were captured for this planning task. |
| Production build/browser audit | Not performed for this planning task; required in Phase 0. |
| Hosting dashboard/environment | Not inspected. The checked-in Vercel file indicates intended hosting configuration, not proof of current production settings. |

No application files, dependency manifests, lockfiles, or deployment settings have been changed to prepare this plan.

## 3. Target architecture and decisions

### 3.1 Framework and rendering approach

Use the **Next.js App Router**, with explicit files for the three active routes. Keep the root layout and route entry points as Server Components. Initially retain the existing interactive page implementations as Client Components to minimize changes to JSX and state management.

A Server Component can pass page content through a client shell's `children` slot. The shell supplies the existing context; client page components can continue consuming it. Avoid passing event-handler functions across a server-to-client prop boundary.

Client Components can still be prerendered on the initial request. Adding `'use client'` alone does not make render-time `localStorage`, module-level browser SDK initialization, or other browser dependencies safe. [Next.js Server and Client Components documentation](https://nextjs.org/docs/app/getting-started/server-and-client-components)

The intended result uses native Next.js routes. A temporary SPA adapter may help isolate a debugging issue, but wrapping the entire old `BrowserRouter` in a catch-all route is not the final migration.

### 3.2 Toolchain and dependency policy

1. At implementation time, select a supported stable Next.js release and inspect its exact Node, React, and React DOM requirements. Pin a compatible version set in the application lockfile; do not install canary releases.
2. Current Next.js installation documentation specifies Node.js 20.9 or newer. Prefer a supported Node LTS that also meets the selected release's requirements, and use the same version locally, in CI, and on the host. The locally observed Node 26.5.0 version does not establish the host's runtime. [Next.js installation documentation](https://nextjs.org/docs/app/getting-started/installation)
3. Treat React/React DOM and type-package changes required by that Next.js release as a separate compatibility step. Do not assume the nested application's React 18 or the root package's React 19 is automatically the correct target.
4. Keep Tailwind on v3, retaining its configuration and PostCSS/Autoprefixer behavior.
5. Keep GSAP, Lucide, Supabase, and Firebase versions unless a demonstrated compatibility issue requires a change.
6. Disable optional compiler experiments and avoid new UI dependencies during the migration.
7. Use the nested package as the install/build root. Do not merge the two package manifests or delete the root manifest/lockfile without first establishing whether any tooling uses them.

### 3.3 Proposed file structure

```text
spectackle-product/
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Document, metadata, fonts, shared shell
│   │   ├── page.tsx                 # Home route adapter
│   │   ├── about/page.tsx           # About route adapter
│   │   ├── faq/page.tsx             # FAQ route adapter
│   │   └── [...unmatched]/page.tsx  # Preserve existing empty-shell HTTP 200 fallback
│   ├── views/                       # Renamed from src/pages; no auto-routing
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   ├── FAQ.tsx
│   │   ├── Impact.tsx               # Retained, inactive
│   │   ├── Pricing.tsx              # Retained, inactive
│   │   ├── Blog.tsx                 # Retained, inactive
│   │   ├── BlogArticle.tsx          # Retained, inactive
│   │   └── blog.css
│   ├── components/
│   │   ├── Layout.tsx              # Existing persistent client shell
│   │   ├── AnalyticsTracker.tsx     # Updated route observation
│   │   ├── RouteEffects.tsx         # Scroll/hash coordination, no visible DOM
│   │   └── ...                     # Existing components and styles retained
│   ├── generated/
│   │   └── roundtable-document.ts   # Deterministic iframe string, build-generated
│   ├── assets/                     # Existing trusted raw HTML/CSS and assets
│   ├── data/                       # Existing content retained
│   ├── lib/                        # Adapted browser-safe integration clients
│   └── index.css                   # Original stylesheet retained
├── scripts/
│   └── generate-roundtable.mjs      # Replaces Vite raw asset handling
├── public/
│   ├── assets/                     # Exact copies of assets needing stable URLs
│   └── ...                         # Existing public files and paths retained
├── next.config.ts                  # Minimal configuration
├── next-env.d.ts                    # Next-generated declarations
├── tsconfig.json                   # Next-compatible application configuration
├── eslint.config.*                 # Next-compatible lint configuration
├── tailwind.config.js              # Existing Tailwind v3 theme preserved
├── postcss.config.js               # Existing plugin arrangement preserved
├── package.json
└── package-lock.json
```

Infrastructure components should return fragments or `null` where possible. Preserve the existing `#root`, `.site-shell`, `<main>`, navbar, modal, and footer relationship; add no layout wrappers without checking their effect on flex/grid, containing blocks, sticky positioning, and stacking contexts.

## 4. Phase 0 — establish the visual and behavior baseline

**Goal:** Create evidence of the current website before changing its framework.

1. Record commit, browser versions, OS, viewport dimensions, device pixel ratio, Node/npm versions, and dependency-lockfile identity.
2. Work from the application directory. Run a clean production Vite build and serve that build as the reference. If reproducible clean dependency installation is needed, use an isolated baseline copy so the migration's installation cannot replace it.
3. Record current build, typecheck, and lint output. Classify pre-existing findings; do not begin by modifying the interface to resolve them.
4. Confirm the baseline's live route set, response status codes, canonical tags, static resources, and behavior when opening a deep link directly.
5. Capture screenshots and interaction recordings for the matrix in Section 13. Include full-page screenshots and individual sections at controlled scroll positions.
6. Capture computed styles for typography, principal containers, navbar, buttons, cards, footer, and modal. Record the actual production stylesheet order.
7. Exercise the three active routes through client navigation, hard refresh, direct entry, back, forward, query changes, and hash changes.
8. Record page-state resets versus shell-state persistence: mobile menu, modal, round tabs, FAQ category/open items, and background lifetime.
9. Record pre-existing dead links and missing anchors. Visit `/pricing`, `/impact`, `/blog`, a sample article URL, and a random unknown path to record what users currently see.
10. Inspect integration behavior using controlled responses and test configuration. Do not create real waitlist entries merely to collect a baseline.
11. Measure representative production load, layout shifts, scroll smoothness, and memory/CPU behavior for comparison. Improvements are welcome only when they preserve the agreed interface.

**Deliverables:** Reference screenshots, recordings, interaction inventory, style/cascade record, integration contract, and existing-issues list.

**Exit gate:** Every live route and high-risk UI state has a reproducible reference. No claim of pixel parity is made before these references exist.

## 5. Phase 1 — introduce Next.js without reconstructing the site

**Depends on:** Phase 0 evidence.

1. Continue on `conversion-to-next-js`; keep the baseline commit/deployment available.
2. Rename `src/pages/` to `src/views/` before enabling Next.js route discovery. Update imports without editing page markup. Leaving these files under `src/pages/` could expose unintended Pages Router URLs or introduce conflicting routing behavior.
3. Add the selected Next.js package and its required compatible React/runtime/type dependencies. Preserve unrelated packages and Tailwind v3.
4. Add a minimal Next configuration. Use the normal Next.js deployment model initially; do not blindly carry over Vite's `dist` output or choose static export without checking the host requirements.
5. Replace the Vite TypeScript project-reference setup with one Next-compatible app configuration. Preserve strict checking, DOM libraries, and `@/* → src/*`. Include generated Next types as required by the selected version.
6. Replace Vite client declarations with Next declarations and asset typing where necessary. Remove Vite-only type references after raw imports have been replaced.
7. Adapt ESLint for Next.js and remove the Vite Fast Refresh rule. Keep lint as an explicit CLI script; do not assume a production build also runs lint.
8. Extend nested-app ignore rules to exclude `.next/`, generated build/type caches, and any chosen test artifacts. Existing root-anchored ignore entries do not necessarily cover a nested application.
9. Install from `spectackle-product/` and confirm the resolved dependency tree uses the intended React pair. Avoid hoisting ambiguity with the repository root manifest.

Proposed scripts, with exact type-generation details verified against the selected release:

| Script | Intended responsibility |
| --- | --- |
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `preview` | Optional compatibility alias to `next start`, if local workflows use it |
| `lint` | `eslint .` |
| `typecheck` | Generate Next route types if needed, then `tsc --noEmit` |
| `prepare:roundtable` | Run deterministic iframe-document generator |
| `predev` / `prebuild` | Generate the iframe module before compilation |
| `test:e2e` | Browser behavior regression suite |
| `test:visual` | Controlled screenshots and comparison reports |

**Exit gate:** Toolchain and file discovery are explicit; no inactive page becomes a public route. Intermediate commits may require later phases before a full build succeeds, but no such commit is deployed.

## 6. Phase 2 — migrate document structure, fonts, and the CSS cascade

### 6.1 Document ownership

1. Create `src/app/layout.tsx` with `<html lang="en">` and `<body>`.
2. Preserve the existing `#root` wrapper if baseline DOM/style checks show it contributes to layout or integration assumptions. Keeping it initially is the lowest-change approach.
3. Transfer font-face declarations, preconnects, and preloads from `index.html` without changing URLs, requested weights, display strategy, or family names.
4. Transfer favicon, title, description, canonical, robots, Open Graph, Twitter metadata, and existing Organization/WebSite structured data.
5. Let Next.js own character encoding and viewport metadata without duplicating their tags. Preserve the effective viewport behavior.
6. Remove the Vite module-entry script when Next.js assumes entry-point ownership.

### 6.2 Styling preservation

1. Retain `src/index.css` and component CSS declarations unchanged during the initial port.
2. Retain Tailwind v3 base/components/utilities directives, preflight, theme extension, shadows, colors, and all media queries.
3. Update Tailwind content paths for `src/app`, `src/views`, and `src/components`; preserve any asset-source scanning that currently affects generated classes. Do not let a rename drop utility classes from the build.
4. Derive import precedence from the Vite production baseline. Do not assume “put global CSS first” reproduces the current cascade: `main.tsx` imports `App` before `index.css`, and component import graphs also influence order.
5. Where needed, centralize active global stylesheet imports in one deliberate sequence and remove duplicate imports. Make only import-placement changes, not selector/value rewrites.
6. Keep inactive styles from leaking into active pages. For example, globally loading `blog.css` just because its source exists could change unrelated content.
7. Verify direct entry and multi-route navigation sequences; stylesheet loading and retention can differ between those cases.
8. Compare production output, not just development screenshots. Next.js documents that CSS order can differ between development and production. [Next.js CSS documentation](https://nextjs.org/docs/app/getting-started/css)

### 6.3 Fonts and images

Keep the current font loading mechanism for the first migration. A change to `next/font` could alter the font files, family names, fallback metrics, or loading behavior, so it requires separate visual validation later.

Keep ordinary `<img>` elements initially. Preserve source bytes, dimensions, loading attributes, alt text, inline styles, and SVG aspect ratios. For string SVG imports, use byte-identical assets under `public/assets/` and explicit URL strings rather than assuming Vite and Next.js produce the same import shape. Preserve the logo's current 1433/231 aspect-ratio calculation.

**Exit gate:** Fonts resolve, assets load, and static page geometry/colors match the baseline before animation differences are investigated.

## 7. Phase 3 — replace routing and preserve shared state

### 7.1 Route adapters and component boundaries

1. Add `app/page.tsx`, `app/about/page.tsx`, and `app/faq/page.tsx`; each initially renders its existing view.
2. Keep metadata exports in server route/layout files. Place `'use client'` on interactive entry components, including `Layout` and views that use hooks/context/events.
3. Mount the background once at the same relative position as today. Mount the persistent shell once around the route `children`.
4. Replace `useLocation().pathname` with `usePathname()` inside the client shell, keeping `<main id="top" key={pathname}>` so page state resets on pathname changes.
5. Do not key the entire shell by pathname: that would also reset the menu/modal/context and restart persistent effects.
6. Remove `BrowserRouter`, `Routes`, `Route`, and the old app-level lazy route/Suspense setup once App Router equivalents work.

### 7.2 Links and dormant source

- Convert internal React Router `<Link to="…">` usage to `next/link` with `href`, preserving classes, children, callbacks, tracking, and browser modifiers.
- Preserve external anchors, their `target`/`rel` attributes, and existing URL text.
- Audit every React Router import, including inactive `Impact`, `Blog`, `BlogArticle`, and `SpectakleIntro` files. Unmounted source can still fail typechecking.
- For inactive `BlogArticle`, make slug selection an explicit optional prop or adapt it to the new router API without creating a live article route. Replace the React Router `Navigate` dependency with equivalent dormant behavior; do not make a redirect part of the live site merely to silence an import.
- Remove `react-router-dom` only after the source-wide import audit is clean.

### 7.3 Scroll, hashes, and URL observation

Introduce one invisible client coordinator instead of letting multiple scroll mechanisms compete. Use Next Link's scroll control where appropriate so the coordinator can reproduce the baseline. Next.js handles routing and link scrolling differently from React Router; hash behavior therefore requires explicit checks. [Next.js Link reference](https://nextjs.org/docs/app/api-reference/components/link)

The coordinator must distinguish:

| Navigation | Required parity check |
| --- | --- |
| Pathname changes without a hash | Reproduce the current scroll-to-top behavior and page remount. |
| Navigate from another page to a home hash | Wait for the target to exist, then reproduce the baseline scroll and offset. |
| Change only a hash on the current page | Scroll correctly even though `usePathname()` does not change. |
| Direct URL with a hash | Reach the existing target after hydration/layout is ready. |
| Change query only | Preserve page state and match baseline page-view/scroll behavior. |
| Browser back/forward | Match observed history behavior rather than assuming Next.js defaults equal the baseline. |
| Click the current hash again | Preserve repeated-anchor behavior. |
| Missing hash target | Preserve the existing result; do not add missing content. |

Use pathname/query subscriptions plus browser history/hash events and link-click coordination as needed. Framework history updates do not guarantee a native `hashchange` event for every link action, so a hash listener alone is insufficient. Bound any target-readiness retry, cancel timers/listeners on cleanup, and preserve the existing 100ms smooth-scroll scheduling unless measurements show framework timing requires an equivalent adjustment.

If `useSearchParams()` is used for analytics/coordinator state, keep that invisible subscriber inside a narrow `<Suspense fallback={null}>` boundary. Avoid wrapping the visible shell in a boundary that could blank the site. [Next.js useSearchParams reference](https://nextjs.org/docs/app/api-reference/functions/use-search-params)

### 7.4 Unknown paths and currently disconnected destinations

The current router has no explicit catch-all content route. Phase 0 has confirmed that the archived production build with the checked-in SPA fallback returns HTTP 200 and a shared shell with an empty main for disconnected paths. Preserve both that appearance and status, using a native catch-all page that returns no content inside the existing shared shell. Do not use a visible default Next.js 404 or activate dormant content. Verify the shell mounts once.

The user's subsequent one-to-one requirement also rules out an incidental HTTP-status change for these existing paths. Production hosting is still uninspected; if it differs from the local build contract, record and resolve that discrepancy before deployment rather than silently choosing new behavior.

**Exit gate:** All active routes, link callbacks, anchors, state resets, and shell persistence behave as recorded. No dormant page has been activated.

## 8. Phase 4 — make browser-dependent behavior safe without changing it

### 8.1 Saved theme and hydration

The current `useState(() => localStorage.getItem(...))` initializer is unsafe during prerendering. Replace it without introducing a light-theme flash for users with a saved dark theme.

1. Add a small pre-paint theme bootstrap to the document that reads `Spectakles-theme` and sets `document.documentElement.dataset.theme`. Preserve the current default of light, not operating-system preference.
2. Guard storage access for environments where it throws. Falling back to light must not crash rendering.
3. Give the client component a deterministic initial render, then read/synchronize the saved theme after mounting. Gate persistence until that read has completed so the initial light state cannot overwrite a saved dark value.
4. Ensure the initial body colors use the bootstrap's CSS theme immediately; the React state synchronization must not flash or reverse the theme.
5. If the bootstrap changes the HTML theme attribute before hydration, limit any necessary hydration-warning suppression to that specific root-attribute case. Never suppress warnings across the component tree to conceal real mismatches.
6. Preserve the absence of a visible toggle; unused Moon/Sun imports are not evidence that a theme-control UI is active.

### 8.2 Animation and browser API audit

| Component/group | Main audit | Behavior to preserve |
| --- | --- | --- |
| `AsciiWavesBackground` | Canvas creation, matchMedia, document/root theme observation, pointer/resize events, animation frames | Persistent background, density, colors, responsiveness, coarse-pointer and reduced-motion handling. |
| `ScrollPortalLayout` | GSAP/ScrollTrigger import and registration, scoped setup/cleanup | Perspective 1000, scrub 0.35, scene opacity/scale/position, hero exclusion, trigger thresholds. |
| `CreativeExperience` | Module-level plugin setup, useLayoutEffect, timers, hover and active state | Existing slides, duration, progress visuals, transition behavior and autoplay rules. |
| `InstitutionsBento`, `MagicBento` | Observers, timers, matchMedia and hover effects | Existing bento motion, card proportions, text, and interaction thresholds. |
| `ParallaxPills` | Pointer listeners, transforms, resize/coarse-pointer handling | Same strength, rotation, highlight, and responsive placement. |
| `TypingText` | Interval/timeout cleanup and initial rendered text | Same words, 70ms typing, 38ms deleting, 2200ms pauses, cursor and wrapping. |
| `RoundtableHero` | ResizeObserver and iframe size timing | Same 1120 × 860 layout, initial scale, wrapper ratio, transform origin and border/shadows. |
| Inactive intro/WebGL/particle components | Browser-only imports and hooks, router dependencies | Remain inactive and type-compatible; do not bring their animations into the live page tree. |

Move DOM-dependent setup into effects or guarded browser-only initialization where necessary. Keep GSAP timelines scoped and revert them on unmount. Cancel animation frames, observers, media-query subscriptions, resize/pointer listeners, and timers with the same lifecycle as before.

Do not move visually important layout work to a later effect simply to eliminate a warning if doing so changes the visible first frame. Investigate the exact cause and preserve initialization geometry.

If a specific effect or library cannot prerender safely, use a narrow dynamic client wrapper with `ssr: false` and preserve the existing outer dimensions. Such declarations belong in Client Components. Do not disable SSR for the entire site as a shortcut. [Next.js lazy-loading documentation](https://nextjs.org/docs/app/guides/lazy-loading)

### 8.3 Deterministic rendering

Audit random/time-based values during rendering. Keep randomness used for canvas/particle animation inside browser setup; do not introduce different random DOM on server and client. Check the footer's current-year rendering around year boundaries without changing its wording or layout.

Retain Strict Mode checks. A library setup that duplicates work under development mount/cleanup cycles should be fixed at the lifecycle boundary, not hidden by disabling Strict Mode.

**Exit gate:** Production prerendering succeeds, there are no hydration errors, saved dark mode paints correctly, and repeated navigation does not duplicate animations or listeners.

## 9. Phase 5 — replace raw asset imports and preserve the iframe exactly

### 9.1 Identified incompatibility

`RoundtableHero.tsx` uses two Vite-specific string imports:

```ts
import roundtableHtml from '../assets/roundtable.html?raw';
import roundtableCss from '../assets/roundtable-compiled.css?raw';
```

It replaces the Tailwind CDN script in the HTML with the existing compiled stylesheet, then inserts sizing/overflow rules before `</head>`. Next.js must receive the same resulting `srcDoc` string.

### 9.2 Preferred replacement: a deterministic build step

1. Add `scripts/generate-roundtable.mjs`, reading the two existing trusted local asset files as UTF-8.
2. Apply exactly the same replacements as `RoundtableHero` currently applies. Do not run an HTML formatter, CSS optimizer, sanitizer, or JSX conversion over this source.
3. Serialize the result safely into `src/generated/roundtable-document.ts` using JSON string serialization. This avoids manual escaping errors in template literals.
4. Run generation before `dev` and `build`. Record that raw source edits during development require regeneration/restart unless a generator watch mode is added.
5. Import the generated string into `RoundtableHero`; keep the same iframe, title, wrapper, `scrolling`, classes, ResizeObserver, transforms, and dimensions.
6. Keep generator output deterministic: no timestamps, machine-dependent absolute paths, or random values. Either commit it and check freshness or generate it reliably in every clean build; choose one documented policy. Preferred policy: commit it and add a freshness check.
7. Compare the generated document string against the baseline's transformed output. This is a useful focused test because an escaping or replacement error can silently destroy the entire hero preview.
8. Inspect inside the iframe at desktop and mobile sizes. Confirm compiled CSS is present, no Tailwind CDN script has returned, there are no nested scrollbars, and resizing/navigation preserve the preview.

This approach avoids bundler-specific raw loaders and runtime filesystem reads. It keeps the existing iframe isolation instead of risking CSS leakage by inlining the preview into the main page.

### 9.3 Other assets

Audit every source image/SVG import and CSS asset URL. Keep existing public paths such as `/favicon.svg` and `/og-image.png`. For relocated assets, verify response type, bytes, proportions, and caching behavior; preserve visible rendering even if hashed build filenames change.

**Exit gate:** The hero iframe's transformed content matches the reference, and every visible logo/image/font resolves without a rendering change.

## 10. Phase 6 — preserve integrations and environment behavior

### 10.1 Environment variable mapping

| Current Vite variable | Next.js public variable |
| --- | --- |
| `VITE_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `VITE_FIREBASE_API_KEY` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `VITE_FIREBASE_PROJECT_ID` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `VITE_FIREBASE_APP_ID` | `NEXT_PUBLIC_FIREBASE_APP_ID` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` |

Replace references with explicit `process.env.NEXT_PUBLIC_*` accesses; dynamic key lookups are unsuitable for build-time inlining. Replace `import.meta.env.DEV` with the appropriate `process.env.NODE_ENV` condition. Public environment variables are embedded at build time, so preview and production need correct values before building. [Next.js environment variable documentation](https://nextjs.org/docs/app/guides/environment-variables)

Update `.env.example`, local setup documentation, CI/build settings, and hosting variables without printing actual values or committing credentials. Preserve use of the public Supabase anon key; do not introduce a service-role key into the browser.

### 10.2 Supabase waitlist

Keep the existing client-side insert architecture. Preserve the `waitlist` table and the modal payload fields:

```text
name       ← trimmed name
email      ← trimmed email
user_type  ← selected user type
college    ← trimmed college or null
```

Preserve the existing validation strings, required/optional behavior, loading button, success layout, error display, and close/reset logic. Keep the no-configuration local demo fallback; distinguish it clearly in verification evidence from an actual successful database write.

The inactive inline `WaitlistForm` has a different email-only payload and a delayed demo fallback. Retain that component's behavior without adding it to active pages.

Use intercepted responses or a dedicated test project to verify success, failure, latency, and missing configuration. A production readiness check must establish that the deployment has real configuration, rather than accepting the demo-success branch as proof that persistence works.

### 10.3 Firebase Analytics

1. Move browser analytics initialization behind an actual browser-only boundary. Avoid calling `firebase/analytics` support checks or analytics initialization during prerendering.
2. Preserve singleton initialization and the current behavior when configuration is missing or analytics is unsupported.
3. If lazy importing the SDK, ensure events await the initialization promise so initial navigation/click events are not lost during startup.
4. Replace React Router URL observation while preserving the full recorded `pathname + search + hash` string. `usePathname()` alone would lose query/hash changes.
5. Preserve event names and parameters: `custom_click`, `page_view`, `waitlist_modal_opened`, `waitlist_modal_closed`, `waitlist_submitted`, `waitlist_submission_failed`, and `faq_question_expanded`, including all current source/location/user-type data.
6. Verify initial navigation, route transitions, query changes, hash-only navigation, clicks, FAQ expansion, and modal lifecycle against the baseline.
7. Check for duplicate page views from SDK automatic collection, manual tracking, subscription overlap, or development remounts. Match the measured event contract and document any pre-existing duplication instead of silently redefining analytics during the framework migration.
8. Preserve title/URL event values. If metadata timing changes under Next.js, use a deterministic title source or wait for the effective title rather than logging the previous route's title.

**Exit gate:** Browser behavior and payloads match; prerendering never initializes analytics; missing optional configuration still permits local rendering.

## 11. Phase 7 — transfer metadata and public resources

1. Inventory every relevant tag in `index.html`, including fonts, not just title/description.
2. Use server-side metadata exports for title, description, robots, canonical, Open Graph, Twitter, and favicon while retaining their present values initially. Next.js supports document metadata through server layouts/pages. [Next.js metadata documentation](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
3. Preserve the existing Organization/WebSite JSON-LD graph and its identifiers. Serialize trusted structured data safely; do not duplicate the graph during client navigation.
4. Keep `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`, `/favicon.svg`, and `/og-image.png` at their existing URLs.
5. Do not generate duplicate `robots.ts` or `sitemap.ts` endpoints while static files still serve those paths.
6. The current canonical and social URL metadata point to the home page even when the SPA is on another route. Retain those baseline values for a strict framework-only port; route-specific SEO changes should be explicitly separated if later requested.
7. Confirm all three active routes return useful initial HTML with the expected visible content, rather than relying on an empty client shell. Keep invisible analytics subscriptions from forcing visible content into a client-only fallback.
8. Ensure inactive pages remain absent from the sitemap and navigation. Avoid changing historical `lastmod` values merely because framework files changed.

**Exit gate:** Existing metadata/resources survive, duplication is absent, and initial route HTML includes the existing content wherever compatible with its interactive initialization.

## 12. Phase 8 — deployment configuration and final cleanup

### 12.1 Hosting preparation

1. Inspect the actual hosting project before changing settings. Confirm repository, branch behavior, root directory, framework preset, install/build commands, environment scopes, domain redirects, headers, and Node version.
2. For a Next.js-aware host such as Vercel, configure the project root as `spectackle-product`, use the Next.js framework preset, and remove obsolete `dist` output overrides.
3. Remove the checked-in catch-all rewrite to `/index.html`; native routes and Next.js assets must resolve normally.
4. Keep normal Next.js deployment as the default. If the verified production host only supports static files, stop that deployment path long enough to choose a documented static-export configuration and verify its direct-route behavior. Do not silently change hosting providers or export semantics.
5. Configure public environment variables for the build's correct deployment scope and rebuild after changes.
6. Deploy a preview when implementation is ready. Check hard refresh/deep links, static assets, iframe, metadata, waitlist behavior, and analytics there.
7. Verify HTTPS/domain behavior and that no Next.js asset or route payload is being rewritten to HTML by a leftover SPA rule.

### 12.2 Retire obsolete tooling only after replacements pass

Remove `src/main.tsx`, obsolete `src/App.tsx`, `vite.config.ts`, `src/vite-env.d.ts`, unused Vite-specific TypeScript configs, the Vite React plugin, and Vite itself once their responsibilities are fully replaced. Remove React Router only after all active and dormant imports are adapted.

Retire `index.html` only after fonts, document metadata, JSON-LD, and bootstrap requirements are transferred. Do not delete raw iframe source, inactive components, or styles as “cleanup.”

Update the application README to describe actual Next.js commands, root directory, environment mapping, generated iframe assets, and deployment. Keep the work confined to the website migration rather than rewriting unrelated root documentation.

Resolve migration-introduced lint/type errors. Address pre-existing lint failures with behavior-neutral import/type cleanup where practical, in a separately reviewable commit. Do not weaken global lint/type rules or alter markup to manufacture a green report.

**Exit gate:** A clean install builds successfully and the preview passes the full regression matrix. Production cutover is a separate operational action from writing this plan or implementing the branch.

## 13. Verification matrix and parity criteria

### 13.1 Screenshot matrix

At minimum, capture all three active routes at **360 × 800, 390 × 844, 768 × 1024, 1024 × 768, and 1440 × 900**, in both default light and saved dark themes. Use a 320px-width overflow check. Test both sides of actual source breakpoints for affected components rather than assuming a device matrix covers every responsive transition.

Use one reference browser/OS/DPR for strict screenshot comparison. Separately run interaction checks in Chromium, Firefox, and WebKit to distinguish cross-browser differences from regressions.

| Area | Required captures/checks |
| --- | --- |
| Shared shell | Navbar at top/scrolled position, footer, mobile menu closed/open, all visible link/button hover/focus states. |
| Home | Initial hero, iframe interior, floating pills, each creative-experience state, institution cards, how-it-works cards, student experience, all three round tabs, bottom CTA. |
| About | Hero, mission visual, values, timeline, existing CTA/footer areas. |
| FAQ | Initial category, each category, representative expanded/collapsed questions, multiple-item behavior, footer. |
| Waitlist modal | Open from each active entry point, idle, invalid input, loading, server failure, success, close/reopen/reset; mobile overflow and keyboard behavior. |
| Theme | New visitor, saved light, saved dark, reload, route navigation, storage unavailable. |
| Motion | Normal motion at defined elapsed times and scroll positions; reduced-motion behavior captured separately. |
| Navigation | Direct entries, hard refresh, back/forward, query-only changes, hash-only changes, cross-route hash links, repeated anchor clicks, disconnected URLs. |

### 13.2 Compare static and animated content honestly

Wait for fonts and relevant resources to load before static comparison. Use the same viewport, DPR, browser version, cursor position, scroll position, data, and elapsed animation time.

For randomness, clocks, typing, and continuous canvas effects, use test-only deterministic controls applied identically to baseline and migrated builds. If a region must be masked in static screenshots, verify it separately through recordings and interaction assertions. Do not mask the hero, navbar, typography, or entire content sections to force a pass.

Capture both settled content and representative startup frames. An identical screenshot after several seconds does not excuse an introduced theme flash, blank hero, layout jump, or changed animation startup.

### 13.3 Acceptance thresholds

- **Design:** No unexplained visual changes. Every material difference in an overlay/diff is investigated. Font/shape/spacing/wrapping/color/visibility differences are failures.
- **Geometry:** Same CSS values and bounding boxes for static elements in the same environment; investigate shifts around 1 CSS pixel or greater. Smaller changes that alter wrapping/alignment also fail.
- **Pixels:** Use exact comparison for deterministic regions where practical. Any image-diff tolerance must cover only demonstrated renderer/antialiasing noise and be documented before accepting a result; no arbitrary blanket percentage establishes parity.
- **Motion:** Same timings, easing, trajectories, start/end states, scroll thresholds, carousel/typing sequences, and reduced-motion behavior. Check recordings as well as still frames.
- **Hydration/runtime:** No new hydration mismatches, uncaught errors, missing assets, server browser-API crashes, or unhandled SDK initialization failures.
- **Functionality:** All active navigation and form flows match the baseline, including state resets and existing inactive-feature visibility.
- **Integrations:** Same payloads/events; one intended submission per action; missing-config fallback is not counted as successful persistence.
- **Performance:** No material regression in representative production measurements. Investigate new layout shifts, blocked interactions, missing initial HTML, growing listener counts, or repeated animation work. No speculative performance gain offsets a design regression.

### 13.4 Required checks before completion

Run from the application directory, adjusting exact script names to the implemented manifest:

```text
npm ci
npm run prepare:roundtable
npm run typecheck
npm run lint
npm run build
npm run start
npm run test:e2e
npm run test:visual
```

Run browser tests against the production build and preview deployment. Confirm the generator-freshness policy, clean-clone build, route output, and no accidental `/Home`, `/About`, `/Pricing`, or other Pages Router routes.

Keep focused integration/browser tests for migration risks rather than adding unit tests that merely mirror static JSX. The iframe-string check, navigation lifecycle checks, form payload checks, and screenshot comparisons provide direct evidence of the user's requirement.

## 14. Main risks and controls

| Risk | Why it applies here | Control |
| --- | --- | --- |
| Server crash from theme initialization | `Layout` reads localStorage while rendering | Pre-paint bootstrap plus deterministic client state and gated persistence. |
| Changed saved-theme first paint | Server cannot read browser localStorage | Capture saved-dark startup; apply theme before paint; avoid overwriting storage on mount. |
| CSS cascade drift | Large global stylesheets with late overrides and component imports | Record production order; preserve declarations and compare direct/soft navigation. |
| Font metrics drift | Explicit font URLs, repeated weight declarations, mixed family settings | Keep existing font mechanism and bytes; defer optimization. |
| Broken hero preview | Vite `?raw` imports and inline document transformations | Deterministic generated string with baseline comparison. |
| Accidentally published pages | Existing `src/pages` is special to Next.js | Rename to `src/views` before route setup; inspect build route output. |
| Lost page state behavior | App Router layouts persist, while current main is pathname-keyed | Preserve shell and keyed main separately; exercise repeated transitions. |
| Missing hash/query tracking | Pathname hooks do not observe the full URL | Invisible URL coordinator, narrow Suspense boundary, query/hash/history tests. |
| Competing scroll handlers | Next Link scrolling plus custom top/hash behavior | One coordinator with explicit navigation classes and preserved offsets. |
| GSAP leaks or timing changes | Module-scope plugin registration and lifecycle effects | Browser-safe setup, scoped cleanup, repeated-navigation recordings. |
| Analytics fails during prerender | Browser SDK imported/initialized at module level | Browser-only initialization and graceful support/config handling. |
| False-positive waitlist success | Existing no-config demo fallback reports success | Validate real deployment configuration separately from mocked/demo tests. |
| Wrong package versions/build root | Root and nested manifests differ | Install/build from nested application and verify resolved dependencies. |
| Next.js assets rewritten to HTML | Current Vercel catch-all targets index.html | Remove SPA rewrite; validate hard refresh and asset response types. |
| Pre-existing lint obscures migration regressions | Current lint already reports 31 findings | Preserve baseline report, fix new issues, isolate neutral cleanup. |

## 15. Suggested implementation commits and dependencies

| Order | Commit scope | Review evidence |
| --- | --- | --- |
| 1 | Record baseline and add regression harness | Screenshot/behavior references tied to commit and environment. |
| 2 | Rename page implementation directory; prepare compatible dependency/configuration changes | Import/path audit; no public-route changes yet. |
| 3 | Add App Router document, route adapters, and persistent client shell | Correct three-route inventory and matching DOM hierarchy. |
| 4 | Transfer fonts/styles/metadata and adapt asset handling | Static visual comparisons and exact iframe-content comparison. |
| 5 | Adapt browser lifecycle, theme, URL observation, scrolling, and internal links | No hydration errors; matching route/hash/state/motion checks. |
| 6 | Convert environment access and integration initialization | Matching waitlist requests and analytics events under controlled responses. |
| 7 | Remove obsolete Vite/router tooling and update docs/hosting config | Clean dependency install, production build, explicit lint/type reports. |
| 8 | Resolve documented parity differences and attach final evidence | Full screenshot matrix, recordings, preview verification, final diff review. |

These are review boundaries rather than a claim that every intermediate commit is deployable. Preserve a working reference build throughout. Do not merge incomplete framework setup into main.

Implementation effort is driven mainly by visual verification, CSS ordering, theme startup, and motion lifecycle. Estimate the schedule after Phase 0 establishes baseline stability and actual hosting constraints; a precise day count before that would be speculative.

## 16. Rollout and rollback

1. Keep the current production deployment and baseline commit identifiable.
2. Complete the migration and parity evidence on `conversion-to-next-js`.
3. Prepare a preview and a reviewable change set that explains required framework changes and lists any deliberate nonvisual infrastructure differences.
4. Before cutover, verify host root, Node version, build variables, routing, and the latest production-build regression results.
5. Cut over only within the authorization for that deployment stage. This planning request does not itself perform a production release.
6. Smoke-test `/`, `/about`, `/faq`, direct refresh, assets/fonts, one controlled waitlist path, and analytics delivery after cutover.
7. If a material regression appears, restore the previous known-good deployment and its framework/build settings; do not attempt a visual redesign as an emergency fix.
8. Because this plan preserves the database schema and submission contract, rollback should not require a data migration. Verify that assumption before release if implementation scope changes.

## 17. Definition of done

- [ ] The application runs on Next.js with native App Router entries for the same three active routes.
- [ ] TypeScript, existing content, component markup, CSS declarations, typography, assets, and responsive behavior are preserved except for documented framework necessities.
- [ ] Inactive page/components remain inactive; no hidden controls or new UI have appeared.
- [ ] The existing shell/background persist and page views reset at the same navigation boundary as before.
- [ ] Saved dark mode, smooth anchors, query/hash analytics, mobile navigation, FAQ interactions, tabs, animations, and modal flows match the baseline.
- [ ] The iframe output matches the baseline transformation and scales identically.
- [ ] Supabase and Firebase retain their existing contracts and missing-config behavior.
- [ ] Metadata, public resource URLs, sitemap contents, favicon, OG image, and font resources are retained.
- [ ] A fresh dependency install, typecheck, lint policy, production build, browser suite, and visual comparison are verified with actual results.
- [ ] Existing lint findings are either resolved neutrally or explicitly recorded; no migration error is hidden by disabling checks.
- [ ] Hosting configuration supports native Next.js routes and assets without the old SPA rewrite.
- [ ] Visual evidence contains no unexplained design difference, including first paint and representative motion states.
- [ ] The implementation report identifies baseline, final commit, tested environments, results, remaining limitations, and rollback target.

The migration should be judged by the rendered website and its behavior. A changed framework is the intended outcome; a changed design is a regression.
