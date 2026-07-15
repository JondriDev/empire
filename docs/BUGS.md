# Bug Ledger — the Bug Hunter's working memory

Owner: the **Bug Hunter** routine (3×/day). Other routines drop LOGIC-bug leads
here (UX-polish leads go to `docs/UX-LEDGER.md` instead). Every entry is one
line. Fixed entries keep the commit hash + one-line root cause.

**Lens rotation** (the Hunter records which lens each run used; next lens first):
A QA-runtime-findings → B fresh-commit-review → C static-sweeps →
D characterization → E runtime-logic-probes

- Lens used 2026-07-15: **A** → clean (QA REPORT 32/32, no runtime bug) → escalated to **B (fresh-commit review)**, which caught the `related.ts` day-bucket bug below.
- Next lens: **C (static sweeps over src/)**.

## OPEN (confirmed, has a repro, not yet fixed)

_(none)_

## SUSPECTED (no deterministic repro yet / needs on-device confirmation)

_(none)_

## FIXED (commit + root cause, newest first)

- 2026-07-15 · `relatedTo` `same-day` signal fired by UTC day, not the user's local day (Lens B, fresh commit `fbb04f1`). Root cause: `related.ts` reimplemented a private `dayKey` as `new Date(ms).toISOString().slice(0,10)` (UTC) while its own doc-comment said "Local-calendar day bucket" — for any non-UTC user this false-positives entities just after local midnight and false-negatives entities just after UTC midnight. Fix: deleted the divergent helper, reused the canonical local-day `dayStamp` from `bridge.ts` (the ONE local-day format, matches Calendar's `data.date`). Locked by two TZ-forced (`Asia/Jakarta`) regression tests in `related.test.ts` that cross the UTC-midnight boundary (fail-before / pass-after verified).
