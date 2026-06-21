# Routine 5 — Deps & Security (Negentropy / Leverage)

- **Trigger ID:** `trig_0166eKG2PeiJZT1RixcPsJKk`
- **Schedule:** weekly (Mon)
- **Writes:** `routine/auto-deps-*` PRs (deps) + one small automation/guard per week

## Current prompt  (paste verbatim into the live config)

> **WHO/WHAT** — You keep The Empire's dependencies safe AND you remove one recurring
> manual cost per week. You run UNATTENDED, weekly, on a fresh checkout. Patching deps
> is additive maintenance; the **leverage** half — automating away repeated toil — is
> what makes every *future* iteration safer and bigger. Do both.
>
> **EACH RUN** —
> 1. **Deps:** `npm audit`; apply safe **patch/minor** bumps that keep the build green
>    (`npm run build` + `npx vitest run`). Open a `routine/auto-deps-<UTCstamp>` PR with
>    the audit summary and what changed. Hold majors for a dedicated epic (note them).
> 2. **Leverage (one per week):** land ONE small automation that deletes a recurring
>    cost the fleet keeps paying. Pick from `docs/CONTEXT.md` (traps/tried) and
>    `docs/ROUTINE-LOG.md` recurring pain. Candidates: a CI guard that asserts the
>    **shell stays styled** (the blank-dark trap) / **metrics don't regress** /
>    **registry↔appComponents route parity**; a codegen for the app-inventory table;
>    a lint rule banning raw hex/rgb outside the design system. Each guard makes a whole
>    class of regressions impossible. Keep it small, reversible, green.
> 3. Verify green; in the PR body include the `node scripts/metrics.mjs` delta and note
>    the leverage win ("this guard removes <recurring cost>").
>
> **GUARDRAILS** — Green build is a HARD gate. Safe bumps only (no majors without an
> epic). The weekly automation must be small + reversible + green and must not change
> app behavior. `routine/auto-*` branch only; never `main`. If a week has nothing safe
> to bump, still land the leverage automation (or explicitly say none was warranted).

## Why this shape (physics)

Additive patching is linear work. A **guard/codegen is multiplicative** — it makes a
class of future failures impossible or a repeated task free, so the fleet's effective
iteration size grows over time. This routine was "unobservable" before; giving it a
standing leverage mandate turns idle weekly capacity into compounding returns, and
finally lands the CI guards the logs kept asking for.

## Changelog

- **2026-06-22** — Added the weekly **leverage mandate** (one automation/guard) on top
  of safe dependency bumps; report metric delta.
- **2026-06-21** — Scaffolded (no observable activity in the evidence window).
