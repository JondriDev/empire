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
> Last re-ranked: **2026-06-29** (strategist) · Main: 🟢 green (build + vitest 205, token-violations 0,
> off-system 1076) · QA: 26/26 routes render, no runtime errors. **EPIC-1 DONE** (both-ways 9/9). **EPIC-2 DONE**
> (token-violations 501 → 0). **EPIC-3 DONE** (shallow instruments 8/8 offline-capable). **EPIC-4 DONE** (PWA:
> offline ✅ + base ✅ + installable ✅, S1–S4). **▶ EPIC-5 · Design-system utility conformance ACTIVE** — sweep the
> **1076 off-system Tailwind palette classes** (EPIC-2's blind spot; they break `[data-theme]` theme-switching) to
> **0** via the already-built `@theme` utility bridge, cluster-by-cluster (S1 Calendar+Photos → … → S8 CI lock).
> **Android renumbered to EPIC-6 (QUEUED)** — device-gated, not unattended-executable; promote only with on-device QA.

> **Note:** the day-to-day execution queue now lives in [`docs/EPICS.md`](./EPICS.md)
> (one ACTIVE epic, deeply decomposed stages). This ROADMAP holds the **higher-altitude
> themes** that feed *future* epics — re-ranked each strategist run.

---

## NOW — next 3–5 increments (each one PR-sized)

Pulled top-to-bottom. Each is small, concrete, and has an acceptance check.
(The **active epic's stages (EPIC-5 S1 → S8, design-system utility sweep) take precedence** — these are the
on-deck themes feeding *future* epics.)

### 1. ✅ DONE (Builder 2026-07-01) — Make the README tell the truth (26 apps, Cakra, current stack)
**Priority: DESIGN-SYSTEM CONSISTENCY / hygiene.** **Shipped:** `README.md` regenerated 1:1 from
`src/lib/registry.ts` (26 apps, correct names + AI flags; the 3 tools merged into Cakra marked as tabs),
Hermes → **Cakra** everywhere, tech-stack versions corrected against `package.json`, and the design-system
section rewritten to the real JondriDev "Earth-from-Space" Liquid Glass tokens (Sora / JetBrains Mono, `.gp`).
Acceptance met: inventory matches the registry, no stale "Hermes"/"21 apps"/"XENO"/"Inter" references remain.
_Original note (for history): the README said "21 Apps," centered a **Hermes AI** app, and omitted the newer
instruments; the product was rebranded Hermes → **Cakra** and the registry now holds **26** apps + the shell._

- **Why:** the README is the front door. A stale inventory undercuts the
  "complete, coherent organism" story and misleads anyone (or any routine)
  orienting from it.
- **Do:** regenerate the app-inventory table from `src/lib/registry.ts` (25 apps,
  correct names + AI flags), update the headline count, and replace "Hermes"
  naming with "Cakra" throughout. (Build-routine task — README lives at repo root,
  outside this strategist's docs-only scope.)
- **Acceptance:** README inventory matches `registry.ts` 1:1; no stale "Hermes AI"
  central-app references; app count is correct.

### 2. Lock the palette against future drift — **NOW FOLDED INTO EPIC-5 S8**
**Priority: DESIGN-SYSTEM CONSISTENCY.** *(No longer a standalone NOW item — it became the close-out stage of the
active epic.)* EPIC-5 S8 wires `metrics.mjs --assert-zero` into CI (fails if `tokenViolations>0 ||
offSystemUtilities>0`) and adds a `@theme`-bridge↔`colors_and_type.css` drift test, so once off-system hits 0 the
conformance is permanent. Kept here as a pointer; do not double-build.

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
- **Design-system colour conformance — full.** *(In progress — this IS EPIC-5.)* EPIC-2 zeroed raw hex/rgba
  *literals*; EPIC-5 now zeroes the **1076 off-system Tailwind palette classes** that bypass the `@theme` token
  bridge and break `[data-theme]`. Closes when `offSystemUtilities` hits 0 and S8's CI gate is live.
  **Follow-on theme (next epic candidate, not yet decomposed):** extend the conformance audit to
  **spacing/radii/type** (ad-hoc px, non-`--mono` code surfaces) with its own `metrics.mjs` row, so
  "design-system conformance" isn't colour-only.
- **Depth pass on shallow apps.** ✅ **DONE — this WAS EPIC-3** (shallow instruments 8/8 offline-capable; Clock,
  Music/Video, Photos durable + DataCenter/Weather tests). Retired.
- **PWA completion.** ✅ **DONE — this WAS EPIC-4** (cold offline boot 5/5 from precache, zero precache gap,
  base-path/install-flow correct, installability asserted). Retired.
- **Organism completeness II — deeper graph mirrors.** *(Next cloud-executable epic candidate after EPIC-5.)*
  DataCenter mirrors only the active table; Files only the current directory (see NOW #3). Mirror the **whole**
  collection so the Network reflects every app's full state — a real interconnection gradient.
- **Android APK validation.** *(QUEUED EPIC-6 — renumbered from EPIC-5.)* Device-gated: an unattended cloud
  builder can't install an APK or run on-device smoke, so its target isn't cloud-verifiable. Promote only when an
  on-device QA path exists; until then it's lower *realizable* gradient than the cloud-executable themes above.

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
