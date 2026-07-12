# App Artisan — Rotation Ledger

> The App Artisan visits ONE surface per run and ships the single highest-value
> craft-level fix/polish for it (a real bug fix, a UX state — empty/loading/error,
> an a11y/keyboard/touch-target pass, a reduced-motion honor, a code-quality lift).
> This file is the **rotation ledger**: the surface list, whose turn it is, and a
> one-line per-visit note. Pick the **least-recently-visited** surface each run; a
> QA-flagged broken surface jumps to the front. Recount surfaces from
> `src/lib/registry.ts` — the app catalog is the truth.

**Rules**
- One surface per run. Depth on one beats shallow edits everywhere.
- Mark the surface visited (date + one-line what-shipped) and set `▶ NEXT`.
- Reduced-motion is already global (`design-system.css` `@media (prefers-reduced-motion: reduce)` neutralizes all animation/transition) — per-surface reduced-motion work is only needed for JS-driven motion (e.g. Network canvas already guards `matchMedia`).

---

## ▶ NEXT: `browser`

(continue down the registry order, wrapping back to the top after The Bridge.)

---

## Surface rotation (seeded 2026-07-06 from registry.ts — 24 launcher apps + hidden Cakra-tab tools + The Bridge)

Newest-visited float to the bottom of the "visited" understanding; unvisited = never touched by the Artisan yet.

| Surface | Last visited | What shipped |
|---|---|---|
| **weather** | 2026-07-06 | Settings dialog a11y: `role="dialog"`+`aria-modal`+`aria-labelledby`, Escape-to-close, autofocus + focus-restore to trigger, `aria-label`s on refresh/settings/close icon buttons, label↔input association, Enter-to-save. +`Weather.test.tsx` (4). |
| ai-chat (Cakra · chat tab) | — | — |
| calculator | — | — |
| calendar | — | — |
| clock | — | — |
| grammar | 2026-07-09 | a11y pass: `aria-pressed` on the Check/Fix segmented toggle (state was colour-only) + `role="group"`, `aria-label` on the textarea, `aria-live="polite"` on the issue-count subtitle, `role="status"` on the clean-text banner, decorative glyphs `aria-hidden`. +`Grammar.test.tsx` (5). |
| language | 2026-07-10 | a11y + honest-state pass: `aria-label`s on the from/to `<select>`s, swap button, textarea, copy/save/delete icon buttons; `aria-pressed` on the Phrases toggle (was colour-only); decorative glyphs `aria-hidden`; `role="status"` on the loading line + `aria-live="polite"` on the result. **UX bug fixed:** translation failures were rendered inside the green `border-success` box — now a distinct `role="alert"` red channel (separate `error` state). +`Language.test.tsx` (5). |
| music | 2026-07-10 | a11y + touch pass: accessible names on every icon-only transport control (play/pause, prev, next, shuffle, repeat, mute) + the seek/volume sliders; `aria-pressed` on shuffle/repeat/mute (state was colour-only) + Repeat's label names its mode (off/all/one); Now Playing wrapped `role="status" aria-live="polite"` so track changes announce; decorative glyphs `aria-hidden`. **Touch bug fixed:** the per-track remove ✕ was `opacity-0 group-hover:opacity-100` — invisible/unreachable on a phone (no hover); now `opacity-60` base + hover/focus emphasis. +`Music.test.tsx` (5). |
| video | 2026-07-11 | a11y + touch pass (mirrors Music): accessible names on every icon-only transport control (play/pause, back/forward 10s, mute, fullscreen) + the playlist-toggle + seek/volume sliders; `aria-pressed` on mute + the active playback-speed + the playlist toggle (state was colour-only) + `role="group"` on the speed strip; `aria-valuetext` (human time) on the seek slider; Now Playing title wrapped `role="status" aria-live="polite"`; decorative glyphs `aria-hidden`. **Touch bug fixed:** the per-item remove ✕ was `opacity-0 group-hover:opacity-100` — invisible/unreachable on a phone (no hover); now `opacity-60` base + hover/focus emphasis. +`Video.test.tsx` (5). |
| files | 2026-07-11 | a11y + touch pass: `aria-label`s on the icon-only refresh/up/home + per-file download/preview + dir-expand controls (`aria-expanded`); `aria-label` on the search box; `aria-pressed` on the quick-path chips (active was colour-only); `<nav aria-label>` + `aria-current="page"` on the breadcrumb; `role="status"` loading + `role="alert"` load-failure; decorative glyphs `aria-hidden`. **Touch bug fixed:** per-file action row was `opacity-0 group-hover:opacity-100` — invisible/unreachable on a phone (no hover); now `opacity-60` base + hover/focus emphasis (mirrors Music/Video). **Honest-state:** Up now truly `disabled` at internal-storage root (visual said disabled, behaviour still navigated up); empty-state copy splits empty-folder vs no-search-match. +`Files.test.tsx` (6). |
| cache | 2026-07-12 | Destructive-action safety + honest-state + a11y: **Clear All / Clear Selected now arm a confirmation** (`role="alertdialog"` bar naming count + bytes + "can't be undone") — first tap arms, "Delete forever" executes; previously Clear All wiped **every app's localStorage** on a single tap with no gate. Disabled honest-states (Clear Selected off when 0 selected; Select All / Clear All off when 0 entries). **Latent bug fixed:** the "✓ Freed X" success banner never showed — `removeEntries` set `freed` then `scan()` reset it to 0 in the same batched handler; removal now refreshes the list in place and preserves the banner. a11y: `role="status"` on freed banner + loading Card (`aria-label="Scanning cache"`), `aria-label="Rescan cache"` on the ⟳ icon button, `aria-live="polite"` on the count line, decorative ⟳/✓ `aria-hidden`. +`CacheCleaner.test.tsx` (6). |
| browser | — | ◀ NEXT |
| notes | — | — |
| photos | — | — |
| datacenter | — | — |
| maps | — | — |
| messages | — | — |
| learning-tracker | — | — |
| goals | — | — |
| network | — | — |
| inbox | — | — |
| reader | — | — |
| search | — | — |
| timeline | — | — |
| Cakra tab · reader | — | — |
| Cakra tab · solver | — | — |
| Cakra tab · artifacts | — | — |
| Cakra tab · code (editor) | — | — |
| Cakra tab · prompt (prompt-generator) | — | — |
| Cakra tab · tokens (token-counter) | — | — |
| The Bridge (home shell) | — | — |

---

## Craft heuristics (per-visit checklist — apply what fits the surface)
- **States:** does it have a real empty / loading / error state? Adopt `<EmptyState>` (`src/components/ui/Utility.tsx`, `size="sm"` for narrow sub-lists) for collection-empties.
- **a11y:** modals need `role="dialog"`+`aria-modal`+`aria-labelledby` + Escape + focus-restore (idiom: `src/apps/notes/Notes.tsx:166`, now also `weather/Weather.tsx`); icon-only buttons need `aria-label`; inputs need a programmatic label; decorative glyphs get `aria-hidden`.
- **Touch targets:** phone-first — tappable ≥ ~40px.
- **Tokens:** any raw hex/radius/type/easing you touch → tokenize (`--radius-*`/`--text-*`/`--ease-*`); `node scripts/metrics.mjs --assert-zero` must stay green.
- **Proof:** prefer a change a vitest test or guard can lock. Component a11y is jsdom-testable (roles, aria, Escape, label association) — see `weather/Weather.test.tsx`.
