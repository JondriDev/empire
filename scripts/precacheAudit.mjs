// Pure precache-audit logic for The Empire's PWA service worker (EPIC-4 S1).
//
// `vite-plugin-pwa` (Workbox `generateSW`) inlines the precache manifest into
// `dist/sw.js` as `precacheAndRoute([{url:"…",revision:"…"}, …])`. This module
// extracts that manifest and cross-checks it against the chunks Vite actually
// emitted into `dist/assets`, so the offline-boot guard can ENUMERATE the gap:
// any lazy app chunk / CSS file that the SW would NOT serve when the network is
// fully blocked. Pure (text + filename list in → report out) so it is unit-
// testable with a fixture and has no filesystem/browser dependency.

/**
 * Pull every precached URL out of a generateSW `sw.js`'s inlined manifest.
 * The `{url:"…",revision:…}` shape only occurs inside `precacheAndRoute([...])`,
 * so a global match over the whole file is robust to the AMD wrapper/minifier.
 * @param {string} swText
 * @returns {string[]} URLs exactly as the SW stores them (may have a leading '/')
 */
export function extractPrecacheUrls(swText) {
  return [...swText.matchAll(/\{url:"([^"]+)",revision:/g)].map((m) => m[1]);
}

const stripLeadingSlash = (u) => u.replace(/^\//, '');

/**
 * Cross-check the SW precache manifest against the emitted `dist/assets` chunks.
 * @param {string} swText            contents of dist/sw.js
 * @param {string[]} assetFileNames  `fs.readdirSync('dist/assets')` (bare names)
 * @returns {{
 *   precacheCount: number,
 *   jsChunks: string[], cssChunks: string[],
 *   missingJs: string[], missingCss: string[],
 *   missing: string[], ok: boolean
 * }}
 */
export function auditPrecache(swText, assetFileNames) {
  const urls = extractPrecacheUrls(swText);
  // Membership check dedupes on the bare URL; the count below stays the raw
  // manifest-entry total so it matches what vite-plugin-pwa prints at build
  // time ("precache N entries" — some assets appear twice via includeAssets +
  // globPatterns, each with its own revision).
  const precached = new Set(urls.map(stripLeadingSlash));
  const jsChunks = assetFileNames.filter((f) => f.endsWith('.js')).sort();
  const cssChunks = assetFileNames.filter((f) => f.endsWith('.css')).sort();
  const notCached = (f) => !precached.has(`assets/${f}`);
  const missingJs = jsChunks.filter(notCached);
  const missingCss = cssChunks.filter(notCached);
  const missing = [...missingJs, ...missingCss];
  return {
    precacheCount: urls.length,
    jsChunks,
    cssChunks,
    missingJs,
    missingCss,
    missing,
    ok: missing.length === 0,
  };
}
