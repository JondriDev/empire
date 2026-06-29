import { describe, it, expect } from 'vitest';
import {
  normalizeBase,
  extractHtmlAssetUrls,
  auditHtmlBase,
  auditSwBase,
  auditRegisterSw,
  auditManifest,
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
const MANIFEST = JSON.stringify({ name: 'The Empire', start_url: '.', scope: '.', id: 'empire' });

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

describe('auditPwaBase', () => {
  it('greenlights a coherent /empire/ build', () => {
    const r = auditPwaBase({
      html: HTML('/empire/'), swText: SW('/empire/'),
      registerSwText: REG('/empire/'), manifestText: MANIFEST, base: '/empire/',
    });
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual([]);
  });
  it('enumerates every base mismatch when a /-build is deployed under /empire/', () => {
    const r = auditPwaBase({
      html: HTML('/'), swText: SW('/'),
      registerSwText: REG('/'), manifestText: JSON.stringify({ start_url: '.', scope: '.', id: '/' }), base: '/empire/',
    });
    expect(r.ok).toBe(false);
    // html assets + manifest link + sw fallback + register + id → several issues.
    expect(r.issues.length).toBeGreaterThanOrEqual(3);
  });
});
