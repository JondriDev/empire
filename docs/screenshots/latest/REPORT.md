# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-29T03:06:31.827Z

**Result:** 26/26 rendered without crash, 0 failed.

## ✅ Epic-acceptance — EPIC-3 S3 (Photos persist) CONFIRMED MOVED, LIVE

The ACTIVE epic's **PRIMARY target metric** is *shallow instruments with genuine
persistent/offline function* → **8/8**. Since the last QA (`88b70a7`, S2 Music+Video)
one code commit landed: **`2a09b27` EPIC-3 S3 — Photos library survives a reload** via
the shared IndexedDB blob rail (`src/lib/mediaStore.ts`), the same fix S2 applied to
Music/Video. S3's acceptance ("add a photo → reload → it still renders") could only be
unit-pinned at the pure-transform layer (`photosStore.test.ts`, 6 cases) because **jsdom
has no IndexedDB**. This run **extended the MEDIA-PERSISTS guard with a `photos` case**
that drives the real image `<input>` (→ `addFiles` → `putMedia` → `setPhotos`), reloads,
and asserts the photo survived (rehydrated from IDB, not dropped as a ghost):
**photos ✅ added + survived-reload — the live IDB roundtrip works in a real browser.**
**Function metric 7/8 → 8/8 — all eight shallow instruments are now offline-capable.
PRIMARY METRIC HIT.** (Remaining EPIC-3 work = **S4**, the test-backfill close: DataCenter
+ Weather logic modules + tests — a Builder task, no acceptance number for QA to move.)

## Metric deltas (vs last QA snapshot `88b70a7`, EPIC-3 S2)

| Metric | Last QA | This run | Δ |
|---|---|---|---|
| Apps / routes | 25 | 25 | ±0 |
| Test cases (vitest) | 143 | 149 | +6 (`photosStore.test.ts`) |
| Test files | 18 | 19 | +1 |
| Design-token violations | 0 | 0 | ±0 |
| Off-system utilities | 1160 | 1164 | +4 (S3's two amber "session" chips × grid+list — the mandated idiom) |
| Bundle gz (KB) | 291.9 | 292.2 | +0.3 (shared rail, by design) |

**No runtime bug found.** All 26 routes render with 0 uncaught JS; SHELL-IS-STYLED ✅,
REGISTRY-COVERAGE ✅ (bidirectional, 25 apps), INBOUND-LANDS 3/3 ✅, MEDIA-PERSISTS 3/3 ✅
(music + video + **photos** all add→reload→survive). Visually re-confirmed: Earth-from-Space
palette + alien icons + Cakra (desktop.png); Photos renders its styled empty state. Maps
renders the real Leaflet container (only OSM/CARTO tiles grey — egress-blocked, env-expected).

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
| maps | ✅ | — | https://b.basemaps.cartocdn.com/dark_all/2/2/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/1/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/0/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/0/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/2/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/3/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/1/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/3/1.png (net::ERR_TUNNEL_CONNECTION_FAILED) |
| messages | ✅ | — | — |
| prompt-generator | ✅ | — | — |
| token-counter | ✅ | — | — |
| learning-tracker | ✅ | — | — |
| ai-chat | ✅ | — | — |
| goals | ✅ | — | — |
| artifacts | ✅ | — | — |
| network | ✅ | — | — |
| inbox | ✅ | — | — |

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

## Screenshots

See PNGs in this folder. `desktop.png` is the shell; `app-<id>.png` is each app route.
