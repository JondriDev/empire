// The Empire — off-system STYLE audit (design-system conformance II).
//
// tokenViolations() catches raw #hex/rgba() COLOUR literals; offSystemUtilities()
// catches Tailwind palette COLOUR classes. Both are about colour. This module is
// the second axis of design-system conformance: the non-colour design tokens —
// **radii, type scale, and easing (motion)** — that app code should also consume
// as `var(--radius-*)` / `var(--text-*)` / `var(--ease-*)` instead of hardcoding.
//
// Scope decision (deliberate, so the metric is DRIVEABLE to zero, not noise):
//   • radii  — raw `border-radius` / `borderRadius` px/rem/em lengths that bypass
//              the `--radius-*` scale. Semantic circles (`50%`) and pills
//              (`9999px`) are NOT violations — they aren't scale steps.
//   • type   — raw `font-size` / `fontSize` px/rem (or unitless-JS-px) that bypass
//              the `--text-*` scale. Relative `em`/`%` sizing is left alone.
//   • motion — raw easing timing functions (`cubic-bezier(...)`, `ease-in`,
//              `ease-out`, `ease-in-out`) that bypass `--ease-*`. A `var(--ease-…)`
//              reference is on-system and never counted.
//   Raw SPACING (padding/margin/gap px) is intentionally EXCLUDED: unlike the
//   scales above it has too many legitimate one-off geometry values (an 8px status
//   dot, a 6px inset) with no bounded token-only target, so counting it would
//   produce an un-driveable number. The Strategist can add it later behind a
//   curated allowlist if desired.
//
// Pure & dependency-free: `scanStyleViolations(text)` takes a file's text and
// returns per-dimension counts, so it is unit-pinned in styleAudit.test.mjs and
// reused by scripts/metrics.mjs over the same app-code file set the colour audits
// walk.

// A value is on-system if it resolves through a CSS custom property.
const isTokenized = (v) => /var\(/.test(v);

// Pull the value of a `prop: value` declaration (CSS `border-radius: 4px` or a
// JS style object `borderRadius: '4px'` / `borderRadius: 4`). Returns the raw
// value string (quotes/trailing comma stripped) for each occurrence of `propRe`.
function declValues(text, propRe) {
  const re = new RegExp(`${propRe}\\s*:\\s*([^;,}\\n]+)`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push(m[1].trim().replace(/^['"`]|['"`]$/g, '').trim());
  }
  return out;
}

// A raw absolute length step (px/rem/em) that should be a scale token. `9999`
// and `100vmax`-style pill radii are excluded by the caller.
const hasAbsoluteLength = (v) => /(?:^|[\s(])\.?\d[\d.]*(px|rem|em)\b/.test(v);
// A bare unitless number in a JS style object is px (React), e.g. `fontSize: 13`.
const isUnitlessNumber = (v) => /^\.?\d[\d.]*$/.test(v);

function radiusViolations(text) {
  let n = 0;
  for (const v of declValues(text, 'border-?[Rr]adius')) {
    if (isTokenized(v)) continue;
    if (/%|9999|100vmax|100vmin|inherit|initial|unset/.test(v)) continue; // circles/pills/keywords
    if (hasAbsoluteLength(v) || isUnitlessNumber(v)) n++;
  }
  return n;
}

function typeViolations(text) {
  let n = 0;
  for (const v of declValues(text, 'font-?[Ss]ize')) {
    if (isTokenized(v)) continue;
    if (/%|inherit|initial|unset|smaller|larger|clamp|calc/.test(v)) continue;
    if (/em\b/.test(v) && !/rem\b/.test(v)) continue; // relative em sizing is allowed
    if (/(?:^|[\s(])\.?\d[\d.]*(px|rem)\b/.test(v) || isUnitlessNumber(v)) n++;
  }
  return n;
}

function motionViolations(text) {
  const bezier = (text.match(/cubic-bezier\s*\(/g) || []).length;
  // Easing keywords, but NOT the `-ease-…` token names / `var(--ease-…)` refs
  // (the char before a token keyword is `-`, which the lookbehind rejects).
  const keyword = (text.match(/(?<![-\w])(?:ease-in-out|ease-in|ease-out)\b/g) || []).length;
  return bezier + keyword;
}

// Per-file scan → { radii, type, motion, total }.
export function scanStyleViolations(text) {
  const radii = radiusViolations(text);
  const type = typeViolations(text);
  const motion = motionViolations(text);
  return { radii, type, motion, total: radii + type + motion };
}
