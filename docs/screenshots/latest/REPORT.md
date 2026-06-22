# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-22T13:04:41.266Z

**No runtime bugs found this run.** Build 🟢, all routes render styled, vitest 86/86 🟢.

**Result:** 27/27 rendered without crash, 0 failed.

## Metric deltas (vs last QA confirmation, "after #23")

The fleet integrated **PR #26 (flow.ts + cross-app wiring + tests)** and **EPIC-1 S3
(Network inspector + node-type legend, commit 32676c4)** since the last QA run. Auto
metrics moved accordingly (from `scripts/metrics.mjs` / `docs/metrics.json`):

| Metric | Prev (after #23) | Now | Δ | Direction |
|---|---|---|---|---|
| Apps / routes | 26 | 26 | ±0 | steady |
| Test cases (static count) | 64 | 82 | **+18** | ↑ good |
| Test files | 8 | 11 | **+3** | ↑ good |
| Design-token violations | 503 | **501** | **−2** | ↓ good (S3 reused `rgbCss`) |
| Bundle gz (KB) | 236.1 | 237.6 | +1.5 | ↑ (S3 inspector/legend code) |

> Note: `metrics.mjs` static count = 82; an actual `vitest run` = **86 passed** (its regex
> undercounts a few nested cases). Both directions agree (test coverage grew with S3 + #26).

## Manual rows

- **Routes rendering clean: 26 / 26 ✅** (27/27 incl. desktop shell). SHELL-IS-STYLED
  assertion passed (top-level `.empire-desktop{position:fixed}`, 0 `.hide-sm .empire-desktop`).
  Desktop + Network screenshots visually confirmed styled (XENO palette; Network shows CORE +
  all satellites **and the new S3 legend panel** bottom-right).
- **Apps fully wired BOTH-ways: 1 / 26** (unchanged) — only `prompt-generator` both emits
  (`<NodeActions>`) and receives (`useInboundHandoff`). Emit-only via `NodeActions` (10):
  artifacts(kanban), calendar, datacenter, files, goals, learning-tracker, messages, notes,
  photos, prompt-generator. Receive-only via `useInboundHandoff` (4): ai-chat, editor,
  prompt-generator, token-counter. PR #26's wiring touched flow visualization, **not** the
  emit/receive app sets — so this overlap did not grow.

## Epic-acceptance confirmation (EPIC-1 · Organism Completeness)

- **S3 (Network inspector + legend) — CONFIRMED shipped.** Its stated metric move
  (token-violations **503 → 501**) is verified in `docs/metrics.json`. `adjacency.test.ts`
  (5 tests, the new pure seam) passes. Legend panel is visible in `app-network.png`.
  *Limitation (honest):* the inspector's per-app entity/neighbour listing could **not** be
  exercised headless — a fresh context has an empty `empire-core-graph` (no seeded nodes),
  so no app node carries entities to click. Legend + tests verify the seam; live inspector
  content is verified-by-construction, not by headless interaction.
- **EPIC-1 target metric (apps fully wired both-ways) — STILL PENDING at 1/26.** S1/S2/S3
  shipped, but the both-ways closure is **S6** (not yet started), so the headline organism
  metric has **not** moved. No contradiction — just the remaining gradient. S4 (command
  palette) is the next active stage.

## Env-expected network noise (NOT bugs)

- `files`: `/api/files?path=/storage/emulated/0` → HTTP 500 (Android-only storage path).
- `datacenter`: `/api/dc/tables` → HTTP 401 (authed API; no headless session).

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

## Screenshots

See PNGs in this folder. `desktop.png` is the shell; `app-<id>.png` is each app route.
