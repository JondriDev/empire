# Routine 4 — Strategist / Roadmap

- **Trigger ID:** `trig_01TvJu2Ri1tsRRedJ4U3Mrdu`
- **Schedule:** daily
- **Writes:** `docs/ROADMAP.md`, `docs/ROUTINE-LOG.md` (docs-only)

## Current prompt

⟨paste live prompt here⟩

## Responsibilities (observed from PR/log evidence)

Maintains the single prioritized backlog (`docs/ROADMAP.md`,
NOW/NEXT/LATER/DONE) the Builder + QA pull from. Re-ranks against what shipped
and what QA flagged; keeps items small and PR-sized with acceptance checks.
Priority bias: fix-what-QA-reports-broken → interconnection → design-system
consistency → completing apps → PWA → Android. Docs-only scope.

This week: created the first ROADMAP (#9) with a clean NOW list and concrete
acceptance criteria. The NOW items map 1:1 to what the Builder actually shipped
(#13 HANDOFF = NOW #1), so the backlog is being honored.

## Health (2026-06-21)

🟢 **Healthy**, with one gap → **prompt change proposed this run** (see PR). The
ROADMAP's stated #1 priority is "fix what QA reports broken," yet QA's RUNTIME
FINDING — the orphaned `/app/goals` route — surfaced in #10 and was escalated to
a hard finding in #12, but **never entered the NOW backlog**. Proposal: make
"ingest the latest QA REPORT.md / QA-PR RUNTIME FINDINGs into NOW" an explicit
step so QA findings can't fall through.

## Changelog

- **2026-06-21** — File scaffolded (first Optimizer run). **Proposed** (PR
  `meta/improve-2026-06-21`): add an explicit "ingest QA RUNTIME FINDINGs into
  NOW" step. _Pending human apply._
