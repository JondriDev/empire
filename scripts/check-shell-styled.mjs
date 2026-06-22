#!/usr/bin/env node
// The Empire — "shell-is-styled" CI guard (the blank-dark trap, regression #10).
//
// THE BUG THIS MAKES IMPOSSIBLE TO MERGE AGAIN:
// A stray `*/` *inside* a CSS doc-comment in src/design-system.css (e.g. a doc
// line containing `--text*/` or `--holo-*/`) closes the comment early. The brace
// matching then drifts by a level and every top-level `.empire-*` shell rule gets
// nested under `@media(max-width:640px){.hide-sm .empire-desktop{…}}`. The desktop
// home shell renders completely unstyled — yet `tsc -b && vite build` stays GREEN,
// so nothing flags it (individual apps survive: they use Tailwind utilities, not
// the `.empire-*` layer). This cost a full QA cycle to find the first time (#10).
//
// This guard asserts, against the BUILT bundle, the two invariants documented in
// docs/CONTEXT.md ("Blank-dark trap"):
//   1. dist CSS has a TOP-LEVEL `.empire-desktop{…position:fixed…}` rule, and
//   2. dist CSS has ZERO `.hide-sm .empire-desktop` rules.
// Plus a fast SOURCE-level pre-check: CSS comment markers balance (`/*` == `*/`)
// in the design-system stylesheets, so the root cause is caught even pre-build.
//
//   npm run build && node scripts/check-shell-styled.mjs
//
// Dependency-free (Node built-ins only): runs in any fresh checkout with no
// install step. Exits 0 when the shell is healthy, 1 (with a diagnosis) when not.

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const failures = [];
const notes = [];

// ---- check 1: source comment balance (the root cause) ----------------------
// A stray `*/` inside a doc-comment is what triggers the cascade break. Count
// the markers in the stylesheets that own the design-system comments.
const SRC_CSS = [
  'src/design-system.css',
  'src/design-system/colors_and_type.css',
];
for (const rel of SRC_CSS) {
  const txt = read(path.join(ROOT, rel));
  if (txt == null) continue; // file optional; absence isn't this guard's concern
  const open = (txt.match(/\/\*/g) || []).length;
  const close = (txt.match(/\*\//g) || []).length;
  if (open !== close) {
    failures.push(
      `${rel}: unbalanced CSS comment markers — ${open} \`/*\` vs ${close} \`*/\`. ` +
      `A stray \`*/\` (often inside a doc-comment like \`--text*/\`) closes a comment ` +
      `early and breaks brace nesting. Space out the slashes in comments.`
    );
  } else {
    notes.push(`${rel}: comment markers balanced (${open}/${close}).`);
  }
}

// ---- check 2 + 3: built bundle invariants ----------------------------------
const assetsDir = path.join(ROOT, 'dist/assets');
let cssFiles = [];
try {
  cssFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.css'));
} catch { /* dist not built */ }

if (cssFiles.length === 0) {
  failures.push(
    'No dist/assets/*.css found — run `npm run build` before this guard so it can ' +
    'assert the built bundle (a green tsc/vite build is exactly what hides this bug).'
  );
} else {
  const css = cssFiles.map((f) => read(path.join(assetsDir, f)) || '').join('\n');

  // 3: the broken state nests the shell rules under `.hide-sm .empire-desktop`.
  const nested = (css.match(/\.hide-sm\s+\.empire-desktop/g) || []).length;
  if (nested > 0) {
    failures.push(
      `built CSS contains ${nested} \`.hide-sm .empire-desktop\` rule(s) — the shell ` +
      `layer got nested under the mobile media query (the #10 blank-dark cascade). ` +
      `Expected 0.`
    );
  } else {
    notes.push('built CSS: 0 `.hide-sm .empire-desktop` (shell not nested).');
  }

  // 2: a healthy bundle keeps a STANDALONE `.empire-desktop{…}` rule (selector not
  // preceded by a descendant combinator) whose body sets `position:fixed`.
  const standaloneFixed = (() => {
    const re = /\.empire-desktop\s*\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(css)) !== null) {
      const before = css[m.index - 1]; // char preceding `.empire-desktop`
      const isDescendant = before === ' ' || before === '\t' || before === '\n';
      if (!isDescendant && /position:\s*fixed/.test(m[1])) return true;
    }
    return false;
  })();
  if (!standaloneFixed) {
    failures.push(
      'built CSS has no TOP-LEVEL `.empire-desktop{…position:fixed…}` rule — the ' +
      'desktop home shell would render unstyled (blank-dark trap). Expected exactly ' +
      'this rule at the stylesheet top level.'
    );
  } else {
    notes.push('built CSS: top-level `.empire-desktop{…position:fixed…}` present.');
  }
}

// ---- report ----------------------------------------------------------------
if (failures.length) {
  console.error('✗ shell-styled guard FAILED — the desktop shell would render unstyled:\n');
  for (const f of failures) console.error('  • ' + f);
  console.error('\nSee docs/CONTEXT.md → "Blank-dark trap" for the full diagnosis.');
  process.exit(1);
}
console.log('✓ shell-styled guard passed:');
for (const n of notes) console.log('  • ' + n);
