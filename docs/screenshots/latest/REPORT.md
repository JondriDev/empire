# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-29T23:05:57.791Z

**Result:** 26/26 rendered without crash, 0 failed.

## ★ Epic-acceptance — EPIC-4 CLOSE (S4 installability) CONFIRMED · EPIC-4 fully DONE

Since the last QA (`14466a8`, for S3 `1b5e695`), one code commit landed: **`d17f73a` feat(pwa): assert
manifest installability (EPIC-4 S4, EPIC-4 close)** — added `auditInstallability(manifest)` + `maxIconSize`
to `scripts/pwaBaseAudit.mjs`, surfaced via `scripts/check-pwa-base.mjs` + the PWA-BASE.md Installability table.

- **S4 acceptance metric MOVED ✅:** `node scripts/check-pwa-base.mjs` → **`installable = ✅ (4 icons)`** —
  manifest passes name+short_name, a ≥192 AND a ≥512 `any`-purpose icon, a maskable icon, standalone display,
  start_url, background_color+theme_color (see `PWA-BASE.md` → Installability).
- **No contradiction; no runtime bug.** All prior EPIC-4 guards re-confirmed LIVE this run: **offline-boots 5/5**
  cold from precache, **PRECACHE no-gap** (63 entries / 37 JS + 2 CSS), **base-path/install-flow** consistent under
  `--base=/empire/` (S3).
- **EPIC-4 (PWA completion → installable, offline-true) is now fully DONE: offline ✅ + base ✅ + installable ✅.**
  Target metric *Lighthouse-PWA ≥ 90* is realized as the deterministic, offline-checkable installability contract.
- vitest **193 → 205 (+12)** (`pwaBaseAudit.test.mjs` installability cases), test files 23 (±0 metrics 21, `src/`-only),
  apps 25 (±0), token-violations 0 (±0), off-system utils 1076 (±0), bundle gz 292.5 (±0).
- **▶ NEXT:** no pre-decomposed builder stage. **EPIC-5 · Android APK validation is QUEUED — needs the Strategist
  to promote it + seed stages** before a builder run. If EPICS.md still shows no `▶ ACTIVE` epic, the builder
  should take the topmost ROADMAP NOW item (or a standing FIX/INTERCONNECT/POLISH item, e.g. begin chipping the
  1076 off-system Tailwind utilities) and flag that EPICS needs the Strategist.

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
| maps | ✅ | — | https://b.basemaps.cartocdn.com/dark_all/2/2/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/1/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/0/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/0/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/2/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/1/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/3/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/3/1.png (net::ERR_TUNNEL_CONNECTION_FAILED) |
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
