# The Empire — Fitness Metrics (the potential field)

> **Why this file exists (first principles):** you cannot descend a gradient you
> don't measure. Before this, "better" was a vibe ("feels like alien technology"),
> so the fleet polished whatever was nearest and every run was a slight iteration.
> These north-star numbers turn "huge iteration" into something *measurable*: each
> run reports its delta, the **Strategist** ranks epics by steepest gradient, the
> **Reviewer** uses them as a no-regression gate, and the **Digest** plots the trend.

The machine-measurable rows are computed by [`scripts/metrics.mjs`](../scripts/metrics.mjs)
(dependency-free; run `node scripts/metrics.mjs`). It updates `docs/metrics.json`
(current snapshot + rolling history) and prints a table with deltas. **Build first**
(`npm run build`) if you want the bundle-size row populated.

## Auto metrics (from `scripts/metrics.mjs`)

| Metric | Current (2026-06-22, after #26 + S3) | Target | Direction |
|---|---|---|---|
| Apps / routes | 26 | ~26 (steady) | coherence over new surface — not a growth metric |
| Test cases | 82 (static) · 86 (vitest run) | 60+ | ↑ higher = safer to leap |
| Test files | 11 | grow with code | ↑ |
| Design-token violations | 501 | 0 | ↓ raw hex/rgb in app code that bypasses the design system |
| Bundle gz (KB) | 237.6 | hold / shrink | ↓ |

> Last integration: **PR #26** (flow.ts + cross-app wiring + tests) **+ EPIC-1 S3**
> (Network inspector + node-type legend, commit 32676c4). Δ vs prior column (after #23):
> test cases +18 (64→82 static), test files +3 (8→11), token violations **−2 (503→501)**
> (S3 reused `rgbCss` instead of raw `rgb(` swatches), bundle gz +1.5 KB (236.1→237.6,
> inspector + legend code). `metrics.mjs` static count (82) undercounts a few nested cases;
> an actual `vitest run` is **86 passed / 11 files**.

## Manual / CI metrics (QA + human)

| Metric | Source | Current (QA 2026-06-22, after #26 + S3) | Target |
|---|---|---|---|
| Routes rendering clean | QA `REPORT.md` (headless render, no uncaught JS / blank) | **26 / 26** ✅ (27/27 incl. desktop shell; SHELL-IS-STYLED ✅) — re-confirmed 2026-06-22 (post-S3, green main; Network legend visible) | 26 / 26 |
| Apps fully wired into the organism (both **emit** and **receive** honest handoffs, visible in The Network) | QA + code audit | **1 / 26** (unchanged) — only `prompt-generator` does both. Emit-only via `NodeActions` (10): artifacts(kanban), calendar, datacenter, files, goals, learning-tracker, messages, notes, photos, prompt-generator. Receive-only via `useInboundHandoff` (4): ai-chat, editor, prompt-generator, token-counter. PR #26 touched flow visualization, not the emit/receive sets — overlap did not grow. Closing this is EPIC-1 **S6** (not yet started). | 26 / 26 |
| Lighthouse — PWA / Perf / A11y | CI (add to a workflow when feasible) | not measured headless | 90 / 90 / 90 |
| Open `routine/auto-*` PR age | reviewer log | — | < one review cycle |

## How each routine uses this

- **Builder** — runs `metrics.mjs`, pastes the delta row into the PR body, must not regress any ↓/steady metric.
- **Reviewer** — re-runs it on the merge candidate; a regression is a **hard gate** (block or require justification in the epic).
- **Visual & Smoke QA** — updates the manual rows (routes rendering, organism wiring) every run and confirms the **active epic's target metric actually moved** before marking a stage done.
- **Strategist** — picks the active epic to maximize capability gradient = (metric gain ÷ stages of effort).
- **Daily Digest** — reports today's deltas as the headline (is the fleet leaping or stalling?).

> Keep this table's "Baseline/Target" columns honest: when a target is hit, raise
> it or retire the row. A flat metric for 3+ runs is a signal for the Routine
> Optimizer that the active epic is in a local minimum.
