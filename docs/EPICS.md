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

## ▶ ACTIVE — EPIC-19 · The organism relates (the associative constellation)

> **Strategist-promoted 2026-07-14**, after EPIC-17 (home cockpit, `HOME-ATTENTION 6/6`) **and** EPIC-18
> (shell attention, `SHELL-ATTENTION 4/4`) both reached CODE-COMPLETE with every stage QA-confirmed on
> green main — both now retired to the DONE index below. The "proactive cockpit" arc is closed.
>
> **Why highest gradient now.** The conformance band is exhausted (all six axes 0 & LOCKED) and QA reports
> **no runtime bug**, so per the priority bias the steepest remaining **systemic** gradient is still
> **organism depth** — one order past *proactive*. The organism now has five lenses over its one Core graph
> (Network · Search · Inbox · Timeline · Attention) and it *remembers movement* (provenance edges + node
> lineage). But every edge it knows is **explicit**: an edge exists only if an app fired a handoff (`ProvEdge`)
> or an intent stamped `data.from`. The organism has never revealed an **implicit** relationship — two notes
> about the same topic, a task and an event that share a tag, entities born the same day. So an entity sits in
> the mesh knowing only who *handed to* it, never what it is *about*. This epic adds the **associative layer**:
> open any entity and see its *constellation* — the other entities across every app that are genuinely related
> to it (shared terms · shared tags · same-day · already-linked), each ranked and reason-labelled, one tap
> away. This is the felt "alien technology that sees the connections you didn't" leap: the 6th lens
> (ASSOCIATIVE), turning a graph of isolated artifacts into a navigable web of meaning. 100% cloud-verifiable,
> reuses the `search.ts` `nodeBodyText`/`queryTerms` spine + the graph's `links`/`data.from` + `openEntity` +
> `ui` rails, **no new deps**, keeps all six axes 0.
>
> **Target metric** = a new **`RELATED` QA guard** (`scripts/qa-smoke.mjs`), the organism-epic pattern
> (cf. `NODE-LINEAGE 1/1`, `TIMELINE 1/1`, `HOME-ATTENTION 6/6`): seed a target entity plus three entities that
> SHOULD relate to it by three distinct signals (an explicit `data.from` link, a shared rare term, a shared
> tag) **and** one entity that must NOT relate (no overlap) → reload → assert the target's constellation renders
> exactly the three related entities in score order (the explicit link on top), each carrying a reason chip, the
> unrelated node ABSENT, and a one-tap open on the top row lands in its owning app. **Goal:
> `RELATED 0 → 5/5` confirmed by QA on green main** (`linkedTop · sharedTerm · sharedTag · unrelatedAbsent ·
> oneTapLands`), plus the pure `relatedTo` spine unit-pinned. Baseline (pre-epic): no relatedness surface
> exists (`0/5`).

- [x] **S1 · Pure relatedness engine + unit tests (measure-only; NO UI change).** New
  `src/lib/core/related.ts`. Types: `export type RelatedReason = 'linked' | 'shared-term' | 'shared-tag' |
  'same-day'`; `export interface RelatedItem { node: CoreNode; score: number; reasons: RelatedReason[] }`.
  Helpers: `export function significantTerms(node: CoreNode): string[]` — union of `node.title` (lowercased,
  split on `/\W+/`) + the search spine's `nodeBodyText(node)` tokens, keep terms with **length ≥ 4**, drop a
  small `STOP` set (`this·that·with·from·have·about·your·will·into·they·them·then·when·what·which·were·been`),
  dedupe (Set). Import `nodeBodyText` from `./search` — do NOT re-implement it. Core:
  `export function relatedTo(nodes: CoreNode[], id: string, limit = 6): RelatedItem[]` — resolve the target `T`
  (return `[]` if `id` absent); for every other node `N` (`N.id !== id`) sum a score with the reasons that
  fired: **linked +8** iff an explicit edge exists either way (`T.links.includes(N.id)` ‖ `N.links.includes(T.id)`
  ‖ `T.data.from === N.id` ‖ `N.data.from === T.id`); **shared-tag +4 per common tag** (intersection of the
  string elements of `T.data.tags` / `N.data.tags` arrays, capped +12); **shared-term +3 per common significant
  term** (intersection of `significantTerms(T)` / `significantTerms(N)`, capped +9); **same-day +2** iff
  `dayKey(T.meta.created) === dayKey(N.meta.created)` (add a local `dayKey(ms)=new Date(ms).toISOString().slice(0,10)`
  — pure, no import cycle). Drop `score === 0`; sort **score desc → `meta.updated` desc**; cap to `limit`;
  attach the reasons that scored (deterministic order: linked · shared-tag · shared-term · same-day). New
  `src/lib/core/related.test.ts` (~13 cases): shared-term relates two notes; a no-overlap node excluded;
  explicit `data.from` scores highest with `reasons:['linked',…]`; graph-`links` counts as linked both
  directions; shared-tag; same-day; stopwords + <4-char terms do NOT create a match; self excluded; missing
  `id` → `[]`; `limit` cap; score-desc ordering; `meta.updated` tie-break; empty graph → `[]`. **Acceptance:**
  `npx vitest run related` green; `relatedTo`/`significantTerms` exported + typed; **no component edited** (S1 is
  measure-only, mirroring every prior epic's S1); `node scripts/metrics.mjs --assert-zero` exit 0 (all six axes 0).
- [x] **S2 · Surface the constellation on the Network inspector (`<RelatedConstellation>`).** New
  `src/components/ui/RelatedConstellation.tsx`: `export function RelatedConstellation({ nodeId }: { nodeId: string })`
  — subscribes `useGraph(s => s.nodes)`, memoizes `relatedTo(Object.values(nodes), nodeId)`; renders `null` when
  empty (self-hiding, like `<NodeLineage>`). Otherwise a labelled `[data-related=<nodeId>]` block of up to 6
  rows, each a keyboard-safe `ui` `Button` (ghost, `data-related-item=<node.id>`) firing
  `openEntity(node.meta.app, node.id)` — folds navigation in for free (no `keyboardA11y` regression). Each row:
  the owning-app accent chip (`getAppIcon`/registry `color`, same idiom as the Bridge attention rows), the
  entity title, and a **reason chip** for the top reason (`RelatedReason` → i18n `related.reason.linked|
  sharedTag|sharedTerm|sameDay`, EN/ID, added to `src/lib/i18n.ts`). DS-clean: new `.related-*` CSS in DS_INFRA
  `src/window-manager.css`; any inline style uses `var(--*)` only (no raw px/hex — the gate bites). **Mount it on
  the Network inspector's per-entity list** (`src/apps/network/Network.tsx`, beside the existing `<NodeLineage>`/
  `<NodeDescendants>` per entity) so clicking a node reveals both its ancestry AND its constellation. New
  `src/components/ui/RelatedConstellation.test.tsx` (~4 cases): given a seeded graph, renders the related set in
  score order with the correct reason chip per row; renders nothing for an entity with no relations; the row is a
  focusable control (`role`/tag) targeting the related entity. **Acceptance:** build🟢 vitest🟢 eslint🟢; six axes
  0 `--assert-zero`; `<RelatedConstellation>` exported + mounted on the Network inspector; render tests green.
- [ ] **S3 · Extend the constellation to the Timeline + Search surfaces (reuse verbatim).** Drop the S2
  `<RelatedConstellation nodeId={n.id}/>` onto the two other node-rendering views that already carry
  `<NodeLineage>`: the **Timeline entity row** (`src/apps/timeline/Timeline.tsx`, beside `NodeLineage`/
  `NodeDescendants` — a moment now reads *ancestry · descendants · constellation*) and the **Search result row**
  (`src/apps/search/Search.tsx`). No new component — import and mount the S2 one. Confirm navigation still lands
  via `openEntity` and every row is keyboard-operable (`Button`). Extend `RelatedConstellation.test.tsx` (+2) for
  the row-click navigation path (handler fires with the related node's app+id, does not throw). **Acceptance:**
  build🟢 vitest🟢 eslint🟢; six axes 0 `--assert-zero`; the constellation is legible on Network + Timeline +
  Search (three surfaces, one component); nav test green.
- [ ] **S4 · QA guard `RELATED` → ★ EPIC-19 CODE-COMPLETE.** Add the `RELATED` guard to `scripts/qa-smoke.mjs`
  (mirror the `TIMELINE`/`HOME-ATTENTION` guards). Seed `empire-core-graph` with graph-survivable nodes that are
  NOT pruned by `syncAll`'s note/learning/message reconcilers (use `task`/`book`/`goal` types): a **target** node
  `T`; a **linked** node whose `data.from === T.id`; a **shared-term** node whose title/body shares a rare token
  with `T` (e.g. `Xenobloom`) and NOTHING else; a **shared-tag** node carrying a tag `T` also has; and an
  **unrelated** node with no overlap. Reload (persist rehydrate), then drive the **Timeline surface** (proven
  headless-drivable by the `TIMELINE` guard — the Network canvas node-click is fragile, do NOT use it): open
  `/app/timeline`, locate `T`'s row, and assert its `[data-related=<T.id>]` block renders exactly the three
  related nodes in score order (linked ▸ shared-tag ▸ shared-term), each with its reason chip, the **unrelated
  node ABSENT**, and a one-tap open on the top (linked) related row lands in its owning app. **Acceptance:**
  smoke green with `RELATED 5/5` (`linkedTop · sharedTerm · sharedTag · unrelatedAbsent · oneTapLands`) → target
  metric 0 → 5/5 MOVED; build🟢 `node scripts/metrics.mjs --assert-zero` exit 0 (six axes 0); the guard is the
  durable lock (mirrors the EPIC-10/13/17 organism guards). ★ EPIC-19 CODE-COMPLETE → Strategist retires to DONE.

> _**Sequencing note.** No new deps, no config/dep changes; all product-code stays behind the green six-axis
> gate. Each stage is downhill given the prior: S1 is a pure module (measure-only), S2 is one new self-hiding
> component on ONE surface, S3 mounts that same component on two more, S4 is a headless guard on the
> already-proven Timeline surface. **EPIC-7 · Android stays device-gated** (below) — promote only with an
> on-device QA path._

---

## ✅ DONE — retired epics (one-line index; full bodies + per-stage detail in git history + `docs/ROUTINE-LOG.md`)

- **EPIC-18 · The cockpit reaches beyond the home (shell-level attention)** — `SHELL-ATTENTION 0 → 4/4` LOCKED
  (2026-07-14, S1–S2). Pure `attentionSummary(nodes,now,limit)` (`attention.ts`) → `{count,top,urgent}` feeds a
  live `.empire-homebar-badge.is-attention` on the HomeBar Home `IconButton` (`Desktop.tsx`), shown only `!atHome`,
  urgent-tinted when the top item is overdue; S2's `shouldPulseAttention` makes it spring-pulse when a NEW top item
  lands. `SHELL-ATTENTION` guard in `qa-smoke.mjs`. Key commits `8a0c6c9` (S1) · `aa9acf7` (S2).
- **EPIC-17 · The Bridge becomes the organism's cockpit (legible → proactive)** — `HOME-ATTENTION 0 → 6/6` LOCKED
  (2026-07-14, S1–S4). Pure `computeAttention` spine (`attention.ts`) + Bridge "Needs you" ranked feed with inline
  quick-resolve (`AttentionResolve`); one prioritized, reasoned, one-tap-resolvable Attention stream synthesising
  every app's live signals. `HOME-ATTENTION` guard in `qa-smoke.mjs`. Key commits `b1c296f` (S1) · `43f6970` (S4).
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
