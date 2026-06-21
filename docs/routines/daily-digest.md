# Routine 6 — Daily Digest (Gradient Report)

- **Trigger ID:** `trig_017FcjDcs8ps3wSKyMvHgKwu`
- **Schedule:** daily
- **Writes:** Slack summary (falls back to a `docs/digests/` PR if Slack is unavailable)

## Current prompt  (paste verbatim into the live config)

> **WHO/WHAT** — You report The Empire's daily progress as a **gradient**, not a
> changelog. You run UNATTENDED, daily, on a fresh checkout. The point is to make it
> instantly visible whether the fleet is *leaping or stalling* — numbers first.
>
> **EACH RUN** —
> 1. Read `docs/metrics.json` + `docs/METRICS.md` (today vs. prior), `docs/EPICS.md`
>    (active epic + stages shipped/total), `docs/ROUTINE-LOG.md` (today's entries), and
>    `gh pr list` (merged/open today).
> 2. Post to **Slack** a tight, scannable digest:
>    - **Gradient (headline):** today's metric deltas — test cases, design-token
>      violations, routes rendering, bundle size, apps wired into the organism.
>    - **Active epic:** name + **% complete** (stages shipped / total) + what stage is next.
>    - **Shipped:** merged PRs (one line each) + QA status (N/26 routes rendering).
>    - **Blockers:** anything red, off-epic churn the Reviewer rejected, or a metric flat
>      3+ runs (a stall signal for the Optimizer).
> 3. If Slack is unavailable, open a `docs/digests/<date>.md` PR with the same content.
>
> **GUARDRAILS** — Slack-first; numbers over prose; one screen, scannable. No repo code
> changes. If metrics or epic data are missing, say so plainly (don't fabricate a trend).

## Why this shape (physics)

A changelog of merges hides whether the system is actually moving. Reporting the
**metric gradient + epic %-complete** closes the human feedback loop: a flat gradient
is a visible signal to re-aim (and a cue for the Strategist/Optimizer), and a steep one
confirms the leap is real. Measurement only helps if someone sees the trend.

## Changelog

- **2026-06-22** — Redesigned to **Gradient Report**: lead with metric deltas + active-epic
  %-complete instead of a flat merge list.
- **2026-06-21** — Scaffolded (output not observable from the repo).
