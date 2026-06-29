// Pure base-path / install-flow audit for The Empire's PWA (EPIC-4 S3).
//
// The "blank-on-install" class of bug: when a PWA is served from a sub-path
// (GitHub Pages serves this app at /empire/), every asset URL, the service
// worker's navigateFallback, the SW registration scope and the manifest must
// all carry the deploy base — otherwise the installed app fetches /assets/… at
// the wrong origin-root path and 404s into a blank screen.
//
// This module is PURE (built-file text + base string in → report out) so it is
// unit-testable with fixtures and has no filesystem/browser dependency. The
// `scripts/check-pwa-base.mjs` runner builds with EMPIRE_BASE set and feeds the
// emitted files through here.

/** Normalize a base to the leading+trailing-slash form vite emits ('/empire/'). */
export function normalizeBase(base) {
  let b = (base || '/').trim();
  if (!b.startsWith('/')) b = '/' + b;
  if (!b.endsWith('/')) b = b + '/';
  return b;
}

// A URL that points at a local build asset (so it MUST carry the base). Anything
// external (http(s)/protocol-relative/data:) or a pure fragment is exempt.
const isLocalAsset = (u) =>
  !!u && !/^(https?:)?\/\//.test(u) && !/^(data:|blob:|#|mailto:|tel:)/.test(u);

/**
 * Pull every `<script src>` and `<link href>` URL out of the built index.html.
 * @param {string} html
 * @returns {Array<{kind:'script'|'link', url:string}>}
 */
export function extractHtmlAssetUrls(html) {
  const out = [];
  for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) out.push({ kind: 'script', url: m[1] });
  for (const m of html.matchAll(/<link\b[^>]*\bhref="([^"]+)"/g)) out.push({ kind: 'link', url: m[1] });
  return out;
}

/** Every local asset href in index.html must be prefixed with the deploy base. */
export function auditHtmlBase(html, base) {
  const b = normalizeBase(base);
  const assets = extractHtmlAssetUrls(html)
    .filter((a) => isLocalAsset(a.url))
    .map((a) => ({ ...a, prefixed: a.url.startsWith(b) }));
  const unprefixed = assets.filter((a) => !a.prefixed).map((a) => a.url);
  // The manifest must be linked AND base-prefixed (so the installer can read it).
  const manifestLink = assets.find((a) => /manifest\.webmanifest$/.test(a.url));
  return {
    count: assets.length,
    unprefixed,
    manifestLinked: !!manifestLink,
    manifestPrefixed: !!manifestLink && manifestLink.prefixed,
    ok: unprefixed.length === 0 && !!manifestLink && manifestLink.prefixed,
  };
}

/** Workbox generateSW inlines navigateFallback as createHandlerBoundToURL("<base>index.html"). */
export function auditSwBase(swText, base) {
  const b = normalizeBase(base);
  const m = swText.match(/createHandlerBoundToURL\("([^"]+)"\)/);
  const navigateFallback = m ? m[1] : null;
  const expected = b + 'index.html';
  return { navigateFallback, expected, ok: navigateFallback === expected };
}

/** registerSW.js registers `<base>sw.js` with `{ scope: '<base>' }`. */
export function auditRegisterSw(registerSwText, base) {
  const b = normalizeBase(base);
  const m = registerSwText.match(/register\(\s*'([^']+)'\s*,\s*\{\s*scope:\s*'([^']+)'\s*\}/);
  const swUrl = m ? m[1] : null;
  const scope = m ? m[2] : null;
  const expectedUrl = b + 'sw.js';
  return { swUrl, scope, expectedUrl, expectedScope: b, ok: swUrl === expectedUrl && scope === b };
}

/**
 * The manifest itself must be base-agnostic: start_url/scope RELATIVE (so they
 * resolve against the manifest's own URL → adapt to any base), and `id` a stable
 * non-root identity (it resolves against start_url's ORIGIN, so a root '/' is
 * ambiguous on shared origins and a relative path gives one stable identity).
 * @param {string|object} manifest  JSON text or already-parsed object
 */
export function auditManifest(manifest) {
  const m = typeof manifest === 'string' ? JSON.parse(manifest) : manifest;
  const isAbsolutePath = (v) => typeof v === 'string' && (v.startsWith('/') || /^[a-z]+:/i.test(v));
  const startUrlRelative = !!m.start_url && !isAbsolutePath(m.start_url);
  const scopeRelative = !!m.scope && !isAbsolutePath(m.scope);
  // id resolves against start_url's origin; a relative path → one stable
  // <origin>/<id> identity for every base. Reject bare root '/' and cross-origin.
  const idOk = typeof m.id === 'string' && m.id !== '/' && !/^https?:\/\//.test(m.id) && m.id.trim() !== '';
  return {
    start_url: m.start_url,
    scope: m.scope,
    id: m.id,
    startUrlRelative,
    scopeRelative,
    idOk,
    ok: startUrlRelative && scopeRelative && idOk,
  };
}

// ── Installability (EPIC-4 S4) ──────────────────────────────────────────────
// The base-path audit above proves a sub-path deploy won't blank-on-install.
// This proves the manifest ITSELF satisfies the browser's add-to-home-screen /
// install criteria — the numeric target metric (Lighthouse PWA ≥ 90) distilled
// into the deterministic, offline-checkable manifest contract those audits gate:
// name + short_name, a ≥192px AND a ≥512px `any` icon, a `maskable` icon, a
// standalone-ish display, a start_url, and background_color + theme_color.

/** Largest pixel dimension in a manifest icon `sizes` string ("192x192 256x256" → 256). "any" → Infinity (scalable). */
export function maxIconSize(sizes) {
  if (typeof sizes !== 'string') return 0;
  if (/\bany\b/i.test(sizes)) return Infinity;
  let max = 0;
  for (const m of sizes.matchAll(/(\d+)\s*[x×]\s*(\d+)/gi)) {
    max = Math.max(max, Number(m[1]), Number(m[2]));
  }
  return max;
}

/** Purpose tokens of an icon (space-separated; defaults to ['any'] per the manifest spec). */
const iconPurposes = (icon) =>
  (typeof icon?.purpose === 'string' && icon.purpose.trim() ? icon.purpose.trim() : 'any')
    .toLowerCase()
    .split(/\s+/);

const DISPLAY_STANDALONE_ISH = ['standalone', 'fullscreen', 'minimal-ui'];

/**
 * Audit the manifest against the browser installability criteria, returning a
 * per-criterion report plus a flat `missing[]` of human-readable gaps.
 * @param {string|object} manifest  JSON text or already-parsed object
 */
export function auditInstallability(manifest) {
  const m = typeof manifest === 'string' ? JSON.parse(manifest) : manifest;
  const icons = Array.isArray(m.icons) ? m.icons : [];

  // An icon counts toward the `any` size buckets only if it can be used as a
  // normal (non-maskable-only) icon — purpose 'any' or absent.
  const anyIcons = icons.filter((i) => iconPurposes(i).includes('any'));
  const has192 = anyIcons.some((i) => maxIconSize(i.sizes) >= 192);
  const has512 = anyIcons.some((i) => maxIconSize(i.sizes) >= 512);
  const hasMaskable = icons.some((i) => iconPurposes(i).includes('maskable'));

  const isStr = (v) => typeof v === 'string' && v.trim() !== '';
  const displayInline = isStr(m.display) && DISPLAY_STANDALONE_ISH.includes(m.display);
  const displayFromOverride =
    Array.isArray(m.display_override) &&
    m.display_override.some((d) => DISPLAY_STANDALONE_ISH.includes(d));

  const criteria = {
    name: isStr(m.name),
    short_name: isStr(m.short_name),
    icon192: has192,
    icon512: has512,
    maskableIcon: hasMaskable,
    displayStandaloneish: displayInline || displayFromOverride,
    start_url: isStr(m.start_url),
    background_color: isStr(m.background_color),
    theme_color: isStr(m.theme_color),
  };

  const LABELS = {
    name: 'name',
    short_name: 'short_name',
    icon192: 'an icon ≥192px with purpose "any"',
    icon512: 'an icon ≥512px with purpose "any"',
    maskableIcon: 'an icon with purpose "maskable"',
    displayStandaloneish: `display one of ${DISPLAY_STANDALONE_ISH.join('/')} (or via display_override)`,
    start_url: 'start_url',
    background_color: 'background_color',
    theme_color: 'theme_color',
  };
  const missing = Object.entries(criteria)
    .filter(([, ok]) => !ok)
    .map(([k]) => LABELS[k]);

  return {
    name: m.name,
    short_name: m.short_name,
    display: m.display,
    iconCount: icons.length,
    criteria,
    missing,
    ok: missing.length === 0,
  };
}

/**
 * Full base-path / install-flow audit. Any missing input is reported, not thrown.
 * @param {{html:string, swText:string, registerSwText:string, manifestText:string, base:string}} files
 */
export function auditPwaBase({ html, swText, registerSwText, manifestText, base }) {
  const b = normalizeBase(base);
  const htmlR = auditHtmlBase(html, b);
  const swR = auditSwBase(swText, b);
  const regR = auditRegisterSw(registerSwText, b);
  const manR = auditManifest(manifestText);
  const instR = auditInstallability(manifestText);

  const issues = [];
  if (htmlR.unprefixed.length) issues.push(`${htmlR.unprefixed.length} index.html asset(s) not prefixed with ${b}: ${htmlR.unprefixed.join(', ')}`);
  if (!htmlR.manifestLinked) issues.push('index.html does not link a manifest.webmanifest');
  else if (!htmlR.manifestPrefixed) issues.push(`manifest <link> not prefixed with ${b}`);
  if (!swR.ok) issues.push(`sw.js navigateFallback is ${JSON.stringify(swR.navigateFallback)}, expected ${JSON.stringify(swR.expected)}`);
  if (!regR.ok) issues.push(`registerSW registers ${JSON.stringify(regR.swUrl)} scope ${JSON.stringify(regR.scope)}, expected ${JSON.stringify(regR.expectedUrl)} scope ${JSON.stringify(regR.expectedScope)}`);
  if (!manR.startUrlRelative) issues.push(`manifest start_url ${JSON.stringify(manR.start_url)} is not relative (won't adapt to base)`);
  if (!manR.scopeRelative) issues.push(`manifest scope ${JSON.stringify(manR.scope)} is not relative (won't adapt to base)`);
  if (!manR.idOk) issues.push(`manifest id ${JSON.stringify(manR.id)} is not a stable non-root identity`);
  if (instR.missing.length) issues.push(`manifest not installable — missing: ${instR.missing.join(', ')}`);

  return { base: b, html: htmlR, sw: swR, registerSw: regR, manifest: manR, installability: instR, issues, ok: issues.length === 0 };
}
