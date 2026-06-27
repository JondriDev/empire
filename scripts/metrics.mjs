#!/usr/bin/env node
// The Empire — fitness metrics ("the potential field").
//
// Computes the machine-measurable north-star numbers the routine fleet steers by.
// Dependency-free (Node built-ins only) so it runs in any cloud checkout without
// an install step. Prints a Markdown table to stdout and updates docs/metrics.json
// (current snapshot + a capped rolling history) so deltas are visible run-to-run.
//
//   node scripts/metrics.mjs            # print table + update docs/metrics.json
//   node scripts/metrics.mjs --json     # print raw JSON only (no file write)
//
// Routines: the Builder/QA run this and paste the delta into their PR; the
// Reviewer uses it as a hard gate (a PR must not regress these); the Strategist
// ranks epics by which metric has the steepest capability gradient; the Digest
// reports the trend. See docs/METRICS.md.

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const JSON_ONLY = args.has('--json');

// ---- tiny fs helpers (no deps) ---------------------------------------------
function walk(dir, acc = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };

// ---- metric: app/route count -----------------------------------------------
function appCount() {
  const src = read(path.join(ROOT, 'src/lib/registry.ts'));
  // Require a quoted value so the `interface AppDefinition { id: string }`
  // declaration isn't counted as an app entry.
  const m = src.match(/\{\s*id:\s*'/g);
  return m ? m.length : 0;
}

// ---- metric: tests ----------------------------------------------------------
function testStats() {
  const files = walk(path.join(ROOT, 'src')).filter((f) => /\.test\.tsx?$/.test(f));
  let cases = 0;
  for (const f of files) {
    const m = read(f).match(/(^|\s)(it|test)\s*\(/g);
    if (m) cases += m.length;
  }
  return { testFiles: files.length, testCases: cases };
}

// ---- metric: design-token conformance (lower is better) --------------------
// Hardcoded colors in app code that bypass the design system. The canonical
// palette lives in src/design-system/**; everything else should consume tokens.
function tokenViolations() {
  // Design-system infrastructure legitimately defines raw colors: the palette
  // dir plus the three bridge/shell stylesheets. `registry.ts` is also palette
  // data — the per-app accent IDENTITY manifest (the single source consumed
  // across the shell as `${app.color}` / `rgbOf(app.color)`), not app render
  // code bypassing the system. Everything else (app code) should consume
  // tokens — those are the actionable violations.
  const DS_INFRA = new Set([
    'src/design-system.css', 'src/window-manager.css', 'src/index.css',
    'src/lib/registry.ts',
  ].map((p) => p.split('/').join(path.sep)));
  const files = walk(path.join(ROOT, 'src')).filter(
    (f) => /\.(ts|tsx|css)$/.test(f) &&
      !f.includes(`${path.sep}design-system${path.sep}`) &&
      !DS_INFRA.has(path.relative(ROOT, f)) &&
      !/\.test\.tsx?$/.test(f)
  );
  let count = 0;
  const offenders = [];
  for (const f of files) {
    const txt = read(f);
    const hex = txt.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    const rgb = txt.match(/\brgba?\(/g) || [];
    const n = hex.length + rgb.length;
    if (n) { count += n; offenders.push([path.relative(ROOT, f), n]); }
  }
  offenders.sort((a, b) => b[1] - a[1]);
  return { count, top: offenders.slice(0, 5) };
}

// ---- metric: shipped bundle size (gzipped) ---------------------------------
function bundleSize() {
  const dir = path.join(ROOT, 'dist/assets');
  if (!exists(dir)) return null; // dist not built in this checkout
  let raw = 0, gz = 0;
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(js|css)$/.test(f)) continue;
    const buf = fs.readFileSync(path.join(dir, f));
    raw += buf.length;
    gz += zlib.gzipSync(buf).length;
  }
  return { rawKB: +(raw / 1024).toFixed(1), gzKB: +(gz / 1024).toFixed(1) };
}

// ---- assemble ---------------------------------------------------------------
const t = testStats();
const tv = tokenViolations();
const bundle = bundleSize();
const snapshot = {
  generatedAt: new Date().toISOString(),
  apps: appCount(),
  testFiles: t.testFiles,
  testCases: t.testCases,
  tokenViolations: tv.count,
  bundleGzKB: bundle ? bundle.gzKB : null,
  bundleRawKB: bundle ? bundle.rawKB : null,
};

if (JSON_ONLY) {
  console.log(JSON.stringify({ ...snapshot, tokenViolationTop: tv.top }, null, 2));
  process.exit(0);
}

// ---- persist history + print delta -----------------------------------------
const OUT = path.join(ROOT, 'docs/metrics.json');
let prev = null, history = [];
try {
  const j = JSON.parse(read(OUT));
  prev = j.current || null;
  history = Array.isArray(j.history) ? j.history : [];
} catch { /* first run */ }
if (prev) history.push(prev);
history = history.slice(-30); // cap rolling history
try {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ current: snapshot, history }, null, 2) + '\n');
} catch (e) { console.error('warn: could not write', OUT, e.message); }

const delta = (k) => {
  if (!prev || prev[k] == null || snapshot[k] == null) return '';
  const d = snapshot[k] - prev[k];
  return d === 0 ? '±0' : (d > 0 ? `+${d}` : `${d}`);
};
const rows = [
  ['Apps / routes', snapshot.apps, delta('apps'), 'higher = more surface (steady-state ~26)'],
  ['Test cases', snapshot.testCases, delta('testCases'), 'higher = safer to leap'],
  ['Test files', snapshot.testFiles, delta('testFiles'), ''],
  ['Token violations', snapshot.tokenViolations, delta('tokenViolations'), 'LOWER is better (design-system conformance)'],
  ['Bundle gz (KB)', snapshot.bundleGzKB ?? 'n/a (no dist)', delta('bundleGzKB'), 'LOWER is better; build first to measure'],
];
const w = (s, n) => String(s).padEnd(n);
console.log(`\nThe Empire — fitness metrics  (${snapshot.generatedAt})\n`);
console.log(`| ${w('Metric', 18)} | ${w('Value', 12)} | ${w('Δ', 6)} | Notes`);
console.log(`| ${'-'.repeat(18)} | ${'-'.repeat(12)} | ${'-'.repeat(6)} | -----`);
for (const [m, v, d, note] of rows) console.log(`| ${w(m, 18)} | ${w(v, 12)} | ${w(d, 6)} | ${note}`);
if (tv.top.length) {
  console.log(`\nTop token-violation files:`);
  for (const [f, n] of tv.top) console.log(`  ${n}\t${f}`);
}
console.log('');
