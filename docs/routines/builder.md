# Routine 1 — Builder

- **Trigger ID:** `trig_01NhehaEqini9ix3THyYLQcK`
- **Schedule:** every 5h
- **Branch prefix:** `routine/auto-*`
- **Writes:** app code + tests (opens a code PR per run)

## Current prompt

⟨paste live prompt here⟩

## Responsibilities (observed from PR/log evidence)

Pulls the top **ROADMAP.md NOW** item, ships it as one small, verified,
reversible PR on a `routine/auto-*` branch, and queues the next step. Every run:
`npm run build` (tsc -b && vite build) green · `vitest run` green · `eslint`
clean on touched files · no localStorage/schema changes unless intended ·
honest "not verifiable in cloud (no rendered UI)" caveats for visual work.

Observed output this week: #3 (Network ↔ event bus), #5 (self-host JetBrains
Mono — fixed a QA-flagged offline-font bug), #7 (Network live ticker), #8
(app→app synapse arcs), #13 (HANDOFF event). Design-system tokens (XENO /
`--signal` etc.) honored consistently.

## Health (2026-06-21)

🟢 **Healthy.** Clean, well-verified, reversible PRs that follow the roadmap.
Note: 4 of 5 code PRs this week (#3/#7/#8/#13) are Network/interconnect — but
that tracks the strategist's INTERCONNECT-weighted NOW list, so it's correct
focus, not churn. No prompt change proposed this run.

## Changelog

- **2026-06-21** — File scaffolded (first Optimizer run). No change proposed.
