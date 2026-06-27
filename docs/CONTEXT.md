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

- **Active epic:** **EPIC-2 — Design-system conformance → zero token violations** (promoted
  2026-06-23). EPIC-1 (Organism Completeness) is **DONE & QA-confirmed**: both-ways hit **9/9
  entity-apps-with-inbound**, S6c live-confirmed (see Last QA confirmation below).
- **EPIC-2 S1 DONE (2026-06-23):** built `src/design-system/tokens.ts` (the TS palette seam:
  `PALETTE` + `cssVar(name)→'var(--name)'` + `tint(name,pct)→'color-mix(in srgb, var(--name) pct%, transparent)'`,
  rounds+clamps; `tokens.test.ts` 4 cases) and swept the **Hermes cluster** to zero:
  `HermesCommandCenter.tsx` 64→0 + `HermesAgentBar.tsx` 49→0. **token-violations 501 → 388 (−113).**
- **EPIC-2 S2 DONE (this run, 2026-06-27):** swept the next cluster to zero with the `cssVar`/`tint` rails —
  `ai-agent/components/SettingsPanel.tsx` 38→0, `apps/calculator/Calculator.tsx` 38→0,
  `artifacts/artifacts/MarkdownStudio.tsx` 29→0. **token-violations 388 → 283 (−105).** Mappings used: amber/orange
  (`#f59e0b`/`#f97316`/`#fb923c`)→`ember`, slate-dark panel (`#111827`)→`cssVar('abyss')`, slate border
  (`#1e2d4a`)→`tint('xenon',10)` (button fill→`tint('ion',22)`), green→`c-success`, red→`c-danger`, cyan→`signal`,
  text greys (`#f1f5f9`/`#94a3b8`/`#475569`)→`text`/`text2`/`text3`, white-glass→`tint('xenon',N)`,
  black-shadow→`tint('void',N)`. **Gradient/darken idiom:** `color-mix(in srgb, var(--ember) 70%, var(--void))` to
  darken and `color-mix(in srgb, var(--ember) 80%, var(--text))` to lighten — works inside both inline styles AND
  the `<style>{`…`}</style>` template literal (interpolate `${cssVar(...)}`/`${tint(...)}`). build🟢 vitest 107🟢
  eslint clean.
- **Next stage (EPIC-2 S3):** continue the sweep with the **next cluster**, same `cssVar`/`tint` rails:
  `lib/registry.ts` (27 — the per-app `color:'#…'` accents; these are the registry accent hexes, see the
  alpha-append trap note before touching `${app.color}NN` sites elsewhere), `components/ui/index.tsx` (26),
  `apps/network/Network.tsx` (24 — but **canvas 2D ctx needs raw colour strings**; use `nodeColors.ts`'s `rgbCss`
  for those, only DOM styles convert to `cssVar`/`tint`), then `artifacts/artifacts/ColorPalette.tsx` (23 — *likely
  legitimately exempt*: it's a colour-swatch demo whose hex literals ARE the content; consider whether to skip or
  move its swatch list to a const the metric still counts — decide before sweeping). **Target 283 → ~210.**
  **Epic target: design-token violations 501 → 0.** ONE cluster per stage, build+vitest green each time.
  **registry.ts caveat:** `registry.ts` feeds `${app.color}NN` alpha-append sites across the app — if you move the
  accents to CSS vars, audit every `${app.color}` consumer for the alpha-append trap (see Invariants) in the SAME
  stage or you'll silently blank those tints.
- **S6c done (this run, 2026-06-23):** all 9 entity-owning apps that honestly take input are now
  both-ways. Added `SEND_TO_CALENDAR` / `SEND_TO_GOALS` / `SEND_TO_MESSAGES` to
  `src/lib/appActions.ts` (each writes `empire-<x>-clipboard` `{text,title?,from}`, `handoff(...)`s,
  `window.open('/app/<x>','_self')`). Receivers wired with the S1 rail:
  - **Calendar** (`Calendar.tsx`): inbound opens the **New Event** modal prefilled (title = payload
    title or first line; description = text if a title was given; date = today). **Trap respected** —
    wired into Calendar's OWN create flow; NO central `event` syncer (that would delete its
    self-mirrored `empire-calendar-events` nodes).
  - **Goals** (`Goals.tsx`): inbound prefills the always-visible **New Goal** form (title + description).
  - **Messages** (`Messages.tsx`): inbound prefills the composer **draft** (chip above the textarea).
  Each renders `<ProvenanceChip from={inbound.source} onDismiss={inbound.dismiss}/>`. All three added
  to `SendResultMenu`'s `ACTION_TARGET` + `DEFAULT_ACTIONS` so the loop is UI-reachable (and the apps
  self-filter so they never offer to send to themselves). `appActions.test.ts` HANDOFF `it.each` cases
  extended +3. **both-ways 6/9 → 9/9.** build🟢 vitest🟢 (103) eslint clean; token-violations 501 (±0).
  *Cloud limit:* the source→target Network arc needs a seeded graph + cross-page nav, not screenshottable.
- **S6b done:** shared `src/components/ui/SendResultMenu.tsx` — glass `gp` dropdown modeled on
  `NodeActions` (roving-focus kbd nav; disabled on empty text; `ACTION_TARGET` map drops any action
  whose target === source). Wired into Editor / TokenCounter / AIChat. Each item runs an existing
  `CROSS_APP_ACTIONS[key].execute({text,title,source})` → that executor already `handoff(...)`s. **Token
  trap avoided:** hover tints use `color-mix(in srgb, var(--signal) N%, transparent)` — NOT raw
  `rgba(...)`, which `scripts/metrics.mjs` greps as a violation even in JS strings. **S6a done:**
  `ProvenanceChip` also renders for Notes cards + Learning items (`LearningItem.from?:string`).

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
- **Design system:** `src/design-system/colors_and_type.css` (canonical XENO palette — the `:root`/theme
  CSS custom props), `src/design-system.css` (legacy-token *bridge* — edit here to restyle all apps),
  `src/window-manager.css`, `src/index.css`.
  - **`src/design-system/tokens.ts` (EPIC-2 S1, 2026-06-23):** the TS-side single source of palette truth,
    mirroring the CSS custom props. **`cssVar('signal')`→`'var(--signal)'`** (themeable, preferred) and
    **`tint('signal',12)`→`'color-mix(in srgb, var(--signal) 12%, transparent)'`** (translucent tint with NO
    raw `rgba(` → no metric violation; rounds+clamps pct). `PALETTE` holds the raw hex only for JS consumers
    that can't resolve a CSS var. **This is the rail for the EPIC-2 sweep** — import these into any app file
    and replace hex/rgba inline styles. Token names: signal/aurora/plasma/ion/ember/xenon/void/abyss,
    text/text2/text3, c-success/c-warn/c-danger/c-info. (Distinct from `network/nodeColors.ts`'s `rgbCss`,
    which builds colours from constant *triplets* for the canvas.)
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

## 📊 Last QA confirmation (2026-06-27, post-EPIC-2-S1 green main `386ff36` — token-violations 501→388)

- **Routes rendering clean: 27/27 ✅** (28/28 incl. desktop). SHELL-IS-STYLED ✅ (top-level
  `.empire-desktop{…position:fixed…}`, 0 `.hide-sm .empire-desktop`) + REGISTRY-COVERAGE ✅ (all 27 registry
  apps in the smoke list) + INBOUND-LANDS **3/3 ✅** (calendar←editor, goals←notes, messages←ai-chat each
  show "Received from …" chip + prefilled control off the live render). vitest **107/107 🟢** (15 files).
  **No runtime bugs found.**
- **Apps fully wired BOTH-ways: 9/9 entity-apps-with-inbound — ✅ EPIC-1 TARGET (held, EPIC-1 DONE).**
  Both-ways: `prompt-generator`, notes, learning-tracker, editor, token-counter, ai-chat, calendar, goals,
  messages. Intentionally emit-only (by design): files, photos, datacenter + tool apps via `NodeActions`.
  Re-verified live this run by the smoke harness's INBOUND-LANDS guard (3/3 receivers chip+prefill).
- **Epic-acceptance: EPIC-2 S1 CONFIRMED MOVED** — the ACTIVE epic's target metric is *Design-token
  violations* (501 → 0). S1 (palette seam `tokens.ts` + Hermes cluster de-hex) claimed **501 → 388 (−113)**;
  `node scripts/metrics.mjs` this run reports **388** → confirmed, no contradiction. Top remaining offenders
  (the EPIC-2 **S2** targets, still un-swept): `ai-agent/components/SettingsPanel.tsx` (38),
  `apps/calculator/Calculator.tsx` (38), `artifacts/artifacts/MarkdownStudio.tsx` (29), then
  `lib/registry.ts` (27), `components/ui/index.tsx` (26). *Visual recolor (Tailwind→XENO) is intentional
  but not cloud-verifiable headless — the metric drop is the proof.*
- **Auto metrics vs post-S6c (last QA snapshot):** EPIC-2 S1 (commit `386ff36`) moved token-violations
  **501→388 (−113)**, vitest 103→107 (+4, `tokens.test.ts`), test files 14→15 (+1), static count 96→100,
  bundle gz 243.5→243.6 (+0.1). This QA run added no product code → auto-metrics ±0 vs the S1 builder snapshot.
- **Stale per-stage screenshots pruned:** removed 8 superseded EPIC-1 confirmation PNGs from
  `docs/screenshots/latest/` (`s6c-inbound-*`, `*-provenance`, `editor-send-menu`, `inbox-populated`,
  `palette`) — the INBOUND-LANDS guard now produces fresh emit↔receive proof each run, so `latest/` holds
  only the current `desktop.png` + `app-<id>.png` set + `REPORT.md`.
- **Env-expected net noise (not bugs):** files `/api/files?path=/storage/emulated/0`→500 (Android-only path),
  datacenter `/api/dc/tables`→401 (authed API, no headless session).
- QA harness note: project has **no `playwright` dep**; it's global at `/opt/node22/lib/node_modules`.
  The run symlinks it into `node_modules/` (env-only, not committed). Pre-installed Chromium at
  `/opt/pw-browsers/chromium-1194`. `scripts/qa-smoke.mjs` `launchBrowser()` auto-globs the version dir.

## 📌 Open follow-ups discovered (promote into EPICS.md stages)

- DataCenter `dataset` nodes only carry a row count for the *active* table.
- Files `file` nodes only reflect the *current* directory (reconcile drops others on navigate).
- Photos `photo` nodes carry no thumbnail (object URLs are revoked on delete).
