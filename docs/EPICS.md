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

## ✅ DONE — EPIC-2 · Design-system conformance → zero token violations

> **DONE 2026-06-28.** Promoted 2026-06-23 when EPIC-1 hit its honest target (both-ways 9/9). **S1–S8
> SHIPPED**; target metric *Design-token violations* **501 → 0** (`node scripts/metrics.mjs` 2026-06-28).
> One palette, consumed via the `cssVar`/`tint`/`CATEGORICAL` rails in `src/design-system/tokens.ts` (DOM)
> and `rgbCss` in `nodeColors.ts` (canvas); genuine brand/content identity data (registry, ai-agent
> providers, ColorPalette tool) exempted in `metrics.mjs` `DS_INFRA` with rationale. Stage history retained
> below. **EPIC-3 · Depth pass on shallow instruments promoted to ▶ ACTIVE.**

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
- [x] **S3 · Shared UI primitives cluster.** — **Shipped 2026-06-27.** Swept the shared primitives
  `components/ui/index.tsx` (26→0: Button primary/danger, Input/TextArea focus borders, the whole `badgeColors`
  map, Badge custom-`color` prop, Divider) and `ai-agent/components/ModelPicker.tsx` (24→0: overlay/panel chrome,
  Cakra-Auto toggle, provider tabs, model list, API-key status) with the `cssVar`/`tint` rails, plus the 3 safe
  **DOM** hex fallbacks in `apps/network/Network.tsx` (`var(--signal, #34f5d6)` → `var(--signal)`, 24→21).
  Mappings: cyan→`signal`, NVIDIA-green `#76b900`→`aurora`, white→`xenon`, slate panel `#111827`→`abyss`/border
  `#1e2d4a`→`tint('xenon',10)`, emerald→`c-success`, amber→`c-warn`, red→`c-danger`, text greys→`text`/`text2`/
  `text3`. **Alpha-append trap fixed** in two spots (Badge `${color}18` and ModelPicker `${p.color}22`/`+'44'`)
  by switching to `color-mix(in srgb, ${var} N%, transparent)` so a CSS-var-valued `color` no longer renders
  nothing. build🟢 vitest 107🟢 eslint clean; **token-violations 321 → 268 (−53)**. (Note: pre-S3 baseline was
  321, not 283 — the two post-S2 Cakra commits regressed it +38; net since S2-claim is 283→268.)
- [x] **S4 · registry accents + Network canvas.** — **Shipped 2026-06-27.**
  (a) **Decided path (1): exempt `lib/registry.ts`** in `scripts/metrics.mjs` (added to `DS_INFRA`). It is the per-app
  accent *identity manifest* — the single source consumed across the shell as `${app.color}` / `rgbOf(app.color)`
  (37 consumers, many using the `${app.color}NN` alpha-append idiom in Desktop/Dashboard/Window/Hermes), so a CSS-var
  migration would be a large multi-file change with the alpha-append trap; exempting palette-data is principled and
  matches how `design-system/**` is already exempt. (−27)
  (b) **Network canvas de-hexed:** routed every `rgba(${triplet},a)` and the `#34f5d6` core-label fill through
  `rgbCss(triplet, alpha)`; added named accent triplet consts to `nodeColors.ts` (`SIGNAL` 52,245,214 / `ION`
  77,155,255 / `PLASMA` 176,107,255 / `VOID` 3,6,14). `Network.tsx` now reports **0** hex/rgba. New `nodeColors.test.ts`
  (5 cases) pins `rgbCss`/`typeRgb`/the accent-triplet shape. (−21)
  build🟢 vitest 112🟢 (+5, +1 file) eslint clean; **token-violations 268 → 221 (−47)**, bundle gz 248.3 (±0).
- [x] **S5 · ai-agent cluster → zero.** — **Shipped 2026-06-27.** De-hexed the entire ai-agent app's render
  code with the `cssVar`/`tint` rails: `Agent.tsx` (17→0), `components/ChatPanel.tsx` (19→0),
  `components/ConfirmModal.tsx` (16→0), `components/WorkspacePanel.tsx` (16→0), `components/ThinkingTrace.tsx`
  (6→0), and the semantic activity accents in `lib/activityStore.ts` (8→0: thinking→`signal`, write/shell→`ember`,
  search/fetch→`plasma`, code→`c-success`). Mappings: cyan `#22d3ee`→`signal`, indigo `#6366f1`→`ion`, NVIDIA-green
  `#76b900`→`aurora`, amber `#f59e0b`→`ember`, green `#34d399`→`c-success`, red `#ef4444`→`c-danger`, text greys
  →`text`/`text2`/`text3`, white-glass→`tint('xenon',N)`, black-scrim `rgba(0,0,0,.7)`→`tint('void',70)`, slate
  panel `#111827`→`abyss`. **Alpha-append-in-HTML-string** handled: ChatPanel's `<code style>` injected via a
  template literal so `${tint('ion',15)}` interpolates. **`ai-agent/lib/providers.ts` exempted** in `metrics.mjs`
  `DS_INFRA` — it's the per-PROVIDER brand-accent identity manifest (consumed as `p.color` in ModelPicker to keep
  OpenRouter/Google/NVIDIA/etc. distinct; mapping brand colors onto our tokens would collapse two blue providers
  onto `ion`), the registry precedent. **token-violations 221 → 134 (−87).** build🟢 vitest 112🟢 eslint clean.
> **Remaining 134 violations — full enumeration (`node scripts/metrics.mjs`, 2026-06-27), partitioned into S6/S7/S8:**
> **Artifacts app (75):** ColorPalette 23 (→exempt), ChartBuilder 15, Kanban 13, FormBuilder 9, ArtifactGallery 8,
> ArtifactsApp 7. **Shared-UI + shell (45):** Toast 16, ErrorBoundary 7, Utility 6, Desktop 6, Dashboard 4, AppShell 3,
> NodeActions 3. **Long-tail entity apps (14):** Notes 6, Goals 3, AIChat 2, Weather 1, Calendar 1, nodeColors.ts 1.
> Sum = 134. After S6/S7/S8 land, the metric hits **0** and EPIC-2 is DONE.

- [x] **S6 · The artifacts app → zero, via ONE shared `CATEGORICAL` accent sequence.** **Shipped 2026-06-28.**
  Added `export const CATEGORICAL: string[]` to `tokens.ts` (8 distinct-hex XENO accents: ion/signal/ember/plasma/
  aurora/c-warn/c-danger/xenon — chose distinct *hexes* over the spec's c-success/c-info which collapse onto
  aurora/signal). Swept all 5 render files to 0: `ChartBuilder` (`COLORS = CATEGORICAL`; SVG grid→`tint('xenon',6)`,
  cyan line/stops→`cssVar('signal')`, pie scrim→`tint('void',40)`), `Kanban` (columns→`cssVar` ion/signal/c-success,
  `TAG_COLORS = CATEGORICAL`, seed tagColors→`CATEGORICAL[n]`, tag-pill alpha-append `+'33'`→`color-mix(… 20%)`),
  `FormBuilder` (field colors→`CATEGORICAL[i]`), `ArtifactGallery` + `ArtifactsApp` (per-artifact accents→matching
  `cssVar` tokens; all `${accent}NN` alpha-appends→`color-mix`; preview ASCII hex→`▦ 7 harmonies`). **Exempted
  `ColorPalette.tsx` in `metrics.mjs` `DS_INFRA`** (colour-theory tool; hexes are content). `tokens.test.ts` +3
  (CATEGORICAL len/var-shape/uniqueness/real-token). **token-violations 134 → 59 (−75).** build🟢 vitest 115🟢
  eslint clean. *(original spec text retained below for reference.)*
  <br/>**— original spec —** The artifacts app was
  the dominant remaining mass (75 of 134) and most of it was **categorical hue arrays** — `ChartBuilder.COLORS`,
  `Kanban` column accents + `TAG_COLORS` + per-task `tagColor` seeds, `FormBuilder` field-type colors,
  `ArtifactGallery` per-artifact accents — i.e. "give me N visually-distinct series colours." Don't dodge these
  and don't flatten them onto one token: serve the epic's actual thesis by giving the whole app **one categorical
  sequence drawn from the XENO palette** (8 distinct accents is plenty for any chart/tag/field set). This is a real
  single-source-of-truth coherence win, not metric-chasing. **Files & shape:**
  - **`src/design-system/tokens.ts`** — add `export const CATEGORICAL: string[] = [cssVar('ion'), cssVar('signal'),
    cssVar('ember'), cssVar('plasma'), cssVar('c-success'), cssVar('aurora'), cssVar('c-danger'), cssVar('c-info')]`
    (8 distinct XENO accents; the canonical "N-distinct-series" rail). Consumers index it `CATEGORICAL[i % CATEGORICAL.length]`.
    Extend `tokens.test.ts`: assert `CATEGORICAL.length === 8`, every entry is a `var(--…)` string, and entries are unique.
  - **`src/apps/artifacts/artifacts/ChartBuilder.tsx`** (15→0) — `const COLORS = [...8 hexes]` → `import { CATEGORICAL }`
    and use it (or `COLORS = CATEGORICAL`). SVG chrome is migratable (SVG `stroke`/`stopColor`/`fill` accept `var(--…)`):
    grid `stroke="rgba(255,255,255,0.06)"` → `stroke={tint('xenon',6)}`; the cyan line/area `#22d3ee` (stroke + both
    `<stop stopColor>`) → `cssVar('signal')`. Keep `stopOpacity` numbers as-is.
  - **`src/apps/artifacts/artifacts/Kanban.tsx`** (13→0) — column `accent` (3) and `TAG_COLORS` (6) → indices into
    `CATEGORICAL`; per-task seed `tagColor: '#…'` → `CATEGORICAL[n]`. Any chrome hex/rgba → `cssVar`/`tint`.
  - **`src/apps/artifacts/artifacts/FormBuilder.tsx`** (9→0) — the field-type `color: '#…'` palette → `CATEGORICAL`
    by index (one accent per field type).
  - **`src/apps/artifacts/ArtifactGallery.tsx`** (8→0) — per-artifact `accent: '#…'` → `CATEGORICAL` by index.
  - **`src/apps/artifacts/ArtifactsApp.tsx`** (7→0) — chrome hex/rgba (panel/border/glass) → `cssVar`/`tint` per the
    established mappings (slate panel→`abyss`, white-glass→`tint('xenon',N)`, void-scrim→`tint('void',N)`).
  - **`src/apps/artifacts/artifacts/ColorPalette.tsx`** (23) — **EXEMPT** (don't migrate): it's a colour-theory TOOL
    where the hexes ARE its content/output — seed palettes (`#6366F1`…), the CSS-export string, `fgFor` returning true
    `#0F172A`/`#FFFFFF` for the **WCAG contrast lab**, the placeholder, and the user's own swatch backgrounds.
    Recolouring to XENO tokens would break the contrast lab and lose the seed data (registry/providers precedent).
    Add `'src/apps/artifacts/artifacts/ColorPalette.tsx'` to the `DS_INFRA` set in `scripts/metrics.mjs` with a
    one-line rationale comment.
  - *Acceptance:* `node scripts/metrics.mjs` reports **0** for every non-exempt file under `src/apps/artifacts/**`
    (ColorPalette exempted); charts/kanban/forms/gallery render in XENO accents; **token-violations 134 → ~59**
    (−75: −23 exempt, −52 swept). Build🟢 `vitest`🟢 (incl. the extended `tokens.test.ts`) eslint clean on touched files.

- [x] **S7 · Shared UI primitives + shell chrome → zero.** *(DONE 2026-06-28 — token-violations 59 → 14, −45.)* The reusable surfaces every app inherits — migrate them
  with the `cssVar`/`tint` rails (all render code, no identity data; ~45 violations). **Files & shape:**
  - **`src/components/ui/Toast.tsx`** (16) — the per-type config map: success-green→`c-success`, error-red→`c-danger`,
    info-cyan `#22d3ee`→`signal`, warning-amber `#f59e0b`→`c-warn` (stripe = solid `cssVar`, fg = lighter via
    `color-mix(… var(--accent) 70%, var(--text))`, bg = `tint(accent,12)`); panel `rgba(13,18,36,0.85)`→`tint('void',85)`
    or `abyss`; white borders/inset → `tint('xenon',N)`; shadow `rgba(0,0,0,…)`→`tint('void',N)`; hover `rgba(255,255,255,0.06)`
    →`tint('xenon',6)`. (`fg: 'var(--color-cyan-3)'` on info is already a var — leave it or normalise to `cssVar('signal')`.)
  - **`src/components/ErrorBoundary.tsx`** (7) — fallback-panel chrome (danger accent + glass) → `cssVar('c-danger')`/`tint`.
  - **`src/components/ui/Utility.tsx`** (6) — shared utility chrome → `cssVar`/`tint`.
  - **`src/components/Desktop.tsx`** (6) — shell chrome hex/rgba → `cssVar`/`tint` (keep any `${app.color}` registry-accent
    interpolation as-is; that's identity data, not a violation in this file — only fix literal hex/rgba).
  - **`src/dashboard/Dashboard.tsx`** (4) + **`src/dashboard/AppShell.tsx`** (3) → `cssVar`/`tint`.
  - **`src/components/ui/NodeActions.tsx`** (3) → `cssVar`/`tint` (hover tints stay `color-mix`, never raw `rgba` — see trap).
  - *Acceptance:* all seven files report **0**; the desktop shell, toasts, error fallback and ⚡ menu render identically in
    XENO. **token-violations ~59 → ~14.** Build🟢 vitest🟢 eslint clean.

- [x] **S8 · Long-tail entity apps → ZERO (EPIC-2 CLOSE).** **Shipped 2026-06-28.** Swept the final scattered
  literals with the `cssVar`/`tint` rails (logic untouched — only colours): `Notes.tsx` 6→0 (left-rail
  `#eab308`→`cssVar('c-warn')`, action accents `#a855f7`→`cssVar('plasma')`/`#ef4444`→`cssVar('c-danger')`,
  footer border `rgba(255,255,255,0.04)`→`tint('xenon',4)`, analyze hover `rgba(34,211,238,0.08)`→`tint('signal',8)`,
  **alpha-append trap** `${accent}1F`→`color-mix(… 12%)` + fallback `rgba(255,255,255,0.06)`→`tint('xenon',6)`),
  `Goals.tsx` 3→0 (dropped hex fallbacks `var(--void,#03060e)`→`var(--void)` ×2, `var(--ember,#ff9b6b)`→`var(--ember)`),
  `AIChat.tsx` 2→0 (context banner `rgba(34,211,238,0.05)`→`tint('signal',5)`, modal scrim
  `rgba(0,0,0,0.6)`→`tint('void',60)`), `Calendar.tsx` 1→0 + `Weather.tsx` 1→0 (modal scrims→`tint('void',60)`),
  `nodeColors.ts` 1→0 (the lone literal was in a **comment** — `metrics.mjs` greps prose too; rephrased to drop the
  `rgb`-function spelling, kept the `rgbCss` rail). **token-violations 14 → 0 — EPIC-2 TARGET MET.** build🟢
  vitest 115🟢 eslint clean. *Visual: scrims/accents now resolve through XENO tokens, identical intent; not
  cloud-verifiable visually.* → **EPIC-2 DONE; QA to confirm 0 on green main.**

> **✅ EPIC-2 COMPLETE (2026-06-28):** target metric *Design-token violations* **501 → 0** across S1–S8. One
> palette, consumed via `cssVar`/`tint`/`CATEGORICAL`/`rgbCss` in DOM and canvas; genuine identity/content data
> (registry, providers, ColorPalette) exempted in `metrics.mjs` `DS_INFRA` with rationale. **EPIC-3 promoted to
> ▶ ACTIVE.**

## 🏁 CODE-COMPLETE — EPIC-3 · Depth pass on shallow instruments

> Promoted 2026-06-28 when EPIC-2 hit 0 token violations. **✅ All stages S1–S4 SHIPPED (2026-06-29).**
> Function metric *shallow instruments with genuine persistent/offline function* = **8/8 (HIT at S3, QA-confirmed
> 2026-06-29)**; S4 landed the "+ a unit test" discipline for the two logic-heavy redesign instruments
> (DataCenter + Weather). **EPIC-3 is code-complete** — move to DONE on the next QA pass. **EPIC-4 · PWA
> completion is now ACTIVE** (below); the next builder takes EPIC-4 S1.

**Leap:** the thin apps (Photos, Maps, Video, Music, Clock) get genuine offline-capable
function instead of placeholders — coherence over new surface area.
**Target metric (PRIMARY):** *Shallow instruments with genuine persistent/offline function* → **8/8**
(Weather, Maps, Language, DataCenter, Clock, Music, Video, Photos). **Now 7/8** — the 2026-06-28 redesign
pre-delivered the first four (Weather=Open-Meteo, Maps=Leaflet+Nominatim, Language=Cakra translation,
DataCenter=local-first localStorage); **S1** added Clock; **S2** added Music + Video. **Only Photos remains
(S3).** *Routes rendering clean* stays 25/25 throughout.
**Acceptance discipline (the "+ a unit test"):** every NEW deepening stage ships with a dedicated unit test
of its pure logic (Clock ✅ `clockLogic.test.ts`, Music/Video ✅ `mediaStore.test.ts`, Photos → S3). The four
redesign instruments pre-shipped without tests; **S4 backfills the two that have real pure logic
(DataCenter CRUD + Weather mapping)** — Maps/Language are thin Leaflet/Cakra wrappers whose honest coverage
is QA's render-smoke. EPIC-3 is **DONE** when the function metric hits 8/8 (S3) and S4's tests land.

> **Decomposition note:** EPIC-3 was Builder-seeded (2026-06-28) for the green Clock stage; the Strategist
> refined the target (function-8/8 primary, "+test" as discipline not a separate 8-test metric) and deeply
> re-specified S3 (exact `mediaStore` port from Music) + S4 (named logic modules + test fixtures) on 2026-06-28.

Stages (Builder takes the topmost `[ ]`; confirm current state vs. code first):
- [x] **S1 · Clock → persistent, offline instrument + countdown Timer.** **Shipped 2026-06-28.**
  Clock was session-only: alarms, the 12/24h preference and the world-clock list all reset to hardcoded
  seeds on every reload (a placeholder masquerading as function), and there was no countdown timer (the
  `Timer` icon was imported but only a stopwatch existed). **Done:** extracted pure, storage-agnostic logic
  to `src/apps/clock/clockLogic.ts` (`formatStopwatch`/`formatTimer`/`alarmShouldFire` + tolerant
  `serializeClockState`/`deserializeClockState` that migrate partial/old/corrupt saves field-by-field +
  `CITY_OPTIONS` picker data); Clock now lazy-loads + persists `{alarms, worldClocks, is24Hour}` to
  `empire-clock-state`, world clocks are **editable** (add from a curated offline city list, remove), a real
  **Timer tab** (presets 1/5/10/25m + custom mm:ss, start/pause/reset, progress bar, fires `EVENT_CREATED`
  on completion → Network pulse), and the formerly-dead "Play sound" now rings via a WebAudio `beep()` (no
  asset, fully offline). `clockLogic.test.ts` (17 cases) covers formatting, alarm-fire rule, and
  persistence round-trip/migration/corruption. *Acceptance met:* set an alarm / switch to 24H / add a city →
  reload → all restored; start a 1m timer → it counts down and beeps/pulses at zero. Build🟢 vitest 115→132🟢
  eslint clean; **token-violations 0 (±0)** (kept the existing Tailwind-class idiom, no raw hex), bundle gz
  288.6→290.7 (+2.1, the Timer tab). *Cloud limit:* the reload-restores-state and timer-beep behaviours are
  described for on-device confirmation; the persistence/alarm/timer *logic* is covered by the 17 unit tests.
- [x] **S2 · Music + Video → library actually survives a reload (IndexedDB blob store).** **Shipped 2026-06-28.**
  Both apps persisted their playlist to `localStorage` *including* `URL.createObjectURL` blob URLs (session-scoped
  → dead after reload), so the restored library was a list of unplayable ghosts (a latent data-integrity bug).
  **Done:** new shared `src/lib/mediaStore.ts` — a thin, tolerant IndexedDB wrapper (`putMedia`/`getMedia`/
  `deleteMedia`/`allMediaIds`/`loadMediaUrls`; opens DB `empire-media`/store `blobs`; **graceful no-op when IDB is
  absent** — private mode / jsdom resolve null/false/empty, never throw) storing real file `Blob`s keyed by id +
  the **pure, tested** transforms `toStorableMeta` (strip volatile `src`, drop `ephemeral`) / `rehydrateMedia`
  (attach fresh URLs, **drop ghosts**) / `shouldPersistBlob` (75 MB per-blob cap). `Music.tsx` + `Video.tsx` now
  persist **metadata only** (no `src`) and async-rehydrate on mount (read meta → recover blobs → rebuild library),
  with a `hydratedRef` gate so the initial empty render can't overwrite the saved library before its blobs load.
  Oversized files are persisted-skipped, flagged `ephemeral`, kept session-only with a "session-only" hint chip and
  excluded from localStorage (never become ghosts). Add → `putMedia`; remove/clear → `deleteMedia`.
  `mediaStore.test.ts` (11 cases) pins strip/rehydrate round-trip, the ghost-drop, the size-cap, and empties.
  *Acceptance:* add an audio/video file → reload → still in the playlist AND plays (the persistence/ghost-drop
  *logic* is unit-pinned; the IDB-roundtrip needs a real browser — jsdom has no IDB). Build🟢 vitest 132→143🟢
  eslint clean; **token-violations 0 (±0)**, bundle gz 290.7→291.9 (+1.2, the shared store). One commit, both apps.
- [x] **S3 · Photos → library survives a reload (reuse the S2 `mediaStore` blob rail) + a unit test.**
  **Shipped 2026-06-29.** Ported `Photos.tsx` to the shared `mediaStore` rail 1:1 from Music: `interface Photo
  extends MediaRecord`, field `url`→`src` (8 read sites incl. both grid/list `<img>`, lightbox `<img>`/`<a
  download>`, `addFiles`, `revokeObjectURL`), async-rehydrate on mount (`loadMediaUrls`+`rehydrateMedia` behind a
  `hydratedRef` gate), persist `toStorableMeta(photos)` only, `putMedia(id,file)` on add (oversized >75 MB →
  `ephemeral` + amber "session" chip in BOTH grid & list views), `deleteMedia(id)` on delete. New test
  `src/apps/photos/photosStore.test.ts` (6 cases). **Function metric 7/8 → 8/8 — all shallow instruments now
  offline-capable.** build🟢 vitest 149🟢 (19 files) eslint clean; token-violations 0 (±0), off-system +4 (the two
  amber chips, the mandated idiom), gz +0.3 (shared rail). *Cloud limit:* add→reload→still-renders needs a real
  browser with IDB (jsdom has none) — pure transforms carry the coverage, as in S2; QA should add `photos` to the
  MEDIA-PERSISTS guard's `mediaCases`.
  **This was the SAME latent data-integrity bug S2 just fixed in Music/Video — confirmed in code.**
  `Photos.tsx:51-58` persists each photo's `url` (a `URL.createObjectURL(file)` blob URL) to
  `localStorage('empire-photos')`; blob URLs are **session-scoped → dead after a reload**, so the restored
  gallery is a grid of broken images (a real bug, not a placeholder). Fix it by reusing the **exact rail**
  S2 built — store the real image `Blob` in IndexedDB, persist metadata only, re-mint URLs on mount, drop
  ghosts. Mirror `Music.tsx` 1:1; **this is a near-mechanical port, fully downhill.** Files & shape:
  - **`src/apps/photos/Photos.tsx`** — apply the Music pattern verbatim:
    - `import { putMedia, deleteMedia, loadMediaUrls, toStorableMeta, rehydrateMedia, shouldPersistBlob,
      type MediaRecord, type StoredMeta } from '../../lib/mediaStore'`.
    - Make `interface Photo extends MediaRecord` and **rename the field `url` → `src`** throughout (the
      transforms key on `src`; ~8 read sites: the two `<img src>`, the lightbox `<img>`/`<a download href>`,
      `URL.revokeObjectURL`, `addFiles`). Add `ephemeral?: boolean`.
    - **Mount effect** (replace the current `localStorage.getItem` load, lines 48-54): async-rehydrate —
      read `empire-photos` metadata, `const urls = await loadMediaUrls(meta.map(m=>m.id))`,
      `setPhotos(rehydrateMedia<Photo>(meta, id => urls.get(id) ?? null))`, then set a `hydratedRef`.
      Use the **`hydratedRef` gate** (a `useRef(false)`) exactly like Music so the initial empty render
      can't clobber the saved library before blobs load (the race S2 documents).
    - **Persist effect** (replace lines 56-58): `if (!hydratedRef.current) return;
      localStorage.setItem('empire-photos', JSON.stringify(toStorableMeta(photos)))`.
    - **`addFiles`** (lines 71-101): for each image set `const ephemeral = !shouldPersistBlob(file.size);
      if (!ephemeral) void putMedia(id, file)`; keep the `src = URL.createObjectURL(file)` for this session,
      set `ephemeral` on the record. Surface a "session" hint chip on `ephemeral` photos (mirror Music's
      `amber-*` chip) so an oversized photo isn't a silent ghost.
    - **`deletePhoto`** (lines 107-113): add `void deleteMedia(id)` alongside the existing `revokeObjectURL`.
    - The graph-mirror effect (lines 63-69) is unaffected (it already omits the url).
  - **Test (new file → +1 test-file metric):** `src/apps/photos/photosStore.test.ts` — with a Photo-shaped
    fixture, assert `toStorableMeta` strips `src` + drops `ephemeral` but **keeps `favorite`/`tags`/`width`/
    `height`/`date`**; assert `rehydrateMedia` re-attaches a URL and **drops a photo whose blob is missing**
    (the ghost case). (The shared transforms are already tested generically in `mediaStore.test.ts`; this
    pins the Photo contract so a future field-strip regression fails loudly.)
  - *Acceptance:* add a photo → reload → it still renders (its blob came back from IDB); delete a photo →
    its IDB blob is removed; an oversized (>75 MB) photo shows the "session" chip and is excluded from
    localStorage. **Function metric 7/8 → 8/8 (all shallow instruments offline-capable).** Build🟢 vitest🟢
    (+ the new file) eslint clean; **token-violations stay 0** (keep the Tailwind-class idiom — the hint chip
    uses `amber-*` utility classes like Music, NOT inline hex). *Cloud limit:* the add→reload→still-renders
    path needs a real browser with IDB (jsdom has none) — the pure transforms carry the coverage, as in S2.

- [x] **S4 · Backfill unit tests for the two logic-heavy redesign instruments (DataCenter + Weather) — EPIC-3 CLOSE.**
  **Shipped 2026-06-29.** Extracted `src/apps/datacenter/datacenterLogic.ts` (DCStore types + tolerant
  `deserializeStore`/`serializeStore` + immutable `addRow`/`updateCell`/`deleteRow`/`addTable`/`deleteTable`/
  `normalizeTableName`, all no-React) and `src/apps/weather/weatherLogic.ts` (`Cat`/`WeatherData`/`OpenMeteo*`
  types + `wmo()` code map + pure `mapForecast(data, place)`), rewired both components to delegate (no behaviour
  change). New `datacenterLogic.test.ts` (12 cases — CRUD immutability + no-op-on-missing-table + round-trip +
  4-way tolerant-parse fallback) and `weatherLogic.test.ts` (8 cases — wmo clear/rain/snow/cloud/storm + mapped
  current/daily/5-day-cap/missing-daily). build🟢 vitest 170🟢 eslint clean; test-files 19→21, token-violations
  0 (±0), bundle 292.2→292.3. **EPIC-3 is now CODE-COMPLETE (all of S1–S4 shipped); function metric 8/8 hit at
  S3.** → Strategist/QA: promote **EPIC-4 · PWA completion** (CONTEXT already points the next builder at S1).
  The four redesign instruments (Weather/Maps/Language/DataCenter) shipped working but **without a dedicated
  test**, so the "+ a unit test" discipline is uneven. Maps & Language are thin wrappers (Leaflet / Cakra
  `chat()`) with little pure logic worth unit-pinning — QA's render-smoke is their honest coverage. **DataCenter
  and Weather DO have real pure logic**; extract and test it so the suite's persistence/parsing is regression-
  guarded. Files & shape:
  - **DataCenter** — extract the table CRUD + (de)serialization out of `DataCenter.tsx` into a pure
    `src/apps/datacenter/datacenterLogic.ts` (mirror `clockLogic.ts`): move `loadStore`/serialize plus pure
    helpers `addRow(store, table, row)` / `deleteRow(store, table, id)` / `addTable(store, name, cols)` (return
    a new `DCStore`, no React). Rewire the component to call them. **Test `datacenterLogic.test.ts`:** add a
    table, add/delete rows, and a `load(serialize(store)) === store` round-trip incl. a corrupt/partial-JSON
    fallback (the tolerant-parse contract).
  - **Weather** — extract the **pure WMO-code → `{label,description,cat}` mapping** (`Weather.tsx:43 wmo()`)
    and the **Open-Meteo forecast JSON → `WeatherData`/`DayForecast[]` mapping** into a pure
    `src/apps/weather/weatherLogic.ts`. Rewire the component's fetch handler to call the mapper.
    **Test `weatherLogic.test.ts`:** feed a canned Open-Meteo response object → assert the mapped current
    temp + N-day forecast (`hi`/`lo`/`cat`) and a couple of `wmo()` codes (clear/rain/snow). No network — the
    mapper is pure over a fixture.
  - *Acceptance:* both new logic modules are imported by their components (no behavior change) and covered by
    `datacenterLogic.test.ts` + `weatherLogic.test.ts`; **test-files +2, all green.** Build🟢 vitest🟢 eslint
    clean; token-violations 0. **This closes EPIC-3** (function 8/8 after S3; the two logic-heavy redesign
    instruments now carry tests, Maps/Language render-smoke-covered) → QA confirms 8/8 and promotes **EPIC-4**.

_When S3 ships (function 8/8) and S4 lands (DataCenter+Weather tests) and QA confirms the function metric hit
8/8 → move EPIC-3 to DONE and promote **EPIC-4 · PWA + Android validation** (stages seeded below)._

## ▶ ACTIVE — EPIC-4 · PWA completion → installable, offline-true
> **Promoted 2026-06-29** when EPIC-3 went code-complete (function 8/8 + S4 tests). Highest gradient after EPIC-3 because the
> vision's end-state is "a complete offline-first PWA, then Android" and every app is now offline-capable
> — the shell itself is the last thing that isn't guaranteed to load with no network.

**Leap:** the installed PWA boots and runs **fully offline** (shell + all 25 app chunks precached), is
installable, and is byte-identical to dev — turning "26 offline apps" into "one offline product."
**Target metric:** *Lighthouse PWA ≥ 90* **and** a new **`offline-boots` smoke guard** = the built app
loads + renders the desktop with the network fully blocked (today's QA only blocks *external* hosts; it
never asserts a cold offline boot of the app's own chunks).
Stages (Strategist to finalize on promotion; first-pass seeds — each one Builder run, build-green):
- [ ] **S1 · Offline-boot guard + SW precache audit.** Add `scripts/qa-offline.mjs` (or extend
  `qa-smoke.mjs`): serve `dist/`, load with `page.route('**', …)` aborting **all** requests after first
  load, assert the desktop shell + one lazy app route still render from the SW/precache. Inventory what the
  service worker actually precaches vs the 25 lazy app chunks (find the SW config — likely `vite-plugin-pwa`
  in `vite.config.ts` or a manual `sw.js`). *Acceptance:* the guard runs in QA and reports cold-offline
  pass/fail; the precache gap (chunks not cached) is enumerated.
- [ ] **S2 · Close the precache gap.** Configure the SW (Workbox `globPatterns` / runtime caching) so the
  shell + every app chunk + fonts + the alien SVG icon set are precached; verify `dist` includes a manifest
  + icons at the right sizes. *Acceptance:* the S1 offline-boot guard goes green for the shell **and** a
  cold-navigated app route; manifest + maskable icons present.
- [ ] **S3 · Base-path + install-flow correctness.** Confirm `base` is correct for the deploy target so the
  installed PWA's asset URLs resolve (the blank-on-install class of bug); add a lightweight check that the
  manifest `start_url`/`scope` match `base`. *Acceptance:* built app loads under the deploy base with no 404
  asset; install prompt criteria met.

## ⏳ QUEUED — EPIC-5 · Android APK validation
> Promote after EPIC-4. **Leap:** the APK degrades gracefully with no LAN server (backend-optional layer).
> **Target metric:** APK installs + all offline-capable apps function on-device with `server.js` absent.
> Stage seeds: run the `Android APK` workflow; verify the backend-optional fallbacks (Files' `/api/files`
> 500 → on-device storage path, etc.); on-device smoke of the 8 offline instruments.

---

## DONE

- **EPIC-0 · Organism foundation** — A-bus / B-graph / C-intents, `mirrorCollection`,
  `NodeActions`, `HANDOFF` event, Network wired to the live bus + app→app arcs, core
  unit tests. (Shipped #3/#5/#7/#8/#13/#20, 2026-06-20 → 06-21.) EPIC-1 completes it.
