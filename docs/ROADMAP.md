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
> Last re-ranked: **2026-06-22** (strategist) · Main: 🟢 green (build + 92/92 vitest) ·
> QA: 26/26 routes mount, no runtime errors. EPIC-1 S1–S5 shipped; active stage **S6a**
> (close the emit↔receive loop — both-ways metric stuck at 1/26, S6a→3, S6b→6, S6c→9).

> **Note:** the day-to-day execution queue now lives in [`docs/EPICS.md`](./EPICS.md)
> (one ACTIVE epic, deeply decomposed stages). This ROADMAP holds the **higher-altitude
> themes** that feed *future* epics — re-ranked each strategist run. The former NOW #3
> (global command-palette audit) **shipped** as EPIC-1 S4 (⌘K palette, commit 1de67e5)
> and is retired below; the Network legend/inspector (former NEXT) shipped as S3.

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

### 3. Generate the matching CSS custom properties from the TS token source
**Priority: DESIGN-SYSTEM CONSISTENCY.** *(Feeds EPIC-2 — promote when EPIC-1 finishes.)*
Companion to #1: once `src/design-system/tokens.ts` exists, the `colors_and_type.css`
custom properties should be generated from (or asserted against) the same consts so DOM
and canvas literally cannot drift, removing the largest class of token violations at the source.

- **Why:** EPIC-2's target is token-violations 496→0; a single generated source is the
  highest-leverage move before the per-app sweep.
- **Do:** scope a build step or a test that asserts every `--accent-*`/signal CSS var equals
  its `tokens.ts` const; document the generation path. (Build-routine task — outside docs scope.)
- **Acceptance:** a test or generator ties CSS vars to `tokens.ts`; a drift fails CI. Build green.

---

## NEXT — themes (break into NOW items as slots open)

- **Complete the cross-app graph.** *(In progress — this IS EPIC-1 S6.)* The Network
  legend + inspector shipped (S3); ⌘K palette (S4) and Inbox (S5) surface intents/tasks.
  The last gap is the emit↔receive loop (both-ways 1/26 → 9/9) — see EPIC-1 S6a–c.
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

- **Inbox / Today view** (EPIC-1 S5) — the 27th app aggregates every graph `task` into
  open/done buckets with a done-toggle, source chip, and ⚡ bar (`tasks.ts` seam). (2026-06-22)
- **Global ⌘K command palette** (EPIC-1 S4) — focus-aware modal over the last-touched node;
  lists `intentsFor(node)` + "Open in <app>" and runs via `runIntent` (`focus.ts`). (2026-06-22)
- **Network inspector + legend** (EPIC-1 S3) — clicking a node opens an inspector of its real
  entities + true neighbors; persistent node-type legend (`adjacency.ts`/`nodeColors.ts`). (2026-06-22)
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
