# The Empire — Routine Fleet (spec source-of-truth)

Human-readable spec for The Empire's autonomous cloud fleet: **7 routines** that
build and maintain this repo. One file per routine (`docs/routines/<name>.md`)
holds its **current prompt + schedule + a short changelog**. The verbatim prompt
in each file is the text to paste into the live routine config on claude.ai.

> **The live routine prompts live on claude.ai and only a human can edit them.**
> These files are the source of truth: when you change a live config, paste the
> resulting prompt back into the matching file here.

## The operating model (redesigned 2026-06-22 — "huge iterations")

The fleet was re-architected from *first principles* to stop producing slight
iterations. The old contract literally said "make the **smallest** coherent
change," so it did. The new model keeps every safety rail (green-build hard gate,
one careful merge per cycle, propose-only meta) but removes the **step-size
governor** and adds the infrastructure that makes a big leap *cheap and safe*:

| First-principles lever | Failure it fixes | Artifact |
|---|---|---|
| **Conserve context energy** | stateless runs re-derive the codebase every time (waste heat) | [`docs/CONTEXT.md`](../CONTEXT.md) — cross-run working memory |
| **Lower activation energy** | big features fumble across many runs, re-planned each time | [`docs/EPICS.md`](../EPICS.md) — big leaps pre-decomposed into green stages |
| **Build a potential field** | "better" was a vibe; no gradient to climb | [`docs/METRICS.md`](../METRICS.md) + [`scripts/metrics.mjs`](../../scripts/metrics.mjs) |
| **Bias to leverage** | additive chores instead of multiplicative tooling | Deps routine lands one automation/week; QA owns CI guards |

**Safety level: bounded leap.** Bigger *pre-planned* steps, not bigger raw diffs.
The Reviewer still merges **one** code PR per cycle, carefully; the green build
(+ no metric regression) is still a hard gate; the Optimizer still only proposes.
The leap comes from *not wasting energy*, from pre-decomposition, and from
measuring — not from recklessness.

## The loop

```
Strategist ── defines ONE active EPIC, decomposed into green stages ──▶ docs/EPICS.md
     ▲                                                                       │
     │                                                                Builder takes next stage,
 Digest reports                                                        executes at full speed
 metric gradient        reads CONTEXT.md first ──────────────────────▶ (no re-planning),
     ▲                  writes seams + metric delta back ◀──────────── opens routine/auto-* PR
     │                                                                       │
 ROUTINE-LOG ◀── Reviewer merges 1 green, on-epic, no-regression PR ◀───────┘
                 QA renders + measures + confirms the epic's metric moved
                 Optimizer (weekly) names THE constraint, proposes the fix
```

## How changes flow (safety gate, unchanged)

```
Optimizer (weekly, read-only) ──proposes──▶ meta/* PR (stays OPEN) ──human applies──▶ live config + paste back here
```

## Roster

| # | Routine | Trigger ID | Schedule | Role (redesigned) | Spec |
|---|---------|-----------|----------|------|------|
| 1 | Builder | `trig_01NhehaEqini9ix3THyYLQcK` | every 5h | **Epic Executor** — ships the next epic stage, largest safe green slice | [builder.md](./builder.md) |
| 2 | Reviewer | `trig_01MBY9DbEJ6rM5pmL127wAnH` | every 5h (offset) | **Integrator** — 1 on-epic, green, no-regression code PR/cycle | [reviewer.md](./reviewer.md) |
| 3 | Visual & Smoke QA | `trig_0135fY5VNK37f98voe3m91oo` | every 5h | **Fitness evaluator** — render + measure + confirm epic metric moved | [visual-smoke-qa.md](./visual-smoke-qa.md) |
| 4 | Strategist / Roadmap | `trig_01TvJu2Ri1tsRRedJ4U3Mrdu` | daily | **Epic Architect** — one active epic, deeply decomposed | [strategist-roadmap.md](./strategist-roadmap.md) |
| 5 | Deps & Security | `trig_0166eKG2PeiJZT1RixcPsJKk` | weekly | **Negentropy/leverage** — safe bumps + 1 automation/week | [deps-security.md](./deps-security.md) |
| 6 | Daily Digest | `trig_017FcjDcs8ps3wSKyMvHgKwu` | daily | **Gradient report** — metric trend + epic %-complete | [daily-digest.md](./daily-digest.md) |
| 7 | Routine Optimizer | `bdbe1fca` | weekly | **Constraint hunter** — name THE bottleneck, propose the fix | [routine-optimizer.md](./routine-optimizer.md) |

_Scaffolded 2026-06-21 (Optimizer first run). Redesigned 2026-06-22 (first-principles "huge iterations" model)._
