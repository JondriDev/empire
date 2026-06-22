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
> Last re-ranked: **2026-06-22** (strategist) · Main: 🟢 green (build + 64/64 vitest) ·
> QA: 26/26 routes mount, no runtime errors. EPIC-1 S1+S2 shipped; active stage **S3**.

> **Note:** the day-to-day execution queue now lives in [`docs/EPICS.md`](./EPICS.md)
> (one ACTIVE epic, deeply decomposed stages). This ROADMAP holds the **higher-altitude
> themes** that feed *future* epics — re-ranked each strategist run. The two former
> NOW #1 (emit `HANDOFF` from every transfer) and #2 (inbound "From <app>" chips) both
> **shipped** (EPIC-1 S2 + S1, #23 / 2026-06-22) and have been retired to DONE below.

---

## NOW — next 3–5 increments (each one PR-sized)

Pulled top-to-bottom. Each is small, concrete, and has an acceptance check.
(The active epic's stages take precedence; these are the on-deck themes feeding EPIC-2/3.)

### 1. One palette, one source of truth — JS-importable design tokens
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

### 2. Make the README tell the truth (26 apps, Cakra, current stack)
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

### 3. Desktop-shell as the organism's hub — global cross-app launcher / command palette audit
**Priority: INTERCONNECT.** *(Feeds EPIC-1 S4 — promote there when S3 lands.)* With
handoffs now observable and provenance surfaced (S1+S2 shipped), confirm the desktop
shell exposes them coherently: a single command surface to jump between apps and
trigger the common handoffs / `intentsFor` a node without hunting through each app's bar.

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

- **Inbound provenance chips** (#23, EPIC-1 S1) — every `sessionStorage` receiver
  (Editor / Token Counter / Prompt Gen / AI Chat) shows a dismissible "From <app>"
  chip and preloads the payload; fixed Editor silently dropping its clipboard. (2026-06-22)
- **Every transfer emits an arc** (EPIC-1 S2) — all five navigating `CROSS_APP_ACTIONS`
  emit `HANDOFF{fromId,toId}`; the two in-place transfers carry `from` on their typed
  event; `appActions.test.ts` asserts exactly one arc-bearing event per action. (2026-06-22)
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
