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

> The single most important block. Keep it in sync with the ACTIVE epic in
> [`docs/EPICS.md`](./EPICS.md). The next Builder reads this and should be able to
> start editing **without re-planning**. **Writing rule (RFC Step 3): REPLACE this
> block in place each run — do NOT stack a new dated stratum on top.** History is in
> git + `docs/ROUTINE-LOG.md`; working memory stays tight (its budget is the
> `docMass` metric — see below).

- **▶ EPIC-19 · The organism relates (the associative constellation) — ▶ ACTIVE, promoted 2026-07-14. NOT yet
  built.** The order past *proactive*: from *what needs you* (EPIC-17/18) to *how everything connects*. Every graph
  edge today is EXPLICIT (handoff `ProvEdge` / intent `data.from`); nothing reveals IMPLICIT relatedness. Add the
  6th lens (ASSOCIATIVE): open any entity → its *constellation* of cross-app relatives (shared-term · shared-tag ·
  same-day · linked), ranked + reason-labelled + one tap away. Reuses `search.ts` + graph + `openEntity` + `ui`; no new deps; six axes 0. **Target: new `RELATED` QA guard 0 → 5/5.**
  - **▶ S1 (next — measure-only, NO UI):** new `src/lib/core/related.ts` — `RelatedReason` (`linked·shared-term·
    shared-tag·same-day`), `RelatedItem {node,score,reasons}`, `significantTerms(node)` (title + `nodeBodyText`
    tokens, len≥4, minus a small STOP set — import `nodeBodyText` from `./search`, don't re-impl), and
    `relatedTo(nodes,id,limit=6)` scoring each other node: linked +8 (edge either way ‖ `data.from` either way),
    shared-tag +4/tag (cap +12), shared-term +3/term (cap +9), same-day +2 (local `dayKey`); drop 0, sort
    score↓→`meta.updated`↓, cap; attach reasons. `related.test.ts` ~13 cases. **Acceptance:** `vitest run
    related` green; no component edited; `--assert-zero` exit 0.
  - **S2:** `src/components/ui/RelatedConstellation.tsx` (`{nodeId}`; `useGraph`→`relatedTo`; `null` when empty; up
    to 6 ghost `Button` rows, each app-chip + title + reason chip, click→`openEntity`) mounted on the Network
    inspector per-entity list beside `<NodeLineage>`; i18n `related.reason.*`; `.related-*` CSS in DS_INFRA
    `window-manager.css`; `RelatedConstellation.test.tsx`. **S3:** mount the SAME component on Timeline + Search
    rows (verbatim). **S4:** `RELATED` guard in `qa-smoke.mjs` on the (headless-drivable) Timeline surface → `5/5`
    (linkedTop·sharedTerm·sharedTag·unrelatedAbsent·oneTapLands) → EPIC-19 CODE-COMPLETE. **Trap:** use `task`/
    `book`/`goal` seed types (note/learning/message get pruned by syncAll); drive Timeline, NOT the fragile
    Network canvas click.

### Standing design-system recipes (carry forward — reusable across any future migration)

- **`ui` primitive migration mapping rule** (EPIC-14): text CTA → `Button`; icon-only → `IconButton`
  (**TS forces `aria-label`**); mutually-exclusive SET with UNIQUE values → `Segmented`
  (`role="radio"`+`aria-checked`, NOT `aria-pressed`); single ON/OFF toggle → `IconButton`/`Button` +
  `aria-pressed`; `<select>` → `Select` (hardcodes `width:100%` — wrap in a fixed-width div to size);
  text `<input>` → `Input` (className lands on the WRAP not the field; not a forwardRef — use
  `id`+`getElementById` for `.focus()`); `<textarea>` → `TextArea`. `Button`/`IconButton` MERGE a
  caller's `style` LAST (look preserved); `IconButton` is always `type="button"` (can't submit a form →
  use a div + Enter-key `onKeyDown`). `checkbox`/`radio`/`file` inputs are audit-EXEMPT (no primitive home).
- **Keyboard-operability recipe (EPIC-15, WCAG 2.1.1):** a clickable non-interactive host (`<div onClick>`)
  needs a keyboard path. Use `src/lib/a11y.ts` `onActivate(fn)` → an `onKeyDown` firing `fn` on Enter/Space
  (with preventDefault+stopPropagation), paired with `role="button"` + `tabIndex={0}` + `aria-label`. For a
  modal/lightbox backdrop whose click closes it: mark the backdrop `role="presentation"` (detector-exempt) and
  move `role="dialog"`/`aria-modal` onto the inner panel (Escape + a real close button give the a11y dismiss).
  `<video>`/`<audio>`/`<canvas>` are NOT detector host tags. `onClick={e => e.stopPropagation()}`-only handlers
  are event-plumbing, EXEMPT.
- **Raw px in inline `.tsx` `style` REGRESSES `offSystemStyle`** (CSS-file values are DS_INFRA-exempt; inline
  `.tsx` values are NOT) — use `var(--text-*)`/`var(--radius-*)`/`var(--space-*)`; omit `borderRadius:0` (raw
  `0`/`0px` both count as a radius violation → keep the primitive's `var(--radius-md)`).
- **`ColorPalette.tsx` is `DS_INFRA` (metrics.mjs `DS_INFRA` set), audit-EXEMPT** — never migrate it.

### Conformance state (all six axes, this run, green main)

- **Five product axes at 0 AND LOCKED in `--assert-zero`:** `tokenViolations` 0 · `offSystemUtilities` 0 ·
  `offSystemStyle` 0 (r0/t0/m0) · `offShellControls` 0 (b0/i0/s0/t0) · `keyboardA11y` 0. The design-system
  trilogy (colour EPIC-5 · tokens EPIC-11 · shell EPIC-14) + keyboard operability (EPIC-15) are enforced;
  a regression on any fails CI. **Do NOT reintroduce a bare `<button>`/`<input>`/`<select>`/`<textarea>` in
  app code, a raw hex/rgb/px, or a mouse-only `onClick` on a host — the gate bites.**
- **Sixth axis `docMass` (EPIC-16): 0 AND LOCKED in `--assert-zero` (S3; QA-reconfirmed green main `19e0454`).**
  Value = doc lines over budget; `docMass 3269 → 0`. The gate bites — any edit pushing CONTEXT >400 or EPICS >500 fails CI.

### ✅ Retired epics — DONE index (full bodies in git; metric each moved)

- **EPIC-18 · The cockpit reaches beyond the home (shell-level attention)** — DONE 2026-07-14, `SHELL-ATTENTION
  0 → 4/4` LOCKED (S1–S2). `attentionSummary` (`attention.ts`) → a live `.empire-homebar-badge.is-attention` on
  the HomeBar Home `IconButton` (`Desktop.tsx`), shown only `!atHome`, urgent-tinted + spring-pulse on a new top
  item (`shouldPulseAttention`). `SHELL-ATTENTION` guard in `qa-smoke.mjs`. `8a0c6c9` · `aa9acf7`.
- **EPIC-17 · The Bridge becomes the organism's cockpit (legible→proactive)** — DONE 2026-07-14, `HOME-ATTENTION
  0 → 6/6` LOCKED (S1–S4). Pure `computeAttention` spine (`attention.ts`) + Bridge "Needs you" ranked feed with
  inline quick-resolve (`AttentionResolve`); `HOME-ATTENTION` guard in `qa-smoke.mjs`. `69fd479`.
- **EPIC-16 · Doc-mass conformance** — DONE 2026-07-13, `docMass 3269 → 0` LOCKED (S1–S3; `scanDocMass` in
  `scripts/docMassAudit.mjs` budgets CONTEXT ≤400 / EPICS ≤500; the sixth gated axis). `1cc462e` · `19e0454`.
- **EPIC-15 · Keyboard operability (WCAG 2.1.1)** — DONE 2026-07-13, `keyboardA11y 24 → 0` LOCKED
  (S1 detector+baseline `79c9272`; S2+S3+S4 sweep+lock `61c4f7b`). QA-confirmed on green main.
- **EPIC-14 · Shell conformance** — DONE 2026-07-13, `offShellControls 307/341 → 0` LOCKED (S1–S12; every bare
  control onto the `ui` primitive layer; the shell-conformance invariant lives in `src/components/ui/index.tsx`).
- **EPIC-13 · Mail + Crypto join the organism** — DONE 2026-07-10, `GRAPH-LEGIBLE 1/1 → 3/3` + `INBOUND-LANDS
  3/3 → 4/4`. Mail persists drafts (`empire-mail-drafts`, `mail/lib/draftStore.ts`) + is a handoff receiver;
  both emit via ⚡ `NodeActions`.
- **EPIC-12 · Intent integrity** — DONE 2026-07-09, `INTENT-ROUNDTRIP 0/2 → 2/2`. `make-note-from` +
  `add-to-learning` write REAL store entities (via `useStore` in `sync.ts`) that survive `reconcile()`; a raw
  `g.addNode` phantom is pruned. **TRAP (still live): a mirrored node gets a FRESH graph id — the store item id
  lands in `data.sourceId`; a guard asserting lineage must use the MIRROR node id, never the store id.**
- **EPIC-1..11 · interconnection + PWA + design-system trilogy** — all DONE (organism graph/bus/intents,
  provenance, global search, Timeline, offline+installable PWA, colour+token+style conformance). Seams below.

---
## 🧩 SOLVER LANDED (2026-07-04) — user-directed "AI Problem Solver"; do NOT refactor away

Cakra is now the **Problem Solver**: a Solver tab in CakraShell (`src/apps/cakra/solver/`) where problems
(world catalog + user-added + ⚡ `make-problem` intent + routine discoveries) decompose into trees and get
critiqued action plans, plus an auto-queue that works the backlog by severity×tractability under a daily
AI-call budget (default 100, user-tunable, hard stop button).

- **Seams:** `solver/store.ts` (zustand `empire-solver`, source of truth; self-mirrors `problem`/`solution`
  nodes via `mirrorCollection` — do NOT add central sync.ts syncers for these types, same rule as Calendar) ·
  `solver/engine.ts` (4 pure stages — analyze/decompose/solve/critique — over an injected chatFn → lib/ai
  `chat()`, JSON-extract + one strict retry) · `solver/queue.ts` (`nextStageFor`/`pickNext`/`rollupIds`
  unit-pinned; 2 engine strikes → `blocked`; transport failure stops the queue) · `solver/solverIntents.ts`
  (registered from `main.tsx`) · registry id `solver` = hidden alias → `ai-chat` tab `solver` (mapped in
  appComponents + the qa-smoke list; route-parity green both directions).
- **World feed:** `public/solver/feed.json` is OWNED by the **World-Solver routine** (routine #8, daily) —
  it web-researches cited briefs for catalog problems and appends fresh `discovery` problems, then commits
  here; the app fetches it read-only (`solver/feed.ts`, 404-safe). Builder/Strategist: do not hand-edit or
  delete `feed.json`; extending the Solver UI/graph wiring in future epics is fair game.
- **Intentional metric deltas (NOT regressions):** apps 28 → 29 (the alias id), vitest +~20 solver cases
  (3 new test files), small bundle bump — the eager slice is only store+catalog+intents; engine/queue/UI
  live in the lazy solver chunk.

## 🧭 Codebase seams (where the important things live)

- **Organism core (B-backbone / A-bus / C-intents):**
  - `src/lib/eventBus.ts` — typed pub/sub. Carries `NODE_*` / `INTENT_*` and the
    generic **`HANDOFF { fromId; toId; label? }`** cross-app transfer event.
  - `src/lib/core/graph.ts` — the shared world-state graph (`CoreNode`, Zustand+persist
    store `empire-core-graph`; `addNode/updateNode/deleteNode/link/unlink`, selectors
    `nodesOfType/neighbors/useNodesOfType`). Unit-tested.
  - **`src/lib/core/provenance.ts` (EPIC-6 S1, 2026-07-02):** the organism's *durable memory of movement*. Zustand+
    persist store `useProvenance` (key `empire-provenance`, `{edges: ProvEdge[]}` + `record`/`clear`); `ProvEdge =
    {fromApp,toApp,label?,at}`. Pure exported helpers (unit-tested, no store/React): `recordEdges(edges,edge,now)`
    (coalesce a same-pair edge within `DEDUP_MS=1500` → bump `at`+label, else append+cap to `MAX_EDGES=500`),
    `edgesInto`/`edgesFrom` (newest-first filters), `lineageOf(edges,appId,maxDepth=6)` (newest-inbound walk backwards,
    cycle-guarded). **EPIC-6 S2 added panel-selection helpers:** `ProvNeighbor{app,at,label?}`;
    `fedBy(edges,appId)`/`feeds(edges,appId)` (de-duped `ProvNeighbor[]`, first-wins over the newest-first list =
    newest edge per app) + `recentEdges(edges,n=12)` (`slice(-n).reverse()`) — the pure selection behind the Network
    inspector Fed-by/Feeds + the durable Memory panel. `startProvenanceTracking()` (module `started` guard, mirror `focus.ts`) subscribes `onAny` and
    records **exactly `flowForEvent(e)`** — the ONE honest edge source, never an invented link. Started once at
    `main.tsx:20`. **This is the spine for S2 (Network memory) / S3 (durable per-entity source) / S4 (Reader island).**
  - `src/lib/core/intents.ts` — `registerIntent/intentsFor/runIntent`. Graph-mutating
    core intents (`make-task`, `make-note-from`, `add-to-learning`) are registered in
    `src/lib/core/sync.ts` (they need `useGraph`), not here.
  - `src/lib/core/sync.ts` — `startCoreSync()` (called once in `main.tsx`); `mirrorCollection()`.
    **⚠️ `mirrorCollection` PRUNES** (`reconcile` deletes any `<type>` node whose `sourceId` isn't in the batch).
    An app surfacing a *window* onto a larger space (Files = one directory at a time) must NOT hand it only the
    current window or it deletes everything else — accumulate the union first. See `src/apps/files/filesGraph.ts`
    (`accumulateFiles` builds a session-union `Map<path,…>`; `Files.tsx` mirrors `[...union.values()]`). DataCenter
    is fine — it already mirrors all tables at once.
  - **`src/lib/core/search.ts` (EPIC-8 S1, 2026-07-02):** the pure global-search spine over the Core graph. `searchNodes(nodes,query,limit=50)`
    → ranked `SearchHit[]` (`{node,score,field,snippet}`); `scoreNode(node,terms)` (AND semantics — every term must
    match title/type/body or the node is dropped; title-prefix 12≫word-boundary 9≫substring 6≫type 4/2≫body 2, +20/+10
    whole-query title bonus, recency tie-break); `nodeBodyText` (shallow string/number/bool `data` values, lowercased);
    `queryTerms`; `groupHitsByApp` → `AppHitGroup[]` ordered by best hit. No React/store — `src/apps/search/Search.tsx`
    feeds it `useGraph` nodes. `search.test.ts` (13). **Add filters/richer fields HERE, not in the component.**
    **Corpus caveat:** only what's mirrored into `empire-core-graph` is searchable; central-sync types (note/learning/
    message) reflect their real stores (safe in prod, PRUNED to empty in a bare QA seed — see the sync.ts prune trap).
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
  - **Emit-onward menu (S6b, 2026-06-23):** `src/components/ui/SendResultMenu.tsx` —
    `<SendResultMenu source text title? actions? label?/>`, the *sender* mirror of the receiver rail.
    A glass `gp` dropdown (styled like `NodeActions`) whose items run
    `CROSS_APP_ACTIONS[key].execute({text,title,source})` (that executor already `handoff(...)`s → an
    arc lights). `ACTION_TARGET` maps each key→target app id and filters out the source (no
    self-handoff); `DEFAULT_ACTIONS` = Notes/PromptGen/AIChat/TokenCounter/Editor **+ Calendar/Goals/
    Messages (S6c)**. Disabled when `!text.trim()`. **Reuse for any future sink** — pass `source` +
    live text. Hover tints MUST stay
    `color-mix(in srgb, var(--signal) N%, transparent)` (raw `rgba(...)` regresses token-violations
    even inside JS strings — see Tried & rejected). Wired into Editor / TokenCounter / AIChat.
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
  **EPIC-6 S2 (2026-07-02):** the inspector gained a durable `Provenance · all-time` section (Fed by/Feeds via
  `fedBy`/`feeds`; `provRow`/`rowStyle` live inside the inspector IIFE), and the bottom-left ticker was wrapped in a
  column container with a persistent **Memory panel** above it (`recentEdges(provEdges,12)`, scrollable, reads the
  store so it survives reload). `provEdges = useProvenance(s => s.edges)` is a reactive sub next to `graphNodes`.
  - **`src/apps/network/adjacency.ts`** — pure seam: `appAdjacency(nodes): Record<app,{out,in}>`
    (owner→owner from node links; drops self-edges, owners not in registry, dangling links)
    and `entitiesByApp(nodes): Record<app, CoreNode[]>` (grouped, newest first). Unit-tested
    in `adjacency.test.ts`.
  - **`src/apps/network/nodeColors.ts`** — the ONE source of node-type colour:
    `TYPE_RGB` (triplets), `typeRgb(type)` (hashed fallback), and **`rgbCss(triplet, alpha?)`**
    which builds a CSS colour from a constant so reusing canonical triplets costs **zero**
    token-metric violations. Canvas, legend and inspector all import from here so they can't drift.
    **EPIC-2 S4:** also exports the canvas accent triplets `SIGNAL`/`ION`/`PLASMA`/`VOID` (bare `"r,g,b"`);
    `Network.tsx` now assembles **every** canvas fill via `rgbCss(...)` (0 literal `rgba(`/hex). `nodeColors.test.ts`
    pins these.
- **Registry / shell:** `src/lib/registry.ts` (**25 apps** post-redesign — `ai-agent`+`hermes-cc` deleted,
  `ai-chat`→**Cakra**), `src/lib/appComponents.tsx` (route→component map), `src/components/Desktop.tsx` (shell).
  **App identity icons** now resolve from the bespoke alien SVG set `src/design-system/icons/` via `getAppIcon()`.
  **Split 2026-06-30 (react-refresh fix):** the glyph *components* live in `icons/glyphs.tsx` (pure component module),
  the `alienIcons` map + `getAppIcon` resolver live in the `icons/index.ts` barrel (no component export). Import path
  unchanged. **Trap:** never add a non-component export (object/function) to `glyphs.tsx` or a component export to
  `index.ts` — `react-refresh/only-export-components` (`error`, now CI-gated) fires when a file mixes the two. Same
  split precedent as `network/nodeColors.ts`.
- **Design system:** `src/design-system/colors_and_type.css` (canonical **JondriDev Earth-from-Space**
  palette — re-skinned 2026-06-28, was XENO; the `:root`/theme CSS custom props), `src/design-system.css`
  (legacy-token *bridge*, re-valued onto the DS tokens — edit here to restyle all apps),
  `src/window-manager.css`, `src/index.css`.
  - **`src/design-system/tokens.ts` (EPIC-2 S1, 2026-06-23):** the TS-side single source of palette truth,
    mirroring the CSS custom props. **`cssVar('signal')`→`'var(--signal)'`** (themeable, preferred) and
    **`tint('signal',12)`→`'color-mix(in srgb, var(--signal) 12%, transparent)'`** (translucent tint with NO
    raw `rgba(` → no metric violation; rounds+clamps pct). `PALETTE` holds the raw hex only for JS consumers
    that can't resolve a CSS var. **This is the rail for the EPIC-2 sweep** — import these into any app file
    and replace hex/rgba inline styles. Token names: signal/aurora/plasma/ion/ember/xenon/void/abyss,
    text/text2/text3, c-success/c-warn/c-danger/c-info. (Distinct from `network/nodeColors.ts`'s `rgbCss`,
    which builds colours from constant *triplets* for the canvas.)
    - **`CATEGORICAL: string[]` (EPIC-2 S6, 2026-06-28):** the canonical "N-distinct-series" rail — 8 distinct-hex
      `var(--…)` accents (ion/signal/ember/plasma/aurora/c-warn/c-danger/xenon). Index `CATEGORICAL[i % len]` for any
      decorative categorical colour (chart series, kanban tags, form field-types). Use this instead of a hardcoded hex
      array; reserve `DS_INFRA` exemptions for genuine brand/content identity data. Tested in `tokens.test.ts`.
- **AI routing:** `src/lib/ai.ts` → `src/lib/apiBase.ts` (`aiApiUrl()`); live site routes
  Cakra to the Supabase proxy, dev stays same-origin.
- **Durable media store (EPIC-3 S2, 2026-06-28):** `src/lib/mediaStore.ts` — the rail for any app that
  holds user-uploaded `Blob`s that must survive a reload. **IDB glue:** `putMedia(id,blob)→bool`,
  `getMedia(id)→Blob|null`, `deleteMedia(id)`, `allMediaIds()`, `loadMediaUrls(ids)→Map<id,url>` (DB
  `empire-media`, store `blobs`; every op is a tolerant no-op when IndexedDB is absent — jsdom/private mode).
  **Pure transforms (the tested part — `mediaStore.test.ts`, 11 cases):** `toStorableMeta(items)` strips the
  volatile `src` + drops `ephemeral` (what you write to localStorage), `rehydrateMedia(meta, urlForId)` mints
  fresh URLs and **drops ghosts** (the bug fix), `shouldPersistBlob(size)` enforces the 75 MB cap. Consumed by
  `Music.tsx` + `Video.tsx` + **`Photos.tsx` (EPIC-3 S3, 2026-06-29)**. jsdom has no IDB → keep the glue
  thin/untested, test only the transforms. **Reuse this exact rail for any future blob-holding app** —
  `Photos.tsx` is the most recent verbatim port (`url`→`src`, `hydratedRef` gate, ephemeral "session" chip).

- **PWA offline guard + precache audit (EPIC-4 S1, 2026-06-29):**
  - `vite.config.ts:18-90` — the **`vite-plugin-pwa`** (`VitePWA`) config: Workbox `generateSW`,
    `globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,json}']` + `maximumFileSizeToCacheInBytes: 5 MB`
    (this is why the precache has no gap — it catches every chunk under 5 MB, incl. Maps' 160 KB). `manifest`
    uses relative `start_url:'.'`/`scope:'.'`; `navigateFallback: base + 'index.html'`. The build prints
    `precache N entries`.
  - `scripts/precacheAudit.mjs` — **pure** seam: `extractPrecacheUrls(swText)` (regex-pulls the inlined
    `{url,revision}` manifest out of `dist/sw.js`) + `auditPrecache(swText, assetFileNames)` →
    `{precacheCount, jsChunks, cssChunks, missing[], ok}`. `precacheCount` = raw manifest entries (matches the
    build log's "N entries"; ~8 icons appear twice via `includeAssets` + `globPatterns`); membership check
    dedupes. Unit-tested in `scripts/precacheAudit.test.mjs` (6 cases).
  - `scripts/qa-offline.mjs` — the **cold-offline boot guard**. Self-contained: own `node:http` static server
    for `dist/` (SPA fallback → index.html; `Service-Worker-Allowed:/` on sw.js) on port 3101 + own browser
    (reuses the `launchBrowser()` Chromium recipe). Warm-loads `/` → waits for the SW to be `active` + controlling
    → **`context.setOffline(true)`** → asserts `/` (needs `.empire-desktop`) + 4 lazy routes render from precache.
    Writes `docs/screenshots/latest/OFFLINE.md` + `/tmp/qa-offline.json`; exits non-zero on failure. **Run
    standalone** `node scripts/qa-offline.mjs` (needs a fresh `npm run build` + the playwright symlink). Wired into
    `qa-smoke.mjs` (spawned after smoke, non-fatal, folded into REPORT.md's "Offline-boot guard" section).
  - **vitest `include` now also matches `scripts/**/*.{test,spec}.mjs`** (`vitest.config.ts:10`) so QA-tooling
    logic can be unit-pinned alongside the app tests. (metrics.mjs still counts only `src/` tests — `scripts/`
    tests don't move the test-cases metric.)

- **PWA base-path / install-flow audit (EPIC-4 S3, 2026-06-29):**
  - `vite.config.ts:11` — `const base = process.env.EMPIRE_BASE || '/'`. Manifest is **base-agnostic**:
    `start_url:'.'`/`scope:'.'` (relative → resolve vs the manifest's own URL, adapt to any base) and now
    **`id:'empire'`** (was `'/'`; `id` resolves vs `start_url`'s ORIGIN with its path ignored — per MDN — so a
    root id collides on a shared origin like `github.io`; a relative path segment gives one stable
    `<origin>/empire` identity for every deploy base). Workbox `navigateFallback: base + 'index.html'`.
  - **Installability auditor (EPIC-4 S4, 2026-06-29):** `auditInstallability(manifest)` + `maxIconSize(sizes)` in
    `scripts/pwaBaseAudit.mjs` — PURE manifest-only check of the browser install criteria (name+short_name; a ≥192
    AND a ≥512 `any`-purpose icon; a `maskable` icon; standalone-ish `display` incl. via `display_override`;
    `start_url`; `background_color`+`theme_color`). Returns `{criteria{}, missing[], ok}`. `maxIconSize('any')` →
    `Infinity` (scalable SVG); a missing `purpose` defaults to `'any'`. **`auditPwaBase` now also runs it** (adds a
    `not installable — missing: …` issue) and `check-pwa-base.mjs` prints it + tables it in PWA-BASE.md. Tested by
    the +12 cases in `pwaBaseAudit.test.mjs`. **The fixture there (`FULL_MANIFEST`) mirrors the real `vite.config.ts`
    manifest** — if you change the manifest's icons/colors/display, update that fixture too.
  - `scripts/pwaBaseAudit.mjs` — **pure** seam (text + base in → report out, no fs/browser):
    `auditPwaBase({html, swText, registerSwText, manifestText, base})` aggregates `auditHtmlBase` (every local
    `<script src>`/`<link href>` prefixed with base + manifest linked), `auditSwBase` (Workbox inlines
    `createHandlerBoundToURL("<base>index.html")` — regex-pull + compare), `auditRegisterSw`
    (`register('<base>sw.js',{scope:'<base>'})`), `auditManifest` (start_url/scope relative + id a stable
    non-root same-origin path). Helpers `extractHtmlAssetUrls`, `normalizeBase`. Unit-tested in
    `scripts/pwaBaseAudit.test.mjs` (17 cases).
  - `scripts/check-pwa-base.mjs` — the **runner**. `spawnSync('npx', ['vite','build','--base=<BASE>',
    '--outDir=dist-pwa-base-check','--emptyOutDir'])` (BASE = `PWA_CHECK_BASE` || `/empire/`), reads the emitted
    `index.html`/`sw.js`/`registerSW.js`/`manifest.webmanifest`, runs `auditPwaBase`, writes
    `docs/screenshots/latest/PWA-BASE.md` + `/tmp/pwa-base.json`, **rm's the throwaway outDir** (gitignored), exits
    non-zero on any mismatch. **Run standalone** `node scripts/check-pwa-base.mjs` (does its own build — needs no
    pre-existing dist, never touches the real `dist/`). NOT wired into `qa-smoke.mjs` (it does a full vite build;
    avoid doubling smoke's build time) — QA can run it on demand; the pure-helper tests give the ongoing guard.

## ⚠️ Invariants & traps (do NOT relearn these the hard way)

- **Offline PWA testing — use `context.setOffline(true)`, NOT `page.route('**',abort)`:** `setOffline` fails real
  network egress while Cache Storage still serves, so a precached chunk loads and a non-precached one falls through
  to a dead network (the render breaks) — the faithful "cold boot" signal. `page.route` interception is murkier with
  a controlling service worker (SW-served responses never hit the route). Also: **warm-load + wait for the SW to be
  `active` AND `navigator.serviceWorker.controller` set before going offline** — the precache only exists once the
  SW's install (which runs `precacheAndRoute`) completes; cut the network too early and you test an empty cache.

- **Blank-dark trap:** a `*/` sequence *inside* a CSS doc-comment in `design-system.css`
  (e.g. `--text*/`) closes the comment early → brace mismatch nests every `.empire-*`
  rule under `@media(max-width:640px){.hide-sm…}` → desktop renders unstyled **despite a
  green build**. Always **space out the slashes** in comments. Verify without a browser:
  `grep -o '/\*'` count == `grep -o '\*/'` count, and built `dist/assets/index-*.css` has a
  **top-level `.empire-desktop{position:fixed}`** with **zero `.hide-sm .empire-desktop`**.
- **Blob-URL persistence trap (Music/Video — FIXED EPIC-3 S2, reuse the rail for Photos S3):**
  `URL.createObjectURL(file)` returns a *session-scoped* URL that is **invalid after a reload** — never
  round-trip a blob URL through localStorage and expect it to play. **The rail (`src/lib/mediaStore.ts`):**
  store the real `Blob` in IndexedDB (`putMedia(id,blob)`), persist **metadata only** via `toStorableMeta(items)`
  (strips `src` + drops `ephemeral`), and on mount `loadMediaUrls(ids)` → `rehydrateMedia(meta, urlForId)` to
  mint fresh object URLs and **drop any item whose blob is gone** (no ghost rows). **Gate the persist effect
  behind a `hydratedRef`** so the initial empty render doesn't clobber the saved library before the async
  rehydrate finishes (race — both Music & Video do this). Oversized blobs (`!shouldPersistBlob(size)`) stay
  session-only (`ephemeral`, excluded from localStorage). Photos S3 should reuse this exact rail.
- **Clock persists via a pure logic module (EPIC-3 S1):** `src/apps/clock/clockLogic.ts` owns the maths +
  (de)serialization (`deserializeClockState` is tolerant — bad JSON / null / partial / corrupt all fall
  back field-by-field, so adding a field never wipes saved alarms). The component lazy-loads from
  `empire-clock-state` via a `useMemo(()=>deserialize(safeGet(KEY)),[])` initializer (no load-effect flash)
  and persists in a `[alarms, worldClocks, is24Hour]` effect. Test the *pure module*, not the component
  (localStorage is an inert `vi.fn()` mock in `src/test/setup.ts`). Pattern to reuse for any instrument that
  needs to survive a reload.
- **Calendar owns its own storage:** events live in `empire-calendar-events` (NOT the central
  store) and self-mirror via `mirrorCollection()` in a `[events]` effect. **Never add an
  `event` syncer to the central list** — it would delete Calendar's nodes.
- **Alpha-append trap (EPIC-2 sweep):** the idiom `` background: `${color}18` `` (append a 2-hex alpha
  to a colour) **silently breaks** when you swap `color` from a hex to a CSS var — `var(--ion)18` is
  invalid CSS and renders nothing. When de-hexing a file that uses this pattern, convert those sites to
  `` `color-mix(in srgb, ${color} N%, transparent)` `` (0x18≈9%, 0x14≈8%, 0x88≈53%). Leave `${app.color}NN`
  alone while `registry.ts` still supplies a real hex there (valid, and not a violation in *that* file).
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
- **Accessible-name metric (WCAG 4.1.2) → rejected as an epic (2026-07-13):** already-closed — all 125 `IconButton`s
  carry `aria-label` (TS forces it), `<img>` alt is 4/4. A broader "icon-only `<Button>` w/o text child + no
  aria-label" detector over-counts badly (most flagged Buttons have DYNAMIC text children a static scan can't see) —
  too noisy to be honest. Chose the ratified `docMass` instead.

## ✅ QA state (latest — 2026-07-14, EPIC-18 CODE-COMPLETE independent cloud-confirm, green `aa9acf7`)

- All six axes 0 & LOCKED (`--assert-zero` exit 0). Auto-metrics: apps 31, test cases 497 (+4 vs `b6681da`, EPIC-18 S2 pulse cases), files 67, bundle gz 734.1. build🟢 vitest🟢. **No runtime bug.** Independent QA re-ran full smoke on `aa9acf7` (EPIC-18 S2 landed since last QA): all 15 guards green — `SHELL-ATTENTION 4/4` (target HOLDS), `HOME-ATTENTION 6/6`, 32/32 routes clean, PRECACHE 89 no-gap, OFFLINE 5/5. **EPIC-18 CODE-COMPLETE (S1+S2) → Strategist: retire to DONE + promote next epic.** Env-only console noise (NOT bugs): weather/maps tiles + files/mail 401 — all render clean.
