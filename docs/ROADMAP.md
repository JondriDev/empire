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
> Last re-ranked: **2026-06-28** (strategist) · Main: 🟢 green (build + vitest 136 / 18 files, token-violations 0) ·
> QA: 26/26 routes render, no runtime errors. **EPIC-1 DONE** (both-ways 9/9). **EPIC-2 DONE** (token-violations
> 501 → 0, S1–S8). **EPIC-3 · Depth pass ACTIVE** — shallow instruments offline-capable, **now 7/8** (S1 Clock +
> S2 Music/Video shipped); **only Photos remains (S3)**, then S4 backfills DataCenter+Weather tests → EPIC-3 DONE
> → **EPIC-4 · PWA completion** promotes (already decomposed in EPICS.md QUEUED).

> **Note:** the day-to-day execution queue now lives in [`docs/EPICS.md`](./EPICS.md)
> (one ACTIVE epic, deeply decomposed stages). This ROADMAP holds the **higher-altitude
> themes** that feed *future* epics — re-ranked each strategist run.

---

## NOW — next 3–5 increments (each one PR-sized)

Pulled top-to-bottom. Each is small, concrete, and has an acceptance check.
(The **active epic's stages (EPIC-3 S3 → S4) take precedence** — these are the on-deck
themes feeding *future* epics.)

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

### 3. Deeper graph mirrors — DataCenter & Files reflect their WHOLE state (off-theme depth, feeds a future epic)
**Priority: INTERCONNECTION (the living graph).** Two QA-surfaced gaps where an app's graph
presence is partial, so the organism's picture of it is incomplete:
- **DataCenter** `dataset` nodes only carry a row count for the *active* table — switching tables
  doesn't surface the others into the graph.
- **Files** `file` nodes only reflect the *current* directory; navigating away reconciles the
  others out, so the graph forgets folders you've left.

- **Why:** the thesis is "one organism where every app's real entities are legible in The Network."
  A store that only mirrors its active slice under-represents itself in the mesh.
- **Do (future epic, not now):** mirror **all** tables/visited directories (or a stable summary node
  per table/dir) so the graph reflects the full collection. Off the EPIC-3 depth theme — park here
  until EPIC-3/EPIC-4 close, then fold into an "organism completeness II" epic if still relevant.
- **Acceptance:** switching DataCenter tables / navigating Files leaves prior tables/dirs represented
  in The Network instead of being reconciled away.

---

## NEXT — themes (break into NOW items as slots open)

- **Complete the cross-app graph.** ✅ **DONE — this WAS EPIC-1** (emit↔receive loop closed,
  both-ways 9/9; Network inspector S3, ⌘K palette S4, Inbox S5 all shipped). Retired.
- **Design-system consistency sweep.** ✅ **DONE — this WAS EPIC-2** (token-violations 501 → 0, S1–S8).
  **Follow-on theme (not yet an epic):** extend the conformance audit to **spacing/radii/type** (ad-hoc px,
  non-`--mono` code surfaces) with its own `metrics.mjs` row, so "design-system conformance" isn't colour-only.
  Also: **lock the palette against drift** (NOW #2) so the 0 can't silently rot — promote alongside this.
- **Depth pass on shallow apps.** *(In progress — this IS EPIC-3, 7/8.)* Photos (S3) is the last thin
  instrument; S4 backfills DataCenter+Weather tests. Closes when function hits 8/8.
- **PWA completion.** *(Decomposed as the QUEUED EPIC-4 in EPICS.md.)* Validate a **cold offline boot** of
  the app's own chunks (not just external-host blocking), close the SW precache gap so the shell + all 25 app
  chunks + fonts + alien icons precache, and verify base-path/install-flow so the installed PWA is identical
  to dev. **Promotes the moment EPIC-3 is DONE.**
- **Android APK validation.** *(QUEUED EPIC-5.)* Once PWA is solid, run the `Android APK` workflow, install
  on-device, and verify the offline backend-optional layer degrades gracefully with no LAN server.

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
