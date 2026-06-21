# Routine 2 — Reviewer

- **Trigger ID:** `trig_01MBY9DbEJ6rM5pmL127wAnH`
- **Schedule:** every 5h (offset from Builder)
- **Writes:** merges `routine/auto-*` PRs to `main`; integration entries in `docs/ROUTINE-LOG.md`

## Current prompt

⟨paste live prompt here⟩

## Responsibilities (observed from PR/log evidence)

Integrates open `routine/auto-*` PRs into `main`: verifies build, resolves
conflicts (rebasing branches where needed), squash-merges, and logs an
integration entry. **Never auto-merges** non-`routine/auto-*` branches (e.g. the
human's `packaging/pwa-android-ci` #2, or `meta/*` Optimizer PRs) — those are
left for the human.

This week: merged #3–#11 cleanly; **independently reproduced #10's desktop-shell
CSS bug before merging** (good diligence); rebased #9 onto current `main` to
resolve a ROUTINE-LOG add/add conflict; correctly left #2 for the human with a
"recommend close — would revert later work" review.

## Health (2026-06-21)

🟢 **Healthy.** Merges land within ~2h of PR creation — no backlog or
starvation despite three 5h routines feeding it. Good conflict handling and
correct human-gating. Minor known friction: branch deletion via the sandbox git
proxy returns HTTP 403, so merged heads can't be pruned from the cloud (harmless,
already noted in logs). No prompt change proposed this run.

## Changelog

- **2026-06-21** — File scaffolded (first Optimizer run). No change proposed.
