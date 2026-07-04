# The Empire — Routine Fleet (spec source-of-truth)

Human-readable spec for The Empire's autonomous cloud fleet: **7 routines** that
build and maintain this repo. One file per routine (`docs/routines/<name>.md`)
holds its **current prompt + schedule + a short changelog**. The verbatim prompt
in each file is the text to paste into the live routine config on claude.ai.

> **The live routine prompts live on claude.ai and only a human can edit them.**
> These files are the source of truth: when you change a live config, paste the
> resulting prompt back into the matching file here.

> **⚠ Model update (direct-to-main, ~2026-06-22→24).** The fleet no longer uses PRs.
> Every routine **self-verifies (green build/tests/metrics) and commits directly to
> `main`** — its own green build is the only gate. The **Reviewer/Guardian
> (`trig_01MBY9DbEJ6rM5pmL127wAnH`) is DISABLED**. The Optimizer (meta) commits its
> proposals directly to `main` too (it still only *proposes*; committing the doc does
> not apply a live-config change). **✅ Synced 2026-07-03:** every per-routine
> `## Current prompt` below now matches the live config, plus a user-directed reality
> sync (27 apps + The Bridge, 28-route/12-guard QA, Earth-from-Space · Liquid Glass
> canon, `JondriDev/design-system` lockstep). To apply, paste each prompt into its live
> routine on claude.ai.

## The operating model (redesigned 2026-06-22 — "huge iterations"; direct-to-main since ~06-24)

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
There is no longer a Reviewer merge step — each routine's **own green build + no
metric regression is the hard gate** before it pushes to `main`; the Optimizer still
only proposes. The leap comes from *not wasting energy*, from pre-decomposition, and
from measuring — not from recklessness.

## The loop

```
Strategist ── defines ONE active EPIC, decomposed into green stages ──▶ docs/EPICS.md
     ▲                                                                       │
     │                                                                Builder takes next stage,
 Digest reports                                                        executes at full speed,
 metric gradient        reads CONTEXT.md first ──────────────────────▶ self-verifies (green
     ▲                  writes seams + metric delta back ◀──────────── build/tests/metrics),
     │                                                                  commits direct to main
 ROUTINE-LOG ◀── QA renders + measures + confirms the epic's metric moved ◀──┘
                 (no Reviewer/Guardian — each routine's green build is the gate)
                 Optimizer (weekly) names THE constraint, proposes the fix
```

## How changes flow (safety gate)

```
Fleet routines ──self-verify (green build/tests/metrics)──▶ commit direct to main
Optimizer (weekly, read-only of code) ──proposes──▶ docs commit to main ──human applies──▶ live config + paste back here
```
(Committing a proposal doc does **not** apply it — a human still edits the live routine config.)

## Roster

| # | Routine | Trigger ID | Schedule | Role (redesigned) | Spec |
|---|---------|-----------|----------|------|------|
| 1 | Builder | `trig_01NhehaEqini9ix3THyYLQcK` | every 5h | **Epic Executor** — ships the next epic stage (largest safe green slice) direct to `main`; own green build is the gate | [builder.md](./builder.md) |
| 2 | ~~Reviewer / Main-Health Guardian~~ | `trig_01MBY9DbEJ6rM5pmL127wAnH` | **DISABLED** | ex-Integrator; if re-enabled, verifies `main` is green/releasable & fixes a red `main` directly (does NOT merge PRs) | [reviewer.md](./reviewer.md) |
| 3 | Visual & Smoke QA | `trig_0135fY5VNK37f98voe3m91oo` | every 5h | **Fitness evaluator** — render + measure + confirm epic metric moved | [visual-smoke-qa.md](./visual-smoke-qa.md) |
| 4 | Strategist / Roadmap | `trig_01TvJu2Ri1tsRRedJ4U3Mrdu` | daily | **Epic Architect** — one active epic, deeply decomposed | [strategist-roadmap.md](./strategist-roadmap.md) |
| 5 | Deps & Security | `trig_0166eKG2PeiJZT1RixcPsJKk` | weekly | **Negentropy/leverage** — safe bumps + 1 automation/week | [deps-security.md](./deps-security.md) |
| 6 | Daily Digest | `trig_017FcjDcs8ps3wSKyMvHgKwu` | daily | **Gradient report** — metric trend + epic %-complete | [daily-digest.md](./daily-digest.md) |
| 7 | Routine Optimizer | `trig_01LH2rdoeNTMWkCCxF5fwTXm` | weekly | **Constraint hunter** — name THE bottleneck, propose the fix (commits proposals direct to `main`) | [routine-optimizer.md](./routine-optimizer.md) |

_Scaffolded 2026-06-21 (Optimizer first run). Redesigned 2026-06-22 (first-principles "huge iterations" model). Switched to direct-to-main + Guardian disabled ~2026-06-24._
