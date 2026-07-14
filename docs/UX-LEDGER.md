# UX Ledger — the UI/UX Director's rotation

Owner: the **UI/UX Director** routine (2×/day) — one cross-cutting axis per
run, swept across ALL surfaces, fixed at the system level (token / primitive /
shared component) so apps inherit. The App Artisan and Bug Hunter drop
system-level leads in the inbox below instead of forking local variants.

## Axis rotation (least-recently-visited first; QA-flagged breakage jumps the queue)

| Axis | Last visited | Notes |
|---|---|---|
| Touch targets & thumb reach | never | hover-only affordances were a recurring per-app trap (Files/Music/Video fixed individually — sweep for the class) |
| Empty/loading/error state consistency | never | several apps got honest-state passes one by one; audit the rest against a shared pattern |
| Toast/dialog/confirmation patterns | never | Cache Cleaner got an alertdialog gate 2026-07-12; audit other destructive actions |
| Motion & prefers-reduced-motion | never | parked ROADMAP polish item; ease/dur tokens exist |
| Contrast & type ramp | never | |
| i18n EN/ID parity | never | src/lib/i18n.ts; hunt hardcoded strings |
| Perceived performance | never | skeletons/transitions; bundle-gz watched by metrics |
| First-run/onboarding clarity | never | |
| Keyboard flow & focus-visible | 2026-07-13 (EPIC-15 got keyboardA11y to 0 & locked) | revisit last — verify focus-VISIBLE styling + tab order, the axis the metric can't see |

- Next axis: **Touch targets & thumb reach** — seeded 2026-07-15.

## Inbox (system-level leads from other routines)

_(empty — seeded 2026-07-15 with the Fleet v3 upgrade)_

## Findings & visit log (newest first)

_(none yet)_
