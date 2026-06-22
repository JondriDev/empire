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
- **Next stage:** **S3 · Network inspector + legend.** (S1, S2 shipped 2026-06-22.)
- **Exact shape for S3:** Add a **side panel** to `src/apps/network/Network.tsx`
  that, on clicking a node, shows that node's **real neighbours** and a **legend**
  mapping node-type → accent. Today `onClick` just `openApp`s the app (line ~330,
  `onClick = (e) => { const i = pick(e); if (i>=0) openApp(...) }`). Change it to
  **select** the app node into React state (e.g. `const [selected, setSelected] =
  useState<string|null>(null)`) and render a `gp` panel (mirror the live-ticker
  panel's styling, top-right). Panel contents: **(1)** the app's CoreNodes
  (`Object.values(useGraph.getState().nodes).filter(n => n.meta.app === id)`) — or
  better, subscribe via `useGraph(s => …)` so it re-renders — and each node's real
  edges from `graph.neighbors(nodeId)` (selector already exists in `graph.ts`).
  **(2)** A legend: iterate the `TYPE_RGB` map (already in Network.tsx, lines ~139)
  → swatch + type label, so the user can decode the orbiting node dots. Keep
  "open app" reachable (e.g. a button in the panel, or double-click opens). Tokens
  only — reuse `var(--text*)`, `--space-*`, `--radius-*`; the swatches read their
  rgb from `TYPE_RGB`/`typeRgb` (canvas palette, already token-derived). *Acceptance:*
  click a node → panel lists its true neighbours (assert against `graph.neighbors`);
  legend rows match `TYPE_RGB`. Add a small test for a `neighbours-of-app` helper if
  you extract one. Build 🟢 vitest 🟢 eslint clean; **no token violations** (metric
  must stay ±0 — no raw hex in the new JSX).

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
  `-ai-clipboard`). **All 7 actions already light a directed arc** (HANDOFF, or
  NOTE_CREATED `from-` tag / LEARNING_LOGGED `from`). Tested in `appActions.test.ts`.
- **C-layer intent arcs (S2, 2026-06-22):** the ⚡ NodeActions menu runs the core intents
  registered in `src/lib/core/sync.ts` (`make-task`/`make-note-from`/`add-to-learning`).
  Each now calls `announceTransfer(fromApp, createdNode.meta.app, label)` (guarded
  `fromId!==toId`) → cross-app `add-to-learning` lights an honest arc; in-app
  `make-task`/`make-note-from` (created node owned by the *source* app) emit nothing.
  Tested in `src/lib/core/coreIntents.test.ts`.
- **Arc predicate (canonical):** `src/lib/core/flow.ts` — `flowForEvent(e): Flow|null`
  is the ONE definition of "does this event light a directed app→app arc?" (HANDOFF /
  NOTE_CREATED `from-` / LEARNING_LOGGED `from`; self-edges → null). Network imports it;
  `flow.test.ts` covers it. **S3 should reuse it / `graph.neighbors` — don't re-derive.**
- **The Network app:** `src/apps/network/Network.tsx` — renders CoreNodes as satellites,
  consumes `HANDOFF` for directed app→app arcs via `flowForEvent` (now from `flow.ts`).
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

- _(append: "tried X → didn't work because Y → do Z instead". Empty at seed.)_

## 📌 Open follow-ups discovered (promote into EPICS.md stages)

- Verify whether `/app/goals` orphan is resolved — `goals` IS in `registry.ts` now; an earlier QA
  run flagged it missing. Confirm route renders and retire the finding if fixed.
- DataCenter `dataset` nodes only carry a row count for the *active* table.
- Files `file` nodes only reflect the *current* directory (reconcile drops others on navigate).
- Photos `photo` nodes carry no thumbnail (object URLs are revoked on delete).
