// EPIC-4 S3 — Base-path + install-flow correctness check (run unattended in cloud).
//
// GitHub Pages serves this PWA from a sub-path (/empire/), every other target
// from origin root (/). A build whose asset URLs, SW navigateFallback, SW
// registration scope or manifest don't carry the deploy base installs into a
// blank screen (assets 404 at the wrong path). This check BUILDS with the Pages
// base into a throwaway outDir and asserts the whole install surface agrees with
// it — using the pure `pwaBaseAudit.mjs` helpers (unit-tested separately).
//
// Standalone: `node scripts/check-pwa-base.mjs` (set PWA_CHECK_BASE to test
// another base). Self-contained — it runs its own `vite build`, so it needs no
// pre-existing dist and never clobbers the real one.
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { auditPwaBase, normalizeBase } from './pwaBaseAudit.mjs';

const BASE = normalizeBase(process.env.PWA_CHECK_BASE || '/empire/');
const OUT = path.resolve('dist-pwa-base-check');

function fail(msg) {
  console.error(`PWA-BASE: ✖ ${msg}`);
  cleanup();
  process.exit(1);
}
function cleanup() {
  try { fs.rmSync(OUT, { recursive: true, force: true }); } catch { /* best-effort */ }
}

// ── 1. Build with the deploy base into a throwaway outDir (real dist untouched).
console.log(`PWA-BASE: building with base ${BASE} → ${path.basename(OUT)} …`);
cleanup();
const build = spawnSync('npx', ['vite', 'build', `--base=${BASE}`, `--outDir=${OUT}`, '--emptyOutDir'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  encoding: 'utf8',
  env: { ...process.env, EMPIRE_BASE: BASE },
});
if (build.status !== 0) {
  console.error(build.stdout || '');
  console.error(build.stderr || '');
  fail(`vite build failed for base ${BASE}`);
}

// ── 2. Read the emitted install surface.
const read = (rel) => {
  const p = path.join(OUT, rel);
  if (!fs.existsSync(p)) fail(`expected build output missing: ${rel}`);
  return fs.readFileSync(p, 'utf8');
};
const html = read('index.html');
const swText = read('sw.js');
const registerSwText = read('registerSW.js');
const manifestText = read('manifest.webmanifest');

// ── 3. Audit.
const r = auditPwaBase({ html, swText, registerSwText, manifestText, base: BASE });

console.log(`PWA-BASE: ${r.html.count} index.html asset(s); manifest ${r.html.manifestLinked ? 'linked' : 'MISSING'}`);
console.log(`PWA-BASE: sw navigateFallback = ${JSON.stringify(r.sw.navigateFallback)} (expect ${JSON.stringify(r.sw.expected)})`);
console.log(`PWA-BASE: registerSW = ${JSON.stringify(r.registerSw.swUrl)} scope ${JSON.stringify(r.registerSw.scope)}`);
console.log(`PWA-BASE: manifest start_url=${JSON.stringify(r.manifest.start_url)} scope=${JSON.stringify(r.manifest.scope)} id=${JSON.stringify(r.manifest.id)}`);

// ── 4. Report (alongside the smoke/offline reports for QA to fold in).
try {
  const OUTDIR = path.resolve('docs/screenshots/latest');
  fs.mkdirSync(OUTDIR, { recursive: true });
  let md = `# Empire QA — Base-path + install-flow (EPIC-4 S3)\n\n**Built with base:** \`${BASE}\`\n\n`;
  md += `| Surface | Result |\n|---|---|\n`;
  md += `| index.html assets prefixed | ${r.html.unprefixed.length === 0 ? '✅' : '❌ ' + r.html.unprefixed.join(', ')} |\n`;
  md += `| manifest linked + prefixed | ${r.html.manifestLinked && r.html.manifestPrefixed ? '✅' : '❌'} |\n`;
  md += `| sw navigateFallback | ${r.sw.ok ? '✅ ' + r.sw.navigateFallback : '❌ ' + r.sw.navigateFallback + ' (want ' + r.sw.expected + ')'} |\n`;
  md += `| registerSW url + scope | ${r.registerSw.ok ? '✅ ' + r.registerSw.swUrl + ' / ' + r.registerSw.scope : '❌'} |\n`;
  md += `| manifest start_url/scope relative | ${r.manifest.startUrlRelative && r.manifest.scopeRelative ? '✅ both \`.\`' : '❌'} |\n`;
  md += `| manifest id stable non-root | ${r.manifest.idOk ? '✅ \`' + r.manifest.id + '\`' : '❌ \`' + r.manifest.id + '\`'} |\n`;
  md += `\n**Base-path check: ${r.ok ? '✅ PASS' : '❌ FAIL'}**\n`;
  if (!r.ok) md += `\n${r.issues.map((i) => `- ${i}`).join('\n')}\n`;
  fs.writeFileSync(path.join(OUTDIR, 'PWA-BASE.md'), md);
} catch { /* best-effort */ }
try { fs.writeFileSync('/tmp/pwa-base.json', JSON.stringify(r, null, 2)); } catch { /* best-effort */ }

cleanup();

if (!r.ok) {
  console.error('PWA-BASE: ✖ install surface does NOT agree with the deploy base:');
  r.issues.forEach((i) => console.error(`   - ${i}`));
  process.exit(1);
}
console.log(`PWA-BASE: ✅ install surface agrees with base ${BASE} — assets, SW & manifest all consistent.`);
