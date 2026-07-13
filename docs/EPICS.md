# The Empire — Epics (reaction pathways)

> **Why this file exists (first principles):** a real capability is a high-
> activation-energy reaction — one time-boxed run can't supply it, so the old
> "pick the next small chore" model fumbled a fraction each run and re-planned
> every time (HANDOFF took *four* runs). An **epic** lowers the activation energy
> by pre-decomposing one big leap into a sequence of **stages**, each a meaty but
> green, reviewable PR with a concrete acceptance check. The Builder executes the
> next stage *at full speed* (no re-planning); the stages compound into a coherent
> leap. **Direction and decomposition, not code.**

## Rules

- **Exactly ONE active epic at a time** (`▶ ACTIVE`). This keeps every PR coherent
  and matches the Reviewer's single-gate / green-hard-gate model (bounded leap).
- Only the **Strategist** edits epic definitions and ordering. The **Builder/QA**
  check off `[x]` stages and append discovered stages; they don't invent epics.
- Each epic names a **target metric** (`docs/METRICS.md`). An epic is `DONE` only
  when its stages ship **and** QA confirms the metric moved.
- A stage must be executable in one run **without re-planning**: name the files,
  the shape, and the acceptance check. *A vague stage = a small builder step = failure.*
- Rank epics by **gradient = capability gain ÷ stages of effort.** Highest first.

---

## ⚠️ Builder/Strategist note — REDESIGN LANDED 2026-06-28 (user-directed)

The user-directed "JondriDev pass" landed on `main` (see CONTEXT.md → "🎨 REDESIGN LANDED"). It **partly
pre-delivers EPIC-3** ("depth pass on shallow instruments"): **Maps** (real Leaflet + OSM + Nominatim),
**Weather** (Open-Meteo, no key), **DataCenter** (local-first localStorage, offline), and **Language**
(Cakra `chat()` translation) are now genuinely functional. **Strategist:** when seeding EPIC-3 stages,
treat those four as done (add only a unit test if wanted) and aim the depth pass at the still-shallow
instruments (Photos / Video / Music / Clock). **Intentional metric deltas — NOT regressions:** apps
**27 → 25** (Hermes Agent + Hermes CC deleted, AI unified into **Cakra**), bundle **+~40 KB** (`leaflet`
for the real Maps), token-violations **held at 0**. Do not re-add the deleted apps or strip `leaflet`.

---

## ⚠️ Builder/Strategist note — SOLVER LANDED 2026-07-04 (user-directed)

Cakra gained the **Problem Solver** (Solver tab, `src/apps/cakra/solver/**` + `public/solver/feed.json` +
registry alias `solver`) — see CONTEXT.md → "🧩 SOLVER LANDED" for seams and invariants. Treat it as shipped
capability: don't re-add it as an epic, don't refactor it away, and don't hand-edit `feed.json` (the
World-Solver routine owns that file). Wiring solutions deeper into Inbox/Bridge is fair game for future epics.
Note for EPIC-11: the solver views use Tailwind structural classes + `var()`-token inline colours only — they
audit at 0 on `offSystemStyle`; keep them that way when reducing.

---

## ▶ ACTIVE — EPIC-16 · The fleet eats its own dog food (doc-mass conformance)

> **Builder-promoted 2026-07-13** from the **user-ratified** RFC
> [`docs/rfc/iteration-plan-musk.md`](./rfc/iteration-plan-musk.md) (Steps 2–3–5), after EPIC-15
> reached CODE-COMPLETE with no unchecked stage. This is the topmost cloud-executable ROADMAP-NOW
> item — **not a self-ratified new direction** (the RFC scoped it end-to-end). *Strategist: confirm
> the framing and formally retire EPIC-15 → DONE.*
>
> **Why highest gradient now.** The fleet's scarcest resource is per-run context budget, and its
> biggest spend is reading its own working memory. `docs/CONTEXT.md` + `docs/EPICS.md` are read in
> full every run by every routine, yet carry mostly HISTORY — which already lives in git +
> `docs/ROUTINE-LOG.md`. Shrinking them enlarges every future run's usable budget across all 8
> routines: a **multiplicative** lever (the "bias to leverage" row of the fleet operating table).
> It reuses the exact **measure → drive-to-0 → lock** template (EPIC-5 S8 / EPIC-11 S4 / EPIC-14
> S12 / EPIC-15 S4) with **no product-code risk** (docs + one metric) and a natural 0 target.
>
> **Target metric `docMass`** = total lines OVER budget across the read-every-run docs
> (`docs/CONTEXT.md` ≤ 400, `docs/EPICS.md` ≤ 500). Detector = pure `scanDocMass`
> (`scripts/docMassAudit.mjs`) wired into `scripts/metrics.mjs`. Baseline (pre-epic) `docMass = 3269`
> (CONTEXT 1923/400, EPICS 2246/500). The final stage locks it in `--assert-zero`.

- [x] **S1 · Stand up `docMass` + baseline + a first prune. ✅ SHIPPED 2026-07-13 (green main).**
  Added `scripts/docMassAudit.mjs` (`DOC_BUDGETS`, `countLines`, `scanDocMass`) + `docMassAudit.test.mjs`
  (11 cases) + the `Doc mass (over)` row + over-budget-doc offenders list in `scripts/metrics.mjs`.
  Then pruned **`docs/CONTEXT.md` 1923 → ~412 lines** (removed retired EPIC-12/13/14 dated SHIPPED/
  QA-CONFIRMED strata + the stale EPIC-14 stage playbook + old 06-29/06-30 QA blocks), preserving every
  live seam verbatim (Codebase seams / Invariants & traps / QA recipe / Tried & rejected / SOLVER) and
  the reusable design-system recipes, and rewrote its active-epic block to EPIC-16. Collapsed EPICS.md's
  retired-epic bodies (EPIC-1..15) to the DONE index below. **`docMass` 3269 → (this run) well under half.**
  `--assert-zero` NOT yet gating `docMass` (S3 locks it). build🟢 vitest +11🟢 eslint clean; five product
  axes stay 0 & LOCKED; bundle gz ±0; no new deps.
- [ ] **S2 · Drive `docMass` under budget.** Lowest-risk first. **(a)** Ensure EPICS.md ≤ 500 — every
  retired epic is a one-line DONE index entry (name · dates · metric moved · commit); the S-by-S detail
  stays in git (`git show`). **(b)** Trim `docs/CONTEXT.md` ≤ 400 — the dense Codebase-seams section can
  shed now-obvious/duplicated prose (e.g. exhaustive PWA base-path audit detail) without losing a
  `file.ts:line` pointer. *Acceptance:* `node scripts/metrics.mjs` shows `docMass` → 0 (or both docs
  within budget); the next-run orient path still resolves every live seam (no seam a future run needs was
  deleted — a deleted seam is a cheap `git show`, per the RFC's Musk caveat); build/vitest/eslint green.
- [ ] **S3 · LOCK `docMass` in `--assert-zero` → ★ EPIC-16 CODE-COMPLETE.** Add `if (snapshot.docMass > 0)
  fail.push('docMass=' + snapshot.docMass)` to the gate in `metrics.mjs` and name it in the success line.
  **Verify the lock BITES** (append ~200 filler lines to a tracked doc → `--assert-zero` exit 1 `docMass>0`,
  revert → exit 0), mirroring every prior lock stage. The doc-conformance ratchet then makes working-memory
  bloat impossible to reintroduce behind a green build.

> _**Sequencing note.** The RFC's other queued items are already handled or out of Builder scope: the
> playwright-devDep + qa-smoke auto-server INFRA GAP is CLOSED (2026-07-10); the routine-prompt amendments
> (dep-rule carve-out, "replace don't append", doc budgets) go through the Optimizer → human-applies flow,
> not a Builder commit. **EPIC-7 · Android stays device-gated** (below)._

---

## ✅ DONE — retired epics (one-line index; full bodies + per-stage detail in git history + `docs/ROUTINE-LOG.md`)

- **EPIC-15 · Keyboard operability (WCAG 2.1.1)** — `keyboardA11y 24 → 0` LOCKED (2026-07-13). Every mouse-only
  `onClick` on a non-interactive host made keyboard-operable via `src/lib/a11y.ts` `onActivate` + role/tabIndex,
  or `role="presentation"` on redundant modal backdrops. S1 detector+baseline `79c9272`; S2+S3+S4 sweep+lock
  `61c4f7b`. *(Strategist: formally retire.)*
- **EPIC-14 · Shell conformance** — `offShellControls 341 → 0` LOCKED (2026-07-13, S1–S12). Every bare
  `<button>`/`<input>`/`<select>`/`<textarea>` migrated onto the `ui` primitive layer (`Button`/`IconButton`/
  `Input`/`TextArea`/`Select`/`Segmented`); the shell-conformance invariant lives in `src/components/ui/index.tsx`.
- **EPIC-13 · Mail + Crypto join the organism** — `GRAPH-LEGIBLE 1/1 → 3/3` + `INBOUND-LANDS 3/3 → 4/4`
  (2026-07-10). Mail persists drafts (`empire-mail-drafts`, `mail/lib/draftStore.ts`) + receives handoffs; both
  emit via ⚡ `NodeActions`.
- **EPIC-12 · Intent integrity** — `INTENT-ROUNDTRIP 0/2 → 2/2` LOCKED (2026-07-09). `make-note-from` +
  `add-to-learning` write REAL store entities that survive `reconcile()`; a raw `g.addNode` phantom is pruned.
- **EPIC-11 · Design-system conformance II (non-colour tokens)** — `offSystemStyle 56 → 0 (r0/t0/m0)` LOCKED
  (2026-07-06). Raw radii/type/easing → `--radius-*`/`--text-*`/`--ease-*`.
- **EPIC-10 · The Timeline (temporal lens)** — `TIMELINE 1/1`, all six axes ordered/grouped/flow/persisted/
  filtered/descendants (2026-07-04).
- **EPIC-9 · Node-level lineage (per-artifact ancestry)** — `NODE-LINEAGE 1/1` (2026-07-03).
- **EPIC-8 · Global cross-app search** — the Core graph becomes queryable (`src/lib/core/search.ts`,
  `GLOBAL-SEARCH 1/1`, 2026-07-03).
- **EPIC-6 · Organism Memory (durable provenance & lineage)** — `src/lib/core/provenance.ts`; Network Memory
  panel + per-entity source; Reader island joined (2026-07-02/03).
- **EPIC-5 · Design-system utility conformance** — `offSystemUtilities 1076 → 0` LOCKED (2026-07-01).
- **EPIC-4 · PWA completion** — offline-true + installable (precache no-gap, cold-offline boot 5/5, manifest
  installable). Guards: `scripts/precacheAudit.mjs` / `qa-offline.mjs` / `pwaBaseAudit.mjs` (2026-06-29).
- **EPIC-3 · Depth pass on shallow instruments** — Maps (Leaflet+OSM+Nominatim), durable media (`mediaStore`
  IDB rail: Music/Video/Photos), Clock persistence, real Language translation (2026-06-28/29).
- **EPIC-2 · Design-system conformance → zero token violations** — `tokenViolations 501 → 0` (2026-06-28).
- **EPIC-1 · Organism Completeness** — inbound handoff receivers 9/9 entity apps; `useInboundHandoff` +
  `ProvenanceChip` rails (2026-06-21/22).
- **EPIC-0 · Organism foundation** — A-bus / B-graph / C-intents, `mirrorCollection`, `NodeActions`, `HANDOFF`,
  Network on the live bus (2026-06-20/21).

---

## ⏳ QUEUED — EPIC-7 · Android APK validation
> **Renumbered EPIC-5→6→7** (2026-07-01) — design-system utility conformance took the old EPIC-5 slot, then
> **EPIC-6 · Organism Memory** took the active slot as the higher *realizable* gradient (durable, cloud-verifiable
> interconnection > device-gated packaging). **Device-gated:** an unattended cloud builder on a fresh checkout cannot install
> an APK or run on-device smoke, so this epic's target metric isn't cloud-verifiable — **promote only when an
> on-device QA path exists.** **Leap:** the APK degrades gracefully with no LAN server (backend-optional layer).
> **Target metric:** APK installs + all offline-capable apps function on-device with `server.js` absent.
> Stage seeds: run the `Android APK` workflow; verify the backend-optional fallbacks (Files' `/api/files`
> 500 → on-device storage path, etc.); on-device smoke of the 8 offline instruments.

---

## DONE

- **EPIC-0 · Organism foundation** — A-bus / B-graph / C-intents, `mirrorCollection`,
  `NodeActions`, `HANDOFF` event, Network wired to the live bus + app→app arcs, core
  unit tests. (Shipped #3/#5/#7/#8/#13/#20, 2026-06-20 → 06-21.) EPIC-1 completes it.
