// QA visual + smoke test for The Empire (run unattended in cloud).
// Navigates the desktop shell + each app route, records console/page errors,
// captures screenshots into docs/screenshots/latest/, writes REPORT.md.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, spawnSync } from 'child_process';

const BASE = 'http://localhost:3001';
const OUT = path.resolve('docs/screenshots/latest');
fs.mkdirSync(OUT, { recursive: true });

// ── SHELL-IS-STYLED assertion (the green-build-but-blank trap) ──────────────
// A stray `*/` inside a CSS doc-comment can close the comment early, nesting
// every `.empire-*` rule under `@media(max-width:640px){.hide-sm …}` → the
// desktop renders unstyled DESPITE a green build. Verify the built CSS without
// a browser: it must have a TOP-LEVEL `.empire-desktop{…position:fixed…}` and
// ZERO `.hide-sm .empire-desktop`. Note: the minifier reorders properties, so
// match the whole rule body, not `.empire-desktop{position:fixed`.
function assertShellStyled() {
  const cssFiles = fs.readdirSync(path.resolve('dist/assets')).filter(f => /^index-.*\.css$/.test(f));
  if (!cssFiles.length) throw new Error('SHELL-IS-STYLED: no dist/assets/index-*.css found (build first)');
  const css = cssFiles.map(f => fs.readFileSync(path.resolve('dist/assets', f), 'utf8')).join('\n');
  const topLevel = /\.empire-desktop\{[^}]*position:fixed[^}]*\}/.test(css);
  const nested = (css.match(/\.hide-sm \.empire-desktop/g) || []).length;
  if (!topLevel) throw new Error('SHELL-IS-STYLED: missing top-level `.empire-desktop{…position:fixed…}` in built CSS (blank-dark trap)');
  if (nested !== 0) throw new Error(`SHELL-IS-STYLED: found ${nested}× \`.hide-sm .empire-desktop\` (rules nested under @media → unstyled shell)`);
  console.log('SHELL-IS-STYLED: ✅ top-level .empire-desktop{position:fixed}, 0 .hide-sm .empire-desktop');
}
assertShellStyled();

// Known-good headless recipe (see docs/CONTEXT.md): use the pre-installed
// Chromium; do NOT rely on cdn.playwright.dev (it 403s in the sandbox).
async function launchBrowser() {
  const glob = fs.readdirSync('/opt/pw-browsers').filter(d => /^chromium-\d+$/.test(d)).sort();
  const candidates = glob.map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`).filter(p => fs.existsSync(p));
  for (const executablePath of candidates) {
    try { return await chromium.launch({ executablePath }); }
    catch (e) { console.warn(`launch failed for ${executablePath}: ${e.message}`); }
  }
  // Fallbacks: bare launch, then @sparticuz/chromium.
  try { return await chromium.launch(); }
  catch (e) { console.warn(`bare chromium.launch() failed: ${e.message}`); }
  const sparticuz = (await import('@sparticuz/chromium')).default;
  return await chromium.launch({ executablePath: await sparticuz.executablePath(), args: sparticuz.args });
}

// App routes to smoke test (keys mirror src/lib/appComponents.tsx).
const apps = [
  'calculator','calendar','clock','weather','grammar','language','music','video',
  'files','cache','browser','editor','notes','photos','datacenter','maps','messages',
  'prompt-generator','token-counter','learning-tracker','ai-chat','goals',
  'artifacts','network','inbox','reader','search','timeline','solver',
  'mail','crypto',
];

// ── REGISTRY-COVERAGE assertion (the silently-skipped-app trap) ─────────────
// A new app added to the registry but not to `apps` above would never be
// smoke-tested (a green report that quietly skips it). Cross-check the smoke
// list against src/lib/registry.ts so every shipped app is rendered here.
function assertRegistryCoverage() {
  const reg = fs.readFileSync(path.resolve('src/lib/registry.ts'), 'utf8');
  const ids = [...reg.matchAll(/id:\s*'([a-z0-9-]+)'/g)].map(m => m[1]);
  const uniqIds = [...new Set(ids)];
  const missing = uniqIds.filter(id => !apps.includes(id));
  if (missing.length) throw new Error(`REGISTRY-COVERAGE: ${missing.length} registry app(s) not in smoke list: ${missing.join(', ')}`);
  // Reverse guard (the phantom-route trap): an app deleted from the registry but
  // left in the smoke list would be visited at a dead /app/<id> route, FAIL as
  // "App not found", and red the whole run for a route that no longer exists.
  // (e.g. the 2026-06-28 Hermes→Cakra redesign deleted ai-agent + hermes-cc.)
  const orphan = apps.filter(id => !uniqIds.includes(id));
  if (orphan.length) throw new Error(`REGISTRY-COVERAGE: ${orphan.length} smoke-list app(s) not in registry (deleted/renamed?): ${orphan.join(', ')}`);
  console.log(`REGISTRY-COVERAGE: ✅ smoke list ↔ registry match exactly (${uniqIds.length} apps)`);
}
assertRegistryCoverage();

const sanitize = (s) => s.replace(/[^a-z0-9-]/gi, '-');
const results = [];

// ── AUTO-SERVER (kills the per-run "start node server.js by hand" tax) ───────
// Every prior QA/build run had to manually `node server.js &` on :3001 before
// the smoke, else all 32 routes read ECONNREFUSED and the report was a wall of
// red that meant nothing. The smoke now boots its OWN server from the built
// dist/ when BASE isn't already answering, and tears it down on exit. An
// already-running server (externally managed) is detected and left untouched,
// so this is safe to run either way. Pairs with `playwright` now being a real
// devDependency — a fresh `npm install` + `npm run build` + this smoke needs no
// manual setup at all.
async function probeServer(url, timeoutMs = 1500) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctl.signal });
    clearTimeout(t);
    return res.status < 500;
  } catch { return false; }
}

let ownedServer = null;
function stopServer() {
  if (!ownedServer) return;
  const s = ownedServer;
  ownedServer = null;
  try { s.kill('SIGTERM'); } catch { /* already gone */ }
}
process.on('exit', stopServer);
process.on('SIGINT', () => { stopServer(); process.exit(130); });
process.on('SIGTERM', () => { stopServer(); process.exit(143); });

async function ensureServer() {
  if (await probeServer(BASE + '/')) {
    console.log(`AUTO-SERVER: ✅ a server is already answering on ${BASE} (leaving it alone)`);
    return;
  }
  if (!fs.existsSync(path.resolve('dist/index.html'))) {
    throw new Error('AUTO-SERVER: no dist/index.html — run `npm run build` before the smoke');
  }
  console.log(`AUTO-SERVER: nothing on ${BASE} — starting \`node server.js\`…`);
  ownedServer = spawn('node', ['server.js'], { stdio: 'ignore', env: process.env });
  ownedServer.on('exit', (code) => {
    if (ownedServer) console.warn(`AUTO-SERVER: ⚠️ server.js exited early (code ${code})`);
  });
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 500));
    if (!ownedServer) throw new Error('AUTO-SERVER: server.js exited before becoming ready');
    if (await probeServer(BASE + '/')) {
      console.log(`AUTO-SERVER: ✅ server.js is up on ${BASE}`);
      return;
    }
  }
  throw new Error(`AUTO-SERVER: server.js did not become ready on ${BASE} within 30s`);
}
await ensureServer();

const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });

async function visit(name, url, file) {
  const page = await ctx.newPage();
  const consoleErrors = [];   // console.error noise (often network)
  const uncaught = [];        // real JS exceptions — render-breaking
  const netFails = [];        // failed network requests w/ URL
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => uncaught.push(e.message || String(e)));
  page.on('requestfailed', (r) => {
    const u = r.url().replace(BASE, '');
    netFails.push(`${u} (${r.failure()?.errorText || 'failed'})`);
  });
  page.on('response', (r) => { if (r.status() >= 400) netFails.push(`${r.url().replace(BASE, '')} → HTTP ${r.status()}`); });
  let crashed = false;
  const errors = uncaught; // back-compat for downstream
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    // networkidle can hang on offline SW retries — fall back to domcontentloaded
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }); }
    catch (e2) { crashed = true; uncaught.push('NAV: ' + (e2.message || String(e2))); }
  }
  // give lazy chunks + animations a beat to settle
  await page.waitForTimeout(1800);
  // Detect React error boundary / blank crash
  const bodyText = await page.evaluate(() => document.body.innerText || '').catch(() => '');
  const rootHtml = await page.evaluate(() => (document.getElementById('root')?.innerHTML || '').length).catch(() => 0);
  if (rootHtml < 30) { crashed = true; uncaught.push('EMPTY: #root has little/no content'); }
  if (/App not available|App not found/i.test(bodyText)) { crashed = true; uncaught.push('App not available/found (route not wired)'); }
  if (/Something went wrong|Error boundary/i.test(bodyText)) { crashed = true; uncaught.push('Error boundary triggered'); }
  try {
    await page.screenshot({ path: path.join(OUT, file), fullPage: false });
  } catch (e) {
    uncaught.push('SHOT: ' + (e.message || String(e)));
  }
  // PASS = app rendered without crash or uncaught JS exception. Network/console
  // noise (offline sandbox: external CDNs, backend API needing auth) is reported
  // separately, not a render failure.
  const pass = !crashed && uncaught.length === 0;
  const uniq = (a) => [...new Set(a)];
  results.push({ name, url, pass, crashed, uncaught: uniq(uncaught), consoleErrors: uniq(consoleErrors), netFails: uniq(netFails) });
  await page.close();
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  (uncaught:${uncaught.length} net:${uniq(netFails).length})`);
}

// Desktop shell
await visit('desktop', BASE + '/', 'desktop.png');

// Each app
for (const id of apps) {
  await visit(id, `${BASE}/app/${id}`, `app-${sanitize(id)}.png`);
}

// ── INBOUND-LANDS guard (the organism-loop regression trap) ─────────────────
// A route can render green while its cross-app *receive* silently breaks (the
// `useInboundHandoff` mount-effect stops preloading, the ProvenanceChip stops
// rendering). EPIC-1's whole thesis is the emit↔receive loop, so guard it: for
// each entity receiver, seed its `empire-*-clipboard` payload the way
// appActions.ts SEND_TO_<X> does, reload, and assert BOTH a "Received from …"
// chip AND a prefilled control value. Non-fatal (recorded in the report, not
// thrown) so a flaky reload can't red the whole render run — but a real
// regression shows as ❌ for the build routine to pick up.
const inboundCases = [
  { id: 'calendar', key: 'empire-calendar-clipboard', from: 'editor', needle: 'Quarterly',
    payload: { text: 'Quarterly planning sync', title: 'Quarterly planning sync', from: 'editor' } },
  { id: 'goals', key: 'empire-goals-clipboard', from: 'notes', needle: 'organism',
    payload: { text: 'Ship the organism epic', title: 'Ship the organism epic', from: 'notes' } },
  { id: 'messages', key: 'empire-messages-clipboard', from: 'ai-chat', needle: 'deploy at 5pm',
    payload: { text: 'Heads up: deploy at 5pm', from: 'ai-chat' } },
  // EPIC-13 S2 — Mail is now a handoff receiver. SEND_TO_MAIL writes subject/body
  // (not text/title) into empire-mail-clipboard, so seed the same shape here.
  { id: 'mail', key: 'empire-mail-clipboard', from: 'notes', needle: 'Q3 report',
    payload: { subject: 'Q3 report', body: 'Please review the Q3 report', from: 'notes' } },
];
const inboundResults = [];
for (const c of inboundCases) {
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/app/${c.id}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(([k, v]) => sessionStorage.setItem(k, JSON.stringify(v)), [c.key, c.payload]);
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const chip = (await page.locator('[aria-label^="Received from"]').count()) > 0;
    const vals = await page.evaluate(() => [...document.querySelectorAll('input,textarea')].map(e => e.value).join(' '));
    const prefilled = vals.includes(c.needle);
    inboundResults.push({ id: c.id, from: c.from, chip, prefilled, pass: chip && prefilled });
    console.log(`INBOUND  ${c.id}  chip=${chip} prefilled=${prefilled} (from ${c.from})`);
  } catch (e) {
    inboundResults.push({ id: c.id, from: c.from, chip: false, prefilled: false, pass: false, err: e.message });
    console.warn(`INBOUND  ${c.id}  ERROR ${e.message}`);
  }
  await page.close();
}
const inboundPass = inboundResults.filter(r => r.pass).length;
console.log(`INBOUND-LANDS: ${inboundPass}/${inboundResults.length} ${inboundPass === inboundResults.length ? '✅' : '⚠️'}`);

// ── MEDIA-PERSISTS guard (EPIC-3 S2 acceptance: the IDB blob roundtrip) ──────
// S2 made Music + Video libraries survive a reload by storing real Blobs in
// IndexedDB and persisting metadata only. jsdom has NO IndexedDB, so the unit
// tests (`mediaStore.test.ts`) can only pin the pure transforms (strip /
// rehydrate / ghost-drop) — the actual add→reload→still-there roundtrip that is
// the stage's whole acceptance was never exercised by any automated check. Do
// it for real here: drive the genuine file <input> (real user flow →
// handleFileSelect → putMedia → setPlaylist), reload, and assert the item
// survived (rehydrated from IDB, not dropped as a ghost). Non-fatal (recorded,
// not thrown) like INBOUND-LANDS so a flaky browser can't red the whole render
// run — but a real regression in the persistence rail shows as ❌ for the build
// routine to pick up.
function makeWavBytes() {
  const sampleRate = 8000, numSamples = 800; // ~0.1s of silence; a valid RIFF/WAVE
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataSize, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(dataSize, 40);
  return buf;
}
// A minimal valid 1×1 PNG (so Photos' image filter + the new window.Image()
// dimension probe both accept it); the bytes round-trip through IDB.
function makePngBytes() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
}
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empire-qa-media-'));
const wavPath = path.join(tmpDir, 'QAProbe MusicSurvive.wav');
const webmPath = path.join(tmpDir, 'QAProbe VideoSurvive.webm');
const pngPath = path.join(tmpDir, 'QAProbe PhotoSurvive.png');
fs.writeFileSync(wavPath, makeWavBytes());
// The blob bytes are irrelevant to the persistence roundtrip — only the .webm
// extension (passes Video's file filter) and that real bytes round-trip matter.
fs.writeFileSync(webmPath, Buffer.from('QAProbe-video-bytes-for-idb-roundtrip'));
fs.writeFileSync(pngPath, makePngBytes());
const mediaCases = [
  { id: 'music', file: wavPath, title: 'QAProbe MusicSurvive' },
  { id: 'video', file: webmPath, title: 'QAProbe VideoSurvive' },
  // EPIC-3 S3: Photos now uses the same mediaStore IDB rail — add→reload→survive.
  // Photos renders the full filename, so the .png substring is present in the body.
  { id: 'photos', file: pngPath, title: 'QAProbe PhotoSurvive' },
];
const mediaResults = [];
for (const c of mediaCases) {
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/app/${c.id}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(800);
    await page.setInputFiles('input[type="file"]', c.file);
    await page.waitForTimeout(1200);
    const bodyAfterAdd = await page.evaluate(() => document.body.innerText || '');
    const added = bodyAfterAdd.includes(c.title);
    // Reload — the library must be rebuilt from localStorage meta + IDB blobs.
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2200); // async rehydrate (loadMediaUrls → rehydrateMedia)
    const bodyAfterReload = await page.evaluate(() => document.body.innerText || '');
    const survived = bodyAfterReload.includes(c.title);
    mediaResults.push({ id: c.id, added, survived, pass: added && survived });
    console.log(`MEDIA  ${c.id}  added=${added} survived-reload=${survived}`);
  } catch (e) {
    mediaResults.push({ id: c.id, added: false, survived: false, pass: false, err: e.message });
    console.warn(`MEDIA  ${c.id}  ERROR ${e.message}`);
  }
  await page.close();
}
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
const mediaPass = mediaResults.filter(r => r.pass).length;
console.log(`MEDIA-PERSISTS: ${mediaPass}/${mediaResults.length} ${mediaPass === mediaResults.length ? '✅' : '⚠️'}`);

// ── GRAPH-LEGIBLE guard (EPIC-6 S4: Reader's books join the organism graph) ──
// Reader owns a real collection (imported books) but was the LAST such app that
// never mirrored into the Core graph — invisible in The Network. S4 wires
// `mirrorCollection('book','reader', books, …)`, so a loaded book must now appear
// as a `book` CoreNode owned by app==='reader'. jsdom can't drive the real import
// → setBooks → mirror effect → persisted `empire-core-graph` roundtrip (no real
// file input / no reload), so do it for real: drive Reader's file <input> with a
// small .txt book, assert a reader-owned `book` node exists in the persisted
// graph, then reload and assert the re-mounted Reader re-mirrors it (idempotent,
// not dropped). Non-fatal like the guards above — a regression shows as ❌.
const GRAPH_KEY = 'empire-core-graph';
// Generalised graph reader (EPIC-13 S1): count persisted CoreNodes of a given
// `type` owned by a given `app`. Was `readReaderBookNodes` (book/reader only);
// now serves both the reader/book and crypto/wallet axes.
const readNodes = (page, type, app) => page.evaluate(({ k, type, app }) => {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return 0;
    const nodes = JSON.parse(raw)?.state?.nodes || {};
    return Object.values(nodes).filter(n => n?.type === type && n?.meta?.app === app).length;
  } catch { return 0; }
}, { k: GRAPH_KEY, type, app });

// ── Axis 1: reader/book (EPIC-6 S4) ──
const readerTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empire-qa-reader-'));
const txtBookPath = path.join(readerTmpDir, 'QAProbe BookLegible.txt');
fs.writeFileSync(txtBookPath, 'QA graph-legibility probe — a small book so Reader mirrors a book node into the organism graph.');
const graphLegible = { added: false, node: false, persisted: false, pass: false };
try {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app/reader`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(700);
  await page.setInputFiles('input[type="file"]', txtBookPath);
  await page.waitForTimeout(1500);
  const bodyAfterAdd = await page.evaluate(() => document.body.innerText || '');
  graphLegible.added = bodyAfterAdd.includes('QAProbe BookLegible');
  graphLegible.node = (await readNodes(page, 'book', 'reader')) > 0;
  // Reload — the mirrored node lives in the persisted graph, and the re-mounted
  // Reader must re-mirror the same library (idempotent reconcile), not drop it.
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  graphLegible.persisted = (await readNodes(page, 'book', 'reader')) > 0;
  graphLegible.pass = graphLegible.node && graphLegible.persisted;
  console.log(`GRAPH-LEGIBLE  reader/book  added=${graphLegible.added} node=${graphLegible.node} persisted=${graphLegible.persisted}`);
  await page.close();
} catch (e) {
  graphLegible.err = e.message;
  console.warn(`GRAPH-LEGIBLE reader/book: guard did not complete — ${e.message}`);
}
try { fs.rmSync(readerTmpDir, { recursive: true, force: true }); } catch { /* ignore */ }

// ── Axis 2: crypto/wallet (EPIC-13 S1) ──
// Crypto owns a real collection (the watched wallet addresses) but landed as a
// raw-HTML island. S1 wires `mirrorCollection('wallet','crypto', walletItems(…))`,
// so a watched address must now appear as a `wallet` CoreNode owned by
// app==='crypto'. Seed `crypto-watch-list` in the page origin BEFORE the app
// mounts (so the hydrate effect reads it → mirror effect fires), then assert the
// wallet node exists and survives a reload (idempotent reconcile).
const WALLET_ADDR = 'bc1qQAprobewalletlegible00000000000000';
const cryptoLegible = { node: false, persisted: false, pass: false };
try {
  const page = await ctx.newPage();
  // Establish the origin, seed the watch-list, then reload so a fresh mount hydrates it.
  await page.goto(`${BASE}/app/crypto`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate((addr) => localStorage.setItem('crypto-watch-list',
    JSON.stringify({ btc: addr, eth: '', sol: '', xrp: '', doge: '' })), WALLET_ADDR);
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1200);
  cryptoLegible.node = (await readNodes(page, 'wallet', 'crypto')) > 0;
  // Reload again — the mirrored node lives in the persisted graph, and the
  // re-mounted Crypto must re-mirror the same watch-list (not drop it).
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1200);
  cryptoLegible.persisted = (await readNodes(page, 'wallet', 'crypto')) > 0;
  cryptoLegible.pass = cryptoLegible.node && cryptoLegible.persisted;
  console.log(`GRAPH-LEGIBLE  crypto/wallet  node=${cryptoLegible.node} persisted=${cryptoLegible.persisted}`);
  await page.close();
} catch (e) {
  cryptoLegible.err = e.message;
  console.warn(`GRAPH-LEGIBLE crypto/wallet: guard did not complete — ${e.message}`);
}

// ── Axis 3: mail/draft (EPIC-13 S3) ──
// Mail owns a real collection now (durable drafts in `empire-mail-drafts`) — the
// last raw-HTML island. S3 wires `mirrorCollection('draft','mail', drafts, …)`, so
// a saved draft must appear as a `draft` CoreNode owned by app==='mail'. Seed one
// draft in the page origin BEFORE the app mounts (the load effect reads it → mirror
// effect fires), then assert the draft node exists and survives a reload.
const draftLegible = { node: false, persisted: false, pass: false };
try {
  const page = await ctx.newPage();
  // Establish the origin, seed a draft, then reload so a fresh mount reads it.
  await page.goto(`${BASE}/app/mail`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => localStorage.setItem('empire-mail-drafts', JSON.stringify([
    { id: 'draft:qa-probe', to: 'qa@empire.test', subject: 'QAProbe DraftLegible', body: 'graph-legibility probe', updatedAt: 1 },
  ])));
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1200);
  draftLegible.node = (await readNodes(page, 'draft', 'mail')) > 0;
  // Reload again — the mirrored node lives in the persisted graph, and the
  // re-mounted Mail must re-mirror the same drafts (not drop it).
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1200);
  draftLegible.persisted = (await readNodes(page, 'draft', 'mail')) > 0;
  draftLegible.pass = draftLegible.node && draftLegible.persisted;
  console.log(`GRAPH-LEGIBLE  mail/draft  node=${draftLegible.node} persisted=${draftLegible.persisted}`);
  await page.close();
} catch (e) {
  draftLegible.err = e.message;
  console.warn(`GRAPH-LEGIBLE mail/draft: guard did not complete — ${e.message}`);
}

const graphLegiblePassed = (graphLegible.pass ? 1 : 0) + (cryptoLegible.pass ? 1 : 0) + (draftLegible.pass ? 1 : 0);
console.log(`GRAPH-LEGIBLE: ${graphLegiblePassed}/3 ${graphLegiblePassed === 3 ? '✅' : '⚠️'}`);

// ── GLOBAL-SEARCH guard (EPIC-8 S1: the organism becomes queryable) ──────────
// Every collection-owning app mirrors its real entities into the Core graph;
// EPIC-8's Search app queries them ALL at once via the pure `searchNodes` spine
// (lib/core/search.ts, unit-pinned) and groups the hits by owning app. The pure
// ranking is covered by search.test.ts, but jsdom can't drive the real
// graph→input→grouped-render roundtrip. Do it for real: seed `empire-core-graph`
// with two entities that share a rare term across TWO different apps (a note in
// `notes`, a task in `goals`), reload so the persist store rehydrates, type the
// term into the Search field, and assert BOTH entities surface under their own
// app groups (checked via the `[data-search-group]` section, NOT body text — the
// desktop launcher grid also prints every app name). Non-fatal like the guards
// above — a regression shows as ❌.
// NOTE on seed types: `startCoreSync()` reconciles the CENTRALLY-mirrored types
// (note/learning/message) against the global store on boot and PRUNES any such
// node absent from that (empty, in a fresh QA session) store. So the seed uses
// graph-survivable types — a `task` (graph-only, no syncer) owned by `goals` and
// a `book` (self-mirrored by Reader, which isn't mounted on /app/search) owned by
// `reader` — two DIFFERENT apps, both surviving the boot reconcile.
// S2 adds a THIRD seed: a node whose rare term ('Tessellate') lives ONLY in
// `data.tags` (a string array) and NOWHERE in its title/type — so it surfaces
// iff `nodeBodyText` now flattens array elements (S2 corpus gap (a)). It's a
// `task` (graph-only, no central syncer) so it survives the boot reconcile — a
// `note`-typed seed on /app/search would be PRUNED (empty Notes store), which is
// why S1's guard already avoids note seeds. The tag-only term is orthogonal to
// Xenolith so the two assertions don't cross-contaminate.
const SEARCH_TERM = 'Xenolith';
const TAG_TERM = 'Tessellate';
const searchSeed = {
  state: {
    nodes: {
      'qa-search-book': {
        id: 'qa-search-book', type: 'book', title: 'Xenolith fragment log',
        data: { author: 'QA', format: 'txt' }, links: [],
        meta: { created: 1, updated: 2, app: 'reader' },
      },
      'qa-search-task': {
        id: 'qa-search-task', type: 'task', title: 'Survey the Xenolith site',
        data: { done: false }, links: [],
        meta: { created: 1, updated: 3, app: 'goals' },
      },
      'qa-search-tag': {
        id: 'qa-search-tag', type: 'task', title: 'Untitled fragment',
        data: { done: false, tags: [TAG_TERM] }, links: [],
        meta: { created: 1, updated: 4, app: 'goals' },
      },
    },
  },
  version: 0,
};
const globalSearch = { book: false, task: false, twoApps: false, tagOnly: false, pass: false };
try {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app/search`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [GRAPH_KEY, JSON.stringify(searchSeed)]);
  // Reload so the zustand+persist graph store rehydrates from the seeded key.
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(700);
  const searchInput = 'input[aria-label="Search across every app"]';
  await page.fill(searchInput, SEARCH_TERM);
  await page.waitForTimeout(600);
  const body = await page.evaluate(() => document.body.innerText || '');
  globalSearch.book = body.includes('Xenolith fragment log');
  globalSearch.task = body.includes('Survey the Xenolith site');
  // Distinct result app-groups (from the rendered sections, not the launcher).
  const groupApps = await page.$$eval('[data-search-group]', els => els.map(e => e.getAttribute('data-search-group')));
  globalSearch.twoApps = groupApps.includes('reader') && groupApps.includes('goals');
  // S2 corpus gap (a): a term that lives ONLY in the node's tags surfaces it.
  await page.fill(searchInput, TAG_TERM);
  await page.waitForTimeout(600);
  const tagBody = await page.evaluate(() => document.body.innerText || '');
  globalSearch.tagOnly = tagBody.includes('Untitled fragment');
  globalSearch.pass = globalSearch.book && globalSearch.task && globalSearch.twoApps && globalSearch.tagOnly;
  console.log(`GLOBAL-SEARCH  book=${globalSearch.book} task=${globalSearch.task} twoApps=${globalSearch.twoApps} tagOnly=${globalSearch.tagOnly} (groups: ${groupApps.join(',')})`);
  // Leave the graph clean for later guards.
  await page.evaluate((k) => localStorage.removeItem(k), GRAPH_KEY);
  await page.close();
} catch (e) {
  globalSearch.err = e.message;
  console.warn(`GLOBAL-SEARCH: guard did not complete — ${e.message}`);
}
console.log(`GLOBAL-SEARCH: ${globalSearch.pass ? '1/1 ✅' : '0/1 ⚠️'}`);

// ── NODE-LINEAGE guard (node-level lineage: per-artifact ancestry is legible) ─
// `provenance.ts`/`lineageOf` remember which APP fed which app. Node-level
// lineage answers the finer question — which ENTITY did this exact artifact
// descend from? The core intents (make-task / make-note-from / add-to-learning)
// already stamp `data.from = sourceNode.id` on every node they create, so the
// per-artifact ancestry lives durably in `empire-core-graph`. The new pure
// `nodeLineageOf` walks it (unit-pinned in nodeLineage.test.ts) and the Inbox
// row renders a `<NodeLineage>` showing the real source entity. jsdom can't
// drive the graph→persist→rehydrate→render roundtrip, so do it for real: seed
// two graph-survivable `task` nodes — a PARENT and a CHILD whose `data.from`
// points at the parent — reload so the persist store rehydrates, open the Inbox,
// and assert the child row renders the parent entity's lineage (a
// `[data-node-lineage="<parentId>"]` element carrying the parent's real title).
// Then reload AGAIN and assert it still resolves (the `from` link is durable).
// Seed types are `task` (graph-only, no central syncer) so the boot reconcile
// in startCoreSync() can't prune them — the same trap GLOBAL-SEARCH documents.
// Non-fatal like the guards above — a regression shows as ❌.
const LINEAGE_PARENT_TITLE = 'Chart the Xenobloom anomaly';
const lineageSeed = {
  state: {
    nodes: {
      'qa-lineage-parent': {
        id: 'qa-lineage-parent', type: 'task', title: LINEAGE_PARENT_TITLE,
        data: { done: false }, links: ['qa-lineage-child'],
        meta: { created: 1, updated: 2, app: 'goals' },
      },
      'qa-lineage-child': {
        id: 'qa-lineage-child', type: 'task', title: 'Do: follow up on the anomaly',
        data: { done: false, from: 'qa-lineage-parent' }, links: [],
        meta: { created: 1, updated: 3, app: 'goals' },
      },
    },
  },
  version: 0,
};
const readLineageEls = (page) => page.$$eval('[data-node-lineage]', els => els.map(e => e.getAttribute('data-node-lineage')));
const nodeLineage = { rendered: false, title: false, persisted: false, search: false, clickable: false, pass: false };
try {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app/inbox`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [GRAPH_KEY, JSON.stringify(lineageSeed)]);
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  const lineageEls = await readLineageEls(page);
  nodeLineage.rendered = lineageEls.includes('qa-lineage-parent');
  const body = await page.evaluate(() => document.body.innerText || '');
  nodeLineage.title = body.includes(LINEAGE_PARENT_TITLE);
  // Reload AGAIN — the `data.from` ancestry link lives in the persisted graph,
  // so the child must still resolve its parent entity after a fresh load.
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  nodeLineage.persisted = (await readLineageEls(page)).includes('qa-lineage-parent');
  // S2: the same durable ancestry must now surface on the SECOND node-rendering
  // view — Search. The graph already holds the seeded pair; open Search, query a
  // term matching the CHILD, and assert its result row renders the parent's
  // <NodeLineage> (`[data-node-lineage="qa-lineage-parent"]`). Proves the Search
  // mount reuses the same walker + surface as the Inbox row.
  await page.goto(`${BASE}/app/search`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  await page.fill('input[aria-label="Search across every app"]', 'anomaly');
  await page.waitForTimeout(600);
  nodeLineage.search = (await readLineageEls(page)).includes('qa-lineage-parent');
  // S3: node-lineage is NAVIGABLE — each ancestry hop is a real control that
  // climbs to the source entity (openEntity → open its owning app + set the
  // gaze). Assert the live Search DOM renders the parent hop as a focusable
  // `[role="button"]` whose accessible name targets the parent entity, then
  // click it to exercise the handler for real (must not throw). The actual
  // window/focus state change is unit-pinned in NodeLineage.test.tsx — on the
  // /app/search *route* AppShell renders by URL param, not windowStore, so the
  // in-app navigation isn't observable headless here; the click-path liveness +
  // correct wiring is what this axis carries.
  const hopSel = '[data-node-lineage="qa-lineage-parent"] [role="button"]';
  nodeLineage.clickable = await page.$$eval(
    hopSel,
    (els, title) => els.some(e => (e.getAttribute('aria-label') || '').includes(title)),
    LINEAGE_PARENT_TITLE,
  ).catch(() => false);
  if (nodeLineage.clickable) {
    // Fire the real handler — a throw here would surface as a page error.
    await page.click(hopSel, { timeout: 2000 }).catch(() => {});
  }
  nodeLineage.pass = nodeLineage.rendered && nodeLineage.title && nodeLineage.persisted && nodeLineage.search && nodeLineage.clickable;
  console.log(`NODE-LINEAGE  rendered=${nodeLineage.rendered} title=${nodeLineage.title} persisted=${nodeLineage.persisted} search=${nodeLineage.search} clickable=${nodeLineage.clickable}`);
  // Leave the graph clean for later guards.
  await page.evaluate((k) => localStorage.removeItem(k), GRAPH_KEY);
  await page.close();
} catch (e) {
  nodeLineage.err = e.message;
  console.warn(`NODE-LINEAGE: guard did not complete — ${e.message}`);
}
console.log(`NODE-LINEAGE: ${nodeLineage.pass ? '1/1 ✅' : '0/1 ⚠️'}`);

// ── INTENT-ROUNDTRIP guard (EPIC-12 S1: cross-app creation makes REAL entities) ─
// The core cross-app intents (make-note-from / add-to-learning) must produce a
// REAL, editable, reload-durable entity in its home app — not a phantom graph
// node. The bug they had: they called `g.addNode({type:'note'})` directly, adding
// a graph node with NO store row and NO `data.sourceId`. Because `note`/`learning`
// are CENTRALLY-mirrored types, `reconcile()` prunes any such node absent from its
// store — so the "created" entity never showed in Notes AND vanished on the next
// store mutation / reload. S1 routes make-note-from through the REAL store
// (`useStore.addNote`), so `useStore.subscribe(syncAll)` materializes an
// un-prunable, sourceId-keyed mirror synchronously. jsdom can't drive the
// intent→store→subscribe→reconcile→persist→reload roundtrip, so do it for real:
// seed a graph-survivable `task` source, drive its ⚡ NodeActions "Make Note from
// this" menu item on the Inbox (the same production surface a user clicks — and
// the exact menu the PROVENANCE guard drives), then assert (axes): `stored` = a
// real note with `from`=source id + copied content is in the `empire-store` `notes`
// array; `mirrored` = a `note` graph node owned by `app==='notes'` with
// `data.from`=source id exists; `persisted` = after a SECOND reload BOTH still hold
// (the store persists AND reconcile KEEPS the store-backed node — the exact
// regression the bug caused). Seed type is `task` (graph-only, survives the boot
// reconcile — the same trap GLOBAL-SEARCH / NODE-LINEAGE document). Non-fatal like
// the guards above — a regression shows as ❌. S2 adds the `add-to-learning` case
// (headline `INTENT-ROUNDTRIP 0/1 → 1/1` now; → 2/2 at S2).
const STORE_KEY = 'empire-store';
const INTENT_SRC_ID = 'qa-intent-src';
const INTENT_SRC_TITLE = 'Survey the Xenoglyph cache';
const INTENT_SRC_CONTENT = 'Field notes on the xenoglyph cache anomaly.';
const intentSeed = {
  state: {
    nodes: {
      [INTENT_SRC_ID]: {
        id: INTENT_SRC_ID, type: 'task', title: INTENT_SRC_TITLE,
        data: { done: false, content: INTENT_SRC_CONTENT }, links: [],
        meta: { created: 1000, updated: 1000, app: 'goals' },
      },
    },
  },
  version: 0,
};
// A real note in `empire-store` whose `from` = the source id, title `Note: <src>`,
// content copied from the source. Returns the matching note object (or null).
const readIntentNote = (page) => page.evaluate(([k, from]) => {
  try {
    const notes = JSON.parse(localStorage.getItem(k))?.state?.notes || [];
    return notes.find(n => n?.from === from) || null;
  } catch { return null; }
}, [STORE_KEY, INTENT_SRC_ID]);
// A `note` graph node owned by app==='notes' carrying data.from = the source id.
const hasIntentMirror = (page) => page.evaluate(([k, from]) => {
  try {
    const nodes = JSON.parse(localStorage.getItem(k))?.state?.nodes || {};
    return Object.values(nodes).some(n => n?.type === 'note' && n?.meta?.app === 'notes' && n?.data?.from === from);
  } catch { return false; }
}, [GRAPH_KEY, INTENT_SRC_ID]);
const intentRoundtrip = {
  note: { stored: false, mirrored: false, persisted: false, pass: false, err: undefined },
  learning: { stored: false, mirrored: false, persisted: false, pass: false, err: undefined },
};
try {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app/inbox`, { waitUntil: 'networkidle', timeout: 30000 });
  // Clean slate so a stale store/graph can't mask a regression, then seed the source.
  await page.evaluate(([gk, gv, sk]) => {
    localStorage.removeItem(sk);
    localStorage.setItem(gk, gv);
  }, [GRAPH_KEY, JSON.stringify(intentSeed), STORE_KEY]);
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(900);
  // Drive the REAL production surface: hover the seeded task row so its ⚡ menu is
  // interactive, open it, click "Make Note from this" (label from sync.ts).
  const row = page.locator('.gp', { hasText: INTENT_SRC_TITLE }).first();
  await row.hover().catch(() => {});
  await page.click('button[aria-label="Node actions"]', { timeout: 5000 });
  await page.waitForTimeout(300);
  await page.locator('button[role="menuitem"]', { hasText: 'Make Note from this' }).first().click({ timeout: 5000 });
  await page.waitForTimeout(700);
  const stored = await readIntentNote(page);
  intentRoundtrip.note.stored = !!stored && stored.title === `Note: ${INTENT_SRC_TITLE}` && stored.content === INTENT_SRC_CONTENT;
  intentRoundtrip.note.mirrored = await hasIntentMirror(page);
  // Reload — the note must survive: the store persists it AND the boot reconcile now
  // KEEPS the store-backed mirror (sourceId present) instead of pruning it.
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(900);
  const storedAfter = await readIntentNote(page);
  intentRoundtrip.note.persisted = !!storedAfter && (await hasIntentMirror(page));
  intentRoundtrip.note.pass = intentRoundtrip.note.stored && intentRoundtrip.note.mirrored && intentRoundtrip.note.persisted;
  console.log(`INTENT-ROUNDTRIP  make-note-from  stored=${intentRoundtrip.note.stored} mirrored=${intentRoundtrip.note.mirrored} persisted=${intentRoundtrip.note.persisted}`);
  // Leave storage clean for later guards.
  await page.evaluate(([gk, sk]) => { localStorage.removeItem(gk); localStorage.removeItem(sk); }, [GRAPH_KEY, STORE_KEY]);
  await page.close();
} catch (e) {
  intentRoundtrip.note.err = e.message;
  console.warn(`INTENT-ROUNDTRIP (note): guard did not complete — ${e.message}`);
}
// ── learning axis (EPIC-12 S2: add-to-learning writes a REAL Learning item) ──
// `add-to-learning` accepts note/message, so seed a REAL note directly in
// empire-store: a real note both SURVIVES the boot reconcile (sourceId-keyed) AND
// is a valid source (a seeded PHANTOM note would be pruned before it could act).
// Reload → startCoreSync mirrors the note → drive its ⚡ NodeActions "Add to
// Learning" menu on /app/notes (the real production surface a user clicks), then
// assert: `stored` = a real learningItems entry in empire-store with topic=src
// title and `from`=the NOTE MIRROR's graph-node id (the intent acts on the graph
// node NodeActions resolves by sourceId, so `from`=n.id — the mirror's own id,
// NOT the store note id, which reconcile keeps only in data.sourceId); `mirrored`
// = a `learning` graph node owned by `app==='learning-tracker'` with that same
// `data.from`; `persisted` = after a SECOND reload BOTH still hold (the store
// persists AND reconcile KEEPS the store-backed mirror — the phantom-bug regression).
const LEARN_SRC_ID = 'qa-learn-src';
const LEARN_SRC_TITLE = 'Decode the resonance lattice';
const LEARN_SRC_CONTENT = 'Field notes on the resonance lattice harmonics.';
const learnStoreSeed = {
  state: {
    notes: [{ id: LEARN_SRC_ID, title: LEARN_SRC_TITLE, content: LEARN_SRC_CONTENT, tags: [], updatedAt: 1000 }],
    learningItems: [], messages: [], events: [],
  },
  version: 0,
};
// The graph-node id of the note MIRROR (NOT the store note id): reconcile() gives
// the mirror a fresh node id and keeps the store id only in data.sourceId. The ⚡
// menu (NodeActions resolves by sourceId) hands the intent this GRAPH NODE, so
// `add-to-learning` writes `from = n.id` = this mirror id — never the store id.
// The guard must therefore match `from` against THIS, not LEARN_SRC_ID.
const readNoteMirrorId = (page) => page.evaluate(([k, sid]) => {
  try {
    const nodes = JSON.parse(localStorage.getItem(k))?.state?.nodes || {};
    const n = Object.values(nodes).find(x => x?.type === 'note' && String(x?.data?.sourceId) === sid);
    return n ? n.id : null;
  } catch { return null; }
}, [GRAPH_KEY, LEARN_SRC_ID]);
// A real learningItems entry in empire-store whose `from` = the note mirror id.
const readLearnItem = (page, fromId) => page.evaluate(([k, from]) => {
  try {
    const items = JSON.parse(localStorage.getItem(k))?.state?.learningItems || [];
    return items.find(i => i?.from === from) || null;
  } catch { return null; }
}, [STORE_KEY, fromId]);
// A `learning` graph node owned by app==='learning-tracker' carrying data.from = note mirror id.
const hasLearnMirror = (page, fromId) => page.evaluate(([k, from]) => {
  try {
    const nodes = JSON.parse(localStorage.getItem(k))?.state?.nodes || {};
    return Object.values(nodes).some(n => n?.type === 'learning' && n?.meta?.app === 'learning-tracker' && n?.data?.from === from);
  } catch { return false; }
}, [GRAPH_KEY, fromId]);
try {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app/notes`, { waitUntil: 'networkidle', timeout: 30000 });
  // Clean slate, seed a real note in empire-store, reload so startCoreSync mirrors it.
  await page.evaluate(([gk, sk, sv]) => {
    localStorage.removeItem(gk);
    localStorage.setItem(sk, sv);
  }, [GRAPH_KEY, STORE_KEY, JSON.stringify(learnStoreSeed)]);
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(900);
  // Drive the REAL production surface: hover the note card, open its ⚡ menu, click
  // "Add to Learning" (label from sync.ts). Scope the ⚡ button to the card.
  const card = page.locator('.gp', { hasText: LEARN_SRC_TITLE }).first();
  await card.hover().catch(() => {});
  await card.locator('button[aria-label="Node actions"]').first().click({ timeout: 5000 });
  await page.waitForTimeout(300);
  await page.locator('button[role="menuitem"]', { hasText: 'Add to Learning' }).first().click({ timeout: 5000 });
  await page.waitForTimeout(700);
  // Resolve the note mirror's graph-node id — the lineage anchor the intent wrote
  // `from` to. It is frozen into the learning item + its mirror, so it stays valid
  // across the reload (even though reconcile re-mints the note mirror's own id).
  const noteMirrorId = await readNoteMirrorId(page);
  const li = await readLearnItem(page, noteMirrorId);
  intentRoundtrip.learning.stored = !!noteMirrorId && !!li && li.topic === LEARN_SRC_TITLE && li.from === noteMirrorId;
  intentRoundtrip.learning.mirrored = !!noteMirrorId && (await hasLearnMirror(page, noteMirrorId));
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(900);
  const liAfter = await readLearnItem(page, noteMirrorId);
  intentRoundtrip.learning.persisted = !!noteMirrorId && !!liAfter && (await hasLearnMirror(page, noteMirrorId));
  intentRoundtrip.learning.pass = intentRoundtrip.learning.stored && intentRoundtrip.learning.mirrored && intentRoundtrip.learning.persisted;
  console.log(`INTENT-ROUNDTRIP  add-to-learning  stored=${intentRoundtrip.learning.stored} mirrored=${intentRoundtrip.learning.mirrored} persisted=${intentRoundtrip.learning.persisted}`);
  await page.evaluate(([gk, sk]) => { localStorage.removeItem(gk); localStorage.removeItem(sk); }, [GRAPH_KEY, STORE_KEY]);
  await page.close();
} catch (e) {
  intentRoundtrip.learning.err = e.message;
  console.warn(`INTENT-ROUNDTRIP (learning): guard did not complete — ${e.message}`);
}
const intentPass = (intentRoundtrip.note.pass ? 1 : 0) + (intentRoundtrip.learning.pass ? 1 : 0);
const intentTotal = 2;
console.log(`INTENT-ROUNDTRIP: ${intentPass}/${intentTotal} ${intentPass === intentTotal ? '✅' : '⚠️'}`);

// ── TIMELINE guard (EPIC-10 S1: the organism gets a TEMPORAL lens) ───────────
// The Empire has three lenses over its one Core graph — Network (STRUCTURAL),
// Search (QUERY), Inbox (TASK) — but until now no TEMPORAL lens, even though
// every `CoreNode` stamps `meta.created` and every `ProvEdge` stamps `at`. The
// new Timeline app merges every entity-birth + every app→app handoff into one
// newest-first, day-grouped stream via the pure `buildTimeline`/`groupByDay`
// spine (lib/core/timeline.ts, unit-pinned in timeline.test.ts). jsdom can't
// drive the graph+ledger→persist→rehydrate→ordered-render roundtrip, so do it
// for real: seed `empire-core-graph` with two graph-survivable `task` nodes
// (distinct `meta.created`, owned by TWO apps) + `empire-provenance` with one
// edge, reload so both persist stores rehydrate, open /app/timeline, and assert
// (axes): `ordered` = the two entity rows appear newest-`created` first;
// `grouped` = at least one `[data-timeline-day]` header renders; `flow` = the
// seeded edge renders as a `[data-timeline-kind=flow]` row; `persisted` = all of
// it still holds after a SECOND reload. Seed types are `task` (graph-only, no
// central syncer) so the boot reconcile in startCoreSync() can't prune them —
// the same trap GLOBAL-SEARCH / NODE-LINEAGE document. Non-fatal like the guards
// above — a regression shows as ❌.
const TL_NEWER_TITLE = 'Xenobeacon calibrated';   // newer meta.created → leads
const TL_OLDER_TITLE = 'Anomaly first sighted';   // older meta.created → trails
const timelineGraphSeed = {
  state: {
    nodes: {
      'qa-tl-older': {
        id: 'qa-tl-older', type: 'task', title: TL_OLDER_TITLE,
        data: { done: false }, links: [],
        meta: { created: 1000, updated: 1000, app: 'notes' },
      },
      'qa-tl-newer': {
        id: 'qa-tl-newer', type: 'task', title: TL_NEWER_TITLE,
        // `data.from` links the newer entity to the older one (EPIC-10 S3): the
        // older moment now SPAWNED this one, so its row surfaces <NodeDescendants>.
        data: { done: false, from: 'qa-tl-older' }, links: [],
        meta: { created: 5000, updated: 5000, app: 'goals' },
      },
    },
  },
  version: 0,
};
const timelineProvSeed = {
  state: { edges: [{ fromApp: 'notes', toApp: 'goals', label: 'seed handoff', at: 3000 }] },
  version: 0,
};
// Read the ordered entity titles in DOM order (newest-first if the sort holds).
// Scope to the dedicated title element — an entity row's <NodeLineage>/<NodeDescendants>
// trails embed OTHER entities' titles, so reading the whole row's innerText would
// cross-contaminate the ordered/filtered checks once S3's lineage links the seeds.
const readTimelineTitles = (page) =>
  page.$$eval('[data-timeline-kind="entity"] [data-timeline-title]', els => els.map(e => (e.innerText || '').trim()));
const timeline = { ordered: false, grouped: false, flow: false, persisted: false, filtered: false, descendants: false, pass: false };
try {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app/timeline`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(([gk, gv, pk, pv]) => {
    localStorage.setItem(gk, gv);
    localStorage.setItem(pk, pv);
  }, [GRAPH_KEY, JSON.stringify(timelineGraphSeed), 'empire-provenance', JSON.stringify(timelineProvSeed)]);
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  const titles = await readTimelineTitles(page);
  const iNewer = titles.findIndex(t => t.includes(TL_NEWER_TITLE));
  const iOlder = titles.findIndex(t => t.includes(TL_OLDER_TITLE));
  timeline.ordered = iNewer !== -1 && iOlder !== -1 && iNewer < iOlder;
  const dayEls = await page.$$eval('[data-timeline-day]', els => els.length);
  timeline.grouped = dayEls >= 1;
  const flowEls = await page.$$eval('[data-timeline-kind="flow"]', els => els.length);
  timeline.flow = flowEls >= 1;
  // Reload AGAIN — both the graph and the ledger are persisted, so the whole
  // stream must survive a fresh load (rehydrated from localStorage).
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  const titles2 = await readTimelineTitles(page);
  const iN2 = titles2.findIndex(t => t.includes(TL_NEWER_TITLE));
  const iO2 = titles2.findIndex(t => t.includes(TL_OLDER_TITLE));
  const flow2 = await page.$$eval('[data-timeline-kind="flow"]', els => els.length);
  timeline.persisted = iN2 !== -1 && iO2 !== -1 && iN2 < iO2 && flow2 >= 1;
  // `descendants` (EPIC-10 S3): the older seed SPAWNED the newer one (newer's
  // `data.from` = 'qa-tl-older'), so the older entity's row must surface a
  // <NodeDescendants> ([data-node-descendants=qa-tl-older]) naming the newer
  // child — the timeline now reads a moment BOTH ways (← ancestry, → spawned).
  // Read on the unfiltered stream (both entities visible), before the filter click.
  try {
    const descNaming = await page.$$eval(
      '[data-node-descendants="qa-tl-older"]',
      (els, child) => els.some(e => (e.innerText || '').includes(child)),
      TL_NEWER_TITLE,
    );
    timeline.descendants = descNaming;
  } catch (de) {
    timeline.descendantsErr = de.message;
  }
  // `filtered` (EPIC-10 S2): click the "goals" App chip — the seed's newer entity
  // is goals-owned, the older is notes-owned, and the notes→goals flow is
  // notes-owned (fromApp). So narrowing to `app:goals` must keep ONLY the newer
  // entity and drop both the older entity and the flow row. Facets derive from the
  // unfiltered stream, so widening back is always available.
  try {
    await page.click('[data-timeline-facet="app:goals"]', { timeout: 5000 });
    await page.waitForTimeout(300);
    const fTitles = await readTimelineTitles(page);
    const hasNewer = fTitles.some(t => t.includes(TL_NEWER_TITLE));
    const hasOlder = fTitles.some(t => t.includes(TL_OLDER_TITLE));
    const fFlows = await page.$$eval('[data-timeline-kind="flow"]', els => els.length);
    timeline.filtered = hasNewer && !hasOlder && fFlows === 0;
  } catch (fe) {
    timeline.filterErr = fe.message;
  }
  timeline.pass = timeline.ordered && timeline.grouped && timeline.flow && timeline.persisted && timeline.filtered && timeline.descendants;
  console.log(`TIMELINE  ordered=${timeline.ordered} grouped=${timeline.grouped} flow=${timeline.flow} persisted=${timeline.persisted} filtered=${timeline.filtered} descendants=${timeline.descendants}`);
  // Leave both stores clean for later guards.
  await page.evaluate(([gk, pk]) => { localStorage.removeItem(gk); localStorage.removeItem(pk); }, [GRAPH_KEY, 'empire-provenance']);
  await page.close();
} catch (e) {
  timeline.err = e.message;
  console.warn(`TIMELINE: guard did not complete — ${e.message}`);
}
console.log(`TIMELINE: ${timeline.pass ? '1/1 ✅' : '0/1 ⚠️'}`);


// ── HOME-ALIVE guard (The Bridge — the home screen is living telemetry) ──
// The launcher used to be a mute grid; The Bridge renders the organism's real
// state at home: Today (calendar events), Open Tasks, Goals, Organism stats,
// a jump-back-in strip (exact-landing via openEntity) and a direct Cakra ask
// line. The pure selectors are unit-pinned in `bridge.test.ts`; this carries
// the graph→persist→reload→rendered-home roundtrip jsdom cannot. Seed types
// follow the GLOBAL-SEARCH rule: graph-survivable only (`event` is
// self-mirrored by Calendar, `task` is graph-only, `book` is Reader-owned —
// none is pruned by the boot reconcile while their apps stay unmounted).
// Non-fatal like the guards above — a regression shows as ❌.
const homeAlive = { today: false, tasks: false, recent: false, land: false, ask: false, pass: false };
try {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
  const todayStamp = await page.evaluate(() => {
    const d = new Date(); const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  });
  const seedNow = Date.now();
  const homeSeed = { state: { nodes: {
    'qa-home-event': {
      id: 'qa-home-event', type: 'event', title: 'Bridge probe sync',
      data: { date: todayStamp, time: '09:30', description: '' }, links: [],
      meta: { created: seedNow - 3000, updated: seedNow - 3000, app: 'calendar' },
    },
    'qa-home-task': {
      id: 'qa-home-task', type: 'task', title: 'Do: Verify the bridge lives',
      data: { done: false }, links: [],
      meta: { created: seedNow - 2000, updated: seedNow - 2000, app: 'goals' },
    },
    'qa-home-book': {
      id: 'qa-home-book', type: 'book', title: 'Bridgeprobe Chronicle',
      data: { format: 'txt' }, links: [],
      meta: { created: seedNow - 1000, updated: seedNow, app: 'reader' },
    },
  } }, version: 0 };
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [GRAPH_KEY, JSON.stringify(homeSeed)]);
  // Reload home so the zustand+persist graph rehydrates and The Bridge reads it.
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(700);
  const widgetText = (sel) => page.$eval(sel, (el) => el.innerText || '').catch(() => '');
  const todayTxt = await widgetText('[data-widget="today"]');
  homeAlive.today = todayTxt.includes('1') && todayTxt.includes('Bridge probe sync');
  const tasksTxt = await widgetText('[data-widget="tasks"]');
  homeAlive.tasks = tasksTxt.includes('1') && tasksTxt.includes('Verify the bridge lives');
  // Jump-back-in strip: all three seeds are content nodes → three rows, the
  // freshest (the book) first.
  const recents = await page.$$eval('[data-bridge-recent]', (els) => els.map((e) => e.innerText || ''));
  homeAlive.recent = recents.length === 3 && recents[0].includes('Bridgeprobe Chronicle');
  // Exact-landing rail: clicking the book row must open Reader (openEntity).
  await page.click('[data-bridge-recent="qa-home-book"]');
  await page.waitForTimeout(700);
  const topbar = await page.$eval('.empire-topbar-title', (el) => el.textContent || '').catch(() => '');
  homeAlive.land = topbar.includes('Reader');
  // The Cakra line: ask from home → Cakra opens with the question prefilled
  // (same `empire-ai-clipboard` rail every app's "Ask Cakra" uses).
  await page.click('button[aria-label="Home"]');
  await page.waitForTimeout(400);
  await page.fill('.bridge-ask input', 'Bridge probe question');
  await page.press('.bridge-ask input', 'Enter');
  await page.waitForTimeout(900);
  const cakraBar = await page.$eval('.empire-topbar-title', (el) => el.textContent || '').catch(() => '');
  const prefilled = await page.evaluate(() =>
    Array.from(document.querySelectorAll('textarea, input')).some((el) => (el.value || '').includes('Bridge probe question')));
  homeAlive.ask = cakraBar.includes('Cakra') && prefilled;
  homeAlive.pass = homeAlive.today && homeAlive.tasks && homeAlive.recent && homeAlive.land && homeAlive.ask;
  console.log(`HOME-ALIVE  today=${homeAlive.today} tasks=${homeAlive.tasks} recent=${homeAlive.recent} land=${homeAlive.land} ask=${homeAlive.ask}`);
  // Leave the graph clean for later guards.
  await page.evaluate((k) => localStorage.removeItem(k), GRAPH_KEY);
  await page.close();
} catch (e) {
  homeAlive.err = e.message;
  console.warn(`HOME-ALIVE: guard did not complete — ${e.message}`);
}
console.log(`HOME-ALIVE: ${homeAlive.pass ? '1/1 ✅' : '0/1 ⚠️'}`);

// ── PROVENANCE-PERSISTS guard (EPIC-6 target metric: durable app→app memory) ──
// EPIC-6 S1 laid the spine: `src/lib/core/provenance.ts` — a Zustand+persist
// store (`empire-provenance`) fed ONLY by `flowForEvent`, wired via
// `startProvenanceTracking()` at main.tsx. The whole epic's claim is that the
// organism STOPS fire-and-forgetting: a real handoff is remembered across a
// reload. jsdom's unit tests (`provenance.test.ts`) pin the pure fold/filter
// logic but cannot exercise the real tracker → persist → rehydrate roundtrip
// (no real localStorage reload). Do it for real here: fire genuine app→app
// handoffs from the Editor's ⚡ Send menu (each executor emits the honest event
// that `flowForEvent` turns into an edge), then reload and assert every edge
// survived in the durable ledger. This is the runtime realization of the epic's
// "seed handoff → reload → durable source still shows" acceptance (the S2
// Network memory panel will make it *visible*; the durable store is the spine).
// Non-fatal (recorded, not thrown) like INBOUND/MEDIA so a flaky browser can't
// red the whole render run — a real regression shows as ❌ for the build routine.
const PROV_KEY = 'empire-provenance';
const readProvEdges = (page) => page.evaluate((k) => {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return [];
    return JSON.parse(raw)?.state?.edges || [];
  } catch { return []; }
}, PROV_KEY);
const hasProvEdge = (edges, from, to) => edges.some(e => e.fromApp === from && e.toApp === to);
// Fire one REAL handoff from the Editor: fill the code textarea (enables the
// Send menu), open it, click the target action. `nav` = executor navigates away
// (window.open('_self')) — the HANDOFF is emitted + persisted BEFORE the nav, so
// the ensuing full page load itself proves the edge survived a reload.
async function fireEditorHandoff(page, actionLabel, nav) {
  await page.goto(`${BASE}/app/editor`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(600);
  await page.fill('textarea', 'QA provenance probe — durable edge seed');
  await page.click('button[aria-label="Send code to…"]');
  await page.waitForTimeout(300);
  const item = page.locator('button[role="menuitem"]', { hasText: actionLabel });
  if (nav) {
    await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), item.click()]);
  } else {
    await item.click();
  }
  await page.waitForTimeout(600);
}
// Each case pairs the Send-menu label (appActions.ts) with the honest edge it
// produces via flowForEvent: NOTE_CREATED(from-editor)→notes (in-place) and two
// HANDOFF arcs (navigating). Distinct targets so the 3 edges can't collapse.
const provCases = [
  { label: 'Send to Notes', from: 'editor', to: 'notes', nav: false },
  { label: 'Ask Cakra', from: 'editor', to: 'ai-chat', nav: true },
  { label: 'Use as Prompt', from: 'editor', to: 'prompt-generator', nav: true },
];
const provResults = [];
try {
  const page = await ctx.newPage();
  // Clean slate so a stale ledger from a prior probe can't mask a regression.
  await page.goto(`${BASE}/app/editor`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate((k) => localStorage.removeItem(k), PROV_KEY);
  for (const c of provCases) {
    let recorded = false;
    try {
      await fireEditorHandoff(page, c.label, c.nav);
      recorded = hasProvEdge(await readProvEdges(page), c.from, c.to);
    } catch (e) { c.err = e.message; }
    provResults.push({ ...c, recorded });
    console.log(`PROVENANCE  ${c.from}→${c.to}  recorded=${recorded}${c.err ? ' ERR ' + c.err.slice(0, 60) : ''}`);
  }
  // Full reload from a different route — the durable ledger must rehydrate.
  await page.goto(`${BASE}/app/network`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  const persistedEdges = await readProvEdges(page);
  for (const r of provResults) {
    r.persisted = hasProvEdge(persistedEdges, r.from, r.to);
    r.pass = r.recorded && r.persisted;
    console.log(`PROVENANCE-PERSIST  ${r.from}→${r.to}  ${r.persisted ? '✅' : '❌'}`);
  }
  await page.close();
} catch (e) {
  console.warn(`PROVENANCE-PERSISTS: guard did not complete — ${e.message}`);
}
const provPass = provResults.filter(r => r.pass).length;
console.log(`PROVENANCE-PERSISTS: ${provPass}/${provCases.length} ${provPass === provCases.length ? '✅' : '⚠️'}`);

// ── PROVENANCE-ENTITY guard (EPIC-6 S3: the per-entity source survives reload) ─
// The PROVENANCE-PERSISTS guard above proves the *edge* ledger roundtrips. S3 is
// a distinct assertion: a created event/goal/draft must itself remember WHERE it
// came from after a reload (the sessionStorage chip is consumed on mount, so the
// durable source now lives on the persisted entity + renders as a <LineageTrail>,
// `role="note"` aria-label `From <source>`). Reconciled with the edge guard on
// purpose — different metric name, no clobber. Flow per case: seed the inbound
// clipboard → reload so the receiver consumes it + prefills → trigger the app's
// OWN create/send → reload AGAIN (chip now gone) → assert the durable trail shows
// the source. Non-fatal (recorded, not thrown) like the guards above.
const entityCases = [
  { id: 'goals', key: 'empire-goals-clipboard', from: 'calculator', srcName: 'Calculator',
    payload: { text: 'Budget target 294', title: 'Budget target 294', from: 'calculator' },
    save: async (page) => { await page.click('button:has-text("Add Goal")'); } },
  { id: 'messages', key: 'empire-messages-clipboard', from: 'editor', srcName: 'Code Editor',
    payload: { text: 'Ship the S3 lineage trail', from: 'editor' },
    save: async (page) => { await page.locator('textarea').first().press('Enter'); } },
  { id: 'calendar', key: 'empire-calendar-clipboard', from: 'notes', srcName: 'Notes',
    payload: { text: 'Review the roadmap', title: 'Review the roadmap', from: 'notes' },
    save: async (page) => { await page.click('button:has-text("Create")'); } },
];
const entityResults = [];
for (const c of entityCases) {
  const page = await ctx.newPage();
  let created = false, persisted = false, err;
  try {
    await page.goto(`${BASE}/app/${c.id}`, { waitUntil: 'networkidle', timeout: 30000 });
    // Seed the inbound payload, reload so the receiver consumes it (prefill +
    // remember the durable source on the draft).
    await page.evaluate(([k, v]) => sessionStorage.setItem(k, JSON.stringify(v)), [c.key, c.payload]);
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);
    // Trigger the app's own create/send so the entity is saved with `from`.
    await c.save(page);
    await page.waitForTimeout(800);
    created = (await page.locator(`[role="note"][aria-label*="${c.srcName}"]`).count()) > 0;
    // Reload — the sessionStorage chip is gone; only the persisted entity's
    // durable `from` can render the trail now.
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);
    persisted = (await page.locator(`[role="note"][aria-label*="${c.srcName}"]`).count()) > 0;
  } catch (e) { err = e.message; }
  entityResults.push({ id: c.id, from: c.from, created, persisted, pass: created && persisted, err });
  console.log(`PROV-ENTITY  ${c.from}→${c.id}  created=${created} persisted=${persisted}${err ? ' ERR ' + err.slice(0, 60) : ''}`);
  await page.close();
}
const entityPass = entityResults.filter(r => r.pass).length;
console.log(`PROVENANCE-ENTITY: ${entityPass}/${entityCases.length} ${entityPass === entityCases.length ? '✅' : '⚠️'}`);

await browser.close();

// ── OFFLINE-BOOT guard (EPIC-4 S1) ──────────────────────────────────────────
// Cold-offline boot + SW precache audit: serves dist/, warm-loads so the SW
// precaches, blocks ALL network (setOffline), then asserts the shell + lazy app
// routes still render from precache, and enumerates any chunk NOT precached.
// Self-contained (own static server + browser, own port). Non-fatal here so a
// flaky launch can't red the render run — a real regression shows as ❌.
let offline = null;
try {
  const r = spawnSync('node', ['scripts/qa-offline.mjs'], { encoding: 'utf8', timeout: 200000 });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  offline = JSON.parse(fs.readFileSync('/tmp/qa-offline.json', 'utf8'));
} catch (e) {
  console.warn(`OFFLINE-BOOT: guard did not complete — ${e.message}`);
}

// Build report
const now = new Date().toISOString();
const pass = results.filter(r => r.pass).length;
const fail = results.length - pass;
let md = `# Empire QA — Visual + Smoke Report\n\n`;
md += `**Generated:** ${now}\n\n`;
md += `**Result:** ${pass}/${results.length} rendered without crash, ${fail} failed.\n\n`;
md += `> **PASS** = the app rendered with no uncaught JS exception / error boundary / blank screen.\n`;
md += `> Network & console noise (failed external CDN fetches, backend API calls needing auth) is\n`;
md += `> listed separately — expected in the offline cloud sandbox and **not** a render failure.\n\n`;
md += `| App | Render | Uncaught JS / crash | Network / console notes |\n|---|---|---|---|\n`;
const cell = (a) => a.length ? a.map(e => e.replace(/\|/g, '\\|').slice(0, 160)).join('<br>') : '—';
for (const r of results) {
  md += `| ${r.name} | ${r.pass ? '✅' : '❌ FAIL'} | ${cell(r.uncaught)} | ${cell([...r.netFails, ...r.consoleErrors.filter(c => !/Failed to load resource/.test(c))])} |\n`;
}
md += `\n## Inbound-lands guard (organism emit↔receive loop)\n\n`;
md += `Each entity receiver was seeded with a cross-app payload + reloaded; PASS = a "Received from <source>" chip rendered AND a control was prefilled.\n\n`;
md += `| Receiver | From | Chip | Prefilled | Result |\n|---|---|---|---|---|\n`;
for (const r of inboundResults) {
  md += `| ${r.id} | ${r.from} | ${r.chip ? '✅' : '❌'} | ${r.prefilled ? '✅' : '❌'} | ${r.pass ? '✅' : '❌'}${r.err ? ' (' + r.err.slice(0, 80) + ')' : ''} |\n`;
}
md += `\n## Media-persists guard (EPIC-3 S2/S3 — IndexedDB blob roundtrip)\n\n`;
md += `Each media app's real file \`<input>\` was driven with a small blob, then the page was reloaded; PASS = the item appeared after add AND survived the reload (rehydrated from IndexedDB, not dropped as a ghost). This exercises the S2 acceptance that jsdom cannot (no IndexedDB).\n\n`;
md += `| App | Added | Survived reload | Result |\n|---|---|---|---|\n`;
for (const r of mediaResults) {
  md += `| ${r.id} | ${r.added ? '✅' : '❌'} | ${r.survived ? '✅' : '❌'} | ${r.pass ? '✅' : '❌'}${r.err ? ' (' + r.err.slice(0, 80) + ')' : ''} |\n`;
}
md += `\n## Graph-legible guard (EPIC-6 S4 + EPIC-13 S1/S3 — collection-owning apps join the organism)\n\n`;
md += `Each collection-owning app must mirror its real entities into the Core graph (\`empire-core-graph\`) so they are legible in The Network / Search / Timeline. **reader/book** (EPIC-6 S4): Reader's real file \`<input>\` was driven with a small \`.txt\` book; PASS = a \`book\` node owned by \`app==='reader'\` appeared AND survived a reload. **crypto/wallet** (EPIC-13 S1): the \`crypto-watch-list\` was seeded with a BTC address before Crypto mounted; PASS = a \`wallet\` node owned by \`app==='crypto'\` appeared AND survived a reload (the re-mounted app re-mirrors its watch-list). **mail/draft** (EPIC-13 S3): \`empire-mail-drafts\` was seeded with one draft before Mail mounted; PASS = a \`draft\` node owned by \`app==='mail'\` appeared AND survived a reload. Mail + Crypto were the last two raw-HTML islands — S1/S2/S3 make both first-class citizens (graph-legible + emit; Mail also receives handoffs).\n\n`;
md += `| Collection | Node created | Survived reload | Result |\n|---|---|---|---|\n`;
md += `| reader/book | ${graphLegible.node ? '✅' : '❌'} | ${graphLegible.persisted ? '✅' : '❌'} | ${graphLegible.pass ? '✅' : '❌'}${graphLegible.err ? ' (' + graphLegible.err.slice(0, 80) + ')' : ''} |\n`;
md += `| crypto/wallet | ${cryptoLegible.node ? '✅' : '❌'} | ${cryptoLegible.persisted ? '✅' : '❌'} | ${cryptoLegible.pass ? '✅' : '❌'}${cryptoLegible.err ? ' (' + cryptoLegible.err.slice(0, 80) + ')' : ''} |\n`;
md += `| mail/draft | ${draftLegible.node ? '✅' : '❌'} | ${draftLegible.persisted ? '✅' : '❌'} | ${draftLegible.pass ? '✅' : '❌'}${draftLegible.err ? ' (' + draftLegible.err.slice(0, 80) + ')' : ''} |\n`;
md += `\n**GRAPH-LEGIBLE: ${graphLegiblePassed}/3 ${graphLegiblePassed === 3 ? '✅' : '⚠️'}**\n`;
md += `\n## Global-search guard (EPIC-8 S1 + S2 — the organism becomes queryable)\n\n`;
md += `The Core graph was seeded with entities sharing a rare term across TWO apps (a \`book\` in Reader, a \`task\` in Goals); after a reload (persist rehydrate) the term was typed into the Search field. PASS = BOTH entities surface, grouped under their own app sections — one lens querying every app's real entities at once. **S2 adds a tag-only match:** a third node carries the term \`${TAG_TERM}\` ONLY in \`data.tags\` (a string array) — it surfaces iff \`nodeBodyText\` now flattens array elements (the S2 corpus gap). The pure ranking spine (\`searchNodes\`) is unit-pinned in \`search.test.ts\`; this carries the graph→input→grouped-render roundtrip jsdom cannot.\n\n`;
md += `| Query | Book hit | Task hit | Spans 2 apps | Tag-only hit | Result |\n|---|---|---|---|---|---|\n`;
md += `| ${SEARCH_TERM} / ${TAG_TERM} | ${globalSearch.book ? '✅' : '❌'} | ${globalSearch.task ? '✅' : '❌'} | ${globalSearch.twoApps ? '✅' : '❌'} | ${globalSearch.tagOnly ? '✅' : '❌'} | ${globalSearch.pass ? '✅' : '❌'}${globalSearch.err ? ' (' + globalSearch.err.slice(0, 80) + ')' : ''} |\n`;
md += `\n**GLOBAL-SEARCH: ${globalSearch.pass ? '1/1 ✅' : '0/1 ⚠️'}**\n`;
md += `\n## Node-lineage guard (node-level lineage — per-artifact ancestry is legible)\n\n`;
md += `App-level provenance remembers which app fed which app; node-level lineage answers which ENTITY an exact artifact descended from. The core intents stamp \`data.from = sourceNode.id\` on every node they create, so the graph already holds a durable per-artifact ancestry edge. Two graph-survivable \`task\` nodes were seeded — a parent and a child whose \`data.from\` points at it — then reloaded so the persist store rehydrated; PASS = the Inbox child row renders a \`<NodeLineage>\` (\`[data-node-lineage]\`) carrying the parent entity's real title, AND it still resolves after a second reload (the \`from\` link is durable). **S2 extends the surface:** the same seeded ancestry must ALSO render on the Search result row (query "anomaly" → the child hit shows \`[data-node-lineage=qa-lineage-parent]\`), proving \`<NodeLineage>\` is now legible on every node-rendering view, not just the Inbox — the same drop-in surface also mounts on The Network inspector's per-entity list (visual/on-device). The pure walker \`nodeLineageOf\` is unit-pinned in \`nodeLineage.test.ts\`; this carries the graph→persist→rehydrate→render roundtrip jsdom cannot.\n\n`;
md += ` **S3 makes it NAVIGABLE:** each ancestry hop is a real \`[role="button"]\` that climbs to the source entity (\`openEntity\` → open its owning app + set the gaze); the guard asserts the parent hop renders as a focusable control whose accessible name targets the parent entity, then clicks it (the window/focus change is unit-pinned in \`NodeLineage.test.tsx\` — on the /app/search route AppShell renders by URL, so in-app navigation isn't observable headless).\n\n`;
md += `| Artifact | Lineage rendered | Parent title shown | Survived reload | Search surface | Hop clickable | Result |\n|---|---|---|---|---|---|---|\n`;
md += `| task ← ${LINEAGE_PARENT_TITLE} | ${nodeLineage.rendered ? '✅' : '❌'} | ${nodeLineage.title ? '✅' : '❌'} | ${nodeLineage.persisted ? '✅' : '❌'} | ${nodeLineage.search ? '✅' : '❌'} | ${nodeLineage.clickable ? '✅' : '❌'} | ${nodeLineage.pass ? '✅' : '❌'}${nodeLineage.err ? ' (' + nodeLineage.err.slice(0, 80) + ')' : ''} |\n`;
md += `\n**NODE-LINEAGE: ${nodeLineage.pass ? '1/1 ✅' : '0/1 ⚠️'}**\n`;
md += `\n## Intent-roundtrip guard (EPIC-12 S1–S2 — cross-app creation makes REAL, durable entities)\n\n`;
md += `The core cross-app intents must produce a REAL, editable, reload-durable entity in its home app — not a phantom graph node. Before EPIC-12, \`make-note-from\` / \`add-to-learning\` called \`g.addNode({type:'note'|'learning'})\` directly: a graph node with NO store row and NO \`data.sourceId\`, which \`reconcile()\` PRUNES (\`note\`/\`learning\` are centrally-mirrored types) — so the "created" entity never showed in its app and vanished on the next store mutation / reload. Each stage routes its intent through the REAL store (\`useStore.addNote\` / \`addLearningItem\`); the synchronous \`useStore.subscribe(syncAll)\` then materializes an un-prunable, \`sourceId\`-keyed mirror. **S1 (note):** a graph-survivable \`task\` source is seeded, its ⚡ \`<NodeActions>\` "Make Note from this" menu is driven on the Inbox; PASS = a real note with \`from\`=source id + copied content in \`empire-store\` (\`stored\`), a \`note\` node owned by \`app==='notes'\` with \`data.from\` (\`mirrored\`), both surviving a second reload (\`persisted\`). **S2 (learning):** a REAL note is seeded in \`empire-store\` (a valid \`add-to-learning\` source that itself survives the reconcile), its ⚡ "Add to Learning" menu is driven on /app/notes; PASS = a real \`learningItems\` entry with \`from\`=source id + topic=source title (\`stored\`), a \`learning\` node owned by \`app==='learning-tracker'\` with \`data.from\` (\`mirrored\`), both surviving a second reload (\`persisted\`). The pure store-writes are unit-pinned in \`sync.test.ts\`; this carries the intent→store→subscribe→reconcile→persist→reload roundtrip jsdom cannot.\n\n`;
md += `| Intent | Real store entry | Mirrored (owned by home app) | Survived reload | Result |\n|---|---|---|---|---|\n`;
md += `| make-note-from → notes | ${intentRoundtrip.note.stored ? '✅' : '❌'} | ${intentRoundtrip.note.mirrored ? '✅' : '❌'} | ${intentRoundtrip.note.persisted ? '✅' : '❌'} | ${intentRoundtrip.note.pass ? '✅' : '❌'}${intentRoundtrip.note.err ? ' (' + intentRoundtrip.note.err.slice(0, 80) + ')' : ''} |\n`;
md += `| add-to-learning → learning-tracker | ${intentRoundtrip.learning.stored ? '✅' : '❌'} | ${intentRoundtrip.learning.mirrored ? '✅' : '❌'} | ${intentRoundtrip.learning.persisted ? '✅' : '❌'} | ${intentRoundtrip.learning.pass ? '✅' : '❌'}${intentRoundtrip.learning.err ? ' (' + intentRoundtrip.learning.err.slice(0, 80) + ')' : ''} |\n`;
md += `\n**INTENT-ROUNDTRIP: ${intentPass}/${intentTotal} ${intentPass === intentTotal ? '✅' : '⚠️'}**\n`;
md += `\n## Timeline guard (EPIC-10 S1–S3 — the TEMPORAL lens: faceted, and read BOTH ways)\n\n`;
md += `The Empire had three lenses over its one Core graph — Network (STRUCTURAL), Search (QUERY), Inbox (TASK) — but no way to see *when* it did things, even though every \`CoreNode\` stamps \`meta.created\` and every \`ProvEdge\` stamps \`at\`. The Timeline app merges every entity-birth + every app→app handoff into one newest-first, day-grouped stream via the pure \`buildTimeline\`/\`groupByDay\`/\`dayKey\` spine, now filtered by the pure \`filterTimeline\`/\`timelineFacets\` helpers (all unit-pinned in \`timeline.test.ts\`). Two graph-survivable \`task\` nodes (distinct \`meta.created\`, owned by two apps, the newer's \`data.from\` = the older) + one \`empire-provenance\` edge were seeded, then reloaded so BOTH persist stores rehydrated; PASS = the two entity rows render newest-\`created\` first (\`ordered\`), at least one \`[data-timeline-day]\` header renders (\`grouped\`), the seeded edge renders as a \`[data-timeline-kind=flow]\` row (\`flow\`), all of it still holds after a SECOND reload (\`persisted\`), the older entity's row surfaces a \`<NodeDescendants>\` (\`[data-node-descendants=qa-tl-older]\`) naming the newer child it spawned (\`descendants\`), and clicking the \`goals\` App chip narrows to ONLY the goals-owned entity — dropping the notes entity + the notes→goals flow (\`filtered\`). **S3** surfaces the long-dormant \`childrenOf\` walker so a moment reads BOTH ways — \`↖ ancestry\` (\`<NodeLineage>\`) and \`→ spawned\` (\`<NodeDescendants>\`), each hop a navigable \`[role="button"]\` (unit-pinned in \`NodeDescendants.test.tsx\`). This carries the graph+ledger→persist→rehydrate→ordered-render + faceted-narrow + descendants roundtrip jsdom cannot; the sticky day headers, relative labels + chip tints are the on-device visual.\n\n`;
md += `| Ordered newest-first | Grouped by day | Flow row | Survived reload | Spawned-child shown | App-chip narrows | Result |\n|---|---|---|---|---|---|---|\n`;
md += `| ${timeline.ordered ? '✅' : '❌'} | ${timeline.grouped ? '✅' : '❌'} | ${timeline.flow ? '✅' : '❌'} | ${timeline.persisted ? '✅' : '❌'} | ${timeline.descendants ? '✅' : '❌'} | ${timeline.filtered ? '✅' : '❌'} | ${timeline.pass ? '✅' : '❌'}${timeline.err ? ' (' + timeline.err.slice(0, 80) + ')' : ''} |\n`;
md += `\n**TIMELINE: ${timeline.pass ? '1/1 ✅' : '0/1 ⚠️'}**\n`;
md += `\n## Home-alive guard (The Bridge — the home screen is living telemetry)\n\n`;
md += `The Core graph was seeded with a today-dated \`event\` (Calendar), an open \`task\` (Goals) and a \`book\` (Reader), then home was reloaded (persist rehydrate). PASS = the Today and Open Tasks widgets show the live count + entity, the jump-back-in strip lists all three newest-first, clicking a row lands in its owning app (the \`openEntity\` rail), and a question typed into the Cakra line opens Cakra prefilled (the \`empire-ai-clipboard\` rail). The pure selectors are unit-pinned in \`bridge.test.ts\`; this carries the rendered-home roundtrip jsdom cannot.\n\n`;
md += `| Today widget | Tasks widget | Recents strip | Exact landing | Cakra line | Result |\n|---|---|---|---|---|---|\n`;
md += `| ${homeAlive.today ? '✅' : '❌'} | ${homeAlive.tasks ? '✅' : '❌'} | ${homeAlive.recent ? '✅' : '❌'} | ${homeAlive.land ? '✅' : '❌'} | ${homeAlive.ask ? '✅' : '❌'} | ${homeAlive.pass ? '✅' : '❌'}${homeAlive.err ? ' (' + homeAlive.err.slice(0, 80) + ')' : ''} |\n`;
md += `\n**HOME-ALIVE: ${homeAlive.pass ? '1/1 ✅' : '0/1 ⚠️'}**\n`;
md += `\n## Provenance-persists guard (EPIC-6 — durable app→app memory)\n\n`;
md += `Real \`editor→<target>\` handoffs were fired from the Editor's ⚡ Send menu (each executor emits the honest event \`flowForEvent\` turns into an edge in the durable \`empire-provenance\` store), then the page was reloaded from a different route; PASS = the edge was recorded when the handoff fired AND survived the reload (rehydrated from the persisted ledger). This is the runtime realization of EPIC-6's "seed handoff → reload → durable source still shows" acceptance that jsdom cannot exercise (no real localStorage reload).\n\n`;
md += `| Edge | Recorded | Persisted (reload) | Result |\n|---|---|---|---|\n`;
for (const r of provResults) {
  md += `| ${r.from}→${r.to} | ${r.recorded ? '✅' : '❌'} | ${r.persisted ? '✅' : '❌'} | ${r.pass ? '✅' : '❌'}${r.err ? ' (' + r.err.slice(0, 80) + ')' : ''} |\n`;
}
md += `\n**PROVENANCE-PERSISTS: ${provPass}/${provCases.length} ${provPass === provCases.length ? '✅' : '⚠️'}**\n`;
md += `\n## Provenance-entity guard (EPIC-6 S3 — per-entity source survives reload)\n\n`;
md += `Distinct from the edge guard above: each S3 receiver was seeded with an inbound payload, reloaded so it consumed the chip + prefilled, then its OWN create/send was triggered so the entity persisted its durable \`from\`; the page was reloaded again (chip now gone) and a \`<LineageTrail>\` ("From <source>") must still render off the persisted entity. This is the headline S3 acceptance jsdom cannot exercise.\n\n`;
md += `| Entity edge | Trail after create | Trail after reload | Result |\n|---|---|---|---|\n`;
for (const r of entityResults) {
  md += `| ${r.from}→${r.id} | ${r.created ? '✅' : '❌'} | ${r.persisted ? '✅' : '❌'} | ${r.pass ? '✅' : '❌'}${r.err ? ' (' + r.err.slice(0, 80) + ')' : ''} |\n`;
}
md += `\n**PROVENANCE-ENTITY: ${entityPass}/${entityCases.length} ${entityPass === entityCases.length ? '✅' : '⚠️'}**\n`;
md += `\n## Offline-boot guard (EPIC-4 S1 — cold boot from SW precache)\n\n`;
md += `The built app was served, warm-loaded so the service worker precached, then ALL network was blocked (\`setOffline\`); each route below was navigated cold and must render purely from the precache. The precache audit cross-checks the SW manifest against every emitted chunk.\n\n`;
if (offline) {
  md += `**Precache:** ${offline.precache.count} manifest entries; ${offline.precache.jsChunks} JS + ${offline.precache.cssChunks} CSS chunks emitted — ${offline.precache.missing.length === 0 ? '✅ no gap (all chunks precached)' : `⚠️ ${offline.precache.missing.length} NOT precached: ` + offline.precache.missing.map((f) => '`assets/' + f + '`').join(', ')}.\n\n`;
  if (offline.routes) {
    md += `| Route | Renders offline |\n|---|---|\n`;
    for (const r of offline.routes) md += `| ${r.route} | ${r.pass ? '✅' : '❌'}${r.note ? ' (' + r.note + ')' : ''} |\n`;
    md += `\n**Cold-offline boot: ${offline.passCount}/${offline.routes.length} ${offline.ok ? '✅' : '❌'}**\n`;
  } else if (offline.error) {
    md += `❌ guard could not run: ${offline.error}\n`;
  }
} else {
  md += `⚠️ offline-boot guard did not produce a result this run (see console).\n`;
}
md += `\n## Screenshots\n\nSee PNGs in this folder. \`desktop.png\` is the shell; \`app-<id>.png\` is each app route.\n`;
fs.writeFileSync(path.join(OUT, 'REPORT.md'), md);
fs.writeFileSync('/tmp/qa-results.json', JSON.stringify({ now, pass, fail, total: results.length, results, inboundResults, mediaResults, graphLegible, globalSearch, nodeLineage, intentRoundtrip, timeline, homeAlive, provResults, entityResults, offline }, null, 2));
console.log(`\n${pass}/${results.length} passed, ${fail} failed`);
stopServer();
