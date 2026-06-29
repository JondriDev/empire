import { describe, it, expect } from 'vitest';
import { extractPrecacheUrls, auditPrecache } from './precacheAudit.mjs';

// A miniature stand-in for a `generateSW` sw.js: only the manifest shape matters.
const SW = `define(["./workbox-abc"],function(e){"use strict";e.precacheAndRoute([` +
  `{url:"index.html",revision:"a1"},` +
  `{url:"assets/index-AAA.js",revision:"b2"},` +
  `{url:"assets/Clock-BBB.js",revision:"c3"},` +
  `{url:"assets/index-CCC.css",revision:"d4"},` +
  `{url:"/icon.svg",revision:"e5"}` +
  `],{}),e.cleanupOutdatedCaches()});`;

describe('extractPrecacheUrls', () => {
  it('pulls every url out of the inlined precacheAndRoute manifest', () => {
    expect(extractPrecacheUrls(SW)).toEqual([
      'index.html',
      'assets/index-AAA.js',
      'assets/Clock-BBB.js',
      'assets/index-CCC.css',
      '/icon.svg',
    ]);
  });
  it('returns [] when there is no manifest', () => {
    expect(extractPrecacheUrls('self.addEventListener("fetch",()=>{})')).toEqual([]);
  });
});

describe('auditPrecache', () => {
  it('reports ok with no gap when every emitted chunk is precached', () => {
    const r = auditPrecache(SW, ['index-AAA.js', 'Clock-BBB.js', 'index-CCC.css']);
    expect(r.ok).toBe(true);
    expect(r.missing).toEqual([]);
    expect(r.jsChunks).toEqual(['Clock-BBB.js', 'index-AAA.js']); // sorted
    expect(r.cssChunks).toEqual(['index-CCC.css']);
    expect(r.precacheCount).toBe(5);
  });

  it('enumerates a lazy chunk the SW would NOT serve offline (the gap)', () => {
    // Maps chunk emitted but absent from the manifest (e.g. over the size cap).
    const r = auditPrecache(SW, ['index-AAA.js', 'Clock-BBB.js', 'Maps-ZZZ.js', 'index-CCC.css']);
    expect(r.ok).toBe(false);
    expect(r.missingJs).toEqual(['Maps-ZZZ.js']);
    expect(r.missing).toEqual(['Maps-ZZZ.js']);
  });

  it('flags a missing CSS chunk too', () => {
    const r = auditPrecache(SW, ['index-AAA.js', 'Clock-BBB.js', 'Late-DDD.css']);
    expect(r.missingCss).toEqual(['Late-DDD.css']);
    expect(r.ok).toBe(false);
  });

  it('matches manifest urls with or without a leading slash', () => {
    const sw = `precacheAndRoute([{url:"/assets/x.js",revision:"1"}])`;
    expect(auditPrecache(sw, ['x.js']).ok).toBe(true);
  });
});
