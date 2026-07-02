// QA visual + smoke test for The Empire (run unattended in cloud).
// Navigates the desktop shell + each app route, records console/page errors,
// captures screenshots into docs/screenshots/latest/, writes REPORT.md.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';

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
  'artifacts','network','inbox','reader',
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
fs.writeFileSync('/tmp/qa-results.json', JSON.stringify({ now, pass, fail, total: results.length, results, inboundResults, mediaResults, provResults, entityResults, offline }, null, 2));
console.log(`\n${pass}/${results.length} passed, ${fail} failed`);
