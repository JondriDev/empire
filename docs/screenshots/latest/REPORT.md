# QA — Visual + Smoke Report · 2026-07-11 (re-confirm on green main `f0761ed`)

**No runtime bug found. No drift.** This run is a clean independent re-confirm: no app-code
commit landed since the last QA (`f0761ed` is itself that QA commit), so every metric reproduces
its committed value EXACTLY (Δ ±0). `metrics.mjs --assert-zero` exits **0**.

## Summary
- **Build:** 🟢 GREEN (`tsc -b && vite build`, 13.1s; PWA precache 91 entries / 3113 KiB).
- **Smoke:** **32/32 routes render clean** (desktop + all 31 registry apps) — 0 uncaught JS, 0 error boundaries, 0 console errors on every route.
- **Guards:** all **13 suites green** (see table).
- **Fitness metric (`offShellControls`):** **307 (b243/i44/s6/t14)**, Δ ±0 vs committed snapshot — EPIC-14 S2 (Reader 341→322) + S3 (Calendar 322→307) acceptances **still CONFIRMED**, net −34 holding.
- **Active epic:** EPIC-14 · Shell conformance. Next unstarted stage = **S4 (Clock 11 + Photos 12 → 0)**. Nothing shipped this run, so no acceptance metric was expected to move — 307 holding is CORRECT.

## Guard suite — 13/13 green
| Guard | Result |
|---|---|
| Routes render (desktop + 31 apps) | **32/32 PASS** (uncaught:0) |
| INBOUND-LANDS | 4/4 ✅ (calendar/editor, goals/notes, messages/ai-chat, mail/notes) |
| MEDIA-PERSISTS | 3/3 ✅ (music, video, photos) |
| GRAPH-LEGIBLE | 3/3 ✅ (reader/book, crypto/wallet, mail/draft) |
| GLOBAL-SEARCH | 1/1 ✅ (book+task, twoApps, tagOnly) |
| NODE-LINEAGE | 1/1 ✅ (5 axes) |
| INTENT-ROUNDTRIP | 2/2 ✅ (make-note-from, add-to-learning) |
| TIMELINE | 1/1 ✅ (6 axes) |
| HOME-ALIVE | 1/1 ✅ (The Bridge) |
| PROVENANCE-PERSISTS | 3/3 ✅ |
| PROVENANCE-ENTITY | 3/3 ✅ |
| PRECACHE-AUDIT | 91 entries, no gap ✅ |
| OFFLINE-BOOT | 5/5 ✅ (/, clock, maps, network, photos cold-offline) |

## Per-app render — 32/32 PASS
All PASS with uncaught:0. Env-expected network noise (NOT bugs):
- `maps` net:8 — CARTO tiles blocked (no outbound tile CDN).
- `weather` net:1 — geocode/geo blocked.
- `files` net:1, `mail` net:1 — 401 authed API (graceful, no error boundary).

## Metrics (Δ ±0 vs committed snapshot)
| Metric | Value | Δ |
|---|---|---|
| Apps / routes | 31 | ±0 |
| Test cases | 411 | ±0 |
| Test files | 52 | ±0 |
| Token violations | 0 | ±0 |
| Off-system utils | 0 | ±0 |
| Off-system style | 0 (r0/t0/m0) | ±0 |
| **Off-shell controls** | **307 (b243/i44/s6/t14)** | **±0** |
| Bundle gz (KB) | 730.2 | ±0 |

Top off-shell offenders (S4 targets in bold): FormBuilder 16, Calculator 14, DataCenter 14,
AIChat 13, Maps 12, **Photos 12**, **Clock 11**, Goals 10. Reader + Calendar stay off the list (migrated in S2/S3).

## Visual inspection (local screenshots, never committed)
- `desktop.png` — The Bridge "Good afternoon", 4 live stat cards (Today/Open Tasks/Goals/Organism), full launcher grid Cakra→Crypto (31 tiles). Clean.
- `reader.png` — S2 shelled: amber "Add book" Button + "+ Add your first book" primary Button, "Your library is empty" empty-state. No error boundary.
- `calendar.png` — S3 shelled: "Today" pill Button, month chevron IconButtons, solid teal "+ Add Event" primary Button, Today's-Events sidebar (Jul 11, Saturday highlighted). No error boundary.
- `clock.png`, `photos.png`, `network.png` — render clean (no error boundary).

## Epic-acceptance confirmation
EPIC-14 S2+S3 acceptance **RE-CONFIRMED** — `offShellControls` reproduces 307 exactly on green
main `f0761ed`. No stage shipped this run, so no new movement was expected; the ratchet holds.
▶ NEXT = **S4 (Clock 11 + Photos 12 → 0)** for the Builder.
