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

## ▶ ACTIVE — EPIC-1 · Organism Completeness

**Leap:** The Empire stops being 26 apps with a few wired synapses and becomes one
organism where **every** app both *emits* and *receives* honest handoffs, the
Network mesh portrays the full adjacency, and a human can navigate the whole graph.

**Target metric:** *Stateful apps fully wired into the organism* → **all entity-owning
apps both emit & receive, visible in The Network**; *Routes rendering clean* stays **26 / 26**.
(See the honest-scope note under S6 — "26/26" was the old literal target; a Calculator
has no collection to mirror, so the real target is "every app that owns persistent
entities is in the graph, and every tool app participates via emit/receive transfers.")
**Why highest gradient:** the product's entire thesis is "one living organism." The
*rails* are now built — `HANDOFF` fires on every transfer (S2 ✅), receivers acknowledge
provenance (S1 ✅), `mirrorCollection`/`NodeActions` exist. The remaining gradient is
**making the organism legible and navigable** (S3), then surfacing its intents globally
(S4/S5), then closing the wiring gaps (S6). Each is now downhill given the ones before.

Stages (Builder takes the topmost `[ ]`; **confirm current state vs. code first** —
some may already be shipped):

- [x] **S1 · Inbound provenance.** Each `sessionStorage` receiver (Editor, Token
  Counter, Prompt Gen, AI Chat) shows a dismissible **"From <source>"** chip
  (token-styled, source app's accent) and preloads the payload. *Acceptance:* send
  from Calculator → Token Counter opens pre-filled with a "From Calculator" chip;
  same for the other three. Build 🟢, vitest 🟢, eslint clean; add a unit test.
  **Shipped 2026-06-22:** `useInboundHandoff` hook + `<ProvenanceChip>`; fixed a
  latent bug (Editor never read its clipboard). See ROUTINE-LOG 2026-06-22.
- [x] **S2 · Every app emits on transfer.** Audit `CROSS_APP_ACTIONS`; every transfer
  emits an arc-bearing event (no invented edges). *Acceptance:* every cross-app action
  lights a directed arc in The Network; one test asserts each action emits exactly one
  arc-bearing event with the correct source. **Already shipped (confirmed in code
  2026-06-22):** all five navigating transfers (`SEND_TO_EDITOR` / `_TOKEN_COUNTER` /
  `_PROMPT_GEN` / `_AI_CHAT` / `ASK_HERMES_TO_ANALYZE`) call `handoff(from,to,label)` →
  emit `HANDOFF{fromId,toId}`; the two in-place transfers (`SEND_TO_NOTES`,
  `SEND_TO_LEARNING`) emit `NOTE_CREATED`/`LEARNING_LOGGED` carrying `from` (a separate
  HANDOFF would double-count the ticker — see `Network.flowForEvent`). The deferred
  "HANDOFF-everywhere vs typed-with-`from`" decision was resolved as **typed-with-`from`**
  (option b). `src/lib/appActions.test.ts` asserts each action emits exactly one
  arc-bearing event with the right source. No Builder work remained; marked shipped here.
- [ ] **S3 · Network inspector + legend** ← **NEXT (active stage).** Make the organism
  *legible*: clicking an app node opens an inspector panel showing that app's real graph
  entities and its true cross-app neighbors, plus a persistent legend mapping node-type →
  accent. Today `Network.tsx`'s canvas `onClick` only `openApp(...)`s — there is no
  inspector and no legend, so the colored entity dots and arcs are unreadable.
  **Files & shape:**
  - **New** `src/apps/network/adjacency.ts` — a pure, testable seam. Export
    `appAdjacency(nodes: CoreNode[]): Record<string, { out: string[]; in: string[] }>`
    that, for every CoreNode `n`, walks `n.links` and maps `owner(n)=n.meta.app` →
    `owner(target)` for each linked node, accumulating directed app→app adjacency
    (skip self-edges and unknown owners). Also export
    `entitiesByApp(nodes): Record<string, CoreNode[]>` grouping nodes by `meta.app`.
  - **`src/apps/network/Network.tsx`** — add `const [selected, setSelected] = useState<typeof apps[number] | null>(null)`.
    In the canvas `onClick`, change behavior: a single click **selects** (`setSelected(layout[i].app)`)
    instead of opening; the inspector's button opens the app. Render an absolutely-
    positioned inspector panel (glass token surface, `--mono`, design-system classes —
    NO raw hex) when `selected` is set, listing: the app name+icon+accent; its entities
    from `entitiesByApp(useGraph nodes)[id]` grouped/counted by type; its neighbors from
    `appAdjacency(...)[id]` (each row a button → `openApp(neighbor)`); a "⚡ Open <app>"
    button and a ✕ to deselect. For the panel, subscribe with `const nodes = useGraph(s => s.nodes)`
    (the render loop already reads `useGraph.getState().nodes` imperatively — keep that;
    add the reactive subscription only for the panel so it updates as the graph changes).
  - **Legend:** a small always-visible panel (corner) listing each entity node-type
    (note/task/message/learning/goal/prompt + "other") with its accent swatch. Source the
    colours from the existing `TYPE_RGB` map in `Network.tsx` (export it) so canvas and
    legend can't drift — do **not** re-hardcode the rgb strings in the DOM.
  - **Test:** `src/apps/network/adjacency.test.ts` — given a fixture graph (a `note`
    owned by `calculator` linking a `task` owned by `goals`), assert
    `appAdjacency(nodes).calculator.out` contains `goals` and `.goals.in` contains
    `calculator`; assert self-links and unknown owners are dropped.
  - *Acceptance:* click any app node in The Network → inspector lists its real entities
    + true neighbors, each neighbor row opens that app; the legend's swatches match the
    canvas dot colours; ✕ deselects. Build 🟢, `vitest` 🟢 (incl. the new adjacency test),
    eslint clean on touched files; no new token violations (legend reuses `TYPE_RGB`).
- [ ] **S4 · Global "⚡ Send to…" in the command palette.** Surface `intentsFor` the
  focused/selected node across all apps from one command surface. *Acceptance:* palette
  lists the focused node's intents and runs them; reachable without hunting per-app bars.
  (Decompose to file/shape when promoted to active — likely `src/components/CommandPalette*`
  + `intentsFor` from `src/lib/core/intents.ts`; confirm whether a palette already exists.)
- [ ] **S5 · "Inbox / Today" view.** Aggregate open `task` nodes from the graph into
  one view. *Acceptance:* tasks created via ⚡ from any app appear here.
- [ ] **S6 · Close the wiring gaps (honest scope).** **Audit first, then wire.** Apps that
  already `mirrorCollection` + render `<NodeActions>`: Calendar, Notes, Learning Tracker,
  Messages, Photos, Prompt Gen, DataCenter, Files, Goals, Artifacts/Kanban. **Entity-owning
  apps still to check/wire:** confirm each persistent-entity app emits into the graph AND
  exposes ⚡ on its rows; wire any gap (one app per Builder run, build green). **Tool apps**
  (Calculator, Clock, Weather, Grammar, Language, Music, Video, Cache, Browser, Maps) own
  no collection — they participate by *emitting/receiving transfers* (already do via
  `CROSS_APP_ACTIONS`), NOT by mirroring fake entities. *Acceptance:* every entity-owning
  app's nodes appear in The Network and carry ⚡ actions; do **not** invent collections for
  tool apps to chase a literal 26/26. (QA should refine the METRICS row to "entity-owning
  apps wired" + "tool apps emit/receive" rather than a single 26/26 — flagged in ROUTINE-LOG.)

_When S3–S6 ship and QA confirms every entity-owning app is in the graph (and the legend/
inspector make it legible) → move EPIC-1 to DONE and promote EPIC-2._

---

## QUEUED — promote one when the active epic finishes

### EPIC-2 · Design-system conformance → zero token violations
**Leap:** one palette, rendered identically in DOM and canvas; no app hardcodes color.
**Target metric:** *Design-token violations* **496 → 0**.
Stage seeds: extract `src/design-system/tokens.ts` (plain TS consts) as the single
source; generate the matching CSS custom props from it; then sweep app code per the
`metrics.mjs` "top offenders" list (start: HermesCommandCenter, HermesAgentBar,
ai-agent SettingsPanel, Calculator) replacing raw hex/rgb with tokens — one cluster
of apps per stage, build green each time.

### EPIC-3 · Depth pass on shallow instruments
**Leap:** the thin apps (Photos, Maps, Video, Music, Clock) get genuine offline-capable
function instead of placeholders — coherence over new surface area.
**Target metric:** *Routes rendering clean* stays 26/26 while each gains real function
(+ tests). Stage seeds: one app per stage, each with a concrete capability + acceptance.

### EPIC-4 · PWA + Android validation
**Leap:** the installed PWA is byte-identical to dev and the APK degrades gracefully offline.
**Target metric:** *Lighthouse PWA ≥ 90*; offline precache verified on a real install.
Stage seeds: validate SW precache + base-path on a real install; close asset gaps; run the
Android workflow and verify the backend-optional layer with no LAN server.

---

## DONE

- **EPIC-0 · Organism foundation** — A-bus / B-graph / C-intents, `mirrorCollection`,
  `NodeActions`, `HANDOFF` event, Network wired to the live bus + app→app arcs, core
  unit tests. (Shipped #3/#5/#7/#8/#13/#20, 2026-06-20 → 06-21.) EPIC-1 completes it.
