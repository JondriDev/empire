/**
 * The Empire — design tokens (single source of palette truth, TS side).
 *
 * The canonical palette is declared once as CSS custom properties in
 * `colors_and_type.css` (the `:root` + theme blocks). This module mirrors that
 * palette for *TypeScript* consumers — inline styles, canvas, computed colours —
 * so app code never hardcodes a `#hex` or `rgb()/rgba()` literal. That is what
 * keeps the design-token-violation metric (scripts/metrics.mjs) trending to zero:
 * the metric greps app code for raw colours, but `var(--x)` and `color-mix(…)`
 * carry none.
 *
 * Two ways to consume a colour from app code:
 *   • `cssVar('signal')`   → 'var(--signal)'                                  (themeable — preferred)
 *   • `tint('signal', 12)` → 'color-mix(in srgb, var(--signal) 12%, transparent)'
 *
 * Reach for the raw `PALETTE` values only when a CSS var genuinely cannot be
 * resolved (e.g. an offscreen 2D canvas context). Those literals live under
 * `src/design-system/**`, which the metric legitimately exempts.
 */

/** Canonical design-system token names (mirror of the CSS custom properties). */
export type TokenName =
  | 'signal' | 'aurora' | 'plasma' | 'ion' | 'ember' | 'xenon' | 'void' | 'abyss'
  | 'text' | 'text2' | 'text3'
  | 'c-success' | 'c-warn' | 'c-danger' | 'c-info';

/**
 * Earth-from-Space palette — raw hex values, a mirror of `:root` in
 * colors_and_type.css. Prefer `cssVar`/`tint` in app code; these literals are
 * only for the rare JS consumer that cannot resolve a CSS var.
 */
export const PALETTE: Record<TokenName, string> = {
  signal: '#1a8caa',
  aurora: '#66d9a0',
  plasma: '#3c7a4a',
  ion:    '#5b8fb9',
  ember:  '#c4a265',
  xenon:  '#e8edf2',
  void:   '#050a14',
  abyss:  '#0b1a2e',
  text:   '#e4eaf4',
  text2:  '#7a8faa',
  text3:  '#2e3d54',
  'c-success': '#66d9a0',
  'c-warn':    '#f0c94e',
  'c-danger':  '#f87171',
  'c-info':    '#1a8caa',
};

/** Reference a design-system CSS custom property by token name.
 *  `cssVar('signal')` → `'var(--signal)'`. */
export const cssVar = (name: TokenName): string => `var(--${name})`;

/**
 * A translucent tint of a token, built with `color-mix` so no raw `rgba(` ever
 * reaches app code. `tint('signal', 12)` →
 * `'color-mix(in srgb, var(--signal) 12%, transparent)'`. `pct` is rounded and
 * clamped to [0, 100].
 */
export const tint = (name: TokenName, pct: number): string => {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return `color-mix(in srgb, var(--${name}) ${p}%, transparent)`;
};

/**
 * The canonical "N-distinct-series" rail: an ordered list of 8 visually
 * distinct XENO accents (each a themeable `var(--…)`) for decorative,
 * categorical colour — chart series, kanban tags, form field-types, etc.
 * Index it cyclically: `CATEGORICAL[i % CATEGORICAL.length]`. Every entry has
 * a *distinct hex* (no two tokens collapse to the same colour), so adjacent
 * series stay legible. Use this instead of a hardcoded hex array; reserve
 * `DS_INFRA` exemptions for genuine brand/content identity data.
 */
export const CATEGORICAL: string[] = [
  cssVar('ion'),
  cssVar('signal'),
  cssVar('ember'),
  cssVar('plasma'),
  cssVar('aurora'),
  cssVar('c-warn'),
  cssVar('c-danger'),
  cssVar('xenon'),
];
