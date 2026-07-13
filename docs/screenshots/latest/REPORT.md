# The Empire — Visual & Smoke QA Report

**Run:** 2026-07-13 · green main `90077c8` · fresh cloud checkout
**Verdict:** 🟢 GREEN — build passes, **32/32 routes render clean**, all 14 guard suites green, `--assert-zero` exit 0. **No runtime bug found.**

> **No runtime bug this run.** Nothing to escalate to the build routine.

## Headline

- **Build:** 🟢 `tsc -b && vite build` — precache **90 entries** (3131 KiB), 0 errors.
- **Routes rendering clean: 32/32** (desktop + all **31** registry apps). 0 uncaught JS, 0 error boundaries, 0 blank routes.
- **ACTIVE epic = EPIC-15 (Keyboard operability, WCAG 2.1.1).** Target metric `keyboardA11y 24 → 0`. This run it sits at **24 (±0)**, its S1 baseline — **S1 is measure-only (drives nothing); S2 is the first mover**, so there is no acceptance to confirm yet. Consistent, no contradiction, no regression.
- **Design-system ratchet holds:** all five conformance axes 0 and gated (`tokenViolations`/`offSystemUtilities`/`offSystemStyle`/`offShellControls` = 0; `keyboardA11y` measured but not yet gated). `--assert-zero` exit 0.

## Pass/fail table (per route)

All 32 routes: **PASS** (rendered without crash — no uncaught JS exception, no error boundary, not blank).

| Route | Result | uncaught | console/net notes |
|---|---|---|---|
| desktop | PASS | 0 | clean |
| calculator, clock, grammar, language, music, video, cache, browser, editor, notes, photos, datacenter, messages, prompt-generator, token-counter, learning-tracker, ai-chat, goals, artifacts, network, inbox, reader, search, timeline, solver, crypto, calendar | PASS | 0 | clean |
| weather | PASS | 0 | net:1 + Geolocation policy — **env-expected** (Open-Meteo geocoding `ERR_TUNNEL_CONNECTION_FAILED`, Geolocation blocked by permissions policy) |
| maps | PASS | 0 | net:8 — **env-expected** (CARTO/OSM tile PNGs egress-blocked; Leaflet container + zoom + attribution render) |
| files | PASS | 0 | net:1 (401) — **env-expected** (authed/Android-only `/api/files`; graceful failure, no boundary) |
| mail | PASS | 0 | net:1 (401) — **env-expected** (authed mail API; graceful "provider not configured", no boundary) |

**Console errors** were emitted ONLY by the four routes above, and every one is a blocked-egress / authed-API / permissions-policy artifact — **none is a product bug.**

## Guard suite (all green)

- SHELL-IS-STYLED ✅ (top-level `.empire-desktop{position:fixed}`, 0 `.hide-sm .empire-desktop`)
- REGISTRY-COVERAGE ✅ (smoke list ↔ registry match exactly, **31 apps**)
- INBOUND-LANDS **4/4 ✅** (calendar←editor, goals←notes, messages←ai-chat, mail←notes — each shows "Received from …" chip + prefilled control)
- MEDIA-PERSISTS **3/3 ✅** (music + video + photos — added + survived-reload)
- GRAPH-LEGIBLE **3/3 ✅** (reader/book + crypto/wallet + mail/draft)
- GLOBAL-SEARCH **1/1 ✅** (book + task + twoApps + tagOnly; groups reader,goals)
- NODE-LINEAGE **1/1 ✅** (rendered + title + persisted + search + clickable)
- INTENT-ROUNDTRIP **2/2 ✅** (make-note-from + add-to-learning — stored + mirrored + persisted)
- TIMELINE **1/1 ✅** (all 6 axes: ordered + grouped + flow + persisted + filtered + descendants)
- HOME-ALIVE **1/1 ✅** (today + tasks + recent + land + ask)
- PROVENANCE-PERSISTS **3/3 ✅** (editor→notes, editor→ai-chat, editor→prompt-generator)
- PROVENANCE-ENTITY **3/3 ✅** (calculator→goals, editor→messages, notes→calendar)
- PRECACHE-AUDIT ✅ **90 entries; 54 JS + 3 CSS chunks — no gap** (every emitted chunk in the SW precache)
- OFFLINE-BOOT **5/5 ✅** (`/`, `/app/clock`, `/app/maps`, `/app/network`, `/app/photos` boot cold-offline from precache)

`scripts/qa-smoke.mjs`: **32/32 passed, 0 failed.**

## Metrics (fitness field) — Δ vs committed snapshot

| Metric | Value | Δ |
|---|---|---|
| Apps / routes | 31 | ±0 |
| Test cases | 465 | +1 |
| Test files | 65 | ±0 |
| Token violations | 0 | ±0 |
| Off-system utils | 0 | ±0 |
| Off-system style | 0 (r0/t0/m0) | ±0 |
| Off-shell controls | 0 (b0/i0/s0/t0) | ±0 |
| **Keyboard a11y (EPIC-15 target)** | **24** | **±0** (S1 baseline — S2 is first mover) |
| Bundle gz (KB) | 732.2 | +0.1 |

`node scripts/metrics.mjs --assert-zero` → **exit 0** (all five gated axes hold).

## Epic-acceptance confirmation

**EPIC-15 (ACTIVE) — Keyboard operability.** Target `keyboardA11y 24 → 0`, then LOCK.
- S1 (measure — detector + baseline): SHIPPED (`79c9272`). Baseline `keyboardA11y = 24` **reproduced exactly** on this fresh checkout across 16 files (Calendar 3, Photos 3, Flashcards 2, Files 2, Maps 2, Recents 2, …).
- S2/S3/S4: not yet landed. **The target metric has not moved yet — and is not expected to,** since S1 is pure-additive measurement. **No done-confirmation and no contradiction this run.** Next mover is S2 (sweep the app cluster, ~24 → ~8).

## Visual inspection (screenshots captured + read locally — NONE committed)

- `desktop.png` — The Bridge: "Good morning · **MONDAY, JULY 13**" (date correct — 2026-07-13 is a Monday), 4 live stat cards (Today/Open Tasks/Goals/Organism), full launcher Cakra→Crypto, Earth-from-Space glass palette + alien glyphs intact.
- `app-calendar.png` — July 2026, the **13th highlighted under the Mon column**, side panel reads "13 July 2026 **Monday**" → calendar date logic correct.
- `app-maps.png` — real Leaflet container with +/- zoom + OSM/CARTO attribution; tiles grey (egress-blocked — env-expected, not a bug).
- All remaining routes render clean per the smoke harness.

## Env-expected noise (NOT bugs)

- weather → Open-Meteo geocoding + Geolocation blocked (permissions policy + tunnel-blocked egress).
- maps → CARTO/OSM dark tile PNGs egress-blocked (Leaflet container + attribution still render).
- files / mail → 401 on the authed/Android-only API (graceful empty state, no error boundary).

---
*Working artifacts only. Screenshots live in this run's workspace (`docs/screenshots/latest/*.png` is gitignored) and are never committed. The human views the live PWA at jondridev.github.io/empire.*
