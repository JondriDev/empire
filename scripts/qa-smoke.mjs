// QA visual + smoke test for The Empire (run unattended in cloud).
// Navigates the desktop shell + each app route, records console/page errors,
// captures screenshots into docs/screenshots/latest/, writes REPORT.md.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

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
  'artifacts','network','inbox',
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
  console.log(`REGISTRY-COVERAGE: ✅ all ${uniqIds.length} registry apps are in the smoke list`);
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

await browser.close();

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
md += `\n## Screenshots\n\nSee PNGs in this folder. \`desktop.png\` is the shell; \`app-<id>.png\` is each app route.\n`;
fs.writeFileSync(path.join(OUT, 'REPORT.md'), md);
fs.writeFileSync('/tmp/qa-results.json', JSON.stringify({ now, pass, fail, total: results.length, results, inboundResults }, null, 2));
console.log(`\n${pass}/${results.length} passed, ${fail} failed`);
