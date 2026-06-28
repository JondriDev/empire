# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-28T04:06:50.051Z

**Result:** 28/28 rendered without crash, 0 failed.

**No runtime bugs found.** Build 🟢 (`tsc -b && vite build`), vitest **115/115 🟢** (16 files), eslint clean. SHELL-IS-STYLED ✅ (top-level `.empire-desktop{…position:fixed…}`, 0 `.hide-sm .empire-desktop`), REGISTRY-COVERAGE ✅ (all 27 registry apps smoke-tested), INBOUND-LANDS **3/3 ✅**.

## Fitness metrics (this run vs. last QA snapshot)

| Metric | Value | Δ vs last QA | Notes |
|---|---|---|---|
| Apps / routes | 27 | ±0 | steady-state |
| Test cases | 108* | ±0 | *`(it\|test)(` source count; vitest runtime = 115 (it.each expands) |
| Test files | 16 | ±0 | |
| Token violations | **59** | **−75** (134→59) | LOWER is better — EPIC-2 target |
| Bundle gz (KB) | 248.1 | −0.0 | |

- **Routes rendering clean: 27/27 ✅** (28/28 incl. desktop).
- **Apps fully wired both-ways: 9/9 entity-apps-with-inbound** (EPIC-1 target, held). INBOUND-LANDS re-verified live: calendar←editor, goals←notes, messages←ai-chat each show a "Received from …" chip + prefilled control off the live render.

## Epic-acceptance confirmation — EPIC-2 (active)

**Target metric:** *Design-token violations* 501 → 0. **CONFIRMED MOVED.** Since the last QA (green main `e0f8cb7`, 134), builder commit **S6** (`5bd2cd0` — entire artifacts app → 0 via the shared `CATEGORICAL` accent rail + exempt `ColorPalette.tsx`) claimed 134→59. `node scripts/metrics.mjs` this run reports **59** → confirmed, no contradiction (metrics.json history shows the 134→59 step at 2026-06-28T00:07). Net since last QA: **−75**. Visually verified: the artifacts app (ChartBuilder/Kanban/FormBuilder/gallery) renders the categorical token series, no broken/blank swatches.

**Remaining 59 → 2 stages (EPICS.md S7/S8, not yet built):** S7 shared-UI + shell (~45, top offenders `Toast.tsx` 16, `ErrorBoundary.tsx` 7, `Desktop.tsx`/`Utility.tsx` 6 each, `Notes.tsx` 6), S8 long-tail → 0 / EPIC-2 close.

**Env-expected net noise (not bugs):** `files` `/api/files?path=/storage/emulated/0`→HTTP 500 (Android-only path), `datacenter` `/api/dc/tables`→HTTP 401 (authed API, no headless session).


> **PASS** = the app rendered with no uncaught JS exception / error boundary / blank screen.
> Network & console noise (failed external CDN fetches, backend API calls needing auth) is
> listed separately — expected in the offline cloud sandbox and **not** a render failure.

| App | Render | Uncaught JS / crash | Network / console notes |
|---|---|---|---|
| desktop | ✅ | — | — |
| calculator | ✅ | — | — |
| calendar | ✅ | — | — |
| clock | ✅ | — | — |
| weather | ✅ | — | — |
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
| datacenter | ✅ | — | /api/dc/tables → HTTP 401 |
| maps | ✅ | — | — |
| messages | ✅ | — | — |
| prompt-generator | ✅ | — | — |
| token-counter | ✅ | — | — |
| learning-tracker | ✅ | — | — |
| ai-agent | ✅ | — | — |
| ai-chat | ✅ | — | — |
| goals | ✅ | — | — |
| hermes-cc | ✅ | — | — |
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
