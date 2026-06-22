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
- **Next stage:** **S5 · "Inbox / Today" view.** (S1–S4 all shipped 2026-06-22; S4
  command palette landed this run.)
- **Exact shape for S5:** Aggregate every open `task` node from the Core graph into ONE
  reachable view, so tasks created via ⚡ `make-task` from ANY app surface in one place.
  Today `task` nodes are graph-only (created by the `make-task` intent in `sync.ts:120`,
  `data.done=false`, `data.from=<sourceNodeId>`, owner app = the source's app) and have NO
  home view — they exist in the graph but are invisible. **Recommended shape:** a small
  surface listing `useNodesOfType('task')` (from `graph.ts:151`), newest first, each row
  showing the task title + its source app (resolve via `node.meta.app`→`registry`), with a
  checkbox that flips `data.done` via `useGraph().updateNode(id,{data:{...,done:true}})` and
  a `<NodeActions type="task" sourceId={...}>` ⚡ bar. **Open question — WHERE does it live?**
  Cheapest honest slice: a panel *inside The Network* (it already subscribes to `useGraph`),
  OR a tiny new always-available surface. **Recommend:** add it as a second panel in
  `Network.tsx` (top-left, mirroring the inspector at bottom-right) so no new route/registry
  entry is needed — confirm there's room, else make a minimal `Inbox` app + registry entry.
  *Acceptance:* a task made via ⌘K/⚡ from Notes appears in the Inbox; toggling done updates
  the graph; one unit test for the task-aggregation/selector logic. Build🟢 vitest🟢 eslint
  clean; token-violations must NOT regress (reuse `rgbCss`/tokens — see trap below).
  **Note the `make-task` `data.done` write-path:** `NodeActions`/intents don't yet flip done;
  S5 introduces the first task *mutation* UI — keep it a graph `updateNode`, the task is a
  graph-only node (no back-write to any app store).

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
- **Registry / shell:** `src/lib/registry.ts` (26 apps), `src/lib/appComponents.tsx`
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

## 📊 Last QA confirmation (2026-06-22, post-S4 green main — ⌘K command palette landed since last run)

- **Routes rendering clean: 26/26 ✅** (27/27 incl. desktop). SHELL-IS-STYLED assertion in
  `scripts/qa-smoke.mjs` passed (top-level `.empire-desktop{…position:fixed…}`, 0 `.hide-sm .empire-desktop`).
  Desktop + Network screenshots visually confirmed styled (XENO palette, CORE + all satellites,
  **S3 legend panel visible** bottom-right). vitest **92/92 🟢** (12 files).
- **Apps fully wired BOTH-ways: 1/26 (unchanged)** — only `prompt-generator` emits AND receives. Emit-only
  via `NodeActions` (10): artifacts(kanban), calendar, datacenter, files, goals, learning-tracker, messages,
  notes, photos, prompt-generator. Receive-only via `useInboundHandoff` (4): ai-chat, editor, prompt-generator,
  token-counter. S4 is navigability (surfaces intents), not wiring. **Closing this overlap is S6 (not started).**
- **Epic-acceptance:** S4 (⌘K command palette) **CONFIRMED live** — pressing Ctrl/⌘-K on the desktop opens a
  styled glass `role="dialog"` with the focus-aware empty state ("No node in focus · Touch a node … then ⌘K
  acts on it", `navigate / run / ⌘K toggle / 0 actions`, ESC). Captured as `docs/screenshots/latest/palette.png`.
  `focus.test.ts` (6 tests) passes. *Honest limit:* fresh context = empty `empire-core-graph`, so there is no
  focused node to **act on** headless — modal-open / focus-binding / empty-state confirmed, live intent
  execution covered by tests + seam. **EPIC-1 headline metric (both-ways 1/26) STILL PENDING** — needs S6.
  Next active stage is **S5 (Inbox / Today view)**.
- **Auto metrics moved vs post-S3:** apps 26 (±0), tests 82→88 static / 86→92 vitest (+6/+6), files 11→12 (+1,
  `focus.test.ts`), token-violations **501 (±0)** (palette reused tokens), bundle gz 237.6→238.9 (+1.3). All
  deltas from S4 (commit 1de67e5).
- **Env-expected net noise (not bugs):** files `/api/files?path=/storage/emulated/0`→500 (Android-only path),
  datacenter `/api/dc/tables`→401 (authed API, no headless session).
- QA harness note: project has **no `playwright` dep**; it's global at `/opt/node22/lib/node_modules`.
  The run symlinks it into `node_modules/` (env-only, not committed). Pre-installed Chromium at
  `/opt/pw-browsers/chromium-1194`. `scripts/qa-smoke.mjs` `launchBrowser()` auto-globs the version dir.

## 📌 Open follow-ups discovered (promote into EPICS.md stages)

- DataCenter `dataset` nodes only carry a row count for the *active* table.
- Files `file` nodes only reflect the *current* directory (reconcile drops others on navigate).
- Photos `photo` nodes carry no thumbnail (object URLs are revoked on delete).
