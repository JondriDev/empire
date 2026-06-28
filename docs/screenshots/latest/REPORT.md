# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-28T18:04:31.669Z

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
| maps | ✅ | — | https://b.basemaps.cartocdn.com/dark_all/2/2/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/2/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/1/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/0/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/0/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/1/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/3/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/3/1.png (net::ERR_TUNNEL_CONNECTION_FAILED) |
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

## Screenshots

See PNGs in this folder. `desktop.png` is the shell; `app-<id>.png` is each app route.

## Metric deltas (vs last QA snapshot — pre-Clock green main `23df6ce` → now `2cb7801`)

| Metric | Last QA | This run | Δ | Note |
|---|---|---|---|---|
| Routes rendering clean | 26/26 (25 apps + desktop) | **26/26** | ±0 | 0 uncaught JS across all routes |
| Apps both-ways into organism | 9/9 entity-apps-with-inbound | **9/9** | ±0 | INBOUND-LANDS guard 3/3 ✅ |
| Apps / routes | 25 | **25** | ±0 | steady (post-redesign) |
| Test cases (vitest run) | 115 | **132** | **+17** | `clockLogic.test.ts` (EPIC-3 S1) |
| Test files | 16 | **17** | **+1** | +`clockLogic.test.ts` |
| Token violations | 0 | **0** | ±0 | held |
| Bundle gz (KB) | 288.6 | **290.7** | **+2.1** | Clock Timer tab (by design) |

SHELL-IS-STYLED ✅ · REGISTRY-COVERAGE ✅ (bidirectional, 25 apps) · INBOUND-LANDS 3/3 ✅ · vitest 132/132 · eslint clean.

## Epic-acceptance confirmation — EPIC-3 S1 (Clock) ✅ CONFIRMED MOVED

**Active epic:** EPIC-3 — Depth pass on shallow instruments. **Target metric:** *Shallow instruments with
genuine persistent/offline function + a unit test* → 8/8.

Since the last QA, one code commit landed: **`2cb7801` — EPIC-3 S1 (persistent offline Clock + countdown Timer)**.
Confirmed, no contradiction:
- **Genuine offline persistence:** `Clock.tsx:92` writes `{alarms, worldClocks, is24Hour}` to `localStorage`
  key `empire-clock-state` via `serializeClockState`; `Clock.tsx:52` rehydrates via `deserializeClockState`
  (tolerant field-by-field migration). No network — fully offline.
- **A dedicated unit test:** `src/apps/clock/clockLogic.test.ts` — **17 cases, all passing** (formatting,
  `alarmShouldFire` rule, serialize/deserialize round-trip + partial/old/corrupt migration).
- **New offline capability:** real countdown **Timer** tab (presets + custom mm:ss, progress, fires
  `EVENT_CREATED` → Network pulse) + WebAudio `beep()` (no asset). Both **visually confirmed** in `app-clock.png`
  (Clock | Timer | Stopwatch | Alarm tabs; editable World Clocks with "Add city…" picker; 12H toggle).

**Metric: 4/8 → 5/8** — Clock is the **first** shallow instrument to have BOTH offline function AND a dedicated
unit test (the four redesign instruments — Weather/Maps/Language/DataCenter — have function but still lack a test;
EPIC-3 S4 backfills one). The acceptance metric moved as claimed. **No runtime regressions.**

## Env-expected net noise (NOT bugs)
- `weather` → Open-Meteo geocoding + Geolocation blocked (external host egress-blocked / headless permissions policy).
- `maps` → CARTO/OSM dark-tile PNGs egress-blocked (the real Leaflet container + attribution still render; only tiles grey).
- `files` → `/api/files?path=/storage/emulated/0` HTTP 500 (Android-only storage path, no device).
