# UX Ledger — the UI/UX Director's rotation

Owner: the **UI/UX Director** routine (2×/day) — one cross-cutting axis per
run, swept across ALL surfaces, fixed at the system level (token / primitive /
shared component) so apps inherit. The App Artisan and Bug Hunter drop
system-level leads in the inbox below instead of forking local variants.

## Axis rotation (least-recently-visited first; QA-flagged breakage jumps the queue)

| Axis | Last visited | Notes |
|---|---|---|
| Empty/loading/error state consistency | never | several apps got honest-state passes one by one; audit the rest against a shared pattern |
| Toast/dialog/confirmation patterns | never | Cache Cleaner got an alertdialog gate 2026-07-12; audit other destructive actions |
| Motion & prefers-reduced-motion | never | parked ROADMAP polish item; ease/dur tokens exist |
| Contrast & type ramp | never | |
| i18n EN/ID parity | never | src/lib/i18n.ts; hunt hardcoded strings |
| Perceived performance | never | skeletons/transitions; bundle-gz watched by metrics |
| First-run/onboarding clarity | never | |
| Keyboard flow & focus-visible | 2026-07-13 (EPIC-15 got keyboardA11y to 0 & locked) | revisit last — verify focus-VISIBLE styling + tab order, the axis the metric can't see |
| Touch targets & thumb reach | 2026-07-16 | coarse-pointer floor shipped (see below); **remaining:** seamless-Input in dense grids (DataCenter cells) deliberately left out — needs a grid-safe approach; verify no phone-320 horizontal overflow on dense IconButton rows on-device |

- Next axis: **Empty/loading/error state consistency** — least-recently-visited standing axis.

## Inbox (system-level leads from other routines)

_(empty — seeded 2026-07-15 with the Fleet v3 upgrade)_

## Findings & visit log (newest first)

### 2026-07-16 · Touch targets & thumb reach — coarse-pointer floor at the primitive layer
- **Audit (all surfaces, via the `ui` primitive classes every app renders through):** the primitives are mouse-dense and under the ~44px thumb minimum (Apple HIG / WCAG 2.5.5 AAA):
  | Primitive | class | size before | on touch (after) |
  |---|---|---|---|
  | IconButton sm/md/lg | `.empire-icon-btn` | 28 / 34 / 42px | ≥44×44 |
  | Button sm/md | `.empire-btn` | ~28 / ~34px tall | ≥44 tall |
  | Segmented item | `.empire-segmented button` | ~28px tall | ≥44 tall |
  | Slider | `.empire-slider` | 4px track (hit box) | ≥44 hit box |
  | Select | `.empire-select-field` | 38px | ≥44 |
  | Input | `.empire-input-wrap` | 38px | **left as-is** (see remaining) |
  - 164 IconButtons across apps (30 at `sm`=28px) all inherited the fix for free — no per-app edits.
- **Fix (system level, `src/design-system.css`):** new `--tap-min: 44px` token + a single `@media (pointer: coarse)` block clamping the primitive classes UP to `--tap-min` (`min-height`, plus `min-width` on IconButton). `min-*` wins over each primitive's smaller inline `width/height`, so visible chrome is untouched where already ≥44px; only the too-small controls grow. **Desktop (fine pointer) is completely unaffected — density preserved.** `touch-action: manipulation` was already global on `.empire-desktop` (no 300ms delay to fix).
- **Locked by** `src/design-system/touch-targets.test.ts` (source-contract assertion — jsdom can't evaluate `@media (pointer: coarse)`, so it asserts the token ≥44px + each selector floored inside the coarse block + the floor is NOT at top level).
- **Deliberately deferred:** `.empire-input-wrap` (seamless variant is inline spreadsheet-cell edit; a 44px floor could distort dense DataCenter grid rows — a visual regression I can't verify headless). Revisit with a grid-aware approach or a `data-` opt-out.
