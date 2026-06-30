# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-30T03:05:47.408Z

**Result:** 27/27 rendered without crash, 0 failed.

## ✅ No runtime bugs found this run.

## Run summary (2026-06-30, green main `c51f79f`)

**This is the FIRST visual QA of the out-of-band redesign batch** (`75ef685`…`fb4c853`) + the EPIC-5 S8 close
(`c51f79f`). Everything passes:

- **Routes rendering clean: 26/26 ✅** (27/27 incl. the desktop shell). 0 uncaught JS across every route.
- **SHELL-IS-STYLED ✅** (top-level `.empire-desktop{…position:fixed…}`, 0 `.hide-sm .empire-desktop`).
- **REGISTRY-COVERAGE ✅** bidirectional — 26 apps, smoke list ↔ registry match exactly. **Added the new
  `reader` app to the smoke list** this run (`scripts/qa-smoke.mjs`); without it the coverage guard would have
  thrown (registry app not smoke-tested).
- **INBOUND-LANDS 3/3 ✅** (calendar←editor, goals←notes, messages←ai-chat each show the "Received from …" chip
  + prefilled control).
- **MEDIA-PERSISTS 3/3 ✅** (music + video + photos: add → reload → survives the IDB blob roundtrip).
- **OFFLINE-BOOT 5/5 ✅** cold from SW precache; **PRECACHE-AUDIT: 70 entries (43 JS + 3 CSS), NO GAP ✅**.
- **vitest 208/208 ✅** (24 files), **eslint clean**, build 🟢.

**Visually confirmed (the redesign, first time):**
- The **windowless full-screen shell** — centered app-launcher grid (26 alien-icon tiles), Earth-from-Space
  dark-oceanic palette, bottom dock (home/grid/search + clock). `Window.tsx` is gone; the model is full-screen.
- The new **Reader** — clean empty-state ("Your library is empty", EPUB/PDF/Markdown/text/Word, "ask Cakra as
  you read"), full-screen app frame + app dock.
- The merged **Cakra** — Chat / Prompt / Tokens / Code tabs + "Cakra's Workspace" activity panel (Prompt-Gen,
  Token-Counter, Code-Editor folded in).
- **Maps** — real Leaflet container with zoom controls + "Leaflet | © OpenStreetMap © CARTO" attribution (tiles
  grey: OSM/CARTO egress-blocked, env-expected — net:8, NOT a bug).

## Metric deltas (vs last QA snapshot `d17f73a`, 2026-06-29)

| Metric | Was | Now | Δ |
|---|---|---|---|
| Apps / routes | 25 | **26** | +1 (Reader added net; Cakra merge folded 3 into tabs) |
| Test cases (vitest) | 205 | **208** | +3 |
| Test files (vitest) | 23 | **24** | +1 |
| Token violations | 0 | **0** | ±0 |
| Off-system utilities | 1076 | **0** | **−1076 (EPIC-5 target MET + LOCKED)** |
| Bundle gz (KB) | 292.5 | **691.3** | +398.8 (Reader's EPUB/PDF/DOCX parsers — BY DESIGN) |

## Epic-acceptance confirmation

- **No `▶ ACTIVE` epic this run** — EPIC-5 (design-system utility conformance → off-system 0) was CLOSED 2026-06-30.
- **EPIC-5 acceptance CONFIRMED-MOVED & LOCKED:** off-system utilities **1076 → 0**; `node scripts/metrics.mjs
  --assert-zero` exits **0** (`tokenViolations=0, offSystemUtilities=0`) — the S8 conformance CI gate holds. The
  `@theme inline` bridge drift test (`themeBridge.test.ts`) passes within the green vitest run. **No contradiction.**
- The redesign batch's intentional deltas (apps 25→26, bundle 292.5→691.3) are **BY DESIGN** — not regressions.
- **Next:** Strategist must promote the next epic (EPIC-6 Android is device-gated/QUEUED; cloud-executable
  candidates: DataCenter/Files whole-state graph-mirror; organism-completeness-II re-audit vs the 26-route registry).

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
| maps | ✅ | — | https://c.basemaps.cartocdn.com/dark_all/2/1/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/2/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/0/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/2/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/1/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/0/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/3/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/3/1.png (net::ERR_TUNNEL_CONNECTION_FAILED) |
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

**Precache:** 70 manifest entries; 43 JS + 3 CSS chunks emitted — ✅ no gap (all chunks precached).

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
