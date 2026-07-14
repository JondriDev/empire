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

## ▶ ACTIVE — EPIC-17 · The Bridge becomes the organism's cockpit (from legible to proactive)

> **Strategist-promoted 2026-07-13**, after EPIC-15 (keyboard operability) + EPIC-16 (doc-mass) both
> reached CODE-COMPLETE with no unchecked stage — both now formally retired to the DONE index below.
>
> **Why highest gradient now.** The conformance band is exhausted at the systemic level — all six axes
> (colour · utilities · style · shell · keyboardA11y · docMass) are **0 & LOCKED**; reduced-motion is
> already global (`design-system.css`), the accessible-name metric was rejected as over-counting, and
> per-app craft belongs to the App Artisan rotation. Per the priority bias, with QA reporting **no
> runtime bug** and every conformance number maxed, the steepest remaining **systemic** gradient is
> **organism depth**. The four read-lenses (Network · Search · Inbox · Timeline) and the emit↔receive
> loop are complete, but the organism is **passive**: it mirrors, remembers and displays, yet never
> tells you *what needs you now*. The front door proves it — `src/components/Bridge.tsx` shows mute
> **counts** (Today: N · Tasks: N · Organism: N) + a recents strip, not a ranked, resolvable feed.
> This epic turns the home from a dashboard into a **cockpit**: one prioritized "Attention" stream that
> synthesizes every app's live signals, explains each, and lets you resolve it in one tap. Highest felt
> capability ("alien technology that anticipates you"), 100 % cloud-verifiable, reuses the `bridge.ts` /
> `tasks.ts` / `openEntity` / `a11y.ts` / `ui` rails, **no new deps**, keeps all six axes 0.
>
> **Target metric** = a new **`HOME-ATTENTION` QA guard** (`scripts/qa-smoke.mjs`), the organism-epic
> pattern (cf. `GRAPH-LEGIBLE 3/3`, `TIMELINE 1/1`): seed a graph that mixes an overdue task, a today
> event, a plain open task, a stalled low-progress goal, an in-progress book and a fresh handoff →
> assert the Bridge renders ONE ranked feed, urgency-ordered, each row reasoned + actionable, one-tap
> open lands. **Goal: `HOME-ATTENTION 0 → 6/6` confirmed by QA on green main**, plus the pure
> `computeAttention` spine unit-pinned. Baseline (pre-epic): no attention feed exists (`0/6`).

- [x] **S1 · Pure attention engine + unit tests (measure-only; NO UI change).** ✅ Shipped 2026-07-14 —
  `src/lib/core/attention.ts` (`computeAttention` + typed `AttentionItem`/`AttentionKind`, 5 pure scorers) +
  `attention.test.ts` (13 green); build🟢 vitest🟢 `--assert-zero` exit 0, all six axes 0. New
  `src/lib/core/attention.ts`: `export type AttentionKind = 'task-overdue'|'event-today'|'task-open'|'goal-stalled'|'reading'|'handoff'`;
  `export interface AttentionItem { id: string; node: CoreNode; kind: AttentionKind; score: number; reasonKey: string; app: string }`;
  pure `computeAttention(nodes: CoreNode[], now: number, limit = 8): AttentionItem[]` that scores each
  candidate 0..100 by urgency, sorts **score desc → `meta.updated` desc**, de-dupes by node id, caps to
  `limit`. Small pure scorers `scoreTask`/`scoreEvent`/`scoreGoal`/`scoreReading` (overdue > today >
  open; a `goal` with `data.progress` low **and** aged is `goal-stalled`; a `book` with reading progress
  <100 is `reading`; a recent inbound `HANDOFF`/`app:*` mirror surfaces once). Reuse `eventsOn`/`dayStamp`
  from `bridge.ts`, `partitionTasks` from `tasks.ts`. New `src/lib/core/attention.test.ts` (~12 cases):
  ordering (overdue task ⟩ today event ⟩ plain open task), stalled-goal detection, `reading` inclusion,
  `limit` cap, empty→`[]`, done-task exclusion, id de-dupe, `meta.updated` tie-break. **Acceptance:**
  `npx vitest run attention` green; `computeAttention` exported + typed; **no component edited** (S1 is
  measure-only, mirroring every prior epic's S1); `node scripts/metrics.mjs --assert-zero` exit 0.
- [x] **S2 · Render the ranked Attention feed on the Bridge.** ✅ Shipped 2026-07-14 — `Bridge.tsx` gains a
  **Needs you** section (between the telemetry widgets and Jump-back-in) fed by
  `computeAttention(Object.values(nodes), minute)` via the existing `useGraph` sub + minute clock. Each item
  is a keyboard-safe `ui` `Button` (ghost) row: owning-app accent chip (`registry` `getAppIcon`/`color`),
  entity title (tasks strip `Do:`), a **reason chip** (`reasonKey` → EN/ID via `t(...)`, one i18n key per
  `AttentionKind`, added to `i18n.ts`), and a `badgeFor` badge (event→time · book→% · else `agoLabel`). Empty
  feed → `<EmptyState size="sm">` ("All clear — nothing needs you"). DS-clean (new `.bridge-attention-*` CSS in
  DS_INFRA `window-manager.css`; Bridge inline styles use `var(--r-*)` only). **Folded S3's primary open** —
  row click fires `openEntity(app, node.id)`, keyboard-operable for free via `Button` (no `keyboardA11y`
  regression). `Bridge.test.tsx` (2🟢) asserts 4-node feed renders **in score order** (overdue▸today▸handoff▸
  open) with each reason string + empty-state fallback. build🟢 vitest 587🟢 eslint🟢 six axes 0 `--assert-zero`.
- [x] **S3 · Inline quick-resolve controls (the cockpit acts in place, not just navigates).** ✅ Shipped
  2026-07-14 — each "Needs you" row is now a `.bridge-attention-item` flex wrapper holding the ghost open `Button`
  (unchanged: `openEntity`, `data-attention`) **plus** a SIBLING quick-resolve control (`AttentionResolve`, never
  nested — no button-in-button): `task` → ✓ done `IconButton` (`updateNode(id,{data:{...data,done:true}})` —
  durable, tasks are graph-only), fresh `handoff` → ✕ dismiss (clear `data.from`), else (event/goal/book) →
  `<NodeActions nodeId>` ⚡ (make-task/make-note intents). TS-forced `aria-label`s via `t('attention.act.done|
  dismiss')`. Dispatches ✓done off `node.type==='task'` FIRST so a make-task task (carries `data.from` → could
  score `handoff`) still gets a done toggle. `Bridge.test.tsx` +2 (4🟢) — done control flips `data.done`, drops the
  row on the next `computeAttention`, and is a proven sibling of the open button; handoff dismiss clears `from` +
  drops. build🟢 vitest 589🟢 eslint🟢 six axes 0 `--assert-zero`; **cloud-verified in a real browser** (6 kinds
  seeded → correct order + per-kind control; ✓-click dropped the row & persisted `done:true`; 0 console errors).
- [x] **S4 · QA guard → ★ EPIC-17 CODE-COMPLETE.** ✅ Shipped by QA 2026-07-14 (`43f6970`). Added the
  `HOME-ATTENTION` guard to `scripts/qa-smoke.mjs`: seeds `empire-core-graph` with all six kinds at
  graph-survivable types (overdue `task` due-5d / today `event` / fresh `draft` handoff / aged low-progress
  `goal` / plain open `task` / mid-progress `book` — none pruned by syncAll's note/learning/message
  reconcilers), reloads (persist rehydrate), asserts the Bridge renders ONE ranked feed in EXACT score
  order (overdue 95 ▸ event 75 ▸ handoff 70 ▸ goal 60 ▸ open 50 ▸ reading 35), every row carries a reason +
  a resolve control, and a one-tap open on the top row lands in Goals. **Acceptance MET:** smoke green with
  `HOME-ATTENTION 6/6` (target metric 0 → 6/6 MOVED); build🟢 `--assert-zero` exit 0; guard is the durable
  lock (mirrors the EPIC-10/13 organism guards). ★ EPIC-17 CODE-COMPLETE → Strategist retires to DONE.

> _**Sequencing note.** No new deps, no config/dep changes, all product-code stays behind the green
> six-axis gate. EPIC-16's remaining RFC items are handled or out of Builder scope (playwright-devDep +
> auto-server INFRA GAP closed 2026-07-10; routine-prompt amendments go through the Optimizer flow).
> **EPIC-7 · Android stays device-gated** (below) — promote only with an on-device QA path._

---

## ✅ DONE — retired epics (one-line index; full bodies + per-stage detail in git history + `docs/ROUTINE-LOG.md`)

- **EPIC-16 · The fleet eats its own dog food (doc-mass conformance)** — `docMass 3269 → 0` LOCKED (2026-07-13,
  S1–S3). `scripts/docMassAudit.mjs` (`scanDocMass`) budgets the read-every-run docs (CONTEXT ≤400, EPICS ≤500);
  S1 stood up the metric + pruned both under budget, S3 added the `docMass>0` gate to `--assert-zero` (bite-verified).
  Enlarges every routine's per-run budget; the sixth gated axis. Key commits `1cc462e` (S1) · `19e0454` (S3).
- **EPIC-15 · Keyboard operability (WCAG 2.1.1)** — `keyboardA11y 24 → 0` LOCKED (2026-07-13). Every mouse-only
  `onClick` on a non-interactive host made keyboard-operable via `src/lib/a11y.ts` `onActivate` + role/tabIndex,
  or `role="presentation"` on redundant modal backdrops. S1 detector+baseline `79c9272`; S2+S3+S4 sweep+lock
  `61c4f7b`.
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
