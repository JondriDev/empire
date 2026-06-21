# Routine 6 — Daily Digest

- **Trigger ID:** `trig_017FcjDcs8ps3wSKyMvHgKwu`
- **Schedule:** daily
- **Writes:** Slack summary (no repo artifact)

## Current prompt

⟨paste live prompt here⟩

## Responsibilities (observed)

Posts a daily Slack summary of fleet activity. Output lands in Slack, **not the
repo**, so it is not observable from a cloud checkout — the Optimizer cannot
evaluate its quality from here.

## Health (2026-06-21)

⚪ **Unobservable from the repo.** No prompt change proposed. If a human wants
this routine audited, the digest's Slack output (or a copy committed to
`docs/`) would need to be made available to the Optimizer.

## Changelog

- **2026-06-21** — File scaffolded (first Optimizer run). No change proposed
  (output not observable from the repo).
