# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-27T13:04:43.468Z · green main `386ff36`

**Result:** 28/28 rendered without crash, 0 failed. **No runtime bug found.**

## Metric deltas (this run)

| Metric | Value | Δ vs last QA (post-S6c) |
|---|---|---|
| Routes rendering clean | 27 / 27 (28/28 incl. desktop) | ±0 |
| Apps both-ways into the organism | 9 / 9 entity-apps-with-inbound | ±0 (EPIC-1 target held) |
| Design-token violations | **388** | **−113 (501→388)** |
| Test cases (vitest) | 107 / 107 (15 files) | +4 |
| Bundle gz | 243.6 KB | +0.1 |

## Epic-acceptance confirmation

**ACTIVE epic: EPIC-2 — Design-system conformance → zero token violations** (target *Design-token
violations* 501 → 0). **EPIC-2 S1 CONFIRMED MOVED:** S1 (palette seam `src/design-system/tokens.ts` +
Hermes cluster de-hex) claimed 501 → 388 (−113); `node scripts/metrics.mjs` this run reports **388** →
confirmed, no contradiction. Next stage **S2** (un-swept top offenders: `SettingsPanel.tsx` 38,
`Calculator.tsx` 38, `MarkdownStudio.tsx` 29). EPIC-1 (both-ways 9/9) re-verified live by the
INBOUND-LANDS guard (3/3 receivers chip+prefill).

> Guards green: SHELL-IS-STYLED ✅ · REGISTRY-COVERAGE ✅ (27/27) · INBOUND-LANDS ✅ (3/3).
> Env-expected noise (NOT bugs): `/api/files` 500 (Android-only path), `/api/dc/tables` 401 (no headless auth).

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
