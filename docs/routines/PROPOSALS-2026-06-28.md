# Routine Optimizer — Fleet Retro & Proposals · 2026-06-28 (UTC)

**Run:** weekly meta (Constraint Hunter, `trig_01LH2rdoeNTMWkCCxF5fwTXm`), unattended, fresh
checkout of `main`. Evidence window: ~2026-06-20 → 06-28 (8 days). Read-only of code; the only
writes this run are `docs/routines/` + `docs/ROUTINE-LOG.md`, committed directly to `main`.
**Committing this doc does NOT change any live routine** — a human applies the config edits below.

---

## THE CONSTRAINT — availability: a 3-day fleet-wide stall (06-24 / 06-25 / 06-26)

The rate-limiting step on iteration **size over the week** was not per-run output — it was
**uptime**. For three consecutive UTC days the entire fleet was dark:

| UTC day | Fleet commits |
|---|---|
| 06-20 | 12 |
| 06-21 | 19 |
| 06-22 | 22 |
| 06-23 | 7 |
| **06-24** | **0** |
| **06-25** | **0** |
| **06-26** | **0** |
| 06-27 | 10 |
| 06-28 | 3 (so far) |

Evidence: `git log --since='8 days ago'` shows **zero commits 06-24→06-26**; the QA log jumps
straight from `2026-06-23T08:07Z` to `2026-06-27T13:05Z` (`docs/ROUTINE-LOG.md`). Builder runs
every 5h, QA every 5h, Strategist + Digest daily — so the stall swallowed **~14 Builder runs,
~14 QA runs, ~3 Strategist runs and ~3 Digests**. That is roughly **half the week's active
window** lost. No prompt-level lever recovers a loss that large; this dwarfs any per-run sizing.

**Cause — unknown from inside the repo, and it is the human's lever, not mine.** There is *no*
in-repo fingerprint of a code constraint: no red builds, no error/recovery commits, no "fix the
breakage" entry — and on 06-27 the fleet resumed cleanly at full tilt (8 EPIC-2 stages in ~24h).
That pattern is consistent with the **schedulers being paused or a platform/quota outage**, not
with a routine stuck on its green gate. I cannot un-pause configs or see the platform, so per
Theory of Constraints I **name it and assign it**, rather than fabricate a prompt fix for a
non-prompt problem.

> **ACTION: human** — confirm *why* the fleet was dark 06-24→06-26 (intentional pause? cloud
> scheduling / quota outage? billing?) and verify all 6 active triggers are firing on schedule.
> If it was an outage, this is the single highest-value thing to prevent recurring.

This stall went **completely unalarmed**: the Daily Digest is the fleet's heartbeat-to-Slack, but
it was down *with* the rest of the fleet — a routine can't report its own outage. The fleet has
no out-of-band liveness alarm. Proposal 1 fixes that within my own lever.

---

## What's working (do NOT touch — these are load-bearing and healthy)

- **The gradient is moving hard when the fleet runs.** EPIC-2 (design-token violations) descended
  **501 → 388 → 283/268 → 221 → 134 → 59 → 14** with QA confirming each step on green main
  (`docs/metrics.json` history; `docs/METRICS.md`). 8 clean stages landed in ~24h on 06-27/06-28.
- **CONTEXT.md is richly maintained — knowledge genuinely compounds.** Each de-hex stage records
  the exact mappings, idioms (`color-mix` darken/lighten), and traps (alpha-append, HTML-string
  `.replace` interpolation) so the next run reuses them instead of rediscovering. This is the
  working-memory thesis paying off — the reason 8 stages flowed without re-planning.
- **EPICS.md decomposition is excellent.** Stages name files, shapes, acceptance checks, and
  expected metric deltas; the Strategist re-decomposed the EPIC-2 tail (S6/S7/S8) on the fly.
- **Self-verify + direct-to-main is holding.** No red build reached `main` this week despite no
  Guardian; QA confirms metrics independently (28/28 render, vitest 115/115).

---

## Proposals (≤3, evidence-backed, surgical, reversible)

### 1. Make the Routine Optimizer the fleet's weekly **liveness auditor** — APPLIED to this spec
**ACTION: apply to live routine Routine Optimizer (`trig_01LH2rdoeNTMWkCCxF5fwTXm`)**

- **Edit:** add a mandatory **step 1a — Fleet-liveness check** to the Optimizer prompt: each run,
  compute commits-per-UTC-day over the trailing week; if any ≥~24h window has zero fleet commits,
  surface it loudly at the TOP of the retro and in the human notification, named as the week's
  likely dominant constraint, with "ACTION: human" for the cause. (Already written into
  `docs/routines/routine-optimizer.md` — step 1a + changelog. Human: paste the updated prompt body
  into the live config.)
- **Evidence:** this week's 3-day stall produced **no alarm** because the Digest canary was down
  too. The weekly meta is the only out-of-band observer that survives a fleet-wide outage (it reads
  history after the fact), so it should own liveness detection.
- **Expected effect:** any future multi-day stall is caught within ≤7 days and pushed to the human,
  instead of being noticed only incidentally. Zero risk (read-only check + reporting).

### 2. Give EPIC-3 a real **numeric target metric** before it goes ACTIVE
**ACTION: apply to live routine Strategist / Roadmap (`trig_01TvJu2Ri1tsRRedJ4U3Mrdu`)**

- **Context:** EPIC-2 is **one stage from DONE** (only S8 remains; metric already at 14/0). The
  on-deck **EPIC-3 · Depth pass on shallow instruments** (`docs/EPICS.md`) currently lists its
  target as *"Routes rendering clean stays 26/26 while each gains real function."* That is **not a
  gradient** — "stays 26/26" is a no-regression guard, and "gains real function" is an unmeasured
  vibe. An epic with no number is exactly the pre-redesign failure mode ("polish whatever's
  nearest") wearing an epic's clothes.
- **Edit:** add one line to the Strategist prompt's promote/retire step (4): *"A QUEUED epic may
  not be promoted to ▶ ACTIVE until it has a concrete, `scripts/metrics.mjs`- or QA-countable
  target-metric number (not 'stays X' + a vibe) — the same treatment EPIC-1/EPIC-2 got."* Then,
  before promoting EPIC-3, give it such a metric (e.g. a per-instrument capability count, an
  offline-capability count for Photos/Maps/Video/Music/Clock, or test-coverage on those apps).
- **Evidence:** EPIC-1 (`both-ways 1→9`) and EPIC-2 (`token-violations 501→0`) each had a hard
  numeric gradient — that is precisely what let the Builder leap 8 stages in 24h. `docs/METRICS.md`
  itself warns "a metric flat 3+ runs signals a local minimum," but an epic with **no** number can
  never trip that alarm. This is the constraint that will bind **next week**, made cheap to fix
  **now** with one stage of runway left.
- **Expected effect:** keeps the fleet on a measurable potential field after EPIC-2 closes, instead
  of sliding back into unmeasured iteration. Docs-only, fully reversible.

### 3. (Housekeeping, no live-config change) — reconcile the spec dir's verbatim prompts with direct-to-main
**ACTION: human** (only a human can read/paste the live prompts from claude.ai)

- The `docs/routines/` **model docs are now synced** to direct-to-main + Guardian-disabled
  (README, builder/reviewer headers, optimizer prompt — done this run). But the **verbatim
  `## Current prompt` bodies** for Builder, QA, Strategist, Deps, Digest still describe the old
  PR flow ("open a PR on `routine/auto-*`", "never push to main", Reviewer merges). The routines
  read their *live* prompt at runtime, so this is a source-of-truth-integrity issue (it misleads
  humans and this optimizer), not an operational break.
- **Ask:** for each routine, paste the current live prompt from claude.ai back into its
  `docs/routines/<name>.md` so the source-of-truth matches reality. Lowest priority of the three.

---

## Not proposed (deliberately)

- **No change to the green-build hard gate or per-run sizing.** Per-run output is excellent; the
  binding constraint this week was uptime, not size — tuning size would be optimizing a non-constraint.
- **The `metrics.mjs` static test-count (108) vs vitest runtime (115) discrepancy** is repeatedly
  noted as known noise (static counter undercounts `it.each`). Fixing it means editing `scripts/`
  (app/tooling code — out of my lever) for a cosmetic gain. Skipped.

---

**Done / Findings / Proposed** — see `ROUTINE-LOG.md` one-liner. Fleet is **healthy and
fast when running**; the week's real loss was a 3-day availability gap (human/platform lever),
and the forward risk is EPIC-3 launching without a measurable gradient.
