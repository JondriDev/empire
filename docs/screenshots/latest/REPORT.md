# Empire QA — Visual + Smoke Report

**Generated:** 2026-07-03T13:08:18.369Z

**Result:** 28/28 rendered without crash, 0 failed.

## ✅ No runtime bug found — green main `436cebf`

- **QA'd commit:** `436cebf feat(home): The Bridge — the living home screen` (landed since last QA `f1303b6`).
- **Active epic EPIC-9 S1 (`NODE-LINEAGE`) RE-CONFIRMED still 1/1** (`rendered=true title=true persisted=true`) — The Bridge did **not** regress per-artifact lineage. No new epic stage landed this run (The Bridge is a user-directed pass, not an EPIC-9 stage).
- **NEW surface confirmed:** The Bridge home screen at `/` — `HOME-ALIVE 1/1 ✅` (`today/tasks/recent/land/ask` all present) + visually verified (`desktop.png`: "Good afternoon" greeting, "Ask Cakra anything…" bar, live TODAY/OPEN TASKS/GOALS/ORGANISM stat cards, app-launcher grid).
- **Build 🟢** (`tsc -b && vite build`), **vitest 288/288** (276→288, +12 from The Bridge), **eslint clean**, `metrics.mjs --assert-zero` exit 0 (tokens 0, off-system 0).
- **Metrics reproduce the builder's Bridge snapshot exactly:** apps 27, static tests 246 (vitest 288), bundle 700.7 KB gz, Δ ±0.
- **All 12 guards green:** SHELL-IS-STYLED, REGISTRY-COVERAGE (27, bidirectional), INBOUND-LANDS 3/3, MEDIA-PERSISTS 3/3, GRAPH-LEGIBLE 1/1, GLOBAL-SEARCH 1/1 (`tagOnly=true`), NODE-LINEAGE 1/1, HOME-ALIVE 1/1, PROVENANCE-PERSISTS 3/3, PROVENANCE-ENTITY 3/3, OFFLINE-BOOT 5/5, PRECACHE 80 no-gap.
- **Env-expected noise only** (not bugs): Weather geocoding CDN + geolocation blocked, Maps carto tiles blocked (net:8), `/api/files` 500 (no Android FS) — all sandbox-expected.

> **PASS** = the app rendered with no uncaught JS exception / error boundary / blank screen.
> Network & console noise (failed external CDN fetches, backend API calls needing auth) is
> listed separately — expected in the offline cloud sandbox and **not** a render failure.

| App | Render | Uncaught JS / crash | Network / console notes |
|---|---|---|---|
| desktop | ✅ | — | — |
| calculator | ✅ | — | — |
| calendar | ✅ | — | — |
| clock | ✅ | — | — |
| weather | ✅ | — | https://geocoding-api.open-meteo.com/v1/search?name=Jakarta&count=1&language=en&format=json (net::ERR_TUNNEL_CONNECTION_FAILED)<br>Permissions policy violation: Geolocation access has been blocked because of a permissions policy applied to the current document. See https://crbug.com/4143482 |
| grammar | ✅ | — | — |
| language | ✅ | — | — |
| music | ✅ | — | — |
| video | ✅ | — | — |
| files | ✅ | — | /api/files?path=%2Fstorage%2Femulated%2F0 → HTTP 500 |
| cache | ✅ | — | — |
| browser | ✅ | — | — |
| editor | ✅ | — | — |
| notes | ✅ | — | — |
| photos | ✅ | — | — |
| datacenter | ✅ | — | — |
| maps | ✅ | — | https://b.basemaps.cartocdn.com/dark_all/2/2/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/1/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/2/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/0/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/1/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/0/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/3/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/3/2.png (net::ERR_TUNNEL_CONNECTION_FAILED) |
| messages | ✅ | — | — |
| prompt-generator | ✅ | — | — |
| token-counter | ✅ | — | — |
| learning-tracker | ✅ | — | — |
| ai-chat | ✅ | — | — |
| goals | ✅ | — | — |
| artifacts | ✅ | — | — |
| network | ✅ | — | — |
| inbox | ✅ | — | — |
| reader | ✅ | — | — |
| search | ✅ | — | — |

## Inbound-lands guard (organism emit↔receive loop)

Each entity receiver was seeded with a cross-app payload + reloaded; PASS = a "Received from <source>" chip rendered AND a control was prefilled.

| Receiver | From | Chip | Prefilled | Result |
|---|---|---|---|---|
| calendar | editor | ✅ | ✅ | ✅ |
| goals | notes | ✅ | ✅ | ✅ |
| messages | ai-chat | ✅ | ✅ | ✅ |

## Media-persists guard (EPIC-3 S2/S3 — IndexedDB blob roundtrip)

Each media app's real file `<input>` was driven with a small blob, then the page was reloaded; PASS = the item appeared after add AND survived the reload (rehydrated from IndexedDB, not dropped as a ghost). This exercises the S2 acceptance that jsdom cannot (no IndexedDB).

| App | Added | Survived reload | Result |
|---|---|---|---|
| music | ✅ | ✅ | ✅ |
| video | ✅ | ✅ | ✅ |
| photos | ✅ | ✅ | ✅ |

## Graph-legible guard (EPIC-6 S4 — Reader's books join the organism)

Reader's real file `<input>` was driven with a small `.txt` book, then the persisted Core graph (`empire-core-graph`) was inspected; PASS = a `book` node owned by `app==='reader'` appeared AND survived a reload (the re-mounted Reader re-mirrors its library). This closes the last graph-island — every collection-owning app is now graph-legible.

| Collection | Node created | Survived reload | Result |
|---|---|---|---|
| reader/book | ✅ | ✅ | ✅ |

**GRAPH-LEGIBLE: 1/1 ✅**

## Global-search guard (EPIC-8 S1 + S2 — the organism becomes queryable)

The Core graph was seeded with entities sharing a rare term across TWO apps (a `book` in Reader, a `task` in Goals); after a reload (persist rehydrate) the term was typed into the Search field. PASS = BOTH entities surface, grouped under their own app sections — one lens querying every app's real entities at once. **S2 adds a tag-only match:** a third node carries the term `Tessellate` ONLY in `data.tags` (a string array) — it surfaces iff `nodeBodyText` now flattens array elements (the S2 corpus gap). The pure ranking spine (`searchNodes`) is unit-pinned in `search.test.ts`; this carries the graph→input→grouped-render roundtrip jsdom cannot.

| Query | Book hit | Task hit | Spans 2 apps | Tag-only hit | Result |
|---|---|---|---|---|---|
| Xenolith / Tessellate | ✅ | ✅ | ✅ | ✅ | ✅ |

**GLOBAL-SEARCH: 1/1 ✅**

## Node-lineage guard (node-level lineage — per-artifact ancestry is legible)

App-level provenance remembers which app fed which app; node-level lineage answers which ENTITY an exact artifact descended from. The core intents stamp `data.from = sourceNode.id` on every node they create, so the graph already holds a durable per-artifact ancestry edge. Two graph-survivable `task` nodes were seeded — a parent and a child whose `data.from` points at it — then reloaded so the persist store rehydrated; PASS = the Inbox child row renders a `<NodeLineage>` (`[data-node-lineage]`) carrying the parent entity's real title, AND it still resolves after a second reload (the `from` link is durable). The pure walker `nodeLineageOf` is unit-pinned in `nodeLineage.test.ts`; this carries the graph→persist→rehydrate→render roundtrip jsdom cannot.

| Artifact | Lineage rendered | Parent title shown | Survived reload | Result |
|---|---|---|---|---|
| task ← Chart the Xenobloom anomaly | ✅ | ✅ | ✅ | ✅ |

**NODE-LINEAGE: 1/1 ✅**

## Home-alive guard (The Bridge — the home screen is living telemetry)

The Core graph was seeded with a today-dated `event` (Calendar), an open `task` (Goals) and a `book` (Reader), then home was reloaded (persist rehydrate). PASS = the Today and Open Tasks widgets show the live count + entity, the jump-back-in strip lists all three newest-first, clicking a row lands in its owning app (the `openEntity` rail), and a question typed into the Cakra line opens Cakra prefilled (the `empire-ai-clipboard` rail). The pure selectors are unit-pinned in `bridge.test.ts`; this carries the rendered-home roundtrip jsdom cannot.

| Today widget | Tasks widget | Recents strip | Exact landing | Cakra line | Result |
|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**HOME-ALIVE: 1/1 ✅**

## Provenance-persists guard (EPIC-6 — durable app→app memory)

Real `editor→<target>` handoffs were fired from the Editor's ⚡ Send menu (each executor emits the honest event `flowForEvent` turns into an edge in the durable `empire-provenance` store), then the page was reloaded from a different route; PASS = the edge was recorded when the handoff fired AND survived the reload (rehydrated from the persisted ledger). This is the runtime realization of EPIC-6's "seed handoff → reload → durable source still shows" acceptance that jsdom cannot exercise (no real localStorage reload).

| Edge | Recorded | Persisted (reload) | Result |
|---|---|---|---|
| editor→notes | ✅ | ✅ | ✅ |
| editor→ai-chat | ✅ | ✅ | ✅ |
| editor→prompt-generator | ✅ | ✅ | ✅ |

**PROVENANCE-PERSISTS: 3/3 ✅**

## Provenance-entity guard (EPIC-6 S3 — per-entity source survives reload)

Distinct from the edge guard above: each S3 receiver was seeded with an inbound payload, reloaded so it consumed the chip + prefilled, then its OWN create/send was triggered so the entity persisted its durable `from`; the page was reloaded again (chip now gone) and a `<LineageTrail>` ("From <source>") must still render off the persisted entity. This is the headline S3 acceptance jsdom cannot exercise.

| Entity edge | Trail after create | Trail after reload | Result |
|---|---|---|---|
| calculator→goals | ✅ | ✅ | ✅ |
| editor→messages | ✅ | ✅ | ✅ |
| notes→calendar | ✅ | ✅ | ✅ |

**PROVENANCE-ENTITY: 3/3 ✅**

## Offline-boot guard (EPIC-4 S1 — cold boot from SW precache)

The built app was served, warm-loaded so the service worker precached, then ALL network was blocked (`setOffline`); each route below was navigated cold and must render purely from the precache. The precache audit cross-checks the SW manifest against every emitted chunk.

**Precache:** 80 manifest entries; 45 JS + 3 CSS chunks emitted — ✅ no gap (all chunks precached).

| Route | Renders offline |
|---|---|
| / | ✅ |
| /app/clock | ✅ |
| /app/maps | ✅ |
| /app/network | ✅ |
| /app/photos | ✅ |

**Cold-offline boot: 5/5 ✅**

## Screenshots

See PNGs in this folder. `desktop.png` is the shell; `app-<id>.png` is each app route.
