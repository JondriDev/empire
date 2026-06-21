# The Empire — Routine Fleet (spec source-of-truth)

This directory is the human-readable spec for The Empire's autonomous cloud
routine fleet: **7 routines** that build and maintain this repo. One file per
routine (`docs/routines/<name>.md`) holds its **current prompt + schedule + a
short changelog**.

> **Status of the prompt text:** these files are maintained by the weekly
> **Routine Optimizer** routine, which can *read* evidence (logs, PRs, docs) but
> **cannot read the live routine configs**. Where a file says
> _"⟨paste live prompt here⟩"_, the verbatim prompt has not yet been pasted in by
> a human — the surrounding **Responsibilities (observed)** section is the
> Optimizer's reconstruction from PR/log evidence, not the authoritative text.
> When a human applies a proposed change to a live routine, please also paste the
> resulting prompt into the matching file so this dir stays the source of truth.

## How changes flow (safety gate)

```
Optimizer (weekly, read-only)  ──proposes──▶  meta/* PR (stays OPEN)
                                                      │
                                              human reviews + APPLIES
                                                      │
                                                      ▼
                                         live routine config updated
                                         + prompt pasted back into this dir
```

The Optimizer **proposes**; a **human applies**. The Optimizer never edits live
routine configs and never pushes to `main`. Its PRs use the `meta/*` branch
prefix (not `routine/auto-*`) so the Reviewer leaves them open for human review.

## Roster

| # | Routine | Trigger ID | Schedule | Role | Spec file |
|---|---------|-----------|----------|------|-----------|
| 1 | Builder | `trig_01NhehaEqini9ix3THyYLQcK` | every 5h | Opens code PRs on `routine/auto-*` | [builder.md](./builder.md) |
| 2 | Reviewer | `trig_01MBY9DbEJ6rM5pmL127wAnH` | every 5h (offset) | Merges auto PRs to `main` | [reviewer.md](./reviewer.md) |
| 3 | Visual & Smoke QA | `trig_0135fY5VNK37f98voe3m91oo` | every 5h | Screenshots + smoke test | [visual-smoke-qa.md](./visual-smoke-qa.md) |
| 4 | Strategist / Roadmap | `trig_01TvJu2Ri1tsRRedJ4U3Mrdu` | daily | Maintains `docs/ROADMAP.md` | [strategist-roadmap.md](./strategist-roadmap.md) |
| 5 | Deps & Security | `trig_0166eKG2PeiJZT1RixcPsJKk` | weekly | Dependency bumps | [deps-security.md](./deps-security.md) |
| 6 | Daily Digest | `trig_017FcjDcs8ps3wSKyMvHgKwu` | daily | Slack summary | [daily-digest.md](./daily-digest.md) |
| 7 | Routine Optimizer | `bdbe1fca` | weekly | Proposes prompt/schedule changes (this dir) | [routine-optimizer.md](./routine-optimizer.md) |

_Scaffolded 2026-06-21 by the Routine Optimizer (first run)._
