# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-28T09:10:49.869Z

**Result:** 28/28 rendered without crash, 0 failed.

## ✅ No runtime bugs found this run. EPIC-2 S7 acceptance CONFIRMED.

**Headline:** green main `d66dd27`. Build 🟢, `tsc -b && vite build` clean. vitest **115/115** (16 files).
ESLint clean. SHELL-IS-STYLED ✅ (top-level `.empire-desktop{…position:fixed…}`, 0 `.hide-sm .empire-desktop`),
REGISTRY-COVERAGE ✅ (all 27 registry apps smoke-tested), INBOUND-LANDS **3/3 ✅**.

**Epic-acceptance (EPIC-2 · Design-token violations → 0):** the ACTIVE epic's target metric is
*Design-token violations*. Two commits landed since the last QA snapshot (which reported **59** after S6):
**S7** (`37e26db` — swept the 7 shared-UI + shell surfaces: Toast/ErrorBoundary/Utility/Desktop/Dashboard/
AppShell/NodeActions, claimed 59→14) and a routines-retro doc commit. `node scripts/metrics.mjs` this run
reports **14** → **CONFIRMED, no contradiction** (`metrics.json` history shows the discrete **59 → 14** step).
Visually verified: the desktop shell, app grid, telemetry rail and toasts render fully in XENO accents
(Desktop/AppShell/Dashboard chrome intact — see `desktop.png`); artifacts categorical rail unbroken
(`app-artifacts.png`). **EPIC-2 is one stage from DONE** — S8 (long-tail entity apps → 0) is the close.

**Metric deltas vs last QA snapshot (`4826447`, token-violations 59):**

| Metric | Prev (QA post-S6) | This run (QA post-S7) | Δ |
|---|---|---|---|
| Design-token violations | 59 | **14** | **−45** ✅ (S7 acceptance) |
| Routes rendering clean | 27/27 (28/28 incl. shell) | **27/27 (28/28)** | ±0 ✅ |
| Apps both-ways (entity-apps-with-inbound) | 9/9 | **9/9** | ±0 ✅ (EPIC-1 held) |
| Test cases (vitest) | 115 | **115** | ±0 |
| Test files | 16 | **16** | ±0 |
| Bundle gz (KB) | 248.1 | **248** | ±0 |

**Remaining 14 token violations (= S8 scope, EPIC-2 close):** `apps/notes/Notes.tsx` (6),
`apps/goals/Goals.tsx` (3), `apps/ai-chat/AIChat.tsx` (2), `apps/weather/Weather.tsx` (1),
`apps/calendar/Calendar.tsx` (1), `apps/network/nodeColors.ts` (1).

**Env-expected net noise (NOT bugs):** `files` `/api/files?path=/storage/emulated/0` → HTTP 500 (Android-only
path), `datacenter` `/api/dc/tables` → HTTP 401 (authed API, no headless session). All other routes: 0 net failures.

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
