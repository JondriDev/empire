# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-29T18:05:09.890Z

**Result:** 26/26 rendered without crash, 0 failed.

## QA summary (2026-06-29 — green main `1b5e695`, after EPIC-4 S3 base-path/install-flow)

**No runtime bugs found.** build🟢 · vitest **193/193 🟢** (23 files) · all guards green:
SHELL-IS-STYLED ✅ · REGISTRY-COVERAGE ✅ (bidirectional, 25 apps) · INBOUND-LANDS **3/3 ✅** ·
MEDIA-PERSISTS **3/3 ✅** (music+video+photos) · OFFLINE-BOOT **5/5 ✅** · PRECACHE-AUDIT no gap (63 entries) ✅.

**★ Epic-acceptance — EPIC-4 S3 (base-path + install-flow correctness) CONFIRMED MOVED.** S3 (`1b5e695`) is the
only code commit since the last QA (`9051409`). Its acceptance check `node scripts/check-pwa-base.mjs` passes:
a `--base=/empire/` build emits 11 base-prefixed asset URLs (manifest linked), SW `navigateFallback="/empire/index.html"`,
`registerSW("/empire/sw.js",{scope:"/empire/"})`, and a base-agnostic manifest (`start_url="."` / `scope="."` /
**`id="empire"`**) — install surface, SW & manifest all consistent. See `PWA-BASE.md`. **▶ Next active stage =
EPIC-4 S4 (Lighthouse-PWA / installability assertion — EPIC-4 CLOSE), not yet built.**

**Metric deltas vs last QA snapshot (`9051409`):** apps **25 (±0)** · token-violations **0 (±0)** ·
off-system-utils **1076 (±0)** · bundle gz **292.5 (±0)** · vitest **176→193 (+17** — the S3 `pwaBaseAudit.test.mjs`,
17 cases) · vitest files **22→23 (+1)** · metrics-static (src/-only) test cases 163 / files 21 (±0).
No contradiction; no regression on any ↓/steady metric.

**Env-expected noise (not bugs):** weather→Open-Meteo geocoding + Geolocation blocked (net:1), files
`/api/files?path=/storage/emulated/0`→500 (Android-only path, net:1), maps→CARTO/OSM dark tiles blocked
(net:8; Leaflet container + attribution still render). Verified visually: Earth-from-Space palette + alien
icons + Cakra (desktop.png); Maps shows the real Leaflet container w/ zoom + OSM/CARTO attribution (only tiles grey).

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
| maps | ✅ | — | https://a.basemaps.cartocdn.com/dark_all/2/2/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/1/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/2/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/1/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/0/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/0/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/3/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/3/2.png (net::ERR_TUNNEL_CONNECTION_FAILED) |
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

## Offline-boot guard (EPIC-4 S1 — cold boot from SW precache)

The built app was served, warm-loaded so the service worker precached, then ALL network was blocked (`setOffline`); each route below was navigated cold and must render purely from the precache. The precache audit cross-checks the SW manifest against every emitted chunk.

**Precache:** 63 manifest entries; 37 JS + 2 CSS chunks emitted — ✅ no gap (all chunks precached).

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
