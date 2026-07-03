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
> Last re-ranked: **2026-07-03** (strategist) · Main: 🟢 green (vitest 292, token-violations 0, off-system 0) ·
> QA: 28/28 routes render, no runtime errors, all guards green. **EPIC-1..9 all DONE** (organism both-ways 9/9 ·
> token-violations 501→0 · shallow instruments 8/8 · PWA offline+base+installable · off-system 1076→0, CI-locked ·
> durable provenance `PROVENANCE-PERSISTS 3/3` + `PROVENANCE-ENTITY 3/3` + Reader graph-legible · `GLOBAL-SEARCH 1/1`
> queryable organism · `NODE-LINEAGE 1/1` per-artifact ancestry, navigable). **▶ EPIC-10 · The Timeline (the
> organism's lifestream — a TEMPORAL lens) ACTIVE** — the organism has three lenses over its one Core graph (Network =
> structural, Search = query, Inbox = tasks) but **no temporal lens**, even though every `CoreNode` has stamped
> `meta.created` and every `ProvEdge` stamps `at` all along. EPIC-10 is the missing 4th lens: one newest-first,
> day-grouped stream merging **every entity-birth + every app→app handoff** into the organism's history — each row
> navigable to its entity, ancestry inline, and (S3) what it spawned (finally surfacing the unused `childrenOf`
> walker). **Target: `TIMELINE 0/1 → 1/1`** (S1 spine+lens+guard → S2 filters/keyboard → S3 descendants). **Android
> renumbered to EPIC-7 (QUEUED)** — device-gated, promote only with on-device QA.

> **Note:** the day-to-day execution queue now lives in [`docs/EPICS.md`](./EPICS.md)
> (one ACTIVE epic, deeply decomposed stages). This ROADMAP holds the **higher-altitude
> themes** that feed *future* epics — re-ranked each strategist run.

---

## NOW — next 3–5 increments (each one PR-sized)

Pulled top-to-bottom. Each is small, concrete, and has an acceptance check.
(The **active epic's stages (EPIC-6 S1 → S4, Organism Memory) take precedence** — these are the on-deck themes
feeding *future* epics.)

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

### 3. ✅ DONE / FOLDED — Deeper graph mirrors (whole-state legibility)
**Priority: INTERCONNECTION (the living graph).** Two of the three whole-state gaps are closed and the last is
now **EPIC-6 S4**:
- **Files** ✅ **DONE** (Builder 2026-06-30) — `filesGraph.ts` accumulates the session union across every visited
  directory and mirrors the whole union (was: navigating pruned prior folders). No longer forgets folders.
- **DataCenter** ✅ **already correct** — `DataCenter.tsx:57` mirrors *all* tables with per-table row counts (the
  "active table only" note predated the redesign; confirmed stale).
- **Reader** ⏳ **folded into EPIC-6 S4** — the newest app never mirrors its book collection, so it's a graph
  island; S4 closes it (mirror `book` nodes + book-level emit) as the epic's capstone.

- **Why:** "one organism where every app's real entities are legible in The Network" — a collection that only
  mirrors its active slice under-represents itself in the mesh. Files/DataCenter are done; Reader is the last gap.
- **Acceptance:** (met for Files/DataCenter) prior tables/dirs stay represented; (EPIC-6 S4) a loaded Reader book
  appears as a `book` node in The Network.

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
- **Organism Memory — durable provenance & lineage.** ✅ **DONE — this WAS EPIC-6** (durable `empire-provenance`
  store, persistent Network memory panel + all-time "fed by/feeds", reload-durable per-entity source via
  `LineageTrail`, Reader graph-island closed). `PROVENANCE-PERSISTS 3/3` + `PROVENANCE-ENTITY 3/3` + `GRAPH-LEGIBLE
  1/1` all QA-confirmed. Retired.
- **Global cross-app search — the organism becomes queryable.** ✅ **DONE — this WAS EPIC-8** (S1–S3 shipped: pure
  `search.ts` spine + the Search app + `openEntity` deep-link + filters/keyboard/⌘⇧F summon; `GLOBAL-SEARCH 1/1`,
  S1–S2 QA-confirmed). Retired.
- **Node-level lineage — per-artifact ancestry.** ✅ **DONE — this WAS EPIC-9** (S1–S3 shipped: `nodeLineage.ts`
  walker + `<NodeLineage>` surface on Inbox/Network/Search + each hop navigable via `openEntity`; `NODE-LINEAGE 1/1`,
  5 axes, S1–S3 all QA-confirmed LIVE). Retired. *Left one rail dormant:* `childrenOf` (descendants) was
  built + unit-pinned but never surfaced → picked up by EPIC-10 S3.
- **The Timeline — a temporal lens over the whole organism.** *(In progress — this IS EPIC-10, ▶ ACTIVE.)* The 4th
  lens (after Network/Search/Inbox): one newest-first, day-grouped stream of every entity-birth (`meta.created`) +
  every app→app handoff (`ProvEdge.at`), each row deep-linking to its entity with ancestry inline and (S3) its
  descendants. Closes when `TIMELINE 1/1` is QA-confirmed. **Follow-on (next epic candidate, not yet decomposed):**
  **design-system conformance II** — extend the audit past colour to **spacing/radii/type** (ad-hoc px, non-`--mono`
  code surfaces) with its own `metrics.mjs` row + `--assert-zero` gate, so conformance isn't colour-only (the
  existing off-system=0 lock is the template).
- **Android APK validation.** *(QUEUED EPIC-7 — renumbered EPIC-5→6→7.)* Device-gated: an unattended cloud
  builder can't install an APK or run on-device smoke, so its target isn't cloud-verifiable. Promote only when an
  on-device QA path exists; until then it's lower *realizable* gradient than the cloud-executable themes above.

## LATER — parking lot (revisit; don't build yet)

- ~~Organism-wide provenance/memory: a queryable trail of which app produced/consumed
  each artifact~~ → **PROMOTED to ▶ EPIC-6 (Organism Memory)**, 2026-07-01. App-level durable provenance is the
  active epic; the artifact-level (node-scoped) trail is the named follow-on candidate.
- ~~Global search across all app data (notes, events, learning, bookmarks, prompts)~~ → **PROMOTED to ▶ EPIC-8
  (Global cross-app search)**, 2026-07-02. S1 shipped (`GLOBAL-SEARCH 1/1`); S2–S3 deepen it.
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
