# RFC — The Empire iteration plan, via Musk's five-step algorithm

> **Status:** ratified by the user 2026-07-10 (human session). Scope = **both** the routine
> fleet/process **and** the product. **Sequencing rule: nothing here preempts EPIC-13** — the
> actions below unlock when the Strategist retires EPIC-13 to DONE (QA-confirmed
> `GRAPH-LEGIBLE 3/3` + `INBOUND-LANDS 4/4` on green main). Until then this doc is direction
> the Strategist ranks, not work the Builder takes.
>
> The algorithm (in this order, never reordered): **(1) make the requirements less dumb →
> (2) delete the part/process step → (3) simplify/optimize → (4) accelerate cycle time →
> (5) automate.** Optimizing or automating a thing that should not exist is the classic
> failure — hence the order. Every requirement carries an owner; every action carries an
> acceptance check (the house style).

---

## Step 1 — Make the requirements less dumb

Question the standing requirements. Verdicts: KEEP / AMEND / DROP.

| Requirement | Owner | Verdict | Why |
|---|---|---|---|
| "No new deps" (stage acceptance criteria; `builder.md` guardrail "do not npm install new deps unless the stage calls for it") | Builder spec (`docs/routines/builder.md`) + Strategist (stage specs) | **AMEND** | As applied, it kept `playwright` out of `devDependencies` for weeks — every QA/render-confirm run pays a manual `npm install --no-save playwright` (the INFRA GAP flagged repeatedly in CONTEXT.md), and QA treats `package.json` as out of scope, so nobody could fix it. Amend to: **no new *shipped* deps without justification; dev-tooling `devDependencies` are allowed when they remove a per-run manual step** (state it in the commit). The bundle-gz metric already guards the shipped surface. |
| "Apps ~26 (steady)" target (`docs/METRICS.md` row 1) | Strategist (owns METRICS targets) | **AMEND** | Reality is 31 and the target has been stale through three user-directed app landings. A dishonest target measures nothing. Set the target to "steady at current registry count; **any new app lands ON the rails** (shell + glyph + `mirrorCollection` + inbound where entity-shaped)". Mail+Crypto landing as raw-HTML islands cost an entire epic (EPIC-13) of retrofit — the requirement that prevents the *next* EPIC-13 is worth more than the number. |
| "Read CONTEXT.md FIRST; keep it tight and current" (CONTEXT.md header) | All routines write; Strategist enforces | **KEEP, but give "tight" a number** | The rule is right and the artifact breaks it (see Step 2). A requirement without a measure is a vibe — the project's own founding insight (METRICS.md header). Step 3 adds the measure. |
| Builder every 5h + QA every 5h on independent clocks | Human (live routine configs) | **QUESTION (proposal only)** | QA runs on a timer whether or not the Builder shipped; some QA runs re-confirm an unchanged main while real regressions wait hours. An event-shaped cadence (QA trails a Builder push) would cut confirm latency without more runs. Live configs are human-applied — this goes through the Optimizer's propose→human flow, not a routine commit. |
| One ACTIVE epic; only the Strategist ratifies (EPICS.md rules) | Strategist | **KEEP** | It is the load-bearing fix for the "pick the next small chore" failure. Nothing found against it. |
| Green gates (`build` + `vitest` + `eslint` + `--assert-zero` + no metric regression) | Builder/QA | **KEEP** | The measure→drive-to-0→lock ratchet (EPIC-5/11/12) is the fleet's best pattern. Step 5 extends it rather than adding a new mechanism. |

## Step 2 — Delete

The fleet's scarcest resource is per-run context budget, and its biggest spend is reading its
own memory. Current mass of the read-every-run docs: **CONTEXT.md 1,624 lines · EPICS.md 1,830
· ROUTINE-LOG.md 3,896**. CONTEXT.md's own header says stale memory is worse than none; both
files carry mostly history, which already lives in git and ROUTINE-LOG.

- **Prune `docs/CONTEXT.md` to genuinely-current working memory** — the active-epic block, live
  seams/traps, QA state, standing invariants. History moves to ROUTINE-LOG.md (or just dies;
  git has it). **Target ≤ ~400 lines.**
- **Move retired epic bodies out of `docs/EPICS.md`** (EPIC-1..12, ~1,300 lines). Keep a
  one-line DONE index per epic (name, dates, metric moved, commit). **Target ≤ ~500 lines.**
- **Delete stale/contradicted notes** wherever found. Known instance: CONTEXT.md (~line 115)
  still warns "CI STILL isn't gating on `--assert-zero`" — `.github/workflows/verify.yml:74`
  has gated it on every push/PR; the warning now misinforms every run that reads it.
- **Fold `docs/routines/reviewer.md` to a stub** (routine DISABLED since ~06-24; the roster
  table already says so). One paragraph + pointer to git history.
- Musk's caveat applies: **if we never have to add anything back, we didn't delete enough.**
  Deleting a seam a future run turns out to need is a cheap `git show`; carrying 5,000 stale
  lines into every run of an 8-routine fleet is not.

## Step 3 — Simplify / optimize (only what survived Step 2)

- **Make doc mass a measured gradient:** add a **`docMass` row to `scripts/metrics.mjs`** —
  line counts of the read-every-run docs (CONTEXT.md, EPICS.md) against their budgets. This is
  the project's own proven template (measure → drive to target → lock), applied to the fleet
  itself. Acceptance: `node scripts/metrics.mjs` prints the row with a delta; offenders named.
- **One writing rule for routine memory: replace, don't append.** The current idiom stacks a
  new dated block on top each run (CONTEXT.md is an archaeology dig of "what shipped this
  run" strata). New rule: update the existing block in place; the chronological record belongs
  to ROUTINE-LOG.md only. This is what keeps Step 2's deletion from regrowing.

## Step 4 — Accelerate cycle time

- **Close the standing INFRA GAP (unblocked by Step 1's dep-rule amendment):** add
  `playwright` to `devDependencies` and make `scripts/qa-smoke.mjs` **auto-start
  `server.js`** (spawn on :3001 if not listening, kill on exit). Kills two known per-run
  losses: the manual `npm install --no-save playwright` every QA/render-confirm run, and the
  all-routes-CONNECTION_REFUSED trap when the server isn't up. Acceptance: on a fresh
  checkout, `npm ci && npm run build && node scripts/qa-smoke.mjs` completes with no manual
  step; prod bundle unchanged (dev-only dep).
- **Step 2's pruning IS the main accelerator.** Every routine's orient phase shrinks by
  thousands of lines; the budget goes to the change instead of re-reading history — the
  CONTEXT.md "conserve energy" principle, actually honored. No new mechanism needed.

## Step 5 — Automate (last, deliberately)

- **Lock `docMass` in `--assert-zero`** once Step 2 drives it under budget — exactly as
  `offSystemUtilities` (EPIC-5 S8) and `offSystemStyle` (EPIC-11 S4) were locked. A run that
  bloats the working-memory docs past budget fails the gate; verify the lock BITES (seed an
  over-budget doc → exit 1 → revert → exit 0).
- **Fold the amended rules into the live routine prompts** (dep-rule carve-out, replace-don't-
  append, doc budgets) via the established flow: Optimizer proposes → human applies on
  claude.ai → prompt pasted back into `docs/routines/*.md`.

---

## Sequencing (all post-EPIC-13-retirement)

| # | Action | Executor | Gate |
|---|---|---|---|
| 1 | `playwright` → devDependencies + `qa-smoke.mjs` auto-server (Step 4) | Deps & Security routine (its weekly automation slot) or Builder | build/vitest/eslint green; bundle gz ±0; smoke runs manual-step-free |
| 2 | Doc prune (Step 2) + `docMass` metric row (Step 3) | Builder run or human session — one commit per doc is fine | routines still orient successfully next run; no live seam lost |
| 3 | `docMass` lock in `--assert-zero` (Step 5) | Builder | lock verified to BITE both directions |
| 4 | Routine-prompt amendments (Steps 1+3+5) | Optimizer proposes → **human applies** | live config matches `docs/routines/*.md` again |

## Candidate epic seed (for the Strategist to rank, not a ratification)

**EPIC-14 · The fleet eats its own dog food (doc-mass conformance + the QA infra gap).**
Target metric: `docMass` (baseline ≈ CONTEXT 1,624 + EPICS 1,830) → under budget (≤400/≤500)
→ LOCKED in `--assert-zero`; plus the smoke running manual-step-free on a fresh checkout.
Gradient case: it directly enlarges every future run's usable budget across all 8 routines —
a multiplicative lever, the "bias to leverage" row of the fleet's own operating table
(`docs/routines/README.md`). Rank against the queued design-system STATE-conformance and
accessibility candidates (`docs/ROADMAP.md` NEXT).
