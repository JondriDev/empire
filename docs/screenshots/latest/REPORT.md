# Visual & Smoke QA — 2026-07-13

**Tree:** green `main` `1ce7fe4` · build 🟢 (`tsc -b && vite build`, 13.7s) · served `node server.js` on :3001
**Verdict:** ✅ **32/32 routes render clean · all 14 guards green · no runtime bug · no DS drift.** The ACTIVE epic's target
metric reached **0 and is now LOCKED** (see below).

> **★ EPIC-14 S11 ACCEPTANCE CONFIRMED — `offShellControls` 49 → 0 (b0/i0/s0/t0).** The active-epic target metric MOVED to
> its terminal value: `node scripts/metrics.mjs` reports `Off-shell controls = 0 (b0/i0/s0/t0)` this run, down from the 49
> confirmed at the last QA (`124f8d9`). Every bare interactive control in app code is now rendered through the `ui` primitive
> layer. **★ S12 LOCK is in place AND BITES:** `scripts/metrics.mjs --assert-zero` gates `offShellControls` (`metrics.mjs:304`),
> **exits 0** on clean `main`, and I verified live that it **exits 1** when one bare `<button>` is reintroduced into an app
> file (`offShellControls=1 (b1/i0/s0/t0)`, reverted). The design-system trilogy (colour · tokens · **components**) is now
> fully enforced — islands can't creep back. **EPIC-14 is effectively CODE-COMPLETE (S1–S12).**
>
> **Housekeeping for the Strategist/Builder (not a bug):** the S12 checkbox in `docs/EPICS.md` is still `[ ]` even though the
> `--assert-zero` gate landed in `1ce7fe4` and bites; the S12 header-comment invariant in `src/components/ui/index.tsx`
> (*"a bare control in an app file fails CI"*) is NOT present. The metric itself is done and locked — only the doc checkbox +
> the header comment remain for the Builder, after which the Strategist can retire EPIC-14 → DONE.

## Route render table (32/32 clean — desktop + 31 registry apps)

| # | Route | Rendered | Uncaught JS | Net noise | Notes |
|---|-------|----------|-------------|-----------|-------|
| 1 | desktop | ✅ | 0 | 0 | Bridge "Good night" + 4 stat cards + full 32-tile launcher |
| 2 | calculator | ✅ | 0 | 0 | full sci keypad, coloured keys preserved (Button ghost) |
| 3 | calendar | ✅ | 0 | 0 | |
| 4 | clock | ✅ | 0 | 0 | |
| 5 | weather | ✅ | 0 | 1 | Open-Meteo/geolocation blocked (env) |
| 6 | grammar | ✅ | 0 | 0 | |
| 7 | language | ✅ | 0 | 0 | |
| 8 | music | ✅ | 0 | 0 | |
| 9 | video | ✅ | 0 | 0 | |
| 10 | files | ✅ | 0 | 1 | `/api/files` Android path 500 (env) |
| 11 | cache | ✅ | 0 | 0 | |
| 12 | browser | ✅ | 0 | 0 | |
| 13 | editor | ✅ | 0 | 0 | |
| 14 | notes | ✅ | 0 | 0 | |
| 15 | photos | ✅ | 0 | 0 | |
| 16 | datacenter | ✅ | 0 | 0 | |
| 17 | maps | ✅ | 0 | 8 | real Leaflet + zoom + OSM/CARTO attribution; tiles egress-blocked (env) |
| 18 | messages | ✅ | 0 | 0 | |
| 19 | prompt-generator | ✅ | 0 | 0 | |
| 20 | token-counter | ✅ | 0 | 0 | |
| 21 | learning-tracker | ✅ | 0 | 0 | |
| 22 | ai-chat (Cakra) | ✅ | 0 | 0 | Chat/Solver/Artifacts/Prompt/Tokens/Code Segmented tabs + Auto pill |
| 23 | goals | ✅ | 0 | 0 | |
| 24 | artifacts | ✅ | 0 | 0 | |
| 25 | network | ✅ | 0 | 0 | CORE mesh + full node-types legend (note…wallet/draft) |
| 26 | inbox | ✅ | 0 | 0 | |
| 27 | reader | ✅ | 0 | 0 | empty-library state, amber Add-book Buttons |
| 28 | search | ✅ | 0 | 0 | |
| 29 | timeline | ✅ | 0 | 0 | "No history yet" (fresh checkout) |
| 30 | solver | ✅ | 0 | 0 | |
| 31 | mail | ✅ | 0 | 1 | Himalaya/AgentMail Segmented + Refresh/Compose Buttons; "provider not configured" (env) |
| 32 | crypto | ✅ | 0 | 0 | |

All net noise is env-expected (blocked CDNs / authed-Android-only API calls) — **no uncaught JS exception, no error boundary,
no blank route** anywhere.

## Guard suite — 14/14 green

| Guard | Result |
|-------|--------|
| SHELL-IS-STYLED | ✅ top-level `.empire-desktop{position:fixed}`, 0 `.hide-sm` |
| REGISTRY-COVERAGE | ✅ smoke list ↔ registry match exactly (31 apps) |
| INBOUND-LANDS | ✅ 4/4 (calendar←editor, goals←notes, messages←ai-chat, mail←notes) |
| MEDIA-PERSISTS | ✅ 3/3 (music + video + photos survive reload) |
| GRAPH-LEGIBLE | ✅ 3/3 (reader/book + crypto/wallet + mail/draft) |
| GLOBAL-SEARCH | ✅ 1/1 (book+task+twoApps+tagOnly) |
| NODE-LINEAGE | ✅ 1/1 (rendered+title+persisted+search+clickable) |
| INTENT-ROUNDTRIP | ✅ 2/2 (make-note-from + add-to-learning) |
| TIMELINE | ✅ 1/1 (ordered+grouped+flow+persisted+filtered+descendants) |
| HOME-ALIVE | ✅ 1/1 (today+tasks+recent+land+ask) |
| PROVENANCE-PERSISTS | ✅ 3/3 (editor→notes/ai-chat/prompt-generator) |
| PROVENANCE-ENTITY | ✅ 3/3 (calculator→goals, editor→messages, notes→calendar) |
| PRECACHE-AUDIT | ✅ 90 entries (54 JS + 3 CSS); no gap |
| OFFLINE-BOOT | ✅ 5/5 routes boot cold-offline from precache |

## Auto metrics (`scripts/metrics.mjs`, `metrics.json` this run)

| Metric | Value | Δ vs last QA (`124f8d9`) |
|--------|-------|--------------------------|
| Apps / routes | 31 | ±0 |
| Test cases (src) | 460 | ±0 |
| Test files (src) | 64 | ±0 |
| Token violations | 0 | ±0 |
| Off-system utils | 0 | ±0 |
| Off-system style | 0 (r0/t0/m0) | ±0 |
| **Off-shell controls** | **0 (b0/i0/s0/t0)** | **49 → 0 (−49)** ★ |
| Bundle gz (KB) | 732.1 | −0.4 |

`node scripts/metrics.mjs --assert-zero` → **exit 0** (all four conformance axes at 0, ratchet holds — now including the
newly-locked `offShellControls`).

## Commits since last QA (`124f8d9`)
- `e819c6a` feat(ui): EPIC-14 S11 — migrate the last 49 off-shell controls onto the ui shell (49 → 0)
- `1ce7fe4` chore(deps): safe patch/minor bumps + lock offShellControls=0 as a CI guard

## Visually inspected (captured + read locally; never committed — `docs/screenshots/latest/*.png` is gitignored)
- `desktop.png` — Bridge "Good night", Ask-Cakra bar, 4 stat cards (Today/Tasks/Goals/Organism), full Cakra→Crypto launcher grid, dock. Glass/alien palette intact after the shell migration.
- `app-network.png` — CORE radial mesh + full node-types legend (note/task/message/learning/goal/prompt/wallet/draft/other).
- `app-ai-chat.png` — Cakra tabs migrated onto `ui.Segmented` (Chat active), Auto model pill, compose Input + teal send IconButton.
- `app-calculator.png` — full scientific keypad migrated to `Button ghost`; per-key inline colours (red C, amber operators/=) preserved verbatim; History panel.
- `app-maps.png` — real Leaflet container + `+/−` zoom + OSM/CARTO attribution + Search/Saved Segmented + city-chip Buttons + "Use My Location" (tiles grey, egress-blocked).
- `app-mail.png` — Himalaya/AgentMail provider Segmented + Refresh/Compose Buttons; graceful "Provider himalaya not configured", no error boundary.
- `app-reader.png` — empty-library state, amber "Add book" / "Add your first book" primary Buttons.
- `app-timeline.png` — "No history yet" empty state (fresh checkout).
- `app-artifacts.png`, `app-crypto.png` — clean.

**Runtime bugs found: none. DS drift: none.** The EPIC-14 shell migration is visually confirmed across every inspected app —
no broken controls, no bare-HTML islands, look fully preserved.
