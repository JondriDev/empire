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
- **Next stage:** **S2 · Every app emits on transfer.** (S1 shipped 2026-06-22.)
- **Exact shape for S2:** Audit `src/lib/appActions.ts` `CROSS_APP_ACTIONS`. The
  navigating transfers already call `handoff(...)` (SEND_TO_EDITOR /
  _TOKEN_COUNTER / _PROMPT_GEN / _AI_CHAT / ASK_HERMES_TO_ANALYZE). **The two
  in-place transfers do NOT emit `HANDOFF`:** `SEND_TO_NOTES` (emits
  `NOTE_CREATED`) and `SEND_TO_LEARNING` (emits `LEARNING_LOGGED`) — by an
  earlier deliberate choice (the Network's `flowForEvent` lights their arcs from
  the *typed* events, see `src/apps/network/Network.tsx`). **Decision the next
  run must make first:** either (a) also emit a `HANDOFF{fromId,toId}` from those
  two so the rail is uniform (risk: double-counts the Network ticker row — verify
  `flowForEvent` dedupes, or gate the typed-event arc when a HANDOFF exists), or
  (b) keep typed events and instead make S2's acceptance "every cross-app action
  lights exactly one directed arc" — then assert in a test that each action emits
  *either* a HANDOFF *or* its arc-bearing typed event with `from`. (b) is lower
  risk and matches the shipped design; recommend (b) unless the Strategist wants
  literal HANDOFF everywhere. *Acceptance:* one test per action asserts exactly
  one arc-bearing event with correct `from`/source. Build 🟢 vitest 🟢 eslint clean.

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
  `-ai-clipboard`).
- **The Network app:** `src/apps/network/Network.tsx` — renders CoreNodes as satellites,
  consumes `HANDOFF` for directed app→app arcs (`flowForEvent`).
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

## 📊 Last QA confirmation (2026-06-22, fresh QA run on green main)

- **Routes rendering clean: 26/26 ✅** (27/27 incl. desktop). SHELL-IS-STYLED assertion now lives in
  `scripts/qa-smoke.mjs` and passed (top-level `.empire-desktop{position:fixed}`, 0 `.hide-sm .empire-desktop`).
- **Apps fully wired BOTH-ways: 1/26** — only `prompt-generator` emits AND receives. Emit-only (10):
  artifacts, calendar, datacenter, files, goals, learning-tracker, messages, notes, photos, prompt-generator.
  Receive-only (4): ai-chat, editor, prompt-generator, token-counter. **This near-zero overlap is EPIC-1's gap.**
- **Epic-acceptance:** S1 (inbound provenance) confirmed; S2 (every app emits) not yet shipped → its
  metric has not moved (no contradiction, just pending). Auto metrics flat vs #23 (no integration since).
- QA harness note: project has **no `playwright` dep**; it's global at `/opt/node22/lib/node_modules`.
  The run symlinks it into `node_modules/` (env-only, not committed). Pre-installed Chromium at
  `/opt/pw-browsers/chromium-1194`. `scripts/qa-smoke.mjs` `launchBrowser()` auto-globs the version dir.

## 📌 Open follow-ups discovered (promote into EPICS.md stages)

- DataCenter `dataset` nodes only carry a row count for the *active* table.
- Files `file` nodes only reflect the *current* directory (reconcile drops others on navigate).
- Photos `photo` nodes carry no thumbnail (object URLs are revoked on delete).
