# The Empire — Visual + Smoke QA Report

**Run:** 2026-07-03T18:08Z (cloud, unattended) · **Build:** 🟢 GREEN (`tsc -b && vite build`, built in 10.8s)
**Commit under test:** `f878844` — *feat(lineage): EPIC-9 S2 — node-lineage on the Network inspector + Search*
**This is the FIRST independent QA of EPIC-9 S2** (last QA `b71ffe4` confirmed `436cebf` The Bridge; since then
`f878844` EPIC-9 S2 landed).

## ✅ No runtime bug found. All 28/28 routes render clean. EPIC-9 S2 acceptance CONFIRMED MOVED, LIVE.

---

## Headline

- **Build 🟢**, **vitest 288/288** (31 files), **eslint clean**, `metrics.mjs --assert-zero` exit 0 (tokens 0, off-system 0).
- **28/28 smoke routes render clean** (desktop + 27 registry apps) — 0 uncaught JS, 0 error boundaries, 0 blank screens.
- **EPIC-9 S2 target metric CONFIRMED:** the `NODE-LINEAGE` guard passes with its new 4th axis independently —
  **`NODE-LINEAGE 1/1 ✅` `rendered=true title=true persisted=true search=true`**. The `search=true` axis is exactly
  what S2 added: a derived child entity surfaces its real ancestor trail on a **Search** result row (`[data-node-lineage=qa-lineage-parent]`),
  proving node-lineage now renders on the S2 display surfaces (Network inspector + Search), not just Inbox (S1).
- Every other guard green (see table).

## Guard / assertion results

| Guard | Result |
|---|---|
| SHELL-IS-STYLED | ✅ top-level `.empire-desktop{position:fixed}`, 0 `.hide-sm .empire-desktop` |
| REGISTRY-COVERAGE | ✅ smoke list ↔ registry match exactly (27 apps) |
| Route smoke | ✅ **28/28** (desktop + 27 apps) render clean |
| INBOUND-LANDS | ✅ **3/3** (calendar←editor, goals←notes, messages←ai-chat) |
| MEDIA-PERSISTS | ✅ **3/3** (music, video, photos — real IDB roundtrip survives reload) |
| GRAPH-LEGIBLE | ✅ **1/1** (reader/book graph node persisted) |
| GLOBAL-SEARCH | ✅ **1/1** `book=true task=true twoApps=true tagOnly=true` (groups reader,goals) |
| **NODE-LINEAGE** (EPIC-9 acceptance) | ✅ **1/1** `rendered=true title=true persisted=true` **`search=true`** ← S2 axis |
| HOME-ALIVE | ✅ **1/1** `today tasks recent land ask` all present (The Bridge) |
| PROVENANCE-PERSISTS | ✅ **3/3** (editor→notes/ai-chat/prompt-generator) |
| PROVENANCE-ENTITY | ✅ **3/3** (calculator→goals, editor→messages, notes→calendar) |
| PRECACHE-AUDIT | ✅ 81 entries; 46 JS + 3 CSS — no gap (every emitted chunk precached) |
| OFFLINE-BOOT | ✅ **5/5** cold-offline (`/`, `/app/clock`, `/app/maps`, `/app/network`, `/app/photos`) |

## Per-route smoke table (uncaught JS : network errors)

All 28 **PASS**. Non-zero `net` counts are env-expected (blocked CDNs / Android-only API), NOT regressions:

| Route | uncaught | net | Route | uncaught | net |
|---|---|---|---|---|---|
| desktop | 0 | 0 | datacenter | 0 | 0 |
| calculator | 0 | 0 | maps | 0 | **8** (CARTO/OSM tiles egress-blocked) |
| calendar | 0 | 0 | messages | 0 | 0 |
| clock | 0 | 0 | prompt-generator | 0 | 0 |
| weather | 0 | **1** (Open-Meteo geocode/geo blocked) | token-counter | 0 | 0 |
| grammar | 0 | 0 | learning-tracker | 0 | 0 |
| language | 0 | 0 | ai-chat | 0 | 0 |
| music | 0 | 0 | goals | 0 | 0 |
| video | 0 | 0 | artifacts | 0 | 0 |
| files | 0 | **1** (`/api/files` Android-only path) | network | 0 | 0 |
| cache | 0 | 0 | inbox | 0 | 0 |
| browser | 0 | 0 | reader | 0 | 0 |
| editor | 0 | 0 | search | 0 | 0 |
| notes | 0 | 0 | photos | 0 | 0 |

**Env-expected non-bugs (not regressions):** `weather`→Open-Meteo geocoding + Geolocation blocked (net:1);
`maps`→CARTO/OSM dark tiles blocked, Leaflet container + attribution still render (net:8); `files`→`/api/files`
500 (Android-only device FS path). Identical pattern to every prior run.

## Metric deltas (vs prior QA snapshot `436cebf`)

| Metric | Value | Δ |
|---|---|---|
| Apps / routes | 27 | ±0 |
| Test cases (static) | 246 | ±0 |
| Test cases (vitest) | 288 | ±0 |
| Test files (static) | 29 | ±0 |
| Token violations | 0 | ±0 |
| Off-system utilities | 0 | ±0 |
| Bundle gz (KB) | 701.2 | ±0 |

Every auto-metric reproduces the builder's EPIC-9 S2 snapshot exactly (Δ ±0) — no regression, no contradiction.
The S2 change was a display-surface mount reusing the S1 component + walker verbatim (no new logic, no new deps),
so a flat metric line is expected and correct.

## Epic-acceptance confirmation

- **▶ EPIC-9 · Node-level lineage — S2 done-confirmed (independent).** The acceptance axis reproduced without the
  builder's tree: `NODE-LINEAGE 1/1` now carries the **`search=true`** fourth axis that S2 introduced — a derived child
  `task` node whose `data.from`=a parent surfaces its real ancestor entity on a Search result row, and it still resolves
  after reload (durable `empire-core-graph`). This confirms S2's leap: node-lineage is legible on the two
  graph-node-rendering views (Network inspector + Search), not just Inbox.
- **Cloud limit (honest):** the Network-inspector entity-list lineage is a visual/on-device render — driving a canvas
  node-click headless is fragile, so the **Search** axis carries the mount roundtrip; the inspector reuses the same
  unit-pinned `<NodeLineage>` component + `nodeLineageOf` walker (`nodeLineage.test.ts`, 11 cases, in vitest 288).
- **EPIC-8 stays CODE-COMPLETE:** `GLOBAL-SEARCH 1/1` held (`tagOnly=true`), so S2's Search-row change did not regress
  the search corpus.
- **▶ NEXT = EPIC-9 S3** — make node-lineage NAVIGABLE (the display surfaces exist; S3 is the click layer:
  each `<NodeLineage>` hop → `openEntity(app, nodeId)`). Seam noted in CONTEXT.md.

## Screenshots (overwritten in this folder)

`desktop.png` (The Bridge — "Good evening", Ask-Cakra bar, 4 live stat cards, 24-tile launcher grid) + `app-*.png`
for all 27 registry apps. Visually re-confirmed clean & styled: The Bridge home, Search (styled field + "Find anything,
anywhere" empty state, "2 things in the graph"), Network mesh, Inbox. `s1-node-lineage-inbox.png` retained as the S1
visual (the "Draft Q3 roadmap" row rendering `↖ ⌾ Quarterly planning source`, a real ancestor entity).
