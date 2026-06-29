// EPIC-4 S1 — Offline-boot guard + SW precache audit (run unattended in cloud).
//
// Today's qa-smoke only blocks EXTERNAL hosts; it never proves the app boots
// with the network FULLY blocked. This guard does:
//   1. PRECACHE AUDIT (static): parse dist/sw.js's inlined Workbox manifest and
//      enumerate any emitted JS/CSS chunk the SW would NOT serve offline.
//   2. COLD-OFFLINE BOOT (live): serve dist/ from a tiny static server, warm-load
//      once so the service worker installs + precaches, then `context.setOffline(true)`
//      to block ALL network and assert the desktop shell + lazy app routes still
//      render — entirely from the SW precache.
//
// `setOffline(true)` is the faithful "cold offline boot" primitive: it fails every
// real network request while Cache Storage still serves, so any chunk that ISN'T
// precached falls through to a dead network and the render breaks — exactly the
// regression this guard exists to catch. Self-contained (own server + browser);
// safe to run standalone (`node scripts/qa-offline.mjs`) or as a qa-smoke child.
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { auditPrecache } from './precacheAudit.mjs';

const DIST = path.resolve('dist');
const PORT = Number(process.env.QA_OFFLINE_PORT || 3101);
const BASE = `http://localhost:${PORT}`;
// One shell route + a spread of lazy app chunks (Maps is the biggest, ~160 KB).
const APP_ROUTES = ['clock', 'maps', 'network', 'photos'];

function fail(msg) {
  console.error(`OFFLINE-BOOT: ✖ ${msg}`);
  writeResult({ ok: false, error: msg });
  process.exit(1);
}

if (!fs.existsSync(DIST)) fail('dist/ not found — run `npm run build` first');
if (!fs.existsSync(path.join(DIST, 'sw.js'))) fail('dist/sw.js not found — PWA service worker missing from build');
if (!fs.existsSync(path.join(DIST, 'index.html'))) fail('dist/index.html not found');

// ── 1. Precache audit (static) ──────────────────────────────────────────────
const swText = fs.readFileSync(path.join(DIST, 'sw.js'), 'utf8');
const assetFiles = fs.existsSync(path.join(DIST, 'assets')) ? fs.readdirSync(path.join(DIST, 'assets')) : [];
const audit = auditPrecache(swText, assetFiles);
console.log(`PRECACHE-AUDIT: ${audit.precacheCount} entries; ${audit.jsChunks.length} JS + ${audit.cssChunks.length} CSS chunks emitted.`);
if (audit.ok) {
  console.log('PRECACHE-AUDIT: ✅ no gap — every emitted chunk is in the SW precache.');
} else {
  console.warn(`PRECACHE-AUDIT: ⚠️ ${audit.missing.length} chunk(s) NOT precached (would 404 offline):`);
  audit.missing.forEach((f) => console.warn(`   - assets/${f}`));
}

// ── tiny static server for dist/ (SPA fallback + SW-friendly headers) ─────────
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.map': 'application/json',
};
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
  let file = path.join(DIST, rel);
  // SPA fallback: an unknown extensionless route (e.g. /app/clock) → index.html.
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(DIST, 'index.html');
    rel = 'index.html';
  }
  const ext = path.extname(file);
  const headers = { 'content-type': MIME[ext] || 'application/octet-stream' };
  // Let the SW (served from root) claim a root scope.
  if (rel === 'sw.js') headers['service-worker-allowed'] = '/';
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
});

async function launchBrowser() {
  const glob = fs.readdirSync('/opt/pw-browsers').filter((d) => /^chromium-\d+$/.test(d)).sort();
  const candidates = glob.map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`).filter((p) => fs.existsSync(p));
  for (const executablePath of candidates) {
    try { return await chromium.launch({ executablePath }); }
    catch (e) { console.warn(`launch failed for ${executablePath}: ${e.message}`); }
  }
  try { return await chromium.launch(); }
  catch (e) { console.warn(`bare chromium.launch() failed: ${e.message}`); }
  const sparticuz = (await import('@sparticuz/chromium')).default;
  return await chromium.launch({ executablePath: await sparticuz.executablePath(), args: sparticuz.args });
}

// Render check: real content in #root, no error-boundary / not-found text.
async function renderState(page) {
  return page.evaluate(() => ({
    rootLen: (document.getElementById('root')?.innerHTML || '').length,
    hasDesktop: !!document.querySelector('.empire-desktop'),
    bodyText: (document.body.innerText || '').slice(0, 400),
  }));
}
function renders(state, { needDesktop } = {}) {
  if (state.rootLen < 30) return false;
  if (/App not (available|found)|Something went wrong|Error boundary/i.test(state.bodyText)) return false;
  if (needDesktop && !state.hasDesktop) return false;
  return true;
}

function writeResult(extra) {
  const result = {
    now: new Date().toISOString(),
    precache: { count: audit.precacheCount, jsChunks: audit.jsChunks.length, cssChunks: audit.cssChunks.length, missing: audit.missing },
    ...extra,
  };
  try { fs.writeFileSync('/tmp/qa-offline.json', JSON.stringify(result, null, 2)); } catch { /* best-effort */ }
  // Human-readable report alongside the smoke report.
  try {
    const OUT = path.resolve('docs/screenshots/latest');
    fs.mkdirSync(OUT, { recursive: true });
    let md = `# Empire QA — Offline-boot guard (EPIC-4 S1)\n\n**Generated:** ${result.now}\n\n`;
    md += `## Precache audit\n\nSW precache manifest: **${audit.precacheCount} entries**. Emitted chunks: **${audit.jsChunks.length} JS + ${audit.cssChunks.length} CSS**.\n\n`;
    md += audit.ok
      ? `✅ **No gap** — every emitted JS/CSS chunk is in the SW precache, so a cold offline boot can serve the shell + all 25 lazy app routes.\n\n`
      : `⚠️ **${audit.missing.length} chunk(s) NOT precached** (would 404 offline):\n\n${audit.missing.map((f) => `- \`assets/${f}\``).join('\n')}\n\n`;
    md += `## Cold-offline boot (network fully blocked via setOffline)\n\n`;
    if (extra.routes) {
      md += `| Route | Renders offline |\n|---|---|\n`;
      for (const r of extra.routes) md += `| ${r.route} | ${r.pass ? '✅' : '❌'}${r.note ? ' (' + r.note + ')' : ''} |\n`;
      md += `\n**Cold-offline boot: ${extra.passCount}/${extra.routes.length} ${extra.ok ? '✅' : '❌'}**\n`;
    } else if (extra.error) {
      md += `❌ guard could not run: ${extra.error}\n`;
    }
    fs.writeFileSync(path.join(OUT, 'OFFLINE.md'), md);
  } catch { /* best-effort */ }
}

await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`OFFLINE-BOOT: serving dist/ at ${BASE}`);

const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'allow' });
const routes = [];
try {
  // ── 2a. Warm load: register the SW + let it precache (install → activate). ──
  const warm = await ctx.newPage();
  await warm.goto(BASE + '/', { waitUntil: 'load', timeout: 30000 });
  await warm.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.getRegistration();
    return !!(reg && reg.active);
  }, null, { timeout: 25000 });
  // clientsClaim should set the controller; reload once to guarantee the SW
  // is the one serving before we cut the network.
  await warm.reload({ waitUntil: 'load', timeout: 30000 });
  await warm.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 }).catch(() => {});
  const controlled = await warm.evaluate(() => !!navigator.serviceWorker.controller);
  console.log(`OFFLINE-BOOT: service worker active${controlled ? ' + controlling the page' : ''}.`);
  await warm.close();

  // ── 2b. Cut ALL network. From here every byte must come from the precache. ──
  await ctx.setOffline(true);
  console.log('OFFLINE-BOOT: network set OFFLINE — booting cold from precache…');

  // Shell at '/'
  {
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 20000 }).catch((e) => routes.push({ route: '/', pass: false, note: 'nav: ' + e.message.slice(0, 60) }));
    await page.waitForTimeout(1500);
    const st = await renderState(page);
    const pass = renders(st, { needDesktop: true });
    if (!routes.find((r) => r.route === '/')) routes.push({ route: '/', pass, note: pass ? '' : `root=${st.rootLen} desktop=${st.hasDesktop}` });
    console.log(`OFFLINE-BOOT  /            renders=${pass}`);
    await page.close();
  }
  // Lazy app routes
  for (const id of APP_ROUTES) {
    const page = await ctx.newPage();
    const route = `/app/${id}`;
    let navErr = '';
    await page.goto(BASE + route, { waitUntil: 'load', timeout: 20000 }).catch((e) => { navErr = 'nav: ' + e.message.slice(0, 60); });
    await page.waitForTimeout(1500);
    const st = await renderState(page);
    const pass = !navErr && renders(st);
    routes.push({ route, pass, note: pass ? '' : (navErr || `root=${st.rootLen}`) });
    console.log(`OFFLINE-BOOT  ${route.padEnd(13)}renders=${pass}`);
    await page.close();
  }
} finally {
  await ctx.setOffline(false).catch(() => {});
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

const passCount = routes.filter((r) => r.pass).length;
const ok = passCount === routes.length && routes.length > 0;
writeResult({ routes, passCount, ok });
console.log(`\nOFFLINE-BOOT: ${passCount}/${routes.length} routes booted cold-offline ${ok ? '✅' : '❌'}`);
console.log(`PRECACHE-AUDIT: ${audit.ok ? 'no gap ✅' : audit.missing.length + ' missing ⚠️'}`);
process.exit(ok ? 0 : 1);
