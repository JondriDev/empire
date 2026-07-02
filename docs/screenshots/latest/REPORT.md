# Empire QA — Visual + Smoke Report

**Generated:** 2026-07-02T20:27:34.866Z

**Result:** 28/28 rendered without crash, 0 failed.

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
| maps | ✅ | — | https://b.basemaps.cartocdn.com/dark_all/2/2/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/2/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/1/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/0/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/1/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/0/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/3/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/3/1.png (net::ERR_TUNNEL_CONNECTION_FAILED) |
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

## Global-search guard (EPIC-8 S1 — the organism becomes queryable)

The Core graph was seeded with two entities sharing a rare term across TWO apps (a `note` in Notes, a `task` in Goals); after a reload (persist rehydrate) the term was typed into the Search field. PASS = BOTH entities surface, grouped under their own app sections — one lens querying every app's real entities at once. The pure ranking spine (`searchNodes`) is unit-pinned in `search.test.ts`; this carries the graph→input→grouped-render roundtrip jsdom cannot.

| Query | Book hit | Task hit | Spans 2 apps | Result |
|---|---|---|---|---|
| Xenolith | ✅ | ✅ | ✅ | ✅ |

**GLOBAL-SEARCH: 1/1 ✅**

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
