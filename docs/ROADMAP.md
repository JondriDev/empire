# The Empire — Roadmap

> Single prioritized backlog the build/QA routines pull from. Re-ranked every
> strategist run against what shipped and what QA flagged. **Direction, not code.**
>
> **Vision:** one interconnected organism that feels like alien technology —
> 25 apps + a windowed desktop shell, shipped as a complete offline-first PWA
> and then an Android app. Depth and coherence over new surface area.
>
> **Priority bias (high → low):** fix what QA reports broken → interconnection
> (the living graph) → design-system consistency → completing apps → PWA → Android.
>
> Last re-ranked: **2026-06-20** · Main: 🟢 green (build + 21/21 vitest) ·
> QA: 26/26 routes mount, no runtime errors.

---

## NOW — next 3–5 increments (each one PR-sized)

Pulled top-to-bottom. Each is small, concrete, and has an acceptance check.

### 1. Every handoff lights its synapse — emit a `HANDOFF` event from `appActions.ts`
**Priority: INTERCONNECT.** This is the standing "next step" from the last three
build runs. Today the Network mesh only draws a real app→app arc for
`SEND_TO_NOTES` (it relies on the `from-<id>` tag on `NOTE_CREATED`). The other
five cross-app actions in `src/lib/appActions.ts` (`SEND_TO_EDITOR`,
`SEND_TO_TOKEN_COUNTER`, `SEND_TO_PROMPT_GEN`, `SEND_TO_AI_CHAT`,
`ASK_HERMES_TO_ANALYZE`) move data via `sessionStorage` + `window.open` and emit
**nothing** — so the organism can't see them and those synapses stay dark.

- **Why:** the vision is "one living organism," not hub-and-spoke. Real nerve
  traffic already flows between these apps; the mesh just can't observe it. One
  honest event closes the gap with no invented relationships.
- **Do:** add `{ type: 'HANDOFF'; fromId: string; toId: string; kind: string }`
  to `EmpireEvent`; emit it from every `CROSS_APP_ACTIONS` executor right before
  it navigates; broaden `Network.flowForEvent` to consume `HANDOFF` directly
  (keep the existing `NOTE_CREATED`/`from-` path as a fallback). While in
  `appActions.ts`, fix the latent bug in `SEND_TO_NOTES`: `Date.now().toString()`
  is computed twice, so the emitted `noteId` differs from the stored note's id —
  hoist it to one `const id`.
- **Acceptance:** open **The Network**, then from Calculator use "Count Tokens"
  → a **Calculator → Token Counter** arc lights and a ticker row reads
  `● Calculator → Token Counter`. `npm run build` 🟢, `vitest` green, eslint clean
  on touched files. Add one unit test that `HANDOFF` resolves to a `{fromId,toId}`
  edge.

### 2. Close the loop on the receiving side — inbound "From <app>" acknowledgment
**Priority: INTERCONNECT + COMPLETE-APPS.** The four `sessionStorage`-based
receivers (Editor `empire-editor-clipboard`, Token Counter `empire-token-clipboard`,
Prompt Gen `empire-prompt-clipboard`, AI Chat `empire-ai-clipboard`) silently
swallow the payload on mount. The handoff has no visible arrival.

- **Why:** a synapse should fire at *both* ends. Surfacing provenance makes the
  interconnection legible and trustworthy ("this text came from Calculator"),
  and it's the natural pair to NOW #1.
- **Do:** on consuming a `*-clipboard` payload, each receiver shows a small,
  dismissible "From <source>" chip (token-styled, using the source app's registry
  accent) and preloads the value. Verify each receiver actually preloads today;
  fix any that drop the payload.
- **Acceptance:** send text from Calculator → Token Counter; Token Counter opens
  pre-filled with a **From Calculator** chip. Same for Editor / Prompt Gen / AI Chat.

### 3. One palette, one source of truth — JS-importable design tokens
**Priority: DESIGN-SYSTEM CONSISTENCY.** The Network canvas (and any future
`<canvas>` visual) hardcodes `rgba()` literals because a 2D context can't read
CSS custom properties — every routine has flagged this as an accepted divergence.
The XENO accent palette therefore lives in two places that can drift.

- **Why:** an organism that "feels like alien technology" needs *one* palette
  rendered identically in DOM and canvas. A shared TS token module removes the
  drift and unblocks future canvas/WebGL visuals.
- **Do:** extract the core accent/signal palette into `src/design-system/tokens.ts`
  (plain TS consts), have the canvas read from it, and — where practical — generate
  the matching CSS custom properties from the same source so they can't diverge.
- **Acceptance:** `Network.tsx` no longer carries orphan hex/rgba beyond values
  derived from the shared module; DOM and canvas accents visibly match. Build green.

### 4. Make the README tell the truth (25 apps, Cakra, current stack)
**Priority: DESIGN-SYSTEM CONSISTENCY / hygiene.** `README.md` still says
"21 Apps," centers a **Hermes AI** app, and omits the newer instruments
(Cakra Agent, Cakra CC, AI Chat, Artifacts, Network). The product was rebranded
Hermes → **Cakra** and the registry now holds **25** apps + the desktop shell.

- **Why:** the README is the front door. A stale inventory undercuts the
  "complete, coherent organism" story and misleads anyone (or any routine)
  orienting from it.
- **Do:** regenerate the app-inventory table from `src/lib/registry.ts` (25 apps,
  correct names + AI flags), update the headline count, and replace "Hermes"
  naming with "Cakra" throughout. (Build-routine task — README lives at repo root,
  outside this strategist's docs-only scope.)
- **Acceptance:** README inventory matches `registry.ts` 1:1; no stale "Hermes AI"
  central-app references; app count is correct.

### 5. Desktop-shell as the organism's hub — global cross-app launcher / command palette audit
**Priority: INTERCONNECT.** With handoffs now observable (NOW #1/#2), confirm the
desktop shell exposes them coherently: a single command surface to jump between
apps and trigger the common handoffs without hunting through each app's agent bar.

- **Why:** the shell is where "one organism" is felt first. The graph work is
  wasted if the entry points are scattered.
- **Do:** inventory how each app currently offers cross-app actions; if a global
  launcher/command palette already exists, ensure every `CROSS_APP_ACTIONS` entry
  is reachable from it; if not, scope it as the next NEXT item (don't build blind).
- **Acceptance:** a written one-paragraph finding in `docs/ROUTINE-LOG.md` + either
  a small wiring PR or a promoted NEXT theme with concrete shape.

---

## NEXT — themes (break into NOW items as slots open)

- **Complete the cross-app graph.** Every app both *emits* and *receives* honest
  handoffs; the Network mesh portrays the full adjacency, not just the handful of
  wired edges. Add a legend/inspector so a node click shows its real neighbors.
- **Design-system consistency sweep.** Audit each of the 25 apps for token usage
  (spacing/radii/type/color) against the XENO system; fix one-off hex, ad-hoc
  spacing, and non-`--mono` code surfaces. Track a per-app conformance checklist.
- **Depth pass on shallow apps.** Identify which instruments are still thin
  (Photos, Maps, Video, Music, Clock) and give each one genuine, offline-capable
  function rather than a placeholder — coherence over new apps.
- **PWA completion.** After packaging PR #2 merges (human-owned), validate the
  offline precache, install flow, and base-path on a real install; close any
  service-worker/asset gaps so the installed PWA is identical to dev.
- **Android APK validation.** Once PWA is solid, run the `Android APK` workflow,
  install on-device, and verify the offline backend-optional layer degrades
  gracefully with no LAN server.

## LATER — parking lot (revisit; don't build yet)

- Organism-wide provenance/memory: a queryable trail of which app produced/consumed
  each artifact (built on the `HANDOFF` + event history).
- Global search across all app data (notes, events, learning, bookmarks, prompts).
- Multi-window desktop polish: snapping, persisted layout, per-app window state.
- Real-device QA loop (rendered UI) so the Network animations, fonts, and handoff
  arcs get visual confirmation instead of "not verifiable in cloud."
- Accessibility follow-through (the earlier a11y audit) as a measured pass.
- Optional self-hosted backend story for users who do run `server.js` (sync).

## DONE — recently shipped (trimmed each run)

- **App→app synapse arcs** (#8) — handoffs light a curved link directly between
  two instruments, routed through CORE, with a packet sweep. (2026-06-20)
- **Live signal ticker** (#7) — Network mesh shows the last 6 signals as a
  glanceable nerve-traffic log. (2026-06-20)
- **Network wired to the live event bus** (#3) — `onAny()` added; the mesh pulses
  on real cross-app activity instead of a fixed timer. (2026-06-20)
- **Self-host JetBrains Mono** (#5) — last external font dependency vendored;
  renders identically offline. (2026-06-20)
- **Cakra rebrand** — Hermes → Cakra + multi-model NIM router.
- **PWA/APK packaging** — staged in PR #2 (open, human-owned; do not auto-merge).
- **QA green** — 26/26 routes mount, no runtime errors (2026-06-20T18:09Z).
