// The Empire — keyboard-operability audit (accessibility conformance).
//
// The design-system trilogy (EPIC-5 colour · EPIC-11 tokens · EPIC-14 shell)
// locked how the Empire LOOKS. This module opens the axis of how it is
// OPERATED: can every action be reached without a mouse? WCAG 2.1.1 (Keyboard)
// requires that anything you can click, you can also drive from the keyboard.
//
// In React a bare `onClick` on a NON-interactive host element (`<div>`, `<span>`,
// `<li>`, an anchor with no `href`, …) does NOT fire on Enter/Space — the browser
// only synthesises click-on-key for natively-actionable elements (`<button>`,
// `<a href>`, form controls). So a `<div onClick>` with no companion key handler
// is a keyboard TRAP: mouse users act, keyboard/switch/AT users cannot. Adding
// `role`/`tabIndex` alone does NOT fix it — the handler still never fires — so the
// honest, sufficient signal is "has onClick but no onKeyDown/onKeyUp/onKeyPress".
//
// What counts as a keyboard-inoperable control (a violation):
//   • a lowercase HOST element (`<div>`, `<span>`, `<li>`, `<p>`, `<section>`, …,
//     or an `<a>` WITHOUT href) that has an `onClick=` attribute AND has NONE of
//     `onKeyDown` / `onKeyUp` / `onKeyPress`.
// What is exempt (not counted):
//   • Natively-actionable tags — `button`, `a` WITH `href`, `input`, `select`,
//     `textarea`, `option`, `label` (label forwards its click to its control).
//   • Capitalised component tags (`<Card onClick>`, `<Button>`): the regex is
//     case-sensitive and the `ui` primitives add keyboard operability themselves
//     (Card wires role+tabIndex+Enter/Space), so they are shell homes, not traps.
//   • Anything DECLARED non-interactive: `aria-hidden="true"`, `role="presentation"`,
//     or `role="none"` (decorative overlays/backdrops — no AT-visible action).
//
// Pure & dependency-free: `scanA11yViolations(text)` takes a file's text and
// returns per-dimension counts, so it is unit-pinned in a11yAudit.test.mjs and
// reused by scripts/metrics.mjs over the same app-code file set the colour/style/
// control audits walk (minus src/components/ui/, whose primitives are shell homes).

// Host tags that are NOT natively actionable — an onClick on these needs an
// explicit key handler to be keyboard-operable.
const HOST_TAGS = [
  'div', 'span', 'li', 'ul', 'ol', 'p', 'section', 'article', 'header', 'footer',
  'nav', 'main', 'aside', 'figure', 'figcaption', 'tr', 'td', 'th', 'table',
  'img', 'svg', 'i', 'b', 'small', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
];

// Walk every `<name` opening tag, returning its full opening-tag text
// (`<name ... >`). Scans to the real tag close, skipping `>` inside `{…}` JSX
// expressions and the `>` of a `=>` arrow function (both extremely common in
// `onClick`/`onKeyDown` handlers), so attributes are read correctly on multi-line
// tags. Mirrors controlAudit.mjs's `inputTags` scanner.
function openingTags(text, name) {
  const tags = [];
  const marker = `<${name}`;
  let i = 0;
  while ((i = text.indexOf(marker, i)) !== -1) {
    const boundary = text[i + marker.length];
    if (boundary && !/[\s/>]/.test(boundary)) { i += marker.length; continue; } // <divlike → skip
    let depth = 0, end = -1;
    for (let j = i + marker.length; j < text.length; j++) {
      const c = text[j];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0 && text[j - 1] !== '=') { end = j; break; }
    }
    if (end === -1) end = text.length;
    tags.push(text.slice(i, end + 1));
    i = end + 1;
  }
  return tags;
}

const hasAttr = (tag, attr) => new RegExp(`(?:^|[\\s{])${attr}(?=[\\s=}/>])`).test(tag);
const hasKey = (tag) => hasAttr(tag, 'onKeyDown') || hasAttr(tag, 'onKeyUp') || hasAttr(tag, 'onKeyPress');

// Extract the balanced `{…}` expression assigned to `onClick=` (or `null` if the
// tag has no onClick). Handles multi-line handlers.
function onClickExpr(tag) {
  const m = tag.match(/(?:^|[\s{])onClick\s*=\s*\{/);
  if (!m) return null;
  const open = tag.indexOf('{', m.index + m[0].length - 1);
  if (open === -1) return null;
  let depth = 0;
  for (let j = open; j < tag.length; j++) {
    if (tag[j] === '{') depth++;
    else if (tag[j] === '}' && --depth === 0) return tag.slice(open + 1, j);
  }
  return tag.slice(open + 1);
}

// A handler that ONLY calls `stopPropagation()` / `preventDefault()` is
// event-plumbing (it guards a nested real control from the parent's click) — it
// performs no user action, so keyboard users need nothing from it. Not a trap.
function isInertHandler(expr) {
  if (!expr) return false;
  let s = expr.replace(/\s+/g, '');
  const p = s.match(/^\(?(\w*)\)?=>/);
  const param = p ? p[1] : '';
  s = s.replace(/^\(?\w*\)?=>/, '').replace(/[{};]/g, '');
  if (param) {
    const esc = param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    s = s.replace(new RegExp(`${esc}\\.(?:stopPropagation|preventDefault)\\(\\)`, 'g'), '');
  }
  return s === '';
}

const hasClick = (tag) => onClickExpr(tag) !== null && !isInertHandler(onClickExpr(tag));
const isDeclaredInert = (tag) =>
  // aria-hidden present and not explicitly false (bare `aria-hidden` = true).
  (hasAttr(tag, 'aria-hidden') && !/aria-hidden\s*=\s*(?:\{?\s*false|['"]false['"])/.test(tag)) ||
  /role\s*=\s*['"](?:presentation|none)['"]/.test(tag);
// An <a> with an href is natively keyboard-actionable; an <a> without href is a host.
const anchorIsInteractive = (tag) => hasAttr(tag, 'href');

// Per-file scan → { count }. `count` = keyboard-inoperable click handlers.
export function scanA11yViolations(text) {
  let count = 0;
  for (const name of HOST_TAGS) {
    for (const tag of openingTags(text, name)) {
      if (!hasClick(tag)) continue;
      if (hasKey(tag)) continue;
      if (isDeclaredInert(tag)) continue;
      count++;
    }
  }
  // Anchors: only those WITHOUT href are host elements.
  for (const tag of openingTags(text, 'a')) {
    if (!hasClick(tag)) continue;
    if (anchorIsInteractive(tag)) continue;
    if (hasKey(tag)) continue;
    if (isDeclaredInert(tag)) continue;
    count++;
  }
  return { count };
}
