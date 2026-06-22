// QA visual + smoke test for The Empire (run unattended in cloud).
// Navigates the desktop shell + each app route, records console/page errors,
// captures screenshots into docs/screenshots/latest/, writes REPORT.md.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3001';
const OUT = path.resolve('docs/screenshots/latest');
fs.mkdirSync(OUT, { recursive: true });

// ── SHELL-IS-STYLED assertion (the green-build-but-blank trap) ───────────────
// A `*/` inside a CSS doc-comment can close it early → every `.empire-*` rule
// nests under `@media(max-width:640px){.hide-sm…}` → desktop renders unstyled
// despite a green build. Verify WITHOUT a browser against the built CSS:
//   • a TOP-LEVEL `.empire-desktop{…position:fixed…}` rule exists, and
//   • ZERO `.hide-sm .empire-desktop` rules (the nested-under-media signature).
// This runs before render so a blank build fails fast & loud.
function assertShellStyled() {
  const assetsDir = path.resolve('dist/assets');
  let css = '';
  try {
    for (const f of fs.readdirSync(assetsDir)) {
      if (f.endsWith('.css')) css += fs.readFileSync(path.join(assetsDir, f), 'utf8');
    }
  } catch (e) {
    throw new Error(`SHELL-IS-STYLED: cannot read dist/assets CSS (${e.message}). Build first.`);
  }
  // top-level .empire-desktop with position:fixed (props may be reordered by the minifier)
  const desktopRule = css.match(/\.empire-desktop\{[^}]*\}/g) || [];
  const hasFixed = desktopRule.some((r) => /position:fixed/.test(r));
  const nested = (css.match(/\.hide-sm \.empire-desktop/g) || []).length;
  if (!hasFixed) throw new Error('SHELL-IS-STYLED: no top-level `.empire-desktop{…position:fixed…}` in built CSS — blank-dark trap (comment broke the cascade).');
  if (nested > 0) throw new Error(`SHELL-IS-STYLED: found ${nested}× \`.hide-sm .empire-desktop\` — rules nested under @media, desktop will render unstyled.`);
  console.log('SHELL-IS-STYLED ✅  top-level .empire-desktop{position:fixed}, 0 nested under .hide-sm');
}
assertShellStyled();

// ── Resolve a usable Chromium (known-good cloud recipe) ──────────────────────
// cdn.playwright.dev 403s in the sandbox — never download. Prefer the pre-installed
// /opt/pw-browsers/chromium-*/chrome-linux/chrome (pick the newest if the dir
// version changed); fall back to Playwright's own resolution.
function resolveChromiumPath() {
  const base = '/opt/pw-browsers';
  try {
    const dirs = fs.readdirSync(base)
      .filter((d) => /^chromium-\d+$/.test(d))
      .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
    for (const d of dirs) {
      const exe = path.join(base, d, 'chrome-linux', 'chrome');
      if (fs.existsSync(exe)) return exe;
    }
  } catch { /* fall through to default */ }
  return undefined; // let Playwright resolve its bundled browser
}

// App routes to smoke test (keys mirror src/lib/appComponents.tsx).
const apps = [
  'calculator','calendar','clock','weather','grammar','language','music','video',
  'files','cache','browser','editor','notes','photos','datacenter','maps','messages',
  'prompt-generator','token-counter','learning-tracker','ai-agent','ai-chat','goals',
  'hermes-cc','artifacts','network',
];

const sanitize = (s) => s.replace(/[^a-z0-9-]/gi, '-');
const results = [];

const executablePath = resolveChromiumPath();
console.log(`Chromium: ${executablePath || '(Playwright default)'}`);
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });

// ── Live DOM styled check: confirm the shell actually paints position:fixed.
// Complements the static CSS assertion (catches a runtime cascade failure too).
let domStyledOk = null;

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

// Live DOM styled check on the rendered shell (computed position must be 'fixed').
try {
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await p.waitForTimeout(1200);
  domStyledOk = await p.evaluate(() => {
    const el = document.querySelector('.empire-desktop');
    return !!el && getComputedStyle(el).position === 'fixed';
  }).catch(() => false);
  await p.close();
  console.log(`DOM shell-styled (computed position:fixed): ${domStyledOk ? '✅' : '❌'}`);
} catch (e) {
  domStyledOk = false;
  console.log('DOM shell-styled check errored:', e.message);
}

// Each app
for (const id of apps) {
  await visit(id, `${BASE}/app/${id}`, `app-${sanitize(id)}.png`);
}

await browser.close();

// Build report
const now = new Date().toISOString();
const pass = results.filter(r => r.pass).length;
const fail = results.length - pass;
let md = `# Empire QA — Visual + Smoke Report\n\n`;
md += `**Generated:** ${now}\n\n`;
md += `**Result:** ${pass}/${results.length} rendered without crash, ${fail} failed.\n\n`;
md += `**Shell-is-styled:** static CSS assertion ✅ (top-level \`.empire-desktop{position:fixed}\`, 0 nested under \`.hide-sm\`); live DOM computed \`position:fixed\` ${domStyledOk ? '✅' : '❌'}.\n\n`;
md += `> **PASS** = the app rendered with no uncaught JS exception / error boundary / blank screen.\n`;
md += `> Network & console noise (failed external CDN fetches, backend API calls needing auth) is\n`;
md += `> listed separately — expected in the offline cloud sandbox and **not** a render failure.\n\n`;
md += `| App | Render | Uncaught JS / crash | Network / console notes |\n|---|---|---|---|\n`;
const cell = (a) => a.length ? a.map(e => e.replace(/\|/g, '\\|').slice(0, 160)).join('<br>') : '—';
for (const r of results) {
  md += `| ${r.name} | ${r.pass ? '✅' : '❌ FAIL'} | ${cell(r.uncaught)} | ${cell([...r.netFails, ...r.consoleErrors.filter(c => !/Failed to load resource/.test(c))])} |\n`;
}
md += `\n## Screenshots\n\nSee PNGs in this folder. \`desktop.png\` is the shell; \`app-<id>.png\` is each app route.\n`;
fs.writeFileSync(path.join(OUT, 'REPORT.md'), md);
fs.writeFileSync('/tmp/qa-results.json', JSON.stringify({ now, pass, fail, total: results.length, results }, null, 2));
console.log(`\n${pass}/${results.length} passed, ${fail} failed`);
