import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// ── EPIC-5 S8 · palette-drift lock ─────────────────────────────────────────
// The `@theme inline` bridge in src/index.css is what makes the whole Empire
// re-theme from one place: every ergonomic `text-fg`/`bg-glass`/`text-signal`
// utility resolves to `var(--token)`, and those tokens are declared in
// colors_and_type.css. If a future bridge edit points a `--color-*` utility at
// a `var(--token)` that doesn't exist, the utility silently renders nothing —
// a green build that quietly un-themes an app. This test fails fast on that
// drift, locking the off-system → 0 win (and satisfying ROADMAP NOW #2).
//
// Vitest runs from the repo root, so resolve the two CSS sources from cwd.
const indexCss = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');
const tokenCss = readFileSync(join(process.cwd(), 'src/design-system/colors_and_type.css'), 'utf8');

/** Pull the `--color-X: var(--Y)` pairs out of the `@theme inline { … }` block. */
function bridgePairs(css: string): Array<{ utility: string; token: string }> {
  const block = css.match(/@theme\s+inline\s*\{([\s\S]*?)\}/);
  if (!block) return [];
  const pairs: Array<{ utility: string; token: string }> = [];
  const re = /(--color-[a-z0-9-]+)\s*:\s*var\(\s*(--[a-z0-9-]+)\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1])) !== null) pairs.push({ utility: m[1], token: m[2] });
  return pairs;
}

/** Custom-property NAMES declared (left-hand side of a `--x:` declaration). */
function declaredVars(css: string): Set<string> {
  const out = new Set<string>();
  const re = /^\s*(--[a-z0-9-]+)\s*:/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) out.add(m[1]);
  return out;
}

describe('@theme bridge ↔ token declarations (palette-drift lock)', () => {
  const pairs = bridgePairs(indexCss);
  const declared = declaredVars(tokenCss);

  it('parses a non-trivial bridge (guards against a silently-broken regex)', () => {
    // The bridge maps the full colour vocabulary; if parsing breaks the rest of
    // this suite would vacuously pass, so assert a sane floor.
    expect(pairs.length).toBeGreaterThanOrEqual(12);
  });

  it('every @theme --color-* utility points at a token declared in colors_and_type.css', () => {
    const dangling = pairs.filter((p) => !declared.has(p.token));
    expect(dangling, `dangling bridge tokens: ${dangling.map((d) => `${d.utility}→${d.token}`).join(', ')}`).toEqual([]);
  });

  it('colors_and_type.css declares the core neutral, accent and state tokens', () => {
    // A floor on the source-of-truth so a future rename can't empty it out from
    // under the bridge without this failing.
    for (const t of ['--text', '--signal', '--c-success', '--c-danger', '--void', '--hair']) {
      expect(declared.has(t), `missing token declaration ${t}`).toBe(true);
    }
  });
});
