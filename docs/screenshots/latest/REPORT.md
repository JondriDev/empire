# Empire QA — Visual + Smoke Report

**Generated:** 2026-07-04T13:08:27.784Z

**Result:** 29/29 rendered without crash, 0 failed.

---

## ▶ QA VERDICT — EPIC-10 S3 CONFIRMED LIVE (no runtime bug)

First independent QA since S3 landed (last QA `b3703ce` confirmed S2 on green main `a89e87e`; S3 `6059284` + the docs
pass `6a1a0b2` landed since). Reproduced on green main **`6a1a0b2`** from a fresh cloud checkout, without the builder's tree.

- **EPIC-10 S3 acceptance axis reproduced independently: `TIMELINE 1/1 ✅` grew a sixth axis `descendants=true`**
  (`ordered=true grouped=true flow=true persisted=true filtered=true descendants=true`). The older seed's Timeline row
  surfaces a `<NodeDescendants>` (`[data-node-descendants=qa-tl-older]`) naming the newer child it spawned — the
  long-dormant `childrenOf` walker (built EPIC-9 S1, unused until now) is finally live. **★ EPIC-10 is CODE-COMPLETE
  (S1–S3) and every stage is now QA-confirmed on green main → the Strategist may retire it to DONE.**
- **29/29 routes render clean** (desktop + 28 apps, 0 uncaught JS). Timeline confirmed **visually** (`app-timeline.png`):
  clock-glyph header, "· 2 moments", a **TODAY** sticky day header, two entity rows (accent dot + title + `dataset` type
  chip + `now`) — the temporal lens renders real organism data.
- **vitest 318/318** (34 files), **eslint clean**, `metrics.mjs --assert-zero` exit 0 (tokens 0, off-system 0).
- Every other guard green: SHELL-IS-STYLED, REGISTRY-COVERAGE 28, INBOUND 3/3, MEDIA 3/3, GRAPH-LEGIBLE 1/1,
  GLOBAL-SEARCH 1/1 (`tagOnly`), NODE-LINEAGE 1/1 (5 axes incl. `clickable`), HOME-ALIVE 1/1, PROVENANCE-PERSISTS 3/3,
  PROVENANCE-ENTITY 3/3, OFFLINE-BOOT 5/5, PRECACHE 83 no-gap.
- **Metric deltas vs the builder's S3 snapshot (Δ ±0 — reproduced exactly):** apps **28**, static test count **276**,
  test files **32/34**, vitest **318**, token-violations **0**, off-system **0**, bundle gz **~705.4**.
- **No runtime bug, no contradiction.** Next: Strategist retires EPIC-10 to DONE and promotes the next cloud-executable
  candidate (**design-system conformance II** — extend the token audit to spacing/radii/type with its own `metrics.mjs`
  row; **EPIC-7 · Android** stays device-gated).

*Cloud limit:* the fresh-checkout corpus is the 2 QA seeds, so the `→ spawned` descendants token + `↖ ancestry` trail +
the Kind/App facet chips are low-contrast/absent in the static shot — the `descendants` + `filtered` guard axes carry
those roundtrips headless, and `NodeDescendants.test.tsx` unit-pins the click→open+focus state change.

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
| maps | ✅ | — | https://a.basemaps.cartocdn.com/dark_all/2/2/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/2/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/1/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/1/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/0/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/3/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/0/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/3/2.png (net::ERR_TUNNEL_CONNECTION_FAILED) |
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

**Precache:** 83 manifest entries; 48 JS + 3 CSS chunks emitted — ✅ no gap (all chunks precached).

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
