# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-28T13:11:23.814Z

**Result:** 26/26 rendered without crash, 0 failed.

> ⚠️ **First QA after the JondriDev redesign landed on main** (`23df6ce`; commits `bf76cf5`…`23df6ce`).
> Remote main was force-rebased mid-run — this report tests the **current redesigned tree**, not the
> pre-redesign `b12b835` it superseded. Intentional, builder-documented deltas (do **not** "fix"): apps
> **27 → 25** (deleted `ai-agent` + `hermes-cc`, AI unified into **Cakra** at `/app/ai-chat`); bundle gz
> **248 → 288** (+40, real Leaflet+OSM Maps); palette swapped XENO → JondriDev Earth-from-Space; bespoke
> alien SVG icon set replaces Lucide app icons; decorative HUD (`HeroHud`/`HermesAgentBar`) removed.

## Runtime bugs found this run

**None.** No uncaught JS exceptions, no error boundaries, no blank routes across the redesigned tree.
All 26 routes (desktop shell + 25 apps) render clean; INBOUND-LANDS organism loop **3/3**; SHELL-IS-STYLED ✅;
REGISTRY-COVERAGE ✅ (smoke list ↔ registry match exactly, 25 apps). Verified visually: desktop shell
(new palette + alien icons, Cakra replaces Hermes), and **Maps renders the real Leaflet container** (zoom
controls + OSM/CARTO attribution + search panel) — only the map *tiles* are grey because OSM/CARTO tile
servers are egress-blocked in the sandbox (the `maps` net:8 / `weather` net:1 noise), which is env-expected,
not a render failure.

## Harness change this run

Added a **reverse REGISTRY-COVERAGE guard** to `scripts/qa-smoke.mjs` (smoke-list ⊆ registry): an app
deleted/renamed in the registry but left in the smoke list would otherwise be visited at a dead `/app/<id>`
route and red the run as "App not found". The redesign deleted `ai-agent`+`hermes-cc`; the builder already
pruned them from the list, but the guard now makes that class of drift fail loudly at assertion time.

## Metric deltas (this run, redesigned main `23df6ce`)

| Metric | Pre-redesign (QA `b12b835`) | This run (`23df6ce`) | Δ | Note |
|---|---|---|---|---|
| Routes rendering clean | 28/28 | **26/26** | −2 routes | by design (2 apps deleted) |
| Apps both-ways into organism | 9/9 | **9/9** | ±0 ✅ | INBOUND-LANDS 3/3 live |
| Test cases (vitest) | 115 | **115** | ±0 | |
| Test files | 16 | **16** | ±0 | |
| Design-token violations | 0 | **0** | ±0 ✅ | held through the full redesign |
| Bundle gz (KB) | 248 | **288.6** | +40.6 | by design (real Leaflet Maps) |

## Epic-acceptance confirmation

- **EPIC-2 (Design-system conformance) — DONE & still CONFIRMED.** `node scripts/metrics.mjs` = **0** token
  violations even after a ground-up redesign (every new/changed surface consumes DS tokens). No regression.
- **EPIC-3 (Depth pass on shallow instruments) — ACTIVE, still UN-DECOMPOSED, but the redesign ADVANCED it.**
  Commit `b155992` made **Weather (Open-Meteo), Maps (Leaflet+Nominatim), Language (Cakra translation),
  DataCenter (local-first localStorage)** genuinely work — exactly the "shallow → real instrument" thesis of
  EPIC-3. **But EPIC-3 still has no formal stages and no declared target metric**, so there is no acceptance
  number to confirm-move yet. **The Strategist must seed EPIC-3 stages + a target metric** (e.g. "N/5 shallow
  instruments offline-capable with a unit test") so future runs can measure it. Recorded in CONTEXT + log.

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
| maps | ✅ | — | https://a.basemaps.cartocdn.com/dark_all/2/2/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/1/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/2/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/0/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://b.basemaps.cartocdn.com/dark_all/2/3/1.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/0/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://c.basemaps.cartocdn.com/dark_all/2/3/2.png (net::ERR_TUNNEL_CONNECTION_FAILED)<br>https://a.basemaps.cartocdn.com/dark_all/2/1/2.png (net::ERR_TUNNEL_CONNECTION_FAILED) |
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
