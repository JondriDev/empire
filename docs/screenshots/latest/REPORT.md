# The Empire — Visual & Smoke QA Report

**Run:** 2026-07-03 · **Green main:** `fcfa06d` (EPIC-9 S1 — node-level lineage) · **Build:** 🟢 (tsc -b && vite build, 80 precache entries)

**No runtime bug found.** Main builds, serves, and renders clean end-to-end from a fresh cloud checkout.

---

## Headline — EPIC-9 S1 done-confirmed (per-artifact ancestry is legible)

First independent QA since EPIC-9 S1 landed (last QA `7ef9a5c` confirmed EPIC-8 S2 on `1db665e`; since then EPIC-8 S3 `4e6a78a` **and** EPIC-9 S1 `fcfa06d` landed). **EPIC-9 S1's target metric MOVED and is reproduced independently:**

- **`NODE-LINEAGE 0/1 → 1/1` ✅** — `rendered=true title=true persisted=true`. The guard seeds two graph-survivable `task` nodes (a parent + a child whose `data.from` = the parent id), loads `/app/inbox`, and asserts the child row renders a `[data-node-lineage=<parentId>]` element carrying the **parent's real entity title** — then reloads TWICE and the ancestry still resolves off the durable `empire-core-graph`. Node→node lineage, not app names.
- **Visually confirmed** (`s1-node-lineage-inbox.png`): the "Draft Q3 roadmap" Inbox task row shows its owning-app chip **plus** the NodeLineage trail `↖ ⌾ Quarterly planning source` — the actual ancestor entity title, exactly as EPIC-9 S1 promised. Self-hides when a node has no `data.from`.
- Backed by `nodeLineage.test.ts` (11 cases) — part of vitest **276/276** (builder shipped 265→276).

**No contradiction.** EPIC-8 (S1–S3) stays CODE-COMPLETE — `GLOBAL-SEARCH 1/1 ✅` (`tagOnly=true`) reproduced this run, so S3's filters/keyboard/summon did not regress the search corpus.

---

## Smoke — 28/28 render clean (desktop shell + 27 apps, 0 uncaught JS)

| Guard | Result |
|---|---|
| SHELL-IS-STYLED | ✅ top-level `.empire-desktop{position:fixed}`, 0 `.hide-sm .empire-desktop` |
| REGISTRY-COVERAGE | ✅ smoke list ↔ registry match exactly (27 apps) |
| Routes render (desktop + 27 apps) | **28/28 PASS** — 0 uncaught JS, 0 error-boundary, none blank |
| INBOUND-LANDS | 3/3 ✅ (editor→calendar, notes→goals, ai-chat→messages) |
| MEDIA-PERSISTS | 3/3 ✅ (music + video + photos survive reload) |
| GRAPH-LEGIBLE | 1/1 ✅ (Reader `.txt` book → `book` node in graph, re-mirrors after reload) |
| GLOBAL-SEARCH | 1/1 ✅ (`book=true task=true twoApps=true tagOnly=true`, groups reader,goals) |
| **NODE-LINEAGE** | **1/1 ✅ (`rendered=true title=true persisted=true`) — EPIC-9 S1 acceptance** |
| PROVENANCE-PERSISTS | 3/3 ✅ (editor→{notes,ai-chat,prompt-generator} edge ledger survives reload) |
| PROVENANCE-ENTITY | 3/3 ✅ (calculator→goals, editor→messages, notes→calendar per-entity `from`) |
| PRECACHE-AUDIT | ✅ 80 entries; 45 JS + 3 CSS chunks emitted, **no gap** |
| OFFLINE-BOOT | 5/5 ✅ routes boot cold-offline from precache |

### Per-app render (all PASS, uncaught:0)

desktop · calculator · calendar · clock · weather (net:1) · grammar · language · music · video · files (net:1) · cache · browser · editor · notes · photos · datacenter · maps (net:8) · messages · prompt-generator · token-counter · learning-tracker · ai-chat · goals · artifacts · network · inbox · reader · search

**Console/network errors — all env-expected, NOT bugs:** `maps` net:8 (OSM/CARTO tiles egress-blocked in cloud), `weather` net:1 (Open-Meteo API call), `files` net:1. No uncaught JS exceptions anywhere.

---

## Metrics (deltas vs the metrics.json the builder committed with EPIC-9 S1)

| Metric | Value | Δ |
|---|---|---|
| Apps / routes | 27 | ±0 |
| Test cases (static) | 234 | ±0 |
| Test cases (vitest) | 276/276 🟢 | ±0 |
| Test files (metrics / vitest) | 28 / 30 | ±0 |
| Token violations | 0 | ±0 |
| Off-system utilities | 0 | ±0 (`--assert-zero` exit 0) |
| Bundle gz (KB) | 698.1 | ±0 |

`node scripts/metrics.mjs --assert-zero` → **exit 0** (tokens 0, off-system 0). eslint clean. Metrics reproduce the builder's S1 snapshot exactly (Δ ±0 across the board).

---

## Cloud limits (honest)

- The `NodeLineage` render is confirmed both headless (the `NODE-LINEAGE` guard's DOM assertion) **and** visually (`s1-node-lineage-inbox.png`, a QA-seeded parent+child pair on `/app/inbox`). On-device with a real derived-entity corpus is the fuller visual.
- `maps` tiles are grey (OSM/CARTO egress-blocked) — the Leaflet container itself renders; expected env noise, not a regression.

## Screenshots in this folder

`desktop.png` + `app-<id>.png` × 27 + **`s1-node-lineage-inbox.png`** (EPIC-9 S1 lineage surface). Prior-epic ad-hoc shots (EPIC-6 memory panel, EPIC-6 S3 goals lineage) were pruned to keep the folder current.
