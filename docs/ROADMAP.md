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
> Last re-ranked: **2026-06-27** (strategist) · Main: 🟢 green (build + 112 vitest) ·
> QA: 28/28 routes render, no runtime errors. **EPIC-1 DONE** (both-ways 9/9). **EPIC-2 ACTIVE
> & ~75% done** — design-token violations **501 → 134**; S1–S5 shipped, remaining 134 decomposed
> into S6 (artifacts app) → S7 (shared-UI+shell) → S8 (long-tail) → **0**, then EPIC-3 promotes.

> **Note:** the day-to-day execution queue now lives in [`docs/EPICS.md`](./EPICS.md)
> (one ACTIVE epic, deeply decomposed stages). This ROADMAP holds the **higher-altitude
> themes** that feed *future* epics — re-ranked each strategist run. Former NOW #1
> (JS-importable design tokens) **shipped** as EPIC-2 S1 (`src/design-system/tokens.ts`) and is
> retired below; the per-app sweep it unblocked is now EPIC-2 S2–S8.

---

## NOW — next 3–5 increments (each one PR-sized)

Pulled top-to-bottom. Each is small, concrete, and has an acceptance check.
(The **active epic's stages (EPIC-2 S6→S7→S8) take precedence** — these are the on-deck
themes feeding the *next* epic, EPIC-3 · Depth pass.)

### 1. Make the README tell the truth (27 apps, Cakra, current stack)
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

### 2. Lock the palette against future drift (assert CSS vars ≡ `tokens.ts`)
**Priority: DESIGN-SYSTEM CONSISTENCY.** *(Feeds a post-EPIC-2 follow-up — promote once
violations hit 0 so the win can't silently rot.)* Now that `src/design-system/tokens.ts` is
the TS palette source and EPIC-2 is driving app code onto it, add a guard so a new hardcoded
hex or a drifted CSS var fails fast.

- **Why:** EPIC-2 gets violations to 0 by sweeping; without a ratchet, the count creeps back.
  A test that ties `colors_and_type.css` `--*` vars to their `tokens.ts` consts (and a CI check
  that `metrics.mjs` token-violations stays 0) makes the conformance permanent.
- **Do:** a vitest that asserts every `--signal`/`--ion`/… CSS custom prop equals its `PALETTE`
  const, plus a `metrics.mjs --assert-zero`-style gate. (Build-routine task — outside docs scope.)
- **Acceptance:** a drift or a new hardcoded hex fails CI. Build green.

### 3. EPIC-3 prep — pick the first shallow instrument to deepen
**Priority: COMPLETING APPS (next epic on deck).** When EPIC-2 closes, EPIC-3 (depth pass on
thin apps: Photos, Maps, Video, Music, Clock) promotes. Pre-scope the first stage so the
handoff is instant: audit which of the five has the highest capability-per-effort offline win
(leading candidate: **Clock** — world clocks + timers + stopwatch are fully offline and high-use;
or **Music** — a local-file player). The strategist will decompose the winner into stages then.

- **Acceptance (for the strategist, not the builder):** EPIC-3's S1 names the app, the concrete
  offline capability, the files, and an acceptance check — ready to promote the moment EPIC-2 is DONE.

---

## NEXT — themes (break into NOW items as slots open)

- **Complete the cross-app graph.** ✅ **DONE — this WAS EPIC-1** (emit↔receive loop closed,
  both-ways 9/9; Network inspector S3, ⌘K palette S4, Inbox S5 all shipped). Retired.
- **Design-system consistency sweep.** *(In progress — this IS EPIC-2, ~75% done: 501 → 134.)*
  The colour axis is nearly swept (S1–S5; S6–S8 finish it to 0). A **follow-on theme** once
  colour hits 0: extend the conformance audit to **spacing/radii/type** (ad-hoc px, non-`--mono`
  code surfaces) with its own `metrics.mjs` row, so "design-system conformance" isn't colour-only.
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
