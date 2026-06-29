import { describe, it, expect } from 'vitest';
import {
  normalizeBase,
  extractHtmlAssetUrls,
  auditHtmlBase,
  auditSwBase,
  auditRegisterSw,
  auditManifest,
  maxIconSize,
  auditInstallability,
  auditPwaBase,
} from './pwaBaseAudit.mjs';

// Miniature stand-ins for the files vite-plugin-pwa emits under EMPIRE_BASE=/empire/.
const HTML = (base) => `<!doctype html><html><head>
  <link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
  <script type="module" crossorigin src="${base}assets/index-AAA.js"></script>
  <link rel="modulepreload" crossorigin href="${base}assets/react-vendor-BBB.js">
  <link rel="stylesheet" crossorigin href="${base}assets/index-CCC.css">
  <link rel="manifest" href="${base}manifest.webmanifest"><script id="vite-plugin-pwa:register-sw" src="${base}registerSW.js"></script></head>
  <body><div id="root"></div></body></html>`;
const SW = (base) => `define(["./workbox-x"],function(s){"use strict";s.precacheAndRoute([{url:"index.html",revision:"a"}],{});s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("${base}index.html"),{denylist:[/^\\/api\\//]}))});`;
const REG = (base) => `if('serviceWorker' in navigator) {window.addEventListener('load', () => {navigator.serviceWorker.register('${base}sw.js', { scope: '${base}' })})}`;
// Mirrors the real install surface vite.config.ts emits (relative + installable).
const FULL_MANIFEST = {
  name: 'The Empire — Desktop OS',
  short_name: 'Empire',
  start_url: '.',
  scope: '.',
  id: 'empire',
  display: 'standalone',
  display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
  background_color: '#03060e',
  theme_color: '#03060e',
  icons: [
    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
  ],
};
const MANIFEST = JSON.stringify(FULL_MANIFEST);

describe('normalizeBase', () => {
  it('forces leading + trailing slashes', () => {
    expect(normalizeBase('empire')).toBe('/empire/');
    expect(normalizeBase('/empire')).toBe('/empire/');
    expect(normalizeBase('/empire/')).toBe('/empire/');
    expect(normalizeBase('/')).toBe('/');
    expect(normalizeBase(undefined)).toBe('/');
  });
});

describe('extractHtmlAssetUrls', () => {
  it('pulls every <script src> and <link href>', () => {
    const urls = extractHtmlAssetUrls(HTML('/empire/')).map((a) => a.url);
    expect(urls).toContain('/empire/assets/index-AAA.js');
    expect(urls).toContain('/empire/assets/index-CCC.css');
    expect(urls).toContain('/empire/manifest.webmanifest');
    expect(urls).toContain('/empire/registerSW.js');
    expect(urls).toContain('/empire/favicon.svg');
  });
});

describe('auditHtmlBase', () => {
  it('passes when every local asset carries the base', () => {
    const r = auditHtmlBase(HTML('/empire/'), '/empire/');
    expect(r.ok).toBe(true);
    expect(r.unprefixed).toEqual([]);
    expect(r.manifestLinked).toBe(true);
    expect(r.manifestPrefixed).toBe(true);
  });
  it('flags assets emitted at origin-root when the deploy base is a sub-path', () => {
    // The blank-on-install bug: built for '/', deployed under '/empire/'.
    const r = auditHtmlBase(HTML('/'), '/empire/');
    expect(r.ok).toBe(false);
    expect(r.unprefixed.length).toBeGreaterThan(0);
    expect(r.manifestPrefixed).toBe(false);
  });
  it('passes the root base', () => {
    expect(auditHtmlBase(HTML('/'), '/').ok).toBe(true);
  });
  it('ignores external/protocol-relative/data URLs', () => {
    const html = `<head><link href="https://fonts.gstatic.com/x.woff2"><script src="/empire/assets/a.js"></script><link rel="manifest" href="/empire/manifest.webmanifest"></head>`;
    const r = auditHtmlBase(html, '/empire/');
    expect(r.ok).toBe(true);
    expect(r.count).toBe(2); // external font href excluded
  });
});

describe('auditSwBase', () => {
  it('matches navigateFallback to <base>index.html', () => {
    expect(auditSwBase(SW('/empire/'), '/empire/').ok).toBe(true);
    expect(auditSwBase(SW('/'), '/').ok).toBe(true);
  });
  it('fails when the fallback points at the wrong base', () => {
    const r = auditSwBase(SW('/'), '/empire/');
    expect(r.ok).toBe(false);
    expect(r.navigateFallback).toBe('/index.html');
    expect(r.expected).toBe('/empire/index.html');
  });
});

describe('auditRegisterSw', () => {
  it('matches the SW url + scope to the base', () => {
    expect(auditRegisterSw(REG('/empire/'), '/empire/').ok).toBe(true);
  });
  it('fails on a base mismatch', () => {
    const r = auditRegisterSw(REG('/'), '/empire/');
    expect(r.ok).toBe(false);
    expect(r.swUrl).toBe('/sw.js');
    expect(r.expectedScope).toBe('/empire/');
  });
});

describe('auditManifest', () => {
  it('accepts relative start_url/scope + a stable non-root id', () => {
    const r = auditManifest(MANIFEST);
    expect(r.ok).toBe(true);
    expect(r.startUrlRelative).toBe(true);
    expect(r.scopeRelative).toBe(true);
    expect(r.idOk).toBe(true);
  });
  it('rejects a bare root id (ambiguous on shared origins)', () => {
    const r = auditManifest({ start_url: '.', scope: '.', id: '/' });
    expect(r.idOk).toBe(false);
    expect(r.ok).toBe(false);
  });
  it('rejects an absolute start_url/scope (pins the manifest to one base)', () => {
    const r = auditManifest({ start_url: '/empire/', scope: '/empire/', id: 'empire' });
    expect(r.startUrlRelative).toBe(false);
    expect(r.scopeRelative).toBe(false);
    expect(r.ok).toBe(false);
  });
  it('rejects a cross-origin id', () => {
    expect(auditManifest({ start_url: '.', scope: '.', id: 'https://evil.example/x' }).idOk).toBe(false);
  });
  it('accepts a parsed object as well as JSON text', () => {
    expect(auditManifest({ start_url: '.', scope: '.', id: 'empire' }).ok).toBe(true);
  });
});

describe('maxIconSize', () => {
  it('reads the largest dimension out of a sizes string', () => {
    expect(maxIconSize('192x192')).toBe(192);
    expect(maxIconSize('512x512')).toBe(512);
    expect(maxIconSize('48x48 256x256 128x128')).toBe(256);
  });
  it('treats "any" (scalable SVG) as covering every size', () => {
    expect(maxIconSize('any')).toBe(Infinity);
  });
  it('returns 0 for a missing/garbage sizes string', () => {
    expect(maxIconSize(undefined)).toBe(0);
    expect(maxIconSize('round')).toBe(0);
  });
});

describe('auditInstallability', () => {
  it('greenlights the real Empire manifest', () => {
    const r = auditInstallability(MANIFEST);
    expect(r.ok).toBe(true);
    expect(r.missing).toEqual([]);
    expect(r.criteria.icon192).toBe(true);
    expect(r.criteria.icon512).toBe(true);
    expect(r.criteria.maskableIcon).toBe(true);
  });
  it('flags a manifest missing short_name and the color theming', () => {
    const r = auditInstallability({ ...FULL_MANIFEST, short_name: '', background_color: undefined });
    expect(r.ok).toBe(false);
    expect(r.missing).toContain('short_name');
    expect(r.missing).toContain('background_color');
  });
  it('requires a ≥512px any-icon, not just a 192px one', () => {
    const r = auditInstallability({
      ...FULL_MANIFEST,
      icons: [{ src: 'a.png', sizes: '192x192', type: 'image/png', purpose: 'any' }],
    });
    expect(r.criteria.icon192).toBe(true);
    expect(r.criteria.icon512).toBe(false);
    expect(r.criteria.maskableIcon).toBe(false);
    expect(r.ok).toBe(false);
  });
  it('does NOT count a maskable-only icon toward the any-size buckets', () => {
    const r = auditInstallability({
      ...FULL_MANIFEST,
      icons: [{ src: 'm.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
    });
    expect(r.criteria.maskableIcon).toBe(true);
    expect(r.criteria.icon512).toBe(false); // maskable-only doesn't satisfy "any"
  });
  it('counts a multi-purpose "any maskable" icon for both', () => {
    const r = auditInstallability({
      ...FULL_MANIFEST,
      icons: [{ src: 'both.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
    });
    expect(r.criteria.icon512).toBe(true);
    expect(r.criteria.maskableIcon).toBe(true);
  });
  it('treats a missing purpose as "any" (the spec default)', () => {
    const r = auditInstallability({
      ...FULL_MANIFEST,
      icons: [{ src: 'big.png', sizes: '512x512', type: 'image/png' }],
    });
    expect(r.criteria.icon512).toBe(true);
  });
  it('accepts a standalone display supplied only via display_override', () => {
    const r = auditInstallability({ ...FULL_MANIFEST, display: 'browser' });
    expect(r.criteria.displayStandaloneish).toBe(true); // minimal-ui in display_override
  });
  it('rejects a browser-only display (no standalone-ish anywhere)', () => {
    const r = auditInstallability({ ...FULL_MANIFEST, display: 'browser', display_override: ['browser'] });
    expect(r.criteria.displayStandaloneish).toBe(false);
    expect(r.ok).toBe(false);
  });
});

describe('auditPwaBase', () => {
  it('greenlights a coherent /empire/ build', () => {
    const r = auditPwaBase({
      html: HTML('/empire/'), swText: SW('/empire/'),
      registerSwText: REG('/empire/'), manifestText: MANIFEST, base: '/empire/',
    });
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual([]);
    expect(r.installability.ok).toBe(true);
  });
  it('enumerates every base mismatch when a /-build is deployed under /empire/', () => {
    const r = auditPwaBase({
      html: HTML('/'), swText: SW('/'),
      registerSwText: REG('/'), manifestText: JSON.stringify({ start_url: '.', scope: '.', id: '/' }), base: '/empire/',
    });
    expect(r.ok).toBe(false);
    // html assets + manifest link + sw fallback + register + id + installability → several issues.
    expect(r.issues.length).toBeGreaterThanOrEqual(3);
  });
  it('fails the whole audit when a base-correct build has a non-installable manifest', () => {
    const r = auditPwaBase({
      html: HTML('/empire/'), swText: SW('/empire/'), registerSwText: REG('/empire/'),
      manifestText: JSON.stringify({ name: 'X', start_url: '.', scope: '.', id: 'empire' }),
      base: '/empire/',
    });
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.includes('not installable'))).toBe(true);
  });
});
