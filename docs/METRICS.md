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

| Metric | Current (QA 2026-06-28, after **EPIC-3 S1 (Clock)** — green main `2cb7801`) | Target | Direction |
|---|---|---|---|
| Apps / routes | 25 | ~26 (steady) | coherence over new surface — not a growth metric |
| Test cases | 125 (static) · 132 (vitest run) | 60+ | ↑ higher = safer to leap |
| Test files | 17 | grow with code | ↑ |
| Design-token violations | **0** | 0 | ↓ raw hex/rgb in app code that bypasses the design system |
| Bundle gz (KB) | 290.7 | hold / shrink | ↓ |

> Last integration since prior QA snapshot (`23df6ce`, JondriDev redesign, apps 25 / gz 288.6 / vitest 115 / files
> 16): one code commit landed — **`2cb7801` EPIC-3 S1 (persistent offline Clock + countdown Timer)**. Δ: test cases
> **115 → 132 (+17)** (`clockLogic.test.ts`), test files **16 → 17 (+1)**, bundle gz **288.6 → 290.7 (+2.1, the
> Timer tab, by design)**, apps ±0 (25), token violations ±0 (**0**). `metrics.mjs` static count (125) undercounts
> nested cases; an actual `vitest run` is **132 passed / 17 files**. CONFIRMED on green main `2cb7801`, no contradiction.

> Prior context (still load-bearing): the **JondriDev redesign** (`bf76cf5`…`23df6ce`) intentionally set apps
> **27 → 25** (deleted `ai-agent` + `hermes-cc`; AI unified into **Cakra** at `/app/ai-chat`) and bundle gz
> **248 → 288.6** (real **Leaflet + OSM** Maps); palette swapped XENO → Earth-from-Space, alien SVG icon set,
> decorative HUD removed. **Do NOT regress-gate these intentional deltas.** It also made
> **Weather/Maps/Language/DataCenter genuinely work** (`b155992`) — pre-delivered the first four EPIC-3 instruments.

## Manual / CI metrics (QA + human)

| Metric | Source | Current (QA 2026-06-28, after **EPIC-3 S1 (Clock)** green main `2cb7801`) | Target |
|---|---|---|---|
| Routes rendering clean | QA `REPORT.md` (headless render, no uncaught JS / blank) | **25 / 25** ✅ (26/26 incl. desktop shell; SHELL-IS-STYLED ✅ + REGISTRY-COVERAGE ✅ bidirectional + INBOUND-LANDS 3/3 ✅) — re-confirmed 2026-06-28 on `2cb7801` (all 26 routes render with 0 uncaught JS, vitest 132/132; Earth-from-Space palette + alien icons + Cakra verified visually; Clock shows the new Timer tab + editable World Clocks; Maps renders the real Leaflet container — only OSM/CARTO tiles grey, env-blocked). | 25 / 25 (every entity route) |
| Shallow instruments with offline function + a unit test (EPIC-3 target) | QA + code audit | **5 / 8** — Clock (S1: `empire-clock-state` persistence + `clockLogic.test.ts` 17 cases ✅, **first with BOTH function AND test**) + the 4 redesign instruments Weather/Maps/Language/DataCenter (function ✅, dedicated test pending → S4 backfills). Remaining shallow: Music, Video, Photos (S2/S3). **Moved 4/8 → 5/8 this run (S1 confirmed).** | 8 / 8 |
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
