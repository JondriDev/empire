# Empire QA — Visual + Smoke Report

**Generated:** 2026-07-03T23:08:38.169Z

**Result:** 28/28 rendered without crash, 0 failed.

## ✅ QA verdict — EPIC-9 S3 DONE-CONFIRMED LIVE on green main `0378d8e` (no runtime bug)

**No runtime bug found.** First independent QA since EPIC-9 S3 landed (last QA `36f33f5` confirmed S2 on
`f878844`; S3 feature commit `0378d8e` — *node-lineage is NAVIGABLE* — landed since). Build 🟢, server 🟢,
28/28 routes render clean (0 uncaught JS), vitest **292/292**, `metrics.mjs --assert-zero` exit 0 (tokens 0,
off-system 0).

**★ EPIC-9 S3 acceptance axis reproduced independently — `NODE-LINEAGE 1/1` now carries a FIFTH axis
`clickable=true`:** `rendered=true title=true persisted=true search=true clickable=true`. In the live Search
DOM the seeded parent hop renders as a real `[role="button"]` whose accessible name targets the parent entity,
and the guard clicks it without the handler throwing — the click layer (`EntityToken` → `openEntity(app, id)`)
is wired. Backed by `NodeLineage.test.tsx` (+4, vitest 288→292) which unit-pins the actual window/focus state
change. **S3 acceptance moved → S3 done-confirmed, no contradiction. ★ EPIC-9 is CODE-COMPLETE (S1–S3 all
shipped + QA-confirmed) → no `▶ ACTIVE` epic remains; the Strategist owes: retire EPIC-9 + promote the next
epic (EPIC-7 · Android stays device-gated).**

*Cloud limit (load-bearing, unchanged from the builder's note):* on the `/app/search` route AppShell renders
by URL param, not windowStore, so the in-app window swap after the click is NOT observable headless — the
`clickable` axis carries the live click-path + correct parent wiring; the actual navigation state change is
unit-pinned in `NodeLineage.test.tsx`. Real navigation is observable on-device only from the Bridge/home (`/`)
shell (renders by windowStore).

**Metric deltas vs the builder's S3 snapshot (`0378d8e`) — all ±0 (this is a confirmation run, no new code):**
apps/routes **27** (±0), static test cases **250** (±0), test files **30** (±0), vitest **292/292** (±0),
token violations **0** (±0), off-system utilities **0** (±0), bundle gz **701.4 KB** (±0), SW precache **81
entries** no-gap. Every guard green: SHELL-IS-STYLED ✅, REGISTRY-COVERAGE ✅ (27 apps, bidirectional),
INBOUND-LANDS 3/3, MEDIA-PERSISTS 3/3, GRAPH-LEGIBLE 1/1, GLOBAL-SEARCH 1/1 (`tagOnly=true`), **NODE-LINEAGE
1/1 (`clickable=true`)**, HOME-ALIVE 1/1, PROVENANCE-PERSISTS 3/3, PROVENANCE-ENTITY 3/3, OFFLINE-BOOT 5/5.

**Env-expected noise (NOT bugs):** Weather geocoding CDN + Maps CARTO tiles = `net::ERR_TUNNEL_CONNECTION_FAILED`
(egress-blocked CDNs); Files `/api/files` HTTP 500 (Android-only backend); Weather geolocation permissions-policy
block. All routes still render clean.

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
| maps | ✅ | — | https://c.basemaps.cartocdn.com/dark_all/2/1/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/2/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/0/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/1/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/2/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/0/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/3/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/3/1.png (net::ERR_TUNNEL_CONNECTION_FAILED) |
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

App-level provenance remembers which app fed which app; node-level lineage answers which ENTITY an exact artifact descended from. The core intents stamp `data.from = sourceNode.id` on every node they create, so the graph already holds a durable per-artifact ancestry edge. Two graph-survivable `task` nodes were seeded — a parent and a child whose `data.from` points at it — then reloaded so the persist store rehydrated; PASS = the Inbox child row renders a `<NodeLineage>` (`[data-node-lineage]`) carrying the parent entity's real title, AND it still resolves after a second reload (the `from` link is durable). **S2 extends the surface:** the same seeded ancestry must ALSO render on the Search result row (query "anomaly" → the child hit shows `[data-node-lineage=qa-lineage-parent]`), proving `<NodeLineage>` is now legible on every node-rendering view, not just the Inbox — the same drop-in surface also mounts on The Network inspector's per-entity list (visual/on-device). The pure walker `nodeLineageOf` is unit-pinned in `nodeLineage.test.ts`; this carries the graph→persist→rehydrate→render roundtrip jsdom cannot.

 **S3 makes it NAVIGABLE:** each ancestry hop is a real `[role="button"]` that climbs to the source entity (`openEntity` → open its owning app + set the gaze); the guard asserts the parent hop renders as a focusable control whose accessible name targets the parent entity, then clicks it (the window/focus change is unit-pinned in `NodeLineage.test.tsx` — on the /app/search route AppShell renders by URL, so in-app navigation isn't observable headless).

| Artifact | Lineage rendered | Parent title shown | Survived reload | Search surface | Hop clickable | Result |
|---|---|---|---|---|---|---|
| task ← Chart the Xenobloom anomaly | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

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

**Precache:** 81 manifest entries; 46 JS + 3 CSS chunks emitted — ✅ no gap (all chunks precached).

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
