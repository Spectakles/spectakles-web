import fs from 'node:fs';
import path from 'node:path';
import { repo, reference, readJSON, sha256 } from './paths.mjs';

const manifest = readJSON(path.join(reference, 'manifest.json'));
const environment = readJSON(path.join(reference, 'environment.json'));
const hashes = readJSON(path.join(reference, 'screenshot-hashes.json'));
const files = Object.keys(hashes);
const acquisition = fs.existsSync(path.join(reference, 'acquisition.json')) ? readJSON(path.join(reference, 'acquisition.json')) : null;
const layoutHashes = fs.existsSync(path.join(reference, 'layout-hashes.json')) ? readJSON(path.join(reference, 'layout-hashes.json')) : {};
const link = (label, relative) => `[${label}](${path.join(repo, relative)})`;
const count = extension => files.filter(file => file.endsWith(extension)).length;
const summary = {
  commit: manifest.commit, archiveSha256: manifest.archiveSha256,
  sourceFileCount: Object.keys(manifest.sourceFiles).length,
  productionFileCount: Object.keys(manifest.buildFiles).length,
  environment, snapshots: { png: count('.png'), json: count('.json'), html: count('.html') },
  snapshotManifestSha256: sha256(fs.readFileSync(path.join(reference, 'screenshot-hashes.json'))),
  additionalLayoutContracts: Object.keys(layoutHashes).length,
  layoutManifestSha256: Object.keys(layoutHashes).length ? sha256(fs.readFileSync(path.join(reference, 'layout-hashes.json'))) : null,
  acquisition, strictRepeatability: 'NOT PASSED: unchanged-original captures expose one-channel-value rasterization variance; zero tolerance retained.',
};
fs.writeFileSync(path.join(repo, 'verification/baseline-manifest.json'), JSON.stringify(summary, null, 2));
const report = `# Original website baseline and verification status

The original Vite application has been archived, built, fingerprinted, and captured. **No website application files, application dependencies, or production settings have been changed.**

**Strict pixel repeatability is not yet passed.** Exploratory comparisons of the unchanged original exposed rasterization variance. It remains a reported failure; no allowed-pixel count, image masking, or color threshold has been introduced to hide it. Reference acquisition is not a claim that Next.js conversion or parity has been completed.

## Reference identity

| Item | Recorded value |
| --- | --- |
| Original commit | \`${manifest.commit}\` |
| Archive SHA-256 | \`${manifest.archiveSha256}\` |
| Original source files | ${Object.keys(manifest.sourceFiles).length} |
| Primary production files | ${Object.keys(manifest.buildFiles).length} |
| Browser environment | ${environment.platform}/${environment.arch}, OS ${environment.osRelease} |
| Chromium | ${environment.browsers.chromium} |
| Firefox | ${environment.browsers.firefox} |
| WebKit | ${environment.browsers.webkit} |
| Playwright | ${environment.playwright} |
| Golden PNGs | ${count('.png')} |
| Geometry/integration JSON contracts | ${count('.json')} |
| Additional untransformed CSS layout contracts | ${Object.keys(layoutHashes).length} |
| Exact iframe documents | ${count('.html')} |

The original source archive excludes private local environment files. The primary build uses synthetic public Supabase configuration, with requests intercepted. Separate unchanged-source builds cover no configuration and Firebase SDK event queuing. Four original font responses are cached and replayed byte-for-byte at their existing URLs.

## Evidence acquired

- All three active routes: home, about, FAQ.
- Light and saved-dark themes at 320, 360, 390, 768, 1024, and 1440px widths. At 320px only layout/overflow is exercised because the original menu control is clipped.
- Initial/full-page screenshots, each page section, menu/hover states, FAQ categories/answers, round tabs, all four creative-experience panels, and waitlist idle/validation/success states at usable widths.
- Loading/failure screenshots on desktop/mobile in both themes, intercepted request bodies, retries, modal reset behavior, and a verified no-configuration demo fallback with zero database requests.
- Geometry at original responsive breakpoints immediately below, exactly at, and immediately above each boundary.
- Normal/reduced-motion recordings on desktop/mobile in light/dark themes, startup frames, and a controlled typing/carousel event timeline.
- Navigation, refresh/history, saved theme, shared-shell/background lifetime, page state reset, anchors, FAQ state, static resources, and exact iframe content.
- Actual Firebase SDK queued-event names/parameters for page views, query/hash transitions, clicks, FAQ interactions, and waitlist lifecycle. Google delivery is stubbed; this is not a claim of production ingestion.
- An independent source guard confirms 30 original CSS/style-configuration/asset/public-resource files remain byte-identical.

${acquisition ? `The complete acquisition contains **${acquisition.totalCases} cases**: ${acquisition.originalPasses} passed initially and ${acquisition.resumedPasses} were completed after documenting the original 320px control limitation and rerunning an original WebKit anchor-scroll failure. Original failed-run evidence and completion evidence are retained separately. A successful rerun does not erase the original intermittent failure. These counts describe acquiring the original reference, not a migrated-build parity pass.` : 'The full reference acquisition passed before the golden set was sealed.'}

## Findings that must not be silently changed

1. The original 320px navbar overflows and clips the menu toggle. Preserve and document this during conversion; do not redesign the navbar to make the baseline test pass.
2. Disconnected paths such as /pricing, /impact, /blog and unknown paths currently show the shared shell with empty main content and HTTP 200 under the checked-in SPA fallback. The migration plan now requires preserving this behavior through a native catch-all.
3. The configured synthetic Supabase fixture exposes the exact original Firefox Navigator LockManager error. It is attached explicitly; only that exact known message is classified as pre-existing. This is not a verified finding about uninspected production configuration.
4. Original typechecking and production building pass. Original lint has 29 errors and 2 warnings; the output is preserved.
5. Identical-source exploratory screenshot comparisons differed in some edge/blur pixels by **one RGB channel value**. Examples included 4 pixels in a section, 47 pixels around the announcement badge in a post-scroll full-page capture, and 672 pixels behind a demo-success overlay. No application source/design difference was present. This still prevents an honest claim that the strict raw-pixel gate is green.
6. A WebKit cross-route anchor-scroll check failed once in the original full run and passed when rerun. Its initial trace is retained as a baseline timing limitation; it has not been fixed or hidden by changing application code.
7. A 29-case repeat run initially passed 26 and flagged three animated bounding-box contracts. Their differences came from active ancestor scroll transforms. Additional original-source contracts now measure exact computed CSS dimensions, grid tracks, typography, and layout dimensions before those transforms. All original 582 snapshots remain sealed, and transformed bounds continue to be attached as diagnostics rather than mixed into the static layout assertion.

The revised six static-layout contracts were then verified against the original: **6 passed with exact object equality and no numeric tolerance**. The earlier repeat run also passed all 21 cross-browser behavior checks, the Firebase event contract, and the controlled typing/carousel contract. This establishes useful deterministic design/behavior checks while keeping the raw-pixel limitation explicit.

## What the next implementation stage requires

Before calling the comparison system a reliable release gate, finish diagnosing or explicitly accounting for original-renderer variance without weakening the requirement that new visual/layout/behavior changes fail. Keep the sealed originals, raw differences, overlays, and geometry evidence available. Do not update golden images from the Next.js candidate.

Then introduce Next.js using the existing presentation code, preserving the original styles/assets and measured interactions. No Next.js application migration has begun in this baseline-establishment step.

## Inspect and reproduce

- ${link('Verification instructions', 'verification/README.md')}
- ${link('Machine-readable baseline summary', 'verification/baseline-manifest.json')}
- ${link('Full source/build/font manifest', '.parity/reference/manifest.json')}
- ${link('Snapshot integrity inventory', '.parity/reference/screenshot-hashes.json')}
- ${link('Additional layout integrity inventory', '.parity/reference/layout-hashes.json')}
- ${link('Unchanged-original raw pixel diagnostic', '.parity/diagnostics/unchanged-original/summary.json')}
- ${link('Original typecheck output', '.parity/reference/checks/typecheck.txt')}
- ${link('Original lint output', '.parity/reference/checks/lint.txt')}
- ${link('Original production build output', '.parity/reference/checks/build.txt')}
- ${link('Interactive browser report', '.parity/report/index.html')}
- ${link('Initial full-acquisition report, including original failures', '.parity/report-acquisition-initial/index.html')}
- ${link('Desktop home reference', '.parity/reference/screenshots/chromium/home-1440x900-light-first-viewport.png')}
- ${link('Mobile home reference', '.parity/reference/screenshots/chromium/home-390x844-light-first-viewport.png')}

All large evidence is local under .parity/ and excluded from Git. Keep it throughout the migration. The tracked verification package and baseline summary describe and protect it.
`;
fs.writeFileSync(path.join(repo, 'verification/BASELINE_REPORT.md'), report);
console.log(`Wrote baseline report: ${count('.png')} PNGs and ${count('.json') + count('.html')} text contracts.`);
