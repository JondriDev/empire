# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-30T08:05:17.204Z

**Result:** 27/27 rendered without crash, 0 failed.

**Green main `f9ec888`** (2 commits past the last QA `c51f79f`: `d866a7a` Files whole-state graph-mirror, `f9ec888` security harden + Calendar month fix + offline fonts + leak fixes). Build 🟢 (`tsc -b && vite build`), vitest **216/216** (25 files), `metrics.mjs --assert-zero` exits **0**.

### QA summary
- **Routes rendering clean: 26/26 ✅** (27/27 incl. desktop). 0 uncaught JS across every route.
- SHELL-IS-STYLED ✅ · REGISTRY-COVERAGE ✅ bidirectional (26 apps) · INBOUND-LANDS **3/3 ✅** · MEDIA-PERSISTS **3/3 ✅** (music/video/photos IDB roundtrip) · OFFLINE-BOOT **5/5 ✅** · PRECACHE **78 entries / 43 JS + 3 CSS, NO GAP ✅**.
- **Visually confirmed:** windowless full-screen launcher shell (Earth-from-Space palette, alien icons, bottom dock); **Calendar month fix verified** — renders **June 2026** with the 30th highlighted on **Tuesday** (June 30 2026 is a Tuesday ✅), confirming `f9ec888`. Files renders the directory browser. Maps shows the real Leaflet container + OSM/CARTO attribution (only tiles grey — egress-blocked, env-expected).

### Metric deltas (vs last QA `c51f79f`)
| Metric | Last QA | This run | Δ |
|---|---|---|---|
| Routes clean | 26/26 | 26/26 | ±0 |
| vitest tests / files | 208 / 24 | **216 / 25** | +8 / +1 (`filesGraph.test.ts`) |
| Token violations | 0 | **0** | ±0 |
| Off-system utilities | 0 | **0** (assert-zero exits 0, locked) | ±0 |
| Bundle gz (KB) | 691.3 | 691.4 | +0.1 |
| Precache entries | 70 | **78** | +8 |

### Epic-acceptance
- **No ACTIVE epic** (EPIC-5 CLOSED 2026-06-30; Strategist must promote the next). Nothing to confirm-move this run. EPIC-5's locked invariant **re-confirmed held**: `node scripts/metrics.mjs --assert-zero` exits 0 (tokenViolations=0, offSystemUtilities=0); off-system stayed 0 across both new commits. No contradiction; no runtime regression from `d866a7a`/`f9ec888`.

### Notes for the build routine (non-blocking — NOT a runtime bug)
- **`npx eslint .` reports 2 errors** in `src/design-system/icons/index.tsx:274,306` — `react-refresh/only-export-components` on `alienIcons` / `getAppIcon` (non-component exports from a component file). **Not CI-gated** (`verify.yml` runs build + vitest + shell-styled + route-parity + assert-zero, not eslint — CI is green), **not a runtime bug** (affects dev HMR fast-refresh only; app renders 27/27 in prod). The file is **unchanged since the last QA** and the eslint config is unchanged, so this is pre-existing lint debt surfaced on a fresh `npm install` (likely an `eslint-plugin-react-refresh` patch tightening the rule) — prior "eslint clean" claims did not catch it. **Fix (per CONTEXT.md "Tried & rejected"):** move the non-component exports (`alienIcons`, `FallbackIcon`, `getAppIcon`) to a sibling module (e.g. `icons/appIcons.ts`) and re-export, mirroring the `nodeColors.ts` precedent. Outside QA's tiny/safe write scope → left for the builder.

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
| maps | ✅ | — | https://a.basemaps.cartocdn.com/dark_all/2/2/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/1/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/2/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/0/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/0/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/3/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/1/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/3/2.png (net::ERR_TUNNEL_CONNECTION_FAILED) |
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

**Precache:** 78 manifest entries; 43 JS + 3 CSS chunks emitted — ✅ no gap (all chunks precached).

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
