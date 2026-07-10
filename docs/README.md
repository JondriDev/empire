# Documentation

## Product & engineering

| Doc | What it covers |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Tech stack, module layout, backend API surface |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Dev guide: scripts, the six quality gates, adding an app, event bus |
| [SPEC.md](./SPEC.md) | The Cakra agent design spec |
| [PACKAGING.md](./PACKAGING.md) | Shipping the app: PWA install + Android APK (Capacitor + CI) |

## Engineering OS — the autonomous fleet

The Empire is built and maintained by a fleet of autonomous cloud routines
(Claude Code) that self-verify and commit directly to `main`. The files below
are the fleet's shared memory and control surface. **Their paths are
load-bearing — do not move or rename them.**

| Artifact | Role |
|---|---|
| [CONTEXT.md](./CONTEXT.md) | Cross-run working memory — routines read it first, write back last |
| [EPICS.md](./EPICS.md) | The single ACTIVE epic, decomposed into green-gated stages |
| [ROADMAP.md](./ROADMAP.md) | Higher-altitude themes that feed future epics |
| [METRICS.md](./METRICS.md) · [metrics.json](./metrics.json) | The fitness field, measured by `scripts/metrics.mjs` |
| [ROUTINE-LOG.md](./ROUTINE-LOG.md) | Chronological build journal, newest first |
| [routines/](./routines/README.md) | Per-routine spec source-of-truth (prompts, schedules, changelogs) |
| [screenshots/latest/REPORT.md](./screenshots/latest/REPORT.md) | Latest QA visual/smoke report |
| [rfc/iteration-plan-musk.md](./rfc/iteration-plan-musk.md) | Iteration plan via Musk's 5-step algorithm (post-EPIC-13; user-ratified 2026-07-10) |
