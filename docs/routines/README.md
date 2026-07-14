# The Empire — Routine Fleet (specs-as-code, source of truth)

The autonomous cloud fleet that builds and maintains this repo: **12 routines**
(10 enabled), all `claude-opus-4-8`, each running unattended in a fresh cloud
checkout of `main` and committing **directly to main** (no branches, no PRs —
each routine's own green gate is the only gate; `main` is the live PWA).

## Specs-as-code (since 2026-07-15)

One file per routine: `docs/routines/<name>.md` =

```
---
trigger: trig_…        # live trigger id (claude.ai/code/routines)
name: The Empire - …   # display name
cron: "0 …"            # UTC schedule
model: claude-opus-4-8
mcp: [Context7]        # attached connectors
enabled: true|false
---
<prompt body — EXACTLY the live prompt, verbatim>
```

- The **body is the live prompt**. The frontmatter mirrors the live config.
- **`/sync-routines`** (a local Claude Code skill on the owner's device) diffs
  every spec body against the live trigger config and applies changes —
  prompts only; frontmatter drift is reported, never auto-applied. Cloud
  routines cannot hold the claude.ai OAuth, so this local hop is the deliberate
  safety gate.
- The **Routine Optimizer edits spec bodies directly** (≤2 material edits/run,
  hard fences: never frontmatter, never weaken PRINCIPLES/VERIFY/FENCES blocks)
  and flags "spec edits pending /sync-routines" in the log + digest. Schedule /
  model / connector / enable changes stay **proposals** for the human.
- Every routine embeds the shared
  [OPERATING PRINCIPLES](../OPERATING-PRINCIPLES.md) block (Musk's algorithm:
  question → delete → simplify → accelerate → automate last) plus an
  expert-in-field persona.

## Roster

| # | Routine | Trigger ID | Cron (UTC) | On | Role |
|---|---------|-----------|------------|----|------|
| 1 | [Builder](./builder.md) | `trig_01NhehaEqini9ix3THyYLQcK` | `0 */5 * * *` | ✅ | **Epic Executor** — ships the next EPICS.md stage, largest safe green slice |
| 2 | [Visual & Smoke QA](./visual-smoke-qa.md) | `trig_0135fY5VNK37f98voe3m91oo` | `0 3,8,13,18,23 * * *` | ✅ | **Fitness Evaluator** — renders, smoke-tests, computes the metric field (text-only commits, images never) |
| 3 | [App Artisan](./app-artisan.md) | `trig_019UidtauKWfvnJf6sra2xAw` | `0 4,16 * * *` | ✅ | **Per-App Craftsman** — deep polish of ONE surface per run (rotation) |
| 4 | [Bug Hunter](./bug-hunter.md) | `trig_01MBY9DbEJ6rM5pmL127wAnH` | `0 2,9,17 * * *` | ✅ | **Root-Cause Exterminator** — proves main green (safety net), then reproduce → root-cause → fix → lock with a regression test; ledger `docs/BUGS.md` |
| 5 | [UI/UX Director](./ui-ux-director.md) | `trig_01GvWCNzCfdpg1RfgpTvpYfU` | `0 7,21 * * *` | ✅ | **Experience-System Owner** — one cross-app UX axis per run, fixed at token/primitive/shared-component level; ledger `docs/UX-LEDGER.md` |
| 6 | [Strategist / Roadmap](./strategist-roadmap.md) | `trig_01TvJu2Ri1tsRRedJ4U3Mrdu` | `0 23 * * *` | ✅ | **Epic Architect** — ONE active epic, deeply decomposed |
| 7 | [Daily Digest](./daily-digest.md) | `trig_017FcjDcs8ps3wSKyMvHgKwu` | `0 13 * * *` | ✅ | **Gradient Report** — numbers-first digest to Slack (fallback: docs/digests/) |
| 8 | [Deps & Security](./deps-security.md) | `trig_0166eKG2PeiJZT1RixcPsJKk` | `0 1 * * 1` | ✅ | **Negentropy + Leverage** — safe bumps + one automation/week |
| 9 | [Release Manager](./release-manager.md) | `trig_01VvxY2PFLHZz2Tn9DrQzUzY` | `0 12 * * 6` | ✅ | **Ship Master** — judges the week's delta; CHANGELOG + semver + tag → `release.yml` publishes the GitHub Release + APK |
| 10 | [Routine Optimizer](./routine-optimizer.md) | `trig_01LH2rdoeNTMWkCCxF5fwTXm` | `0 6 * * 0` | ✅ | **Constraint Hunter & Fleet Editor** — names THE bottleneck, edits ≤2 spec bodies to elevate it |
| 11 | [World Solver](./world-solver.md) | `trig_014H3aHQsaRpt8EYzjah4NP8` | `0 14 * * *` | ❌ | **Research Arm** — cited world-problem briefs into `public/solver/feed.json` |
| 12 | [Academy Tutor](./academy-tutor.md) | `trig_015VngdgtQyLpDTCoEEmkEBL` | `0 22 * * *` | ❌ | **Course Author** — no-op until the Academy app lands |

~19–20 Opus runs/day. Free cron hours were chosen so no two routines fire in
the same UTC hour (except the pre-existing QA/Digest 13:00 and QA/Strategist
23:00 overlaps).

## The loop

```
Strategist ── ONE active EPIC, pre-decomposed green stages ──▶ docs/EPICS.md
     ▲                                                             │
     │                                              Builder executes the next stage
 Digest reports the gradient                        Artisan deepens one app/run
     ▲                                              Director widens one UX axis/run
     │                                              Bug Hunter proves green + kills defects
 ROUTINE-LOG ◀── QA renders + measures + confirms the epic metric moved
     │                                              Release Manager tags the week's delta
     └── Optimizer (weekly): names THE constraint, EDITS the specs ──▶ /sync-routines applies
```

## Safety model

Bounded leap, unchanged: every producer's **green gate** (build + vitest +
eslint + check-shell-styled + check-route-parity + check-audit +
`metrics.mjs --assert-zero` + no-regression) before every push; rebase-retry,
never force-push; lanes fenced per spec; QA commits text only (images are
gitignored and never committed); localStorage schemas and the Artifacts/Solver
security invariants are load-bearing in every spec; the Optimizer's edit
authority is bounded by its fences + the sync skill's guards + git history
(every spec edit is a revertable commit).

_Scaffolded 2026-06-21 · "huge iterations" redesign 2026-06-22 ·
direct-to-main since ~2026-06-24 · **Fleet v3 2026-07-15**: Musk-principled
prompts, Bug Hunter (ex-Guardian slot), UI/UX Director, Release Manager,
spec-editing Optimizer, specs-as-code + /sync-routines._
