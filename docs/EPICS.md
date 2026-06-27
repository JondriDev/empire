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

## ✅ DONE — EPIC-1 · Organism Completeness

> **DONE 2026-06-23** (QA-confirmed on green main `6435a81`). All stages S1–S6c shipped;
> target metric **moved to its honest success state**: *Apps fully wired both-ways* = **9/9
> entity-apps-with-a-natural-inbound** (was 1/26 at epic start), *Routes rendering clean* held
> **27/27**. S6c live-confirmed by QA (`scripts/qa-s6c-confirm.mjs` → Calendar/Goals/Messages each
> show a "From <source>" ProvenanceChip + prefilled create form; 3/3 ✅, screenshots
> `s6c-inbound-*.png`). **EPIC-2 promoted to ▶ ACTIVE** (design-token violations 501 → 0).
> Full stage history retained below for reference.

**Leap:** The Empire stops being 26 apps with a few wired synapses and becomes one
organism where **every** app both *emits* and *receives* honest handoffs, the
Network mesh portrays the full adjacency, and a human can navigate the whole graph.

**Target metric:** *Apps fully wired both-ways* (emit AND legibly receive) → **1/26 → 9/9
entity-apps-with-a-natural-inbound**; *Routes rendering clean* stays **26 / 26**.
(See the settled audit under S6 — "26/26" was the old literal target; a Calculator has no
collection and no natural inbound, so the honest target is "every entity-owning app that can
take input is both-ways" (9: notes, learning, prompt-gen, editor, token-counter, ai-chat,
calendar, goals, messages), while files/photos/datacenter + the tool apps stay emit-only sources.)
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
- [x] **S3 · Network inspector + legend** — **Shipped 2026-06-22.** Make the organism
  *legible*: clicking an app node opens an inspector panel showing that app's real graph
  entities and its true cross-app neighbors, plus a persistent legend mapping node-type →
  accent. Today `Network.tsx`'s canvas `onClick` only `openApp(...)`s — there is no
  inspector and no legend, so the colored entity dots and arcs are unreadable.
  **Done:** new `adjacency.ts` (`appAdjacency`/`entitiesByApp`, 5 tests) + `nodeColors.ts`
  (extracted `TYPE_RGB`/`typeRgb` + `rgbCss`, one source for canvas+legend); `Network.tsx`
  click → select, reactive inspector panel (entities by type, ↔/→/← neighbours, ⚡ Open, ✕)
  + always-visible legend. Build🟢 vitest🟢 86/86 eslint clean; token-violations 503→501.
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
- [x] **S4 · Global "⚡ Send to…" in the command palette** — **Shipped 2026-06-22.** No palette
  existed (only the Ctrl+Space app-search), so built a minimal one: `src/components/CommandPalette.tsx`
  (⌘/Ctrl-K `gp` modal, reuses the shell's `empire-search-*` glass) targets the FOCUSED node and lists
  `intentsFor(node)` + an "Open in <app>" action, running the choice via `runIntent` + toast (mirrors
  `NodeActions`). "Focused node" = the last node touched anywhere, derived from the event bus by the new
  `src/lib/core/focus.ts` (`useFocus` store + pure `focusIdForEvent` + `startFocusTracking()` in `main.tsx`);
  Network's inspector also `setFocus`es the selected app's newest node. Build🟢 vitest 92/92 (focus.test.ts
  +6) eslint clean; token-violations 501 (±0 — used `rgbCss`). *Acceptance met:* ⌘K lists the focused node's
  intents and runs them from one surface. *Honest cloud limit:* keyboard summon + run not exercised headless
  (fresh graph is empty); seam + 6 unit tests verify focus logic, not live keypress.
- [x] **S5 · "Inbox / Today" view.** — **Shipped 2026-06-22.** Built a dedicated **Inbox app**
  (a real always-reachable home for tasks, not a buried panel) instead of the Network-panel
  fallback. `src/lib/core/tasks.ts` (pure seam: `partitionTasks`/`taskNodes`/`isTaskDone`, 4
  tests) aggregates every graph `task` node into open/done buckets (newest-first by `created` so
  toggling done doesn't reorder). `src/apps/inbox/Inbox.tsx` subscribes to the graph reactively,
  lists tasks with a checkbox that flips `data.done` via `updateNode`, a source-app chip
  (icon+name from registry), and a ⚡ `<NodeActions>` bar. `NodeActions` gained an optional
  `nodeId` prop so graph-only nodes (tasks have no store `sourceId`) can be targeted directly.
  Registry+appComponents entry added (`inbox`, 27th app). *Acceptance met:* a task made via
  ⚡ make-task from any app surfaces in the Inbox; toggling the checkbox flips `data.done` on the
  graph node. Build🟢 vitest 96/96 eslint clean; token-violations **501 (±0** — Inbox is pure
  tokens; the new registry accent's +1 was offset by removing a dead `var(--ion,#hex)` fallback in
  Goals). *Honest cloud limit:* a fresh checkout's graph is empty, so the populated list / live
  toggle can't be exercised headless — covered by the 4 unit tests + the seam.
**S6 · Close the emit↔receive loop (the headline metric).** The audit is now DONE (see
below — no more "audit first" hand-waving). The metric *apps fully wired both-ways* has been
stuck at **1/26** (only `prompt-generator` emits AND legibly receives) since S1, because three
honest gaps remain. S6 closes them in three downhill stages, each one Builder run, each moving
the number. **Audit (settled, code-confirmed 2026-06-22):**
  - **Emitters (10)** — `<NodeActions>` + mirror into the graph: artifacts/kanban, calendar,
    datacenter, files, goals, learning-tracker, messages, notes, photos, prompt-generator.
  - **Chip-receivers (4)** — `useInboundHandoff` + `<ProvenanceChip>`: editor, prompt-generator,
    token-counter, ai-chat.
  - **Silent in-place receivers (2)** — `SEND_TO_NOTES`/`SEND_TO_LEARNING` land content but show
    NO provenance: notes (tags the note `from-<source>` but never renders it), learning-tracker
    (drops the source entirely — `LearningItem` has no `from` field).
  - **Dead-end sinks (3)** — editor, token-counter, ai-chat receive but emit nothing onward.
  - **Emit-only entity apps with a *natural* inbound (3)** — calendar, goals, messages own
    entities and emit, but no `CROSS_APP_ACTION` targets them, so they can't receive.
  - **Honest non-receivers** — files, photos, datacenter are *manage/browse* stores (a generic
    text handoff INTO them is unnatural — they stay emit-only by design); tool apps (calculator,
    clock, weather, grammar, language, music, video, cache, browser, maps) own no collection and
    participate as emit-only *sources*. **Do NOT invent inbound for these to chase a literal 26/26.**

- [x] **S6a · Surface provenance on the two silent in-place receivers (Notes + Learning).**
  **Shipped 2026-06-23.** `LearningItem` gained `from?: string`; `SEND_TO_LEARNING` now sets
  `from: data.source`. Notes cards split a `from-<source>` tag out of the badge list and render
  `<ProvenanceChip>` (dismiss strips only `from-*` tags, keeps user tags); Learning cards render
  the chip for `item.from` (dismiss clears `from` via `updateLearningItem`). `appActions.test.ts`
  asserts the stored item persists `from === data.source` (97 vitest tests, +1). Build🟢 eslint
  clean; token-violations **501 (±0)** (reused `ProvenanceChip`), bundle gz 240.5→240.9 (+0.4).
  **both-ways 1/26 → 3/26.** *Honest cloud limit:* fresh-checkout graph/stores are empty, so the
  live chip render isn't exercised headless — covered by the unit test + the existing S1 chip.
  Lowest-risk first: the data already arrives, just make the receive *legible* so both apps
  count as both-ways. **Files & shape:**
  - **`src/lib/store.ts`** — add `from?: string` to `interface LearningItem` (optional →
    backward-compatible; existing persisted items just lack it).
  - **`src/lib/appActions.ts`** — in `SEND_TO_LEARNING.execute`, set `from: data.source` on the
    `addLearningItem({...})` object (Notes already carries `tags: ['from-' + data.source]`, no change).
  - **`src/apps/notes/Notes.tsx`** — for any note whose `tags` contains a `from-<source>` entry,
    render `<ProvenanceChip from={source} onDismiss={…}/>` on that note's card; dismiss removes
    only that one tag via `updateNote(id, { tags: tags.filter(...) })` (keep the user's other tags).
  - **`src/apps/learning-tracker/LearningTracker.tsx`** — for any item with `item.from`, render
    `<ProvenanceChip from={item.from} onDismiss={…}/>`; dismiss clears `from` via the store updater.
  - **Test:** extend `src/lib/appActions.test.ts` — assert `SEND_TO_LEARNING.execute` persists a
    `from` equal to `data.source` on the created learning item.
  - *Acceptance:* ⚡ Send-to-Notes from Calculator → the new note card shows a "From Calculator"
    chip (source-accent, dismissible); ⚡ Track-as-Learning from Notes → the new learning item
    shows a "From Notes" chip. **both-ways 1/26 → 3/26.** Build🟢 vitest🟢 eslint clean; reuse
    `ProvenanceChip` (no new colours) so token-violations do NOT regress.

- [x] **S6b · Make the three dead-end sinks emit onward (Editor, Token Counter, AI Chat).**
  *(Shipped 2026-06-23.)* New shared `src/components/ui/SendResultMenu.tsx` (glass `gp` dropdown
  modeled on `NodeActions`, roving-focus keyboard nav, disabled on empty text, drops any action
  whose target === source so no self-handoff). Wired into Editor ("Send code to…", over the buffer),
  Token Counter ("Send text to…", over the counted text) and per assistant reply in AI Chat
  ("Send reply to…"). Each menu item runs an existing `CROSS_APP_ACTIONS` executor with
  `{ text, title, source }` → the executor `handoff(...)`s → a real source→target arc lights in the
  Network. **both-ways 3/26 → 6/26.** Tests: `SendResultMenu.test.tsx` (3) — running an action emits
  a `HANDOFF` whose `fromId` is the sink; self-action excluded; disabled when empty. Token-violations
  flat at **501** (hover tints use `color-mix(in srgb, var(--signal) …)`, not raw rgba). Build🟢
  vitest 97→100🟢 eslint clean. *Cloud limit:* the source→target arc is a visual Network change not
  verifiable headless — flagged for QA.
  They receive but the signal dies there — give each a ⚡ "Send to…" affordance that re-injects
  its output, so each becomes both-ways. **Reuse the existing `CROSS_APP_ACTIONS` executors**
  (they already call `handoff(...)` → light a Network arc); do NOT add new collections. **Shape:**
  a tiny shared `<SendResultMenu source="<app>" text={…} title?={…}/>` button (new
  `src/components/ui/SendResultMenu.tsx`) that lists a couple of relevant `CROSS_APP_ACTIONS`
  (e.g. Notes / Prompt Gen) and runs the chosen one with `{ text, title, source }`. Wire it:
  - **`src/apps/editor/Editor.tsx`** — "Send code to…" over the current buffer (`source:'editor'`).
  - **`src/apps/token-counter/TokenCounter.tsx`** — "Send text to…" over the counted text (`source:'token-counter'`).
  - **`src/apps/ai-chat/AIChat.tsx`** — per assistant reply, "Send reply to…" (`source:'ai-chat'`).
  - **Test:** `src/components/ui/SendResultMenu.test.tsx` (or extend `appActions.test.ts`) — assert
    running the menu's action emits a `HANDOFF` whose `fromId` is the sink app's id.
  - *Acceptance:* from Editor, "Send to Notes" creates a note AND lights an `editor → notes` arc in
    The Network; same for `token-counter → notes` and `ai-chat → notes`. **both-ways 3/26 → 6/26.**
    Build🟢 vitest🟢 eslint clean; token-violations not regressed.

- [x] **S6c · Natural inbound for the last three entity apps (Calendar, Goals, Messages) + retarget
  the metric honestly.** ✅ Shipped 2026-06-23. `SEND_TO_CALENDAR` (text → draft event, opens New
  Event form prefilled on today), `SEND_TO_GOALS` (text → New Goal form prefilled),
  `SEND_TO_MESSAGES` (text → composed draft) added to `appActions.ts`; each app wired with
  `useInboundHandoff` + a `[inbound.payload]` create-form preload + `<ProvenanceChip>`. All three
  added to `SendResultMenu` `ACTION_TARGET` + `DEFAULT_ACTIONS` so the loop is UI-reachable.
  `appActions.test.ts` HANDOFF cases extended (+3, now 11 in file; vitest 100→103). **both-ways 6/9
  → 9/9 entity-apps-with-inbound — EPIC-1 entity loop CLOSED.** build🟢 vitest🟢 (103) eslint clean;
  token-violations 501 (±0). **QA: confirm live, then retarget the METRICS both-ways row to 9/9 and
  promote EPIC-2.** Original spec below:
  Each owns entities and already emits but has no inbound `CROSS_APP_ACTION`;
  give each a *natural* text→entity receive so the organism's loop closes for every entity app that
  honestly takes input. **Shape (mirror the S1 receiver rail — ~3 lines/app):**
  - **`src/lib/appActions.ts`** — add `SEND_TO_CALENDAR` (text → draft event), `SEND_TO_GOALS`
    (text → new goal), `SEND_TO_MESSAGES` (text → composed draft): each `sessionStorage.setItem`
    an `empire-<x>-clipboard` payload `{ text, title?, from: data.source }`, call
    `handoff(data.source, '<app>', '<verb>')`, then `window.open('/app/<x>', '_self')`.
  - **`src/apps/calendar/Calendar.tsx` / `goals/Goals.tsx` / `messages/Messages.tsx`** — each:
    `const inbound = useInboundHandoff<{text;title?}>('empire-<x>-clipboard')`, a
    `[inbound.payload]` effect that opens the app's *create* form prefilled from the payload, and
    `{inbound.source && <ProvenanceChip from={inbound.source} onDismiss={inbound.dismiss}/>}`.
  - **Test:** extend `appActions.test.ts` — each new action emits exactly one arc-bearing `HANDOFF`
    with the correct `toId`.
  - **Metric retarget (flag for QA, do not edit METRICS yourself):** EPIC-1's honest success state
    is **"every entity-owning app with a natural inbound is both-ways"** = notes, learning, prompt-gen,
    editor, token-counter, ai-chat, calendar, goals, messages (**9**); files/photos/datacenter stay
    emit-only *by design* (manage/browse stores); tool apps stay emit-only sources. QA should rewrite
    the "Apps fully wired both-ways" METRICS row to **9 / 9 entity-apps-with-inbound** (+ a note that
    files/photos/datacenter + tool apps are intentionally emit-only) rather than a dishonest 26/26.
  - *Acceptance:* ⚡ Send-to-Calendar / -Goals / -Messages from any text opens that app with a
    "From <source>" chip and a prefilled create form; each lights a Network arc. **both-ways 6/26 →
    9/26 (= the honest target).** Build🟢 vitest🟢 eslint clean; token-violations not regressed.

_When S6a–c ship and QA confirms the both-ways count climbed to the honest target (9 entity-apps-
with-inbound, files/photos/datacenter + tool apps emit-only by design) → move EPIC-1 to DONE and
promote EPIC-2 (design-token violations → 0)._

---

## ▶ ACTIVE — EPIC-2 · Design-system conformance → zero token violations

> Promoted 2026-06-23 when EPIC-1 hit its honest target (both-ways 9/9). Builder's next
> stage = **S1: start the sweep** — extract `src/design-system/tokens.ts` as the single source
> + chip the top offenders (`hermes-command-center/HermesCommandCenter.tsx` (64),
> `components/HermesAgentBar.tsx` (49), `ai-agent/components/SettingsPanel.tsx` (38),
> `calculator/Calculator.tsx` (38)). Target metric *Design-token violations* **501 → 0**.

### EPIC-2 · Design-system conformance → zero token violations
**Leap:** one palette, rendered identically in DOM and canvas; no app hardcodes color.
**Target metric:** *Design-token violations* **501 → 0** (was 496 at epic draft; 501 at S1 start).
Stage seeds: extract `src/design-system/tokens.ts` (plain TS consts) as the single
source; then sweep app code per the `metrics.mjs` "top offenders" list replacing raw
hex/rgb with `cssVar`/`tint` — one cluster of apps per stage, build green each time.

Stages (Builder takes the topmost `[ ]`; reuse the `cssVar`/`tint` rails from `tokens.ts`):

- [x] **S1 · Palette seam + Hermes cluster.** — **Shipped 2026-06-23.** Built
  `src/design-system/tokens.ts` (`PALETTE` + `cssVar(name)` + `tint(name,pct)` color-mix helper;
  `tokens.test.ts` 4 cases) and swept `hermes-command-center/HermesCommandCenter.tsx` (64→0) +
  `components/HermesAgentBar.tsx` (49→0). Found & recorded the **alpha-append trap** (`` `${color}18` ``
  breaks on a `var()` — convert to `color-mix`). Build🟢 vitest 107/107🟢 (15 files) eslint clean;
  **token-violations 501 → 388 (−113)**, tests +4, bundle gz +0.1. *Visual recolor (Tailwind→XENO) is
  intentional but not cloud-verifiable.*
- [x] **S2 · Next cluster.** — **Shipped 2026-06-27.** Swept `ai-agent/components/SettingsPanel.tsx` (38→0),
  `apps/calculator/Calculator.tsx` (38→0), `artifacts/artifacts/MarkdownStudio.tsx` (29→0) with the
  `cssVar`/`tint` rails. amber/orange→`ember`, slate→`abyss`/`xenon`/`ion`, greens→`c-success`, reds→`c-danger`,
  cyan→`signal`, text greys→`text`/`text2`/`text3`. Gradients/darken-lighten via `color-mix(… var(--ember) N%,
  var(--void)/var(--text))` (works in inline styles AND the `<style>{`…`}</style>` template literal). All three
  files report **0 hex/rgba** in `metrics.mjs`; build🟢 vitest 107🟢 eslint clean; **token-violations 388 → 283
  (−105)**, no regression elsewhere.
- [ ] **S3 · Next cluster.** Sweep `lib/registry.ts` (27 — the per-app `color:'#…'` accents; move them to a
  registry-accent CSS-var map) and `components/ui/index.tsx` (26), then `apps/network/Network.tsx` (24 — DOM
  styles → `cssVar`/`tint`, but the **canvas 2D ctx keeps `rgbCss` from `nodeColors.ts`**, not a violation).
  *Acceptance:* those files report 0 hex/rgba (registry/ui fully, Network minus its canvas-ctx strings); build🟢
  vitest🟢 eslint clean; token-violations 283 → ~210. **registry.ts caveat:** audit every `${app.color}NN`
  alpha-append consumer in the same stage (alpha-append trap) before moving accents off hex.
- [ ] **S4+ · Continue the sweep.** Remaining offenders incl. `artifacts/artifacts/ColorPalette.tsx` (23 — likely
  legitimately exempt: hex swatches ARE its content; decide skip vs. move-to-const) + the long tail until
  **token-violations = 0**. One cluster per stage.

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
