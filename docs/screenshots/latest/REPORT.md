# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-27T18:05:46.248Z

**Result:** 28/28 rendered without crash, 0 failed.

**No runtime bugs found this run.** Build 🟢, vitest 107/107 🟢, SHELL-IS-STYLED ✅, REGISTRY-COVERAGE ✅ (27/27), INBOUND-LANDS 3/3 ✅.

## Metric deltas (vs last QA snapshot `4d4754f`, post-EPIC-2-S1)

| Metric | Last QA (S1) | This run | Δ |
|---|---|---|---|
| Apps / routes | 27 | 27 | ±0 |
| Test cases (vitest) | 107 | 107 | ±0 |
| Test files | 15 | 15 | ±0 |
| **Design-token violations** | **388** | **268** | **−120** |
| Bundle gz (KB) | 243.6 | 248.3 | +4.7 |
| Routes rendering clean | 27/27 | 27/27 | ±0 |
| Apps both-ways into organism | 9/9 | 9/9 | ±0 |

Bundle +4.7 KB traces to the two `cakra` feature commits (`2ab3285` adaptive NIM-pool orchestrator, `6e1fc1e` live Workspace panel) — product growth, not a QA-flagged regression.

## Epic-acceptance confirmation — EPIC-2 (ACTIVE)

EPIC-2 target metric = *Design-token violations* (501 → 0). Two builder stages landed since the last QA:
- **S2** (`e396ce6`): claimed 388 → 283 (SettingsPanel/Calculator/MarkdownStudio cluster).
- **S3** (`bdbce00`): claimed 321 → 268 (shared UI primitives cluster; baseline 321 not 283 because the two cakra commits regressed +38 in between).

`node scripts/metrics.mjs` this run reports **268** → **CONFIRMED MOVED, no contradiction**. The Tailwind→XENO recolor itself is not headless-verifiable, but the metric drop is the proof; all touched files render clean. Top remaining offenders (next stages): `lib/registry.ts` (27), `artifacts/ColorPalette.tsx` (23), `apps/network/Network.tsx` (21), `ai-agent/ChatPanel.tsx` (19), `ai-agent/Agent.tsx` (17).

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
