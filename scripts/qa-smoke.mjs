// QA visual + smoke test for The Empire (run unattended in cloud).
// Navigates the desktop shell + each app route, records console/page errors,
// captures screenshots into docs/screenshots/latest/, writes REPORT.md.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3001';
const OUT = path.resolve('docs/screenshots/latest');
fs.mkdirSync(OUT, { recursive: true });

// App routes to smoke test (keys mirror src/lib/appComponents.tsx).
const apps = [
  'calculator','calendar','clock','weather','grammar','language','music','video',
  'files','cache','browser','editor','notes','photos','datacenter','maps','messages',
  'prompt-generator','token-counter','learning-tracker','ai-agent','ai-chat','goals',
  'hermes-cc','artifacts','network',
];

const sanitize = (s) => s.replace(/[^a-z0-9-]/gi, '-');
const results = [];

const browser = await chromium.launch();
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
md += `\n## Screenshots\n\nSee PNGs in this folder. \`desktop.png\` is the shell; \`app-<id>.png\` is each app route.\n`;
fs.writeFileSync(path.join(OUT, 'REPORT.md'), md);
fs.writeFileSync('/tmp/qa-results.json', JSON.stringify({ now, pass, fail, total: results.length, results }, null, 2));
console.log(`\n${pass}/${results.length} passed, ${fail} failed`);
