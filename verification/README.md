# One-to-one migration verification

This package checks the website against an isolated production build of commit `0065ac0b555a1be65889f674b509e3d2e4d1145c`. It does not change the application package or its dependencies.

## What is protected

- Exact tracked source archive, source hashes, production build hashes, and lockfile identity.
- Cached bytes of the four original remote fonts, replayed at their original URLs.
- Pinned Playwright and browser versions, OS/architecture fingerprint, DPR 1, locale, timezone, and Chromium software-rasterization flags.
- Screenshots for the three active routes at six viewport sizes in saved light/dark themes, including full pages, individual sections, navigation, FAQ categories/answers, carousel states, round tabs, and waitlist states.
- Element geometry, computed typography/styles, link/anchor inventories, stylesheet-order evidence, and exact iframe document content.
- Navigation/state/form checks in Chromium, Firefox, and WebKit.
- Normal and reduced-motion videos, startup frames, and a controlled typing/carousel timeline.

Static screenshots use a paused JavaScript clock, seeded test-only randomness, completed finite CSS transitions, and cancelled looping CSS animations. No screenshot regions are hidden or masked. Videos run with normal time and unmodified motion; normal/reduced-motion and light/dark recordings are separate. Breakpoint geometry checks use widths immediately below, at, and above the original stylesheet breakpoints.

Image comparison uses **threshold 0, includes antialiasing differences, and permits 0 different pixels**. A failure attaches the original, actual, difference image, and 50% overlay. This is stricter than Playwright's default screenshot comparator.

## Prepare the original reference once

From the repository root:

```sh
npm ci --prefix verification
PLAYWRIGHT_BROWSERS_PATH="$PWD/.parity/browsers" verification/node_modules/.bin/playwright install chromium firefox webkit
node verification/scripts/prepare-reference.mjs
npm ci --prefix .parity/reference/source/spectackle-product --ignore-scripts
node verification/scripts/build-reference.mjs
node verification/scripts/cache-fonts.mjs
node verification/scripts/seal-reference.mjs
node verification/scripts/build-variants.mjs
npm run baseline:record --prefix verification
npm run baseline:layout --prefix verification
npm run baseline:verify --prefix verification
```

The prepare/seal/record commands refuse to replace an existing reference. Failed recording attempts are retained under `.parity/recordings/`; a final screenshot set is installed and hashed only after the full recording run passes.

The reference server reproduces the checked-in Vite SPA fallback: disconnected paths show the shared shell with empty main content and HTTP 200. This is a local build baseline, not a claim about uninspected production-host settings.

## Compare the migrated build

Build and start the candidate with the synthetic public Supabase configuration used by the reference:

```text
NEXT_PUBLIC_SUPABASE_URL=https://spectakles-parity.invalid
NEXT_PUBLIC_SUPABASE_ANON_KEY=parity-public-test-key
```

Firebase is disabled in the primary visual/form fixture. Set the candidate's public Firebase configuration empty for this run. No production secrets are needed.

The full suite also needs two candidate builds from the same source: a build with no Supabase/Firebase configuration (demo fallback), and a build with the synthetic Firebase/Supabase values stored in `.parity/reference/variants.json` (analytics contract). These build-time variables cannot be changed just by changing the running server's environment. Start all three candidate builds on separate ports.

Then, with the candidate production server on port 3000:

```sh
PARITY_TARGET_URL=http://127.0.0.1:3000 \
PARITY_DEMO_URL=http://127.0.0.1:3001 \
PARITY_ANALYTICS_URL=http://127.0.0.1:3002 \
npm run compare --prefix verification
```

Never use the Vite reference as the candidate and call that a migration pass. The self-comparison command has a distinct purpose: proving the harness can reproduce the original.

```sh
npm run baseline:verify --prefix verification
npm run test:behavior --prefix verification
npm run test:motion --prefix verification
```

The runner disables snapshot updates during verification/comparison, checks baseline hashes first, and rejects different browser/OS fingerprints. Do not run Playwright's update-snapshots command manually to accept a mismatch. Correct the candidate or diagnose the capture environment.

## Evidence and interpretation

Local evidence lives in `.parity/`, excluded from Git because it includes installed browsers, an archived dependency tree, screenshots, traces, and videos. Keep that directory throughout the migration. Recreating a reference on another OS creates a different comparison environment; it does not authorize replacing this one.

| Path | Contents |
| --- | --- |
| `.parity/reference/source.tar` | Exact source archive from the baseline commit |
| `.parity/reference/manifest.json` | Source/build/font hashes and preparation details |
| `.parity/reference/environment.json` | Exact browser and rendering environment |
| `.parity/reference/screenshots/` | Sealed golden PNGs and text/geometry contracts |
| `.parity/reference/screenshot-hashes.json` | Tamper-evident snapshot inventory |
| `.parity/reference/layout-contracts/` | Additional exact CSS layout dimensions before ancestor animation transforms |
| `.parity/reference/layout-hashes.json` | Integrity inventory for those additional layout measurements |
| `.parity/reference/checks/` | Original typecheck/lint/build/dependency reports |
| `.parity/runs/` | Run-specific diagnostics, attachments, videos, and traces |
| `.parity/report/index.html` | Latest interactive Playwright report |
| `.parity/results.json` | Latest machine-readable results |

Known baseline findings are explicit. The original lint reports 29 errors and 2 warnings. The configured synthetic Supabase client triggers an exact known Navigator LockManager error in Firefox; the harness attaches that error and permits only that specific original message. It does not suppress arbitrary browser errors or change the SDK configuration/source to hide it.

Screenshots establish equality only for the captured states/environment. Normal-motion videos require review. Firebase tests verify events queued by the actual SDK against controlled configuration/installation responses; the Google delivery script is deliberately stubbed. This proves the application's SDK contract, not production ingestion. The demo variant independently verifies visible success without a database request. This harness must not turn partial coverage into a claim that every browser/device/state has been proved identical.

Exploratory self-comparisons detected differences of one color-channel value in some edge/blur pixels of the unchanged original. The strict gate still reports these as failures; no tolerance or masking has been introduced to hide them. Measurements of bounding boxes inside active GSAP transforms also fluctuated; the additional CSS layout contracts measure dimensions before those transforms, while the original transformed bounds remain sealed as diagnostic evidence. Reference acquisition and passing the complete repeatability gate are separate results. Consult `BASELINE_REPORT.md` for the current status before treating this suite as a migration release gate.

Technical basis: [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots), [clock controls](https://playwright.dev/docs/clock), and [network interception](https://playwright.dev/docs/network).
