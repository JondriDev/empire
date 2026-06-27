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

| Metric | Current (QA 2026-06-27, after **EPIC-2 S4+S5** — design-system de-hex sweep) | Target | Direction |
|---|---|---|---|
| Apps / routes | 27 | ~26 (steady) | coherence over new surface — not a growth metric |
| Test cases | 105 (static) · 112 (vitest run) | 60+ | ↑ higher = safer to leap |
| Test files | 16 | grow with code | ↑ |
| Design-token violations | **134** | 0 | ↓ raw hex/rgb in app code that bypasses the design system |
| Bundle gz (KB) | 248.1 | hold / shrink | ↓ |

> Last integration since prior QA snapshot (`181c81a`, after S2+S3, token-violations 268): two builder
> commits — **EPIC-2 S4** (`b645762`, exempt `lib/registry.ts` accent identity manifest + de-hex the Network
> canvas via `rgbCss`, claimed 268→221, +5 tests `nodeColors.test.ts`), then **EPIC-2 S5** (`e0f8cb7`, de-hex
> the entire ai-agent/Cakra cluster + exempt `ai-agent/lib/providers.ts` provider manifest, claimed 221→134).
> **Design-token violations 268 → 134 (−134)** — EPIC-2 target metric CONFIRMED moved this QA run
> (`node scripts/metrics.mjs` reports 134, matching the S5 claim, no contradiction). Δ vs prior column:
> apps ±0 (27), test cases +5 (107→112 vitest), test files +1 (15→16), token violations **−134 (268→134)**,
> bundle gz −0.2 KB (248.3→248.1). `metrics.mjs` static count (105) undercounts nested cases; an actual
> `vitest run` is **112 passed / 16 files**.

## Manual / CI metrics (QA + human)

| Metric | Source | Current (QA 2026-06-27, after **EPIC-2 S4+S5** green main `e0f8cb7`) | Target |
|---|---|---|---|
| Routes rendering clean | QA `REPORT.md` (headless render, no uncaught JS / blank) | **27 / 27** ✅ (28/28 incl. desktop shell; SHELL-IS-STYLED ✅ + REGISTRY-COVERAGE ✅; INBOUND-LANDS 3/3 ✅) — re-confirmed 2026-06-27 (post-EPIC-2-S4+S5, green main `e0f8cb7`; all 28 routes render with 0 uncaught JS, vitest 112/112) | 27 / 27 (every entity route) |
| Apps fully wired into the organism (both **emit** and **receive** honest handoffs, visible in The Network) | QA + code audit | **9 / 9 entity-apps-with-inbound ✅ TARGET HIT (↑ from 6 — S6c)** — both-ways now: `prompt-generator`, `notes`, `learning-tracker`, `editor`, `token-counter`, `ai-chat` **+ `calendar`, `goals`, `messages`** (S6c: each gained a natural text→entity inbound via `useInboundHandoff` → opens its own create form prefilled + a "From <source>" `ProvenanceChip`; reachable from `SendResultMenu` & `NodeActions`). **Confirmed LIVE this run** (`scripts/qa-s6c-confirm.mjs`, screenshots `s6c-inbound-{calendar,goals,messages}.png`): seeding each `empire-<x>-clipboard` payload + reload shows the chip AND a prefilled field (Calendar New-Event title+date+desc, Goals New-Goal title+desc, Messages composer draft) — 3/3 ✅. The HANDOFF emission is unit-tested (`appActions.test.ts`, vitest 103). **Entity emit↔receive loop CLOSED.** Intentionally emit-only (by design, no natural inbound): files, photos, datacenter (browse/manage stores) + tool apps (calculator, clock, weather, etc.) via `NodeActions`. | 9 / 9 entity-apps-with-inbound ✅ |
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
