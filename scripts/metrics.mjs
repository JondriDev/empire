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
import { scanStyleViolations } from './styleAudit.mjs';

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

// ---- shared: the "app code" file set the conformance audits walk -----------
// Design-system infrastructure legitimately defines raw design values: the
// palette dir plus the bridge/shell stylesheets. `registry.ts` is palette data
// (the per-app accent IDENTITY manifest). `cakra/lib/providers.ts` is the
// per-PROVIDER brand-accent identity manifest. `artifacts/…/ColorPalette.tsx`
// is a colour-theory TOOL whose hexes ARE the content. Reader's render-surface
// colours are reading conventions mirrored into the EPUB iframe. Everything
// else (app render code) should consume tokens — those are the actionable
// violations. Shared by tokenViolations / offSystemUtilities / styleViolations.
const DS_INFRA = new Set([
  'src/design-system.css', 'src/window-manager.css', 'src/index.css',
  'src/lib/registry.ts',
  'src/apps/cakra/lib/providers.ts',
  'src/apps/artifacts/artifacts/ColorPalette.tsx',
  'src/apps/reader/reader.css',
  'src/apps/reader/lib/render/epub.ts',
].map((p) => p.split('/').join(path.sep)));
function appCodeFiles() {
  return walk(path.join(ROOT, 'src')).filter(
    (f) => /\.(ts|tsx|css)$/.test(f) &&
      !f.includes(`${path.sep}design-system${path.sep}`) &&
      !DS_INFRA.has(path.relative(ROOT, f)) &&
      !/\.test\.tsx?$/.test(f)
  );
}

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
  const files = appCodeFiles();
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

// ---- metric: design-system utility conformance (lower is better) -----------
// Tailwind named-palette utilities in app code bypass the JondriDev tokens
// (text-gray-400, bg-cyan-600, text-white/40, bg-white/10, text-red-400, …).
// tokenViolations() above only catches raw #hex / rgba() LITERALS; EPIC-2
// swept those to 0 but never touched these ergonomic-but-off-system Tailwind
// colour classes — which is why the apps were only partly on-system. App code
// should use the token-backed utilities instead (text-fg/-muted/-faint,
// bg-glass, border-hair, text-signal/-danger/…, the .gp/.glass primitives, or
// cssVar()/tint()). Same infra allowlist as tokenViolations().
function offSystemUtilities() {
  const files = appCodeFiles();
  // Tailwind utility prefixes that take a colour value.
  const PFX = 'bg|text|border|ring|ring-offset|from|to|via|fill|stroke|divide|outline|accent|caret|decoration|placeholder|shadow';
  // Default Tailwind palette scales (the off-system colours).
  const SCALE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
  const named = new RegExp(`\\b(?:${PFX})-(?:${SCALE})-[0-9]{2,3}(?:/[0-9]{1,3})?\\b`, 'g');
  const blackWhite = new RegExp(`\\b(?:${PFX})-(?:white|black)(?:/[0-9]{1,3})?\\b`, 'g');
  const arbColor = new RegExp(`\\b(?:${PFX})-\\[(?:#|rgb|hsl|oklch|oklab)[^\\]]*\\]`, 'gi');
  let count = 0;
  const offenders = [];
  for (const f of files) {
    const txt = read(f);
    const n = (txt.match(named) || []).length
            + (txt.match(blackWhite) || []).length
            + (txt.match(arbColor) || []).length;
    if (n) { count += n; offenders.push([path.relative(ROOT, f), n]); }
  }
  offenders.sort((a, b) => b[1] - a[1]);
  return { count, top: offenders.slice(0, 8) };
}

// ---- metric: off-system STYLE conformance (lower is better) ----------------
// Design-system conformance II — the non-colour axis. The two colour audits
// above catch raw #hex/rgba and Tailwind palette classes; this catches app code
// that hardcodes RADII / TYPE sizes / EASINGS instead of consuming the
// `--radius-*` / `--text-*` / `--ease-*` scales. Detection is the pure,
// unit-pinned `scanStyleViolations` (scripts/styleAudit.mjs); same app-code file
// set as the colour audits. Raw SPACING is deliberately excluded (see that
// module's header) — it has no bounded token-only target, so it's not driveable.
function styleViolations() {
  const files = appCodeFiles();
  let count = 0;
  const dims = { radii: 0, type: 0, motion: 0 };
  const offenders = [];
  for (const f of files) {
    const r = scanStyleViolations(read(f));
    if (r.total) {
      count += r.total;
      dims.radii += r.radii; dims.type += r.type; dims.motion += r.motion;
      offenders.push([path.relative(ROOT, f), r.total]);
    }
  }
  offenders.sort((a, b) => b[1] - a[1]);
  return { count, dims, top: offenders.slice(0, 8) };
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
const osu = offSystemUtilities();
const sv = styleViolations();
const bundle = bundleSize();
const snapshot = {
  generatedAt: new Date().toISOString(),
  apps: appCount(),
  testFiles: t.testFiles,
  testCases: t.testCases,
  tokenViolations: tv.count,
  offSystemUtilities: osu.count,
  offSystemStyle: sv.count,
  offSystemStyleDims: sv.dims,
  bundleGzKB: bundle ? bundle.gzKB : null,
  bundleRawKB: bundle ? bundle.rawKB : null,
};

if (JSON_ONLY) {
  console.log(JSON.stringify({ ...snapshot, tokenViolationTop: tv.top, offSystemUtilitiesTop: osu.top, offSystemStyleTop: sv.top }, null, 2));
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
  ['Token violations', snapshot.tokenViolations, delta('tokenViolations'), 'LOWER is better (raw hex/rgb literals)'],
  ['Off-system utils', snapshot.offSystemUtilities, delta('offSystemUtilities'), 'LOWER is better (Tailwind palette classes bypassing tokens)'],
  ['Off-system style', `${snapshot.offSystemStyle} (r${sv.dims.radii}/t${sv.dims.type}/m${sv.dims.motion})`, delta('offSystemStyle'), 'LOWER is better (raw radii/type/easing bypassing --radius-*/--text-*/--ease-*)'],
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
if (osu.top.length) {
  console.log(`\nTop off-system-utility files:`);
  for (const [f, n] of osu.top) console.log(`  ${n}\t${f}`);
}
if (sv.top.length) {
  console.log(`\nTop off-system-style files (raw radii/type/easing):`);
  for (const [f, n] of sv.top) console.log(`  ${n}\t${f}`);
}
console.log('');

// ---- optional CI gate: fail if design-system conformance regressed ---------
if (args.has('--assert-zero')) {
  const fail = [];
  if (snapshot.tokenViolations > 0) fail.push(`tokenViolations=${snapshot.tokenViolations}`);
  if (snapshot.offSystemUtilities > 0) fail.push(`offSystemUtilities=${snapshot.offSystemUtilities}`);
  if (fail.length) {
    console.error(`✗ design-system conformance assertion FAILED: ${fail.join(', ')}`);
    process.exit(1);
  }
  console.log('✓ design-system conformance: tokenViolations=0, offSystemUtilities=0');
}
