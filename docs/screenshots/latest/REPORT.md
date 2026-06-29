# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-29T08:06:05.757Z

**Result:** 26/26 rendered without crash, 0 failed.

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
| maps | ✅ | — | https://b.basemaps.cartocdn.com/dark_all/2/2/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/2/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/1/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/1/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/0/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/3/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/0/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/3/2.png (net::ERR_TUNNEL_CONNECTION_FAILED) |
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

## Metric deltas (vs prior QA snapshot `3e666ce` / EPIC-3 S3, before `2126481` EPIC-3 S4 CLOSE landed)

Verified on green main `2126481`. One code commit landed since the last QA run: **`2126481` EPIC-3 S4 CLOSE** — extracted DataCenter + Weather pure logic into tested modules (`datacenterLogic.ts` +12 cases, `weatherLogic.ts` +8 cases).

| Metric | Prev | Now | Δ |
|---|---|---|---|
| Apps / routes | 25 | 25 | ±0 |
| Routes rendering clean | 26/26 | 26/26 | ±0 |
| Test files | 19 | 21 | +2 (datacenterLogic + weatherLogic) |
| Test cases (vitest run) | 149 | 170 | +21 (S4 modules) |
| Token violations | 0 | 0 | ±0 ✅ |
| Off-system utilities | 1164 | 1164 | ±0 |
| Bundle gz (KB) | 292.2 | 292.3 | +0.1 (logic-extraction only, by design) |

All guards green: SHELL-IS-STYLED ✅, REGISTRY-COVERAGE ✅ (25↔25), INBOUND-LANDS 3/3 ✅, MEDIA-PERSISTS 3/3 ✅.

## Active-epic acceptance — EPIC-4 (PWA completion) S1 · offline-boot guard

**Status this run: NOT YET STARTED (no contradiction, no confirmation possible).** EPIC-3 is CODE-COMPLETE (S4 closed it; function metric held 8/8). EPIC-4 was promoted ACTIVE 2026-06-29 but its **S1 is not yet shipped by the builder**: no `scripts/qa-offline.mjs` exists and `qa-smoke.mjs` has **no offline-boot (`page.route('**', abort)`) guard** — today's QA only blocks *external* hosts (Open-Meteo, CARTO tiles), never a cold offline boot of the app's own precached chunks. The PWA build is healthy (`vite-plugin-pwa` 1.3.0 `generateSW`, **precache 63 entries / 1150.93 KiB**), but the **EPIC-4 target metric (Lighthouse PWA ≥ 90 + an `offline-boots` smoke guard) has not moved** — there is nothing for QA to confirm-move until the builder ships S1. Recorded as awaiting-builder, not a regression.
