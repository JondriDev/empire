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

| Metric | Current (2026-06-22, after #23) | Target | Direction |
|---|---|---|---|
| Apps / routes | 26 | ~26 (steady) | coherence over new surface — not a growth metric |
| Test cases | 64 | 60+ | ↑ higher = safer to leap |
| Test files | 8 | grow with code | ↑ |
| Design-token violations | 503 | 0 | ↓ raw hex/rgb in app code that bypasses the design system |
| Bundle gz (KB) | 236.1 | hold / shrink | ↓ |

> Last integration: **#23** (EPIC-1 S1 · inbound provenance) — Δ vs prior main:
> test cases +4 (60→64), token violations ±0 (503), bundle gz +1.3 KB (234.8→236.1,
> one new hook + chip component). The old `24 / 496 / null` column was a stale
> pre-organism-core snapshot; these are the true current values.

## Manual / CI metrics (QA + human)

| Metric | Current (2026-06-22 QA) | Source | Target |
|---|---|---|---|
| Routes rendering clean | **26 / 26** ✅ | QA `REPORT.md` (headless render, no uncaught JS / blank) | 26 / 26 |
| Apps fully wired into the organism (both **emit** and **receive** honest handoffs, visible in The Network) | **3 / 26** (emit-capable 10/26 · receive-capable 6/26) | QA + code audit | 26 / 26 |
| Lighthouse — PWA / Perf / A11y | not yet measured | CI (add to a workflow when feasible) | 90 / 90 / 90 |
| Open `routine/auto-*` PR age | see reviewer log | reviewer log | < one review cycle |

> **Organism-wiring breakdown (2026-06-22 QA, honest code audit):** *emit-capable* (renders
> `<NodeActions>` ⚡ Send-to) = artifacts, calendar, datacenter, files, goals, learning-tracker,
> messages, notes, photos, prompt-generator (**10**). *Receive-capable* = editor, token-counter,
> prompt-generator, ai-chat (provenance chip, S1) + notes, learning-tracker (in-place create)
> (**6**). *Both ways* = prompt-generator, notes, learning-tracker (**3**). EPIC-1 S2–S6 close
> the gap. EPIC-1 **S1 acceptance confirmed end-to-end** this run (all 4 chip receivers render
> "From <source>" when seeded — see QA `REPORT.md`).

## How each routine uses this

- **Builder** — runs `metrics.mjs`, pastes the delta row into the PR body, must not regress any ↓/steady metric.
- **Reviewer** — re-runs it on the merge candidate; a regression is a **hard gate** (block or require justification in the epic).
- **Visual & Smoke QA** — updates the manual rows (routes rendering, organism wiring) every run and confirms the **active epic's target metric actually moved** before marking a stage done.
- **Strategist** — picks the active epic to maximize capability gradient = (metric gain ÷ stages of effort).
- **Daily Digest** — reports today's deltas as the headline (is the fleet leaping or stalling?).

> Keep this table's "Baseline/Target" columns honest: when a target is hit, raise
> it or retire the row. A flat metric for 3+ runs is a signal for the Routine
> Optimizer that the active epic is in a local minimum.
