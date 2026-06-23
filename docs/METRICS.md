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

| Metric | Current (2026-06-23, after #26 + S3 + S4 + S5 + S6a + S6b) | Target | Direction |
|---|---|---|---|
| Apps / routes | 27 | ~26 (steady) | coherence over new surface — not a growth metric |
| Test cases | 96 (static) · 100 (vitest run) | 60+ | ↑ higher = safer to leap |
| Test files | 14 | grow with code | ↑ |
| Design-token violations | 501 | 0 | ↓ raw hex/rgb in app code that bypasses the design system |
| Bundle gz (KB) | 242.8 | hold / shrink | ↓ |

> Last integration: **EPIC-1 S6b** — the three dead-end sinks (Editor, Token-Counter, AI-Chat) now
> emit onward via the shared `src/components/ui/SendResultMenu.tsx` (commit b6cd0c3:
> `SendResultMenu.tsx` + `SendResultMenu.test.tsx`, wired into the 3 sinks). Δ vs prior column (after
> S6a): apps ±0 (27), test cases +3 (93→96 static, 97→100 vitest), test files +1 (13→14,
> `SendResultMenu.test.tsx`), token violations **±0 (501)** (hover tints use `color-mix`, no new
> colours), bundle gz +1.9 KB (240.9→242.8, the `SendResultMenu` chunk wired into 3 apps).
> `metrics.mjs` static count (96) undercounts a few nested cases; an actual `vitest run` is **100 passed / 14 files**.

## Manual / CI metrics (QA + human)

| Metric | Source | Current (QA 2026-06-23, after #26 + S3 + S4 + S5 + S6a + S6b) | Target |
|---|---|---|---|
| Routes rendering clean | QA `REPORT.md` (headless render, no uncaught JS / blank) | **27 / 27** ✅ (28/28 incl. desktop shell; SHELL-IS-STYLED ✅ + REGISTRY-COVERAGE ✅) — re-confirmed 2026-06-23 (post-S6b, green main `b6cd0c3`; all 28 routes render with 0 uncaught JS) | 27 / 27 (every entity route) |
| Apps fully wired into the organism (both **emit** and **receive** honest handoffs, visible in The Network) | QA + code audit | **6 / 9 entity-apps-with-inbound** (↑ from 3 — S6b) — now both-ways: `prompt-generator`, `notes`, `learning-tracker` (receive provenance) **+ `editor`, `token-counter`, `ai-chat`** (S6b: each gained a `SendResultMenu` "Send to…" affordance that runs a `CROSS_APP_ACTIONS` executor → `handoff(...)` → a real source→target arc). **Confirmed live** this run (`editor-send-menu.png`): the "Send code to…" menu is disabled-when-empty, enabled-with-content, lists 4 targets and excludes Editor itself (no self-handoff); the HANDOFF emission is unit-tested in `SendResultMenu.test.tsx` (3). Remaining gap to the honest target = **calendar, goals, messages** (emit-only entity apps with a natural inbound) — closed by **S6c** (the last EPIC-1 stage). Still emit-only via `NodeActions`: artifacts(kanban), calendar, datacenter, files, goals, inbox, messages, photos. **Honest EPIC-1 target = 9 / 9** entity-apps-with-a-natural-inbound; files/photos/datacenter + tool apps stay emit-only *by design*. | 9 / 9 entity-apps-with-inbound |
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
