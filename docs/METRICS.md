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

| Metric | Current (2026-06-23, after #26 + S3 + S4 + S5 + S6a) | Target | Direction |
|---|---|---|---|
| Apps / routes | 27 | ~26 (steady) | coherence over new surface — not a growth metric |
| Test cases | 93 (static) · 97 (vitest run) | 60+ | ↑ higher = safer to leap |
| Test files | 13 | grow with code | ↑ |
| Design-token violations | 501 | 0 | ↓ raw hex/rgb in app code that bypasses the design system |
| Bundle gz (KB) | 240.9 | hold / shrink | ↓ |

> Last integration: **EPIC-1 S5** — Inbox / Today view (the 27th app) aggregating every graph
> `task` node (commit a4f60a7: `tasks.ts`/`tasks.test.ts`, `apps/inbox/Inbox.tsx`, `NodeActions`
> optional `nodeId`). Δ vs prior column (after S4): apps +1 (26→27, `inbox`), test cases +4 (88→92
> static, 92→96 vitest), test files +1 (12→13, `tasks.test.ts`), token violations **±0 (501)** (Inbox
> is pure tokens — no regression), bundle gz +1.6 KB (238.9→240.5, the Inbox chunk + registry entry).
> `metrics.mjs` static count (92) undercounts a few nested cases; an actual `vitest run` is **96 passed / 13 files**.

## Manual / CI metrics (QA + human)

| Metric | Source | Current (QA 2026-06-22, after #26 + S3 + S4 + S5) | Target |
|---|---|---|---|
| Routes rendering clean | QA `REPORT.md` (headless render, no uncaught JS / blank) | **27 / 27** ✅ (28/28 incl. desktop shell; SHELL-IS-STYLED ✅ + REGISTRY-COVERAGE ✅) — re-confirmed 2026-06-23 (post-S6a, green main; all 28 routes render with 0 uncaught JS) | 27 / 27 (every entity route) |
| Apps fully wired into the organism (both **emit** and **receive** honest handoffs, visible in The Network) | QA + code audit | **3 / 27** (↑ from 1 — S6a) — `prompt-generator`, **`notes`** and **`learning-tracker`** now do both. S6a made the two silent in-place receivers legible: Notes renders a `From <source>` chip off its `from-*` tag, Learning renders one off `item.from`; **confirmed live** this run (seeded note→"From Calculator", learning item→"From Notes", 0 errors — `notes-provenance.png`/`learning-provenance.png`). Still emit-only via `NodeActions`: artifacts(kanban), calendar, datacenter, files, goals, inbox, messages, photos. Receive-only via `useInboundHandoff`: ai-chat, editor, token-counter. **Honest EPIC-1 target = 9 / 9** entity-apps-with-a-natural-inbound (notes, learning, prompt-gen, editor, token-counter, ai-chat, calendar, goals, messages); files/photos/datacenter + tool apps stay emit-only *by design*. Next: **S6b** (Editor/Token-Counter/AI-Chat emit onward → 6). | 9 / 9 entity-apps-with-inbound |
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
