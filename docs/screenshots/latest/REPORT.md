# Empire QA — Visual + Smoke Report

**Generated:** 2026-07-14T18:09:17.667Z

**Result:** 32/32 rendered without crash, 0 failed.

**NO RUNTIME BUG THIS RUN.** Build 🟢 (`tsc -b && vite build`, PWA precache 89 entries). Every one of the 32 routes rendered clean; console/network noise is env-expected only (weather Open-Meteo geocode tunnel-blocked, maps 8× CARTO tiles tunnel-blocked, files + mail 401 on authed/Android-only APIs). Visually re-inspected locally (never committed): `desktop.png` (styled shell, "Good evening", 4 stat tiles all 0 on a fresh session, "All clear — nothing needs you", full 31-app dock), `app-maps.png` (Leaflet chrome + search + controls render; grey tile pane is the blocked CARTO CDN), `app-network.png` (CORE hub + radial mesh + legend), `app-goals.png` (form + "No goals yet" empty state).

**★ EPIC-18 S1 TARGET METRIC CONFIRMED MOVED — first independent QA confirm.** Since the last QA commit (`69fd479`), two app-code commits landed on main (`8a0c6c9` EPIC-18 S1 shell attention badge · `d4289b8` maps busy-state polish); this run rebuilt + re-smoked the tree it describes. The new **`SHELL-ATTENTION` guard PASSES 4/4** (`homeHidden=true awayShows=true urgent=true tapHome=true`): the Home badge is hidden at home, shows count `2` inside an app, tints `is-urgent` when an overdue task leads, and clears on tap-Home while the feed returns — the EPIC-18 S1 acceptance metric **0 → 4/4 MOVED, no contradiction.** All six conformance axes remain **0 & LOCKED** (`--assert-zero` exit 0); `HOME-ATTENTION` still 6/6. EPIC-18 remains **Builder-proposed, AWAITING STRATEGIST RATIFICATION** — the metric confirmation does not itself promote it.

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
| files | ✅ | — | /api/files?path=%2Fstorage%2Femulated%2F0 → HTTP 401 |
| cache | ✅ | — | — |
| browser | ✅ | — | — |
| editor | ✅ | — | — |
| notes | ✅ | — | — |
| photos | ✅ | — | — |
| datacenter | ✅ | — | — |
| maps | ✅ | — | https://c.basemaps.cartocdn.com/dark_all/2/1/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/2/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/0/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/3/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/0/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/3/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/2/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/1/2.png (net::ERR_TUNNEL_CONNECTION_FAILED) |
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
| timeline | ✅ | — | — |
| solver | ✅ | — | — |
| mail | ✅ | — | /api/integrations/status → HTTP 401 |
| crypto | ✅ | — | — |

## Inbound-lands guard (organism emit↔receive loop)

Each entity receiver was seeded with a cross-app payload + reloaded; PASS = a "Received from <source>" chip rendered AND a control was prefilled.

| Receiver | From | Chip | Prefilled | Result |
|---|---|---|---|---|
| calendar | editor | ✅ | ✅ | ✅ |
| goals | notes | ✅ | ✅ | ✅ |
| messages | ai-chat | ✅ | ✅ | ✅ |
| mail | notes | ✅ | ✅ | ✅ |

## Media-persists guard (EPIC-3 S2/S3 — IndexedDB blob roundtrip)

Each media app's real file `<input>` was driven with a small blob, then the page was reloaded; PASS = the item appeared after add AND survived the reload (rehydrated from IndexedDB, not dropped as a ghost). This exercises the S2 acceptance that jsdom cannot (no IndexedDB).

| App | Added | Survived reload | Result |
|---|---|---|---|
| music | ✅ | ✅ | ✅ |
| video | ✅ | ✅ | ✅ |
| photos | ✅ | ✅ | ✅ |

## Graph-legible guard (EPIC-6 S4 + EPIC-13 S1/S3 — collection-owning apps join the organism)

Each collection-owning app must mirror its real entities into the Core graph (`empire-core-graph`) so they are legible in The Network / Search / Timeline. **reader/book** (EPIC-6 S4): Reader's real file `<input>` was driven with a small `.txt` book; PASS = a `book` node owned by `app==='reader'` appeared AND survived a reload. **crypto/wallet** (EPIC-13 S1): the `crypto-watch-list` was seeded with a BTC address before Crypto mounted; PASS = a `wallet` node owned by `app==='crypto'` appeared AND survived a reload (the re-mounted app re-mirrors its watch-list). **mail/draft** (EPIC-13 S3): `empire-mail-drafts` was seeded with one draft before Mail mounted; PASS = a `draft` node owned by `app==='mail'` appeared AND survived a reload. Mail + Crypto were the last two raw-HTML islands — S1/S2/S3 make both first-class citizens (graph-legible + emit; Mail also receives handoffs).

| Collection | Node created | Survived reload | Result |
|---|---|---|---|
| reader/book | ✅ | ✅ | ✅ |
| crypto/wallet | ✅ | ✅ | ✅ |
| mail/draft | ✅ | ✅ | ✅ |

**GRAPH-LEGIBLE: 3/3 ✅**

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

## Intent-roundtrip guard (EPIC-12 S1–S2 — cross-app creation makes REAL, durable entities)

The core cross-app intents must produce a REAL, editable, reload-durable entity in its home app — not a phantom graph node. Before EPIC-12, `make-note-from` / `add-to-learning` called `g.addNode({type:'note'|'learning'})` directly: a graph node with NO store row and NO `data.sourceId`, which `reconcile()` PRUNES (`note`/`learning` are centrally-mirrored types) — so the "created" entity never showed in its app and vanished on the next store mutation / reload. Each stage routes its intent through the REAL store (`useStore.addNote` / `addLearningItem`); the synchronous `useStore.subscribe(syncAll)` then materializes an un-prunable, `sourceId`-keyed mirror. **S1 (note):** a graph-survivable `task` source is seeded, its ⚡ `<NodeActions>` "Make Note from this" menu is driven on the Inbox; PASS = a real note with `from`=source id + copied content in `empire-store` (`stored`), a `note` node owned by `app==='notes'` with `data.from` (`mirrored`), both surviving a second reload (`persisted`). **S2 (learning):** a REAL note is seeded in `empire-store` (a valid `add-to-learning` source that itself survives the reconcile), its ⚡ "Add to Learning" menu is driven on /app/notes; PASS = a real `learningItems` entry with `from`=source id + topic=source title (`stored`), a `learning` node owned by `app==='learning-tracker'` with `data.from` (`mirrored`), both surviving a second reload (`persisted`). The pure store-writes are unit-pinned in `sync.test.ts`; this carries the intent→store→subscribe→reconcile→persist→reload roundtrip jsdom cannot.

| Intent | Real store entry | Mirrored (owned by home app) | Survived reload | Result |
|---|---|---|---|---|
| make-note-from → notes | ✅ | ✅ | ✅ | ✅ |
| add-to-learning → learning-tracker | ✅ | ✅ | ✅ | ✅ |

**INTENT-ROUNDTRIP: 2/2 ✅**

## Timeline guard (EPIC-10 S1–S3 — the TEMPORAL lens: faceted, and read BOTH ways)

The Empire had three lenses over its one Core graph — Network (STRUCTURAL), Search (QUERY), Inbox (TASK) — but no way to see *when* it did things, even though every `CoreNode` stamps `meta.created` and every `ProvEdge` stamps `at`. The Timeline app merges every entity-birth + every app→app handoff into one newest-first, day-grouped stream via the pure `buildTimeline`/`groupByDay`/`dayKey` spine, now filtered by the pure `filterTimeline`/`timelineFacets` helpers (all unit-pinned in `timeline.test.ts`). Two graph-survivable `task` nodes (distinct `meta.created`, owned by two apps, the newer's `data.from` = the older) + one `empire-provenance` edge were seeded, then reloaded so BOTH persist stores rehydrated; PASS = the two entity rows render newest-`created` first (`ordered`), at least one `[data-timeline-day]` header renders (`grouped`), the seeded edge renders as a `[data-timeline-kind=flow]` row (`flow`), all of it still holds after a SECOND reload (`persisted`), the older entity's row surfaces a `<NodeDescendants>` (`[data-node-descendants=qa-tl-older]`) naming the newer child it spawned (`descendants`), and clicking the `goals` App chip narrows to ONLY the goals-owned entity — dropping the notes entity + the notes→goals flow (`filtered`). **S3** surfaces the long-dormant `childrenOf` walker so a moment reads BOTH ways — `↖ ancestry` (`<NodeLineage>`) and `→ spawned` (`<NodeDescendants>`), each hop a navigable `[role="button"]` (unit-pinned in `NodeDescendants.test.tsx`). This carries the graph+ledger→persist→rehydrate→ordered-render + faceted-narrow + descendants roundtrip jsdom cannot; the sticky day headers, relative labels + chip tints are the on-device visual.

| Ordered newest-first | Grouped by day | Flow row | Survived reload | Spawned-child shown | App-chip narrows | Result |
|---|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**TIMELINE: 1/1 ✅**

## Home-alive guard (The Bridge — the home screen is living telemetry)

The Core graph was seeded with a today-dated `event` (Calendar), an open `task` (Goals) and a `book` (Reader), then home was reloaded (persist rehydrate). PASS = the Today and Open Tasks widgets show the live count + entity, the jump-back-in strip lists all three newest-first, clicking a row lands in its owning app (the `openEntity` rail), and a question typed into the Cakra line opens Cakra prefilled (the `empire-ai-clipboard` rail). The pure selectors are unit-pinned in `bridge.test.ts`; this carries the rendered-home roundtrip jsdom cannot.

| Today widget | Tasks widget | Recents strip | Exact landing | Cakra line | Result |
|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**HOME-ALIVE: 1/1 ✅**

## Home-attention guard (EPIC-17 — the proactive cockpit feed)

HOME-ALIVE proved the home *reflects* the organism; EPIC-17 makes it *proactive*. The graph was seeded with the six Attention kinds (`attention.ts` scorers) at graph-survivable types — an overdue `task` (due 5d ago → 95), a today `event` (75), a fresh `draft` handoff (70), an aged low-progress `goal` (60), a plain open `task` (50) and a mid-progress `book` (35) — then home was reloaded (persist rehydrate). PASS = the "Needs you" feed renders all six in score order, the top row is the overdue task tagged "Overdue", every row carries a reason + a one-tap resolve control, and clicking the top row's open lands in its owning app (Goals). The pure ranking is unit-pinned in `attention.test.ts`; this carries the seed→persist→reload→ranked-render + one-tap-open roundtrip jsdom cannot.

| Six rows | Overdue on top | Score order | Every reason | Every act | One-tap lands | Result |
|---|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**HOME-ATTENTION: 6/6 ✅**

## Shell-attention guard (EPIC-18 — the cockpit reaches beyond the home)

EPIC-17 made the *home* proactive; the moment you open an app the "Needs you" feed leaves the screen. EPIC-18 carries the signal into the persistent shell: while an app is foregrounded, the HomeBar's Home button wears a live badge (`attentionSummary`, unit-pinned in `attention.test.ts`) tinted red when the most-urgent item is overdue. Two graph-survivable tasks were seeded — an overdue `task` (→ 95) and a plain open `task` (→ 50), both owned by Goals — then home was reloaded. PASS = at home the badge is ABSENT (the feed is already on screen), opening an app in-place shows the Home button count `2` with the urgent tint, and tapping Home clears it while the full feed returns.

| Hidden at home | Shows inside app (count 2) | Urgent tint | Tap-home clears + feed back | Result |
|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | ✅ |

**SHELL-ATTENTION: 4/4 ✅**

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

**Precache:** 89 manifest entries; 53 JS + 3 CSS chunks emitted — ✅ no gap (all chunks precached).

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
