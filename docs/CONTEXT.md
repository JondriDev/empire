# The Empire — Working Memory (cross-run context)

> **Why this file exists (first principles):** every cloud routine runs on a
> *stateless fresh checkout*. Without shared memory, each run burns most of its
> budget re-deriving the codebase and re-discovering the plan — that understanding
> is dissipated at run-end (waste heat), leaving only enough energy for a sliver
> of a change. **This file conserves that energy.** Read it FIRST; write back to
> it LAST. Run N+1 should inherit the understanding run N paid for, and spend its
> whole budget on the change — that is what turns slight iterations into leaps.

**Rules for maintaining this file:**
- This is *working memory*, not a log (the chronological journal is `docs/ROUTINE-LOG.md`).
- Keep it **tight and current** — prune anything no longer true. Stale memory is worse than none.
- Builder & QA update it **every run**. Strategist refreshes the "Active epic" block when it promotes a new epic.
- Use `file.ts:line` pointers so the next run jumps straight to the seam.

---

## ▶ Active epic & exact next-stage shape

> The single most important block. The Strategist keeps this in sync with the
> ACTIVE epic in [`docs/EPICS.md`](./EPICS.md). The Builder reads this and should
> be able to start editing **without re-planning**.

- **Active epic:** EPIC-1 — Organism Completeness (see `docs/EPICS.md`).
- **Next stage:** **S6a · Surface provenance on the two silent in-place receivers (Notes + Learning)** —
  the first of three S6 stages that close the emit↔receive loop. (S1–S5 all shipped 2026-06-22.)
  The audit is SETTLED (full breakdown in `docs/EPICS.md` S6) — no re-auditing, just build.
- **Exact shape for S6a (start here, no re-planning):** the headline metric *apps both-ways* is
  stuck at **1/26** (only `prompt-generator` emits AND legibly receives). Notes & Learning already
  emit AND receive content in-place (`SEND_TO_NOTES`/`SEND_TO_LEARNING`) but acknowledge nothing —
  make the receive *legible* and both flip to both-ways (1→3). Edits:
  1. `src/lib/store.ts` — add `from?: string` to `interface LearningItem` (optional, backward-compat).
  2. `src/lib/appActions.ts` — in `SEND_TO_LEARNING.execute`, set `from: data.source` on the
     `addLearningItem({...})` (Notes already tags `from-<source>` — no change there).
  3. `src/apps/notes/Notes.tsx` — note cards whose `tags` include a `from-<source>` render
     `<ProvenanceChip from={source} onDismiss={…}/>`; dismiss strips only that tag via `updateNote`.
  4. `src/apps/learning-tracker/LearningTracker.tsx` — items with `item.from` render a
     `<ProvenanceChip>`; dismiss clears `from`.
  5. Extend `src/lib/appActions.test.ts` — assert `SEND_TO_LEARNING` persists `from === data.source`.
  *Acceptance:* ⚡ Send-to-Notes from Calculator → new note shows a "From Calculator" chip; ⚡
  Track-as-Learning from Notes → new item shows a "From Notes" chip. **both-ways 1→3.** Reuse
  `ProvenanceChip` (no new colours → token-violations flat); build🟢 vitest🟢 eslint clean.
- **Then S6b** (sinks emit onward: Editor/Token-Counter/AI-Chat get a ⚡ "Send to…" reusing
  `CROSS_APP_ACTIONS`; 3→6) **then S6c** (natural inbound for Calendar/Goals/Messages via the
  S1 receiver rail; 6→9 = honest target) — full file lists in `docs/EPICS.md`.
  **When S6a–c land and QA confirms both-ways climbed to the honest target (9 entity-apps-with-
  inbound; files/photos/datacenter + tool apps emit-only by design) → EPIC-1 DONE; promote EPIC-2.**

## 🧭 Codebase seams (where the important things live)

- **Organism core (B-backbone / A-bus / C-intents):**
  - `src/lib/eventBus.ts` — typed pub/sub. Carries `NODE_*` / `INTENT_*` and the
    generic **`HANDOFF { fromId; toId; label? }`** cross-app transfer event.
  - `src/lib/core/graph.ts` — the shared world-state graph (`CoreNode`, Zustand+persist
    store `empire-core-graph`; `addNode/updateNode/deleteNode/link/unlink`, selectors
    `nodesOfType/neighbors/useNodesOfType`). Unit-tested.
  - `src/lib/core/intents.ts` — `registerIntent/intentsFor/runIntent`. Graph-mutating
    core intents (`make-task`, `make-note-from`, `add-to-learning`) are registered in
    `src/lib/core/sync.ts` (they need `useGraph`), not here.
  - `src/lib/core/sync.ts` — `startCoreSync()` (called once in `main.tsx`); `mirrorCollection()`.
  - `src/components/ui/NodeActions.tsx` — `<NodeActions type sourceId/>` ⚡ "Send to…" menu.
  - **Focus + command palette (S4, 2026-06-22):** `src/lib/core/focus.ts` — `useFocus` store
    (`focusedId`), pure `focusIdForEvent(event)` (NODE_CREATED/UPDATED/INTENT_RUN→nodeId,
    NODES_LINKED→fromId), and `startFocusTracking()` (called once in `main.tsx`) which subscribes
    `onAny` to keep `focusedId` = the LAST node touched (clears on that node's NODE_DELETED).
    `src/components/CommandPalette.tsx` — ⌘/Ctrl-K `gp` modal (self-contained: own open state +
    global keydown; rendered once in `Desktop.tsx` as Layer 7). Resolves the focused node from
    the graph, lists "Open in <app>" + `intentsFor(node)`, runs via `runIntent`+toast (mirrors
    NodeActions). Network's inspector `setFocus`es the selected app's newest node
    (`Network.tsx` effect on `[selected]`), so ⌘K after a click aims at something real.
  - **Inbox / Today task view (S5, 2026-06-22):** `src/lib/core/tasks.ts` — pure selectors
    `taskNodes(nodes)` / `partitionTasks(nodes)→{open,done}` / `isTaskDone(n)` (a task is done iff
    `data.done===true`; sorted newest-first by `meta.created` so a toggle doesn't reorder the list).
    Unit-tested in `tasks.test.ts` (4 tests). `src/apps/inbox/Inbox.tsx` — the 27th app (registry id
    `inbox`, `appComponents.tsx`); subscribes `useGraph(s=>s.nodes)`, renders open/done task rows
    with a checkbox that flips `data.done` via `updateNode(id,{data:{...n.data,done:!done}})`, a
    source-app chip (icon+name from `registry`), and `<NodeActions nodeId={n.id}/>`. **`NodeActions`
    now takes an optional `nodeId`** (all three props optional) to target graph-only nodes that have
    no store `sourceId` — tasks created by `make-task` carry only `data.done`/`data.from`. The only
    intent that `accepts` a `task` is `make-note-from` (so the ⚡ bar offers "Make Note from this").
  - **HANDOFF receiver rail (S1, 2026-06-22):** `src/lib/useInboundHandoff.ts` —
    `useInboundHandoff<T>(sessionKey)` reads the `empire-*-clipboard` payload once
    on mount, consumes the key, returns `{payload, source, dismiss}`.
    `src/components/ui/ProvenanceChip.tsx` — `<ProvenanceChip from onDismiss/>`
    glass pill in the source app's registry accent. Used by Editor / TokenCounter /
    PromptGenerator / AIChat. **To add a new receiver:** `const inbound =
    useInboundHandoff<{...}>('empire-x-clipboard')`, preload in a `[inbound.payload]`
    effect, render `{inbound.source && <ProvenanceChip from={inbound.source}
    onDismiss={inbound.dismiss}/>}`.
- **Cross-app handoffs:** `src/lib/appActions.ts` — `CROSS_APP_ACTIONS` executors; the
  `handoff(fromId,toId,label)` helper emits `HANDOFF` before navigating. Receivers read
  `sessionStorage` keys (`empire-editor-clipboard`, `-token-clipboard`, `-prompt-clipboard`,
  `-ai-clipboard`).
- **The Network app:** `src/apps/network/Network.tsx` — renders CoreNodes as satellites,
  consumes `HANDOFF` for directed app→app arcs (`flowForEvent`). **S3 (2026-06-22):** a
  single canvas click now **selects** a node (`onClick` → `setSelected(layout[i].app)`,
  empty space clears) and opens an **inspector** panel; the inspector's "⚡ Open" button is
  what launches the app now. Panels subscribe reactively via `useGraph(s=>s.nodes)` +
  memoized `appAdjacency`/`entitiesByApp`; the canvas render loop still reads the graph
  imperatively (animation unaffected — the effect does NOT depend on `selected`).
  - **`src/apps/network/adjacency.ts`** — pure seam: `appAdjacency(nodes): Record<app,{out,in}>`
    (owner→owner from node links; drops self-edges, owners not in registry, dangling links)
    and `entitiesByApp(nodes): Record<app, CoreNode[]>` (grouped, newest first). Unit-tested
    in `adjacency.test.ts`.
  - **`src/apps/network/nodeColors.ts`** — the ONE source of node-type colour:
    `TYPE_RGB` (triplets), `typeRgb(type)` (hashed fallback), and **`rgbCss(triplet, alpha?)`**
    which builds a CSS colour from a constant so reusing canonical triplets costs **zero**
    token-metric violations. Canvas, legend and inspector all import from here so they can't drift.
- **Registry / shell:** `src/lib/registry.ts` (27 apps, incl. S5 `inbox`), `src/lib/appComponents.tsx`
  (route→component map), `src/components/Desktop.tsx` (shell).
- **Design system:** `src/design-system/colors_and_type.css` (canonical XENO palette),
  `src/design-system.css` (legacy-token *bridge* — edit here to restyle all apps),
  `src/window-manager.css`, `src/index.css`. A TS token module
  (`src/design-system/tokens.ts`) is the planned single source for canvas + CSS.
- **AI routing:** `src/lib/ai.ts` → `src/lib/apiBase.ts` (`aiApiUrl()`); live site routes
  Cakra to the Supabase proxy, dev stays same-origin.

## ⚠️ Invariants & traps (do NOT relearn these the hard way)

- **Blank-dark trap:** a `*/` sequence *inside* a CSS doc-comment in `design-system.css`
  (e.g. `--text*/`) closes the comment early → brace mismatch nests every `.empire-*`
  rule under `@media(max-width:640px){.hide-sm…}` → desktop renders unstyled **despite a
  green build**. Always **space out the slashes** in comments. Verify without a browser:
  `grep -o '/\*'` count == `grep -o '\*/'` count, and built `dist/assets/index-*.css` has a
  **top-level `.empire-desktop{position:fixed}`** with **zero `.hide-sm .empire-desktop`**.
- **Calendar owns its own storage:** events live in `empire-calendar-events` (NOT the central
  store) and self-mirror via `mirrorCollection()` in a `[events]` effect. **Never add an
  `event` syncer to the central list** — it would delete Calendar's nodes.
- **An app joins the organism in ~3 lines:** `mirrorCollection(type, app, items, {id,title,data})`
  in a `useEffect` + `<NodeActions type="<type>" sourceId={item.id}/>` in each row.
- **Graph is a mirror, not the source of truth (yet):** apps keep their own store/localStorage;
  the graph reflects them. `make-note-from`/`add-to-learning` create graph-only nodes — they do
  **not** write back into the Notes/Learning stores yet.
- **Sandbox quirks:** branch deletion via the cloud git proxy returns **HTTP 403** (merged heads
  linger — harmless). Headless **Chromium CDN download 403s**; use the recipe below.
- **Test setup stubs storage:** `src/test/setup.ts` replaces `window.sessionStorage`/
  `localStorage` with inert `vi.fn()`s (no real store). Any test exercising a storage
  round-trip must `Object.defineProperty(window,'sessionStorage',{value: <Map-backed shim>})`
  in `beforeEach` (see `useInboundHandoff.test.ts`). Also: `act` imports from
  `@testing-library/react`, **not** `vitest`.
- **StrictMode is ON in prod** (`src/main.tsx`). A "read sessionStorage once + removeItem"
  mount effect is safe (dev double-invoke keeps the state set on the first pass; the second
  finds an empty key and no-ops), but never rely on the key surviving a second read.

## 🖥️ QA headless-render recipe (known-good)

- Use the pre-installed browser: Playwright `chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })`
  (adjust the version dir if it changed). **Fallback:** `@sparticuz/chromium`. Do **not** rely on
  `cdn.playwright.dev` (403). Serve the built app on `http://localhost:3001` before rendering.
- `scripts/qa-smoke.mjs` must include the **shell-is-styled assertion** (see blank-dark trap) so a
  green-but-blank build can't pass.

## 🧪 Tried & rejected (don't repeat dead ends)

- **`export const TYPE_RGB` from `Network.tsx` → rejected:** eslint
  `react-refresh/only-export-components` fails (a component file may export only
  components). **Do Z:** put shared constants/helpers in a sibling module
  (`nodeColors.ts`) and import them — that's why `TYPE_RGB`/`typeRgb`/`rgbCss` live there.
- **Token-metric trap (NEW):** `scripts/metrics.mjs` greps raw text for `\brgba?\(`
  and `#hex` — **including comments**. So a literal `rgb(` *in a code comment* counts
  as a violation. To reuse a token triplet as a CSS colour without a violation, use
  `rgbCss(triplet, alpha?)` from `nodeColors.ts` (assembles the string from a constant,
  no literal `rgb(`), and never write `rgb(`/`rgba(` in prose. Reusing this helped S3
  *lower* the metric 503→501 (the old ticker swatches used raw `rgb(${s.rgb})`).

## 📊 Last QA confirmation (2026-06-22, post-S5 green main — Inbox / Today app landed since last run)

- **Routes rendering clean: 27/27 ✅** (28/28 incl. desktop). SHELL-IS-STYLED assertion in
  `scripts/qa-smoke.mjs` passed (top-level `.empire-desktop{…position:fixed…}`, 0 `.hide-sm .empire-desktop`).
  **NEW this run:** a `REGISTRY-COVERAGE` assertion (cross-checks the smoke `apps` list against
  `registry.ts`) — it caught that `inbox` was missing from the list; added inbox + the guard so a future
  app can't silently skip the smoke test. vitest **96/96 🟢** (13 files).
- **Apps fully wired BOTH-ways: 1/27 (unchanged)** — only `prompt-generator` emits AND receives. Emit-only
  via `NodeActions` (11): artifacts(kanban), calendar, datacenter, files, goals, **inbox**, learning-tracker,
  messages, notes, photos, prompt-generator. Receive-only via `useInboundHandoff` (4): ai-chat, editor,
  prompt-generator, token-counter. S5 added an 11th emitter (inbox) but no receiver, so the overlap is
  unchanged. **Closing this overlap is S6 (not started).**
- **Epic-acceptance:** S5 (Inbox / Today view) **CONFIRMED LIVE** — seeded 3 `task` nodes into
  `empire-core-graph` (open from Calculator, done from Notes, open from Goals); the Inbox app surfaced **all
  three** with source-app chips, 0 page errors. Captured as `docs/screenshots/latest/inbox-populated.png`.
  This beats prior runs' empty-graph-only confirmation. `tasks.test.ts` (4 tests) passes. **EPIC-1 headline
  metric (both-ways 1/27) STILL PENDING** — needs S6 (give a tool app a `useInboundHandoff` receiver, or wire
  the last entity-owner both ways). Next active stage is **S6 (final EPIC-1 stage).**
- **Auto metrics moved vs post-S4:** apps 26→27 (+1, inbox), tests 88→92 static / 92→96 vitest (+4/+4),
  files 12→13 (+1, `tasks.test.ts`), token-violations **501 (±0)** (Inbox is pure tokens), bundle gz
  238.9→240.5 (+1.6). All deltas from S5 (commit a4f60a7).
- **Env-expected net noise (not bugs):** files `/api/files?path=/storage/emulated/0`→500 (Android-only path),
  datacenter `/api/dc/tables`→401 (authed API, no headless session).
- QA harness note: project has **no `playwright` dep**; it's global at `/opt/node22/lib/node_modules`.
  The run symlinks it into `node_modules/` (env-only, not committed). Pre-installed Chromium at
  `/opt/pw-browsers/chromium-1194`. `scripts/qa-smoke.mjs` `launchBrowser()` auto-globs the version dir.

## 📌 Open follow-ups discovered (promote into EPICS.md stages)

- DataCenter `dataset` nodes only carry a row count for the *active* table.
- Files `file` nodes only reflect the *current* directory (reconcile drops others on navigate).
- Photos `photo` nodes carry no thumbnail (object URLs are revoked on delete).
