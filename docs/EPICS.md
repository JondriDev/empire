# The Empire — Epics (reaction pathways)

> **Why this file exists (first principles):** a real capability is a high-
> activation-energy reaction — one time-boxed run can't supply it, so the old
> "pick the next small chore" model fumbled a fraction each run and re-planned
> every time (HANDOFF took *four* runs). An **epic** lowers the activation energy
> by pre-decomposing one big leap into a sequence of **stages**, each a meaty but
> green, reviewable PR with a concrete acceptance check. The Builder executes the
> next stage *at full speed* (no re-planning); the stages compound into a coherent
> leap. **Direction and decomposition, not code.**

## Rules

- **Exactly ONE active epic at a time** (`▶ ACTIVE`). This keeps every PR coherent
  and matches the Reviewer's single-gate / green-hard-gate model (bounded leap).
- Only the **Strategist** edits epic definitions and ordering. The **Builder/QA**
  check off `[x]` stages and append discovered stages; they don't invent epics.
- Each epic names a **target metric** (`docs/METRICS.md`). An epic is `DONE` only
  when its stages ship **and** QA confirms the metric moved.
- A stage must be executable in one run **without re-planning**: name the files,
  the shape, and the acceptance check. *A vague stage = a small builder step = failure.*
- Rank epics by **gradient = capability gain ÷ stages of effort.** Highest first.

---

## ▶ ACTIVE — EPIC-1 · Organism Completeness

**Leap:** The Empire stops being 26 apps with a few wired synapses and becomes one
organism where **every** app both *emits* and *receives* honest handoffs, the
Network mesh portrays the full adjacency, and a human can navigate the whole graph.

**Target metric:** *Apps fully wired into the organism* → **26 / 26** (both emit &
receive, visible in The Network); *Routes rendering clean* stays **26 / 26**.
**Why highest gradient:** the product's entire thesis is "one living organism";
the rails are 80% built (`HANDOFF`, `mirrorCollection`, `NodeActions`), so each
stage is now downhill (low barrier) and visibly moves the headline metric.

Stages (Builder takes the topmost `[ ]`; **confirm current state vs. code first** —
some may already be shipped):

- [x] **S1 · Inbound provenance.** Each `sessionStorage` receiver (Editor, Token
  Counter, Prompt Gen, AI Chat) shows a dismissible **"From <source>"** chip
  (token-styled, source app's accent) and preloads the payload. *Acceptance:* send
  from Calculator → Token Counter opens pre-filled with a "From Calculator" chip;
  same for the other three. Build 🟢, vitest 🟢, eslint clean; add a unit test.
  **Shipped 2026-06-22:** `useInboundHandoff` hook + `<ProvenanceChip>`; fixed a
  latent bug (Editor never read its clipboard). See ROUTINE-LOG 2026-06-22.
- [x] **S2 · Every app emits on transfer.** Audit `CROSS_APP_ACTIONS`; any transfer
  that still navigates silently emits `HANDOFF` first (no invented edges).
  *Acceptance:* every cross-app action lights a directed arc in The Network; one
  test asserts each action emits exactly one `HANDOFF{fromId,toId}`.
  **Shipped 2026-06-22:** the 7 `CROSS_APP_ACTIONS` already rode arc-bearing events
  (HANDOFF / NOTE_CREATED `from-` / LEARNING_LOGGED `from`) — confirmed + already
  tested. The real silent gap was the **C-layer intents** (the ⚡ NodeActions menu):
  `add-to-learning` moved a note/message → Learning Tracker with **no** arc. Added a
  guarded `announceTransfer()` in `sync.ts` so all three core intents emit an honest
  `HANDOFF` (the `fromId!==toId` guard suppresses in-app `make-task`/`make-note-from`).
  Extracted the canonical `flowForEvent` arc predicate to `src/lib/core/flow.ts`
  (shared by Network + tests; S3 inspector will reuse it). +13 tests
  (`flow.test.ts`, `coreIntents.test.ts`). See ROUTINE-LOG 2026-06-22.
- [ ] **S3 · Network inspector + legend.** Clicking a node shows its real neighbors
  (from `graph.neighbors`) and a legend maps node-type → accent. *Acceptance:* click
  a node → side panel lists its true edges; legend matches `design-system` tokens.
- [ ] **S4 · Global "⚡ Send to…" in the command palette.** Surface `intentsFor` the
  focused node across all apps from one command surface. *Acceptance:* palette lists
  the focused node's intents and runs them; reachable without hunting per-app bars.
- [ ] **S5 · "Inbox / Today" view.** Aggregate open `task` nodes from the graph into
  one view. *Acceptance:* tasks created via ⚡ from any app appear here.
- [ ] **S6 · Wire the remaining stateful apps both-ways.** Any app still missing
  `mirrorCollection` + `<NodeActions>` (audit Goals/Artifacts/DataCenter/Files/Photos/
  prompt-gen against `CONTEXT.md`) gets wired. *Acceptance:* the "apps fully wired"
  metric reaches 26/26; The Network shows every app's entities.

_When all stages ship and QA confirms 26/26 wired → move EPIC-1 to DONE and promote EPIC-2._

---

## QUEUED — promote one when the active epic finishes

### EPIC-2 · Design-system conformance → zero token violations
**Leap:** one palette, rendered identically in DOM and canvas; no app hardcodes color.
**Target metric:** *Design-token violations* **496 → 0**.
Stage seeds: extract `src/design-system/tokens.ts` (plain TS consts) as the single
source; generate the matching CSS custom props from it; then sweep app code per the
`metrics.mjs` "top offenders" list (start: HermesCommandCenter, HermesAgentBar,
ai-agent SettingsPanel, Calculator) replacing raw hex/rgb with tokens — one cluster
of apps per stage, build green each time.

### EPIC-3 · Depth pass on shallow instruments
**Leap:** the thin apps (Photos, Maps, Video, Music, Clock) get genuine offline-capable
function instead of placeholders — coherence over new surface area.
**Target metric:** *Routes rendering clean* stays 26/26 while each gains real function
(+ tests). Stage seeds: one app per stage, each with a concrete capability + acceptance.

### EPIC-4 · PWA + Android validation
**Leap:** the installed PWA is byte-identical to dev and the APK degrades gracefully offline.
**Target metric:** *Lighthouse PWA ≥ 90*; offline precache verified on a real install.
Stage seeds: validate SW precache + base-path on a real install; close asset gaps; run the
Android workflow and verify the backend-optional layer with no LAN server.

---

## DONE

- **EPIC-0 · Organism foundation** — A-bus / B-graph / C-intents, `mirrorCollection`,
  `NodeActions`, `HANDOFF` event, Network wired to the live bus + app→app arcs, core
  unit tests. (Shipped #3/#5/#7/#8/#13/#20, 2026-06-20 → 06-21.) EPIC-1 completes it.
