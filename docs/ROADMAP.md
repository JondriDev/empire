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
> Last re-ranked: **2026-06-22** · Main: 🟢 green (build + 28/28 vitest) ·
> QA: 27/27 routes render, no uncaught JS. Execution lives in
> [`docs/EPICS.md`](./EPICS.md) — active epic **EPIC-1 · Organism Completeness**,
> next stage **S2 · Every app emits on transfer**. This file holds the
> higher-altitude NEXT/LATER themes those stages and future epics draw from.

---

## NOW — next 3–5 increments (each one PR-sized)

Pulled top-to-bottom. Each is small, concrete, and has an acceptance check.
**The active execution surface is EPIC-1's stage list in `docs/EPICS.md`;** the
items below are the higher-altitude themes those stages and the next epics draw from.

### 1. ▶ ACTIVE (EPIC-1 S2) — Every cross-app action lights exactly one directed arc
**Priority: INTERCONNECT.** The five navigating transfers already emit
`HANDOFF` (shipped #13); the two in-place transfers `SEND_TO_NOTES` /
`SEND_TO_LEARNING` light their arcs from typed events (`NOTE_CREATED` /
`LEARNING_LOGGED`) by an earlier deliberate design. S2 makes the rail provably
uniform and locks it with a test. Full shape + the (a)-literal-HANDOFF vs
(b)-keep-typed-events decision (recommend **b**, lower risk): `docs/CONTEXT.md`
active-epic block / `docs/EPICS.md` S2.

- **Acceptance:** one test per `CROSS_APP_ACTIONS` entry asserts it emits exactly
  one arc-bearing event with the correct `from`/source; The Network shows one
  directed arc per action (no double-count). Build 🟢, vitest 🟢, eslint clean.

### 2. One palette, one source of truth — JS-importable design tokens
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

### 3. Make the README tell the truth (25 apps, Cakra, current stack)
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

### 4. Desktop-shell as the organism's hub — global cross-app launcher / command palette audit
**Priority: INTERCONNECT.** With handoffs now observable end-to-end (S1/S2), confirm the
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

- **Inbound provenance chips + dead-Editor-handoff fix** (#23, EPIC-1 S1) — every
  HANDOFF receiver preloads its payload and shows a dismissible "From <source>"
  chip; `useInboundHandoff` hook + `<ProvenanceChip>`. Fixed a latent bug where
  the Code Editor never read its clipboard. (2026-06-22)
- **Every handoff lights its synapse** (#13, EPIC-1 S2 partial) — all navigating
  `CROSS_APP_ACTIONS` emit `HANDOFF{fromId,toId,label}`; `Network.flowForEvent`
  consumes it; `SEND_TO_NOTES` double-`Date.now()` id bug fixed. (2026-06-21)
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
