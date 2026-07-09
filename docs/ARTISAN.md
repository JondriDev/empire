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

## ▶ NEXT: `language` (Language Lab)

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
| language | — | ◀ NEXT |
| music | — | — |
| video | — | — |
| files | — | — |
| cache | — | — |
| browser | — | — |
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
