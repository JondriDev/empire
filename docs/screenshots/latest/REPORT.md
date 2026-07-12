# The Empire — Visual & Smoke QA Report

**Run:** 2026-07-12 · cloud · green `main` `9cbd322` (EPIC-14 **S7** — utility apps migrated onto the `ui` shell)
**Verdict:** ✅ **CLEAN — no runtime bug, no drift.** First independent QA since EPIC-14 S7 shipped.

## Headline
- **Build 🟢** (`tsc -b && vite build`, 13.3s; PWA precache 91 entries).
- **32/32 routes render clean** (desktop shell + all 31 registry apps) — **0 uncaught JS**, 0 error boundaries, 0 console errors on every route.
- **All 13 guard suites GREEN.**
- **`--assert-zero` exit 0** — design-system ratchet holds (token/util/style all 0).
- **Active-epic target `offShellControls` reproduces EXACTLY: `162 (b133/i17/s2/t10)`, Δ ±0 → EPIC-14 S7 acceptance (utility apps 204 → 162, −42) CONFIRMED.** All five S7 files (DataCenter/Maps/Files/Weather/Grammar) off the offenders list.

## Route render table (32/32 pass)
| Route | Rendered | uncaught | net | Notes |
| --- | --- | --- | --- | --- |
| desktop | ✅ | 0 | 0 | The Bridge "Good morning" + 4 live stat cards + full 26-tile launcher |
| calculator | ✅ | 0 | 0 | |
| calendar | ✅ | 0 | 0 | |
| clock | ✅ | 0 | 0 | |
| weather | ✅ | 0 | 1 | graceful "Failed to fetch" (Open-Meteo geo env-blocked), no boundary |
| grammar | ✅ | 0 | 0 | **S7 shelled** — Check/Fix Buttons + borderless TextArea |
| language | ✅ | 0 | 0 | |
| music | ✅ | 0 | 0 | |
| video | ✅ | 0 | 0 | |
| files | ✅ | 0 | 1 | **S7 shelled** — graceful "Failed to load directory / HTTP 401 / Retry", no boundary |
| cache | ✅ | 0 | 0 | |
| browser | ✅ | 0 | 0 | |
| editor | ✅ | 0 | 0 | |
| notes | ✅ | 0 | 0 | |
| photos | ✅ | 0 | 0 | |
| datacenter | ✅ | 0 | 0 | **S7 shelled** — sidebar/table-tab/New-table Buttons, inline `seamless` cells, Analyze Button, trash IconButtons |
| maps | ✅ | 0 | 8 | **S7 shelled** — Segmented tabs, Input+search IconButton, city-chip Buttons, plasma "Use My Location"; Leaflet tiles grey (CARTO env-blocked) |
| messages | ✅ | 0 | 0 | |
| prompt-generator | ✅ | 0 | 0 | |
| token-counter | ✅ | 0 | 0 | |
| learning-tracker | ✅ | 0 | 0 | |
| ai-chat | ✅ | 0 | 0 | |
| goals | ✅ | 0 | 0 | |
| artifacts | ✅ | 0 | 0 | |
| network | ✅ | 0 | 0 | |
| inbox | ✅ | 0 | 0 | |
| reader | ✅ | 0 | 0 | |
| search | ✅ | 0 | 0 | |
| timeline | ✅ | 0 | 0 | |
| solver | ✅ | 0 | 0 | |
| mail | ✅ | 0 | 1 | graceful "Provider not configured" (401), no boundary |
| crypto | ✅ | 0 | 0 | |

## Guard suite (13/13 green)
- SHELL-IS-STYLED ✅ · REGISTRY-COVERAGE ✅ (smoke ↔ registry exact, **31 apps**)
- INBOUND-LANDS **4/4** ✅ (calendar←editor, goals←notes, messages←ai-chat, mail←notes)
- MEDIA-PERSISTS **3/3** ✅ (music/video/photos — IDB path survives)
- GRAPH-LEGIBLE **3/3** ✅ (reader/book, crypto/wallet, mail/draft)
- GLOBAL-SEARCH **1/1** ✅ · NODE-LINEAGE **1/1** ✅ (5 axes)
- INTENT-ROUNDTRIP **2/2** ✅ (make-note-from, add-to-learning)
- TIMELINE **1/1** ✅ (6 axes) · HOME-ALIVE **1/1** ✅
- PROVENANCE-PERSISTS **3/3** ✅ · PROVENANCE-ENTITY **3/3** ✅
- PRECACHE-AUDIT **91 entries, no gap** ✅ (55 JS + 3 CSS emitted, all precached)
- OFFLINE-BOOT **5/5** ✅ (`/`, `/app/clock`, `/app/maps`, `/app/network`, `/app/photos` boot cold-offline)

## Metrics (Δ vs committed S7 snapshot)
| Metric | Value | Δ |
| --- | --- | --- |
| Apps / routes | 31 | ±0 |
| Test cases | 458 | ±0 |
| Test files | 64 | ±0 |
| Token violations | 0 | ±0 |
| Off-system utils | 0 | ±0 |
| Off-system style | 0 (r0/t0/m0) | ±0 |
| **Off-shell controls** | **162 (b133/i17/s2/t10)** | **±0** |
| Bundle gz (KB) | 731 | ±0 |

Top off-shell offenders now (S7 files all gone): Calculator 14, AIChat 13, Goals 10, Editor 9, PromptGenerator 9, AgentSurface 8, SolverPanel 8, Desktop 8. → **▶ EPIC-14 S8** (standalone tool + entity apps, 40 → 0; `162 → 122`).

## Visual inspection (local PNGs, never committed)
- `desktop.png` — The Bridge "Good morning · Sunday July 12", Ask-Cakra Input, 4 stat cards (Today/Open Tasks/Goals/Organism all 0-state), full launcher grid Cakra→Crypto. Clean.
- `datacenter.png` — S7 shelled: Ask-Cakra + Tasks/Ideas table-tab + New-table Buttons, seeded 2-row Tasks table with `seamless` inline cells, "Analyze with Cakra" Button, trash IconButtons, "Add a row…" + `+` IconButton.
- `maps.png` — S7 shelled: Segmented Search/Saved tabs, Input search bar + plasma search IconButton, Tokyo/London/…/Singapore city-chip Buttons, plasma "Use My Location" Button, real Leaflet container (tiles grey — CARTO env-blocked, expected).
- `files.png` — S7 shelled: refresh/Up/Home IconButtons, breadcrumb + quick-path chip Buttons (Internal Storage active teal), Input search, graceful "Failed to load directory / HTTP 401 / Retry" (no Android file API — env-expected), no boundary.
- `weather.png` — S7 shelled: refresh/settings IconButtons, 4 stat cards, graceful "Failed to fetch" (geo env-blocked), no boundary.
- `grammar.png` — S7 shelled: Check/Fix mode-toggle Buttons, borderless transparent TextArea ("Paste or type text…"), "0 words · 0 issues found".
- `network.png` — CORE mesh renders, legend intact.

## Env-expected noise (NOT bugs)
- Maps CARTO/Nominatim tiles (net:8) — outbound blocked in cloud.
- Weather Open-Meteo geolocation (net:1) — graceful "Failed to fetch".
- Files / Mail 401 (net:1 each) — Android/authed-only APIs; both render graceful states, no error boundary.

**No runtime bug. No drift. EPIC-14 S7 done-confirmed (acceptance metric moved 204→162).**
