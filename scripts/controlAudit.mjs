// The Empire — off-shell CONTROL audit (design-system conformance III).
//
// The colour audit (tokenViolations / offSystemUtilities) locks the COLOUR axis;
// the style audit (scanStyleViolations) locks the RADII / TYPE / MOTION token
// axis. This module locks the LAST unlocked conformance axis: the COMPONENT
// shell. An app should render its interactive controls through the `ui` primitive
// layer (`Button` / `IconButton` / `Input` / `TextArea` / `Select` / `Segmented`)
// — NOT a bare `<button>` / `<input>` / `<select>` / `<textarea>`. A bare control
// bypasses the shell's glass surface, focus ring, spring motion, and a11y
// affordances, and is exactly how apps drift into raw-HTML islands.
//
// What counts as a bare (off-shell) control:
//   • <button>   — every lowercase opening tag. The capitalised `<Button>` /
//                  `<IconButton>` primitive is NOT a bare tag (regex is
//                  case-sensitive), so it is never counted.
//   • <select>   — every lowercase opening tag (the `Select` primitive wraps it).
//   • <textarea> — every lowercase opening tag (the `TextArea` primitive wraps it).
//   • <input>    — every lowercase opening tag EXCEPT type=file|checkbox|radio.
//                  Those three have no text-field primitive home (the `Input`
//                  primitive is a text field) and legitimately stay bare, so
//                  counting them would produce an un-driveable number.
//
// Pure & dependency-free: `scanControlViolations(text)` takes a file's text and
// returns per-dimension counts, so it is unit-pinned in controlAudit.test.mjs and
// reused by scripts/metrics.mjs over the same app-code file set the colour/style
// audits walk (minus src/components/ui/, whose primitives legitimately render the
// bare elements they wrap).

// Native input types that have no text-field primitive and legitimately stay bare.
const EXEMPT_INPUT_TYPES = new Set(['file', 'checkbox', 'radio']);

// Count lowercase opening `<name` tags whose next char is a tag boundary
// (whitespace, `/`, or `>`). Case-sensitive, so a capitalised component tag
// (`<Button`, `<Select`) is intentionally NOT matched.
function countTag(text, name) {
  const re = new RegExp(`<${name}(?=[\\s/>])`, 'g');
  return (text.match(re) || []).length;
}

// Walk every `<input` tag, returning its full opening-tag text (`<input ... >`).
// Scans to the real tag close, skipping `>` inside `{…}` JSX expressions and the
// `>` of a `=>` arrow function (both extremely common in `onChange` handlers), so
// the `type=` attribute is read correctly even on multi-line inputs.
function inputTags(text) {
  const tags = [];
  let i = 0;
  while ((i = text.indexOf('<input', i)) !== -1) {
    const boundary = text[i + 6];
    if (boundary && !/[\s/>]/.test(boundary)) { i += 6; continue; } // <inputlike → skip
    let depth = 0, end = -1;
    for (let j = i + 6; j < text.length; j++) {
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

function inputViolations(text) {
  let n = 0;
  for (const tag of inputTags(text)) {
    const m = tag.match(/type\s*=\s*['"]([a-zA-Z]+)['"]/);
    const type = m ? m[1].toLowerCase() : null;
    if (type && EXEMPT_INPUT_TYPES.has(type)) continue;
    n++;
  }
  return n;
}

// Per-file scan → { button, input, select, textarea, total }.
export function scanControlViolations(text) {
  const button = countTag(text, 'button');
  const input = inputViolations(text);
  const select = countTag(text, 'select');
  const textarea = countTag(text, 'textarea');
  return { button, input, select, textarea, total: button + input + select + textarea };
}
