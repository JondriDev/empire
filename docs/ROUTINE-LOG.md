# Routine Log — The Empire

Autonomous build/refinement journal. Newest entry first. Each entry = one
increment: what changed, why, what's verified, and the single best next step.

---

## 2026-06-21 · `routine/auto-20260621T120000Z` — Track-as-Learning lights its synapse arc

**Increment:** INTERCONNECT. Closed the standing next-step queued by the last
several runs: **Track as Learning** (`CROSS_APP_ACTIONS.SEND_TO_LEARNING`) was
the last cross-app transfer that still radiated only CORE→app in The Network —
its `LEARNING_LOGGED` event carried no source, so the mesh could light the
Learning Tracker node but never the directed source→learning arc. Now it does.

**Why:** The vision is "one living organism." Every other cross-app action is
already an honest, bus-observable directed edge (Notes via the `from-` tag; the
5 sessionStorage transfers via `HANDOFF`). Learning was the one silent handoff;
this makes the mesh's portrait of nerve traffic complete — no invented links.

**Approach — single tagged event, not a separate `HANDOFF`:** unlike the 5
sessionStorage actions (which navigate away via `_self`), SEND_TO_LEARNING stays
in place and *also* emits `LEARNING_LOGGED`. Emitting a `HANDOFF` **and**
`LEARNING_LOGGED` would push two rows into the live ticker for one action. So I
mirrored the cleaner `NOTE_CREATED` `from-` pattern: thread an optional `from`
onto `LEARNING_LOGGED` instead. One event, one arc, no duplicate row.

**Changed:**
- `src/lib/eventBus.ts` — `LEARNING_LOGGED` gains an optional `from?: string`
  (the source app id; undefined when logged inside the Learning Tracker itself).
- `src/lib/appActions.ts` — `SEND_TO_LEARNING` now emits `from: data.source`.
- `src/apps/network/Network.tsx` — `flowForEvent` returns
  `{ fromId: e.from, toId: 'learning-tracker' }` for a `LEARNING_LOGGED` that
  carries a real `from` (≠ `learning-tracker`); in-app logging leaves `from`
  undefined, so there's **no false self-edge**. Arc/flare/ticker rendering is
  unchanged — it already draws any flow `flowForEvent` surfaces.
- `src/lib/appActions.test.ts` (new test) — asserts `SEND_TO_LEARNING` tags the
  emitted `LEARNING_LOGGED` with the source app and stores the item.

**Verified:** `npm run build` 🟢 (`tsc -b && vite build`, PWA precache 56).
`npx eslint` clean on all 4 touched files. `npx vitest run` → **28/28 pass**
(27 prior + 1 new). Additive and reversible; no localStorage/schema changes (the
stored `LearningItem` shape is untouched — only the transient bus event grew an
optional field); no Calendar syncer; one focused increment.
*Not verifiable here (no rendered UI):* on-device — open **The Network** in one
window, then from another app's agent bar use **Track as Learning**; a curved
packet should race `source → Learning Tracker` with both nodes flaring and a
ticker row `● source → Learning Tracker · learning logged · now`.

**Main state:** 🟢 green at `origin/main` `65ad660`; this branch is based on it.

**Next step:** the cheap CI guard flagged across several runs is now the best
unclaimed item — assert the built `dist/assets/*.css` keeps a **top-level**
`.empire-desktop` rule (0 `.hide-sm .empire-desktop`) so a silent comment-balance
break can't pass a green build again (the regression that #10 caught). Also still
open: triage the orphaned `/app/goals` route (wired in `appComponents.tsx`, absent
from `registry.ts`) — either register it or retire it from `appComponents.tsx`.

---

## 2026-06-21 · QA visual + smoke — main 🟢, 26/27 routes render (Chrome-for-Testing fallback)

**Run:** unattended cloud QA against `main` (`65ad660`). Build 🟢 (`tsc -b &&
vite build`, PWA precache 56). Served `dist/` via `node server.js` on :3001 and
drove it headless.

**Result — 26/27 routes render, no uncaught exceptions:** all 25 registered apps
+ the desktop shell PASS. The only non-render is the orphaned `/app/goals`
(known). Console is clean everywhere except the expected sandbox-only backend
errors: Files `GET /api/files` → 500 (no device FS) and Data Center → 401 (not
logged in). **Self-hosted JetBrains Mono confirmed working — zero external font
fetches this run** (the desktop telemetry strip renders correctly offline).
Screenshots for every app overwritten in `docs/screenshots/latest/` + full
pass/fail table in `REPORT.md`.

**Carried-forward finding (still open):** `/app/goals` — wired in
`appComponents.tsx` but absent from `registry.ts`, so `AppShell` (needs both
`appDef` + component) shows "App not found"; the `Goals-*.js` chunk is built but
unreachable. Not a regression; one-liner to register or delete to retire.

**⚠️ Tooling note — stale `origin/main` + blocked Playwright CDN:**
(1) The fresh clone's `origin/main` ref was **stale at `f6e1e74` (06-19)** while
the real tip is `65ad660`; `git checkout main` initially landed on the old tree.
A `git fetch origin main` + `reset --hard origin/main` corrected it — worth a
`git fetch` at the top of every routine run before trusting `main`.
(2) `npx playwright install chromium` is **blocked by network egress**
(`cdn.playwright.dev` / `playwright.azureedge.net` not on the allowlist), and
the apt `chromium-browser` is only a snap stub. Workaround that worked:
`storage.googleapis.com` **is** reachable, so pulled Chrome-for-Testing
149.0.7827.55 directly and pointed Playwright at it via `executablePath`. All
system libs were present (no `--with-deps` needed). Consider adding the
Playwright CDN to egress, or caching a browser in the image.

**Main state:** 🟢 green and releasable at `65ad660`.

**Next step:** triage the orphaned `goals` route (register it in `registry.ts`
or delete the component + map entry) so 27/27 is achievable.

---

## 2026-06-21 · Integration run — merged #13 (code: HANDOFF) + #12 (QA docs/tooling); left #14 + #2

**Integrated this run (4 open PRs triaged into lanes):**
- **PR #13** (`routine/auto-20260621T053000Z`, **the one CODE PR**) — the
  INTERCONNECT increment: a new `HANDOFF { fromId; toId; label? }` bus event so
  the other 5 cross-app transfers (Editor / Token Counter / Prompt Gen / Ask
  Hermes / Analyze) light their Network synapse arc, not just `SEND_TO_NOTES`;
  also folds the latent double-`Date.now()` id mismatch in `SEND_TO_NOTES`.
  **Verified locally on a fresh checkout:** `npm run build` 🟢 (`tsc -b && vite
  build`, PWA precache 56), `npx vitest run` → **27/27 pass** (21 prior + 6 new),
  `npx eslint` clean on all 4 touched files. Reviewed the diff: purely additive
  and reversible, tokens-only (no CSS/colour changes), no localStorage/schema
  changes, no Calendar central syncer, one focused increment, honest edges only
  (no-ops on empty/self). `mergeable_state: clean`. **Squash-merged** (`716e070`).
- **PR #12** (`routine/auto-qa-2026-06-21T04-18Z`, QA visual+smoke) — refreshed
  screenshots + `REPORT.md` + this log's QA table, plus a one-line crash-regex
  broadening in `scripts/qa-smoke.mjs` (matches `App not found` as well as `App
  not available`). Non-app tooling (not in the build graph); low-risk, confirmed
  the only non-docs file. `mergeable_state: clean`. **Squash-merged** (`c375586`).

**Reviewed, not merged (left for the human):**
- **PR #14** (`meta/improve-2026-06-21`) — the Routine-Optimizer's weekly retro.
  **Not** a `routine/auto-*` branch; the PR body explicitly asks to stay open for
  human review (proposals are human-applied to live routine configs). Untouched.
- **PR #2** (`packaging/pwa-android-ci`) — the human's own packaging branch;
  packaging already on `main` and the branch is stale. Prior runs already posted
  a close recommendation; nothing changed since, so no redundant comment. Left.

**QA finding carried forward:** `/app/goals` is an orphaned route — wired in
`appComponents.tsx` but missing from `registry.ts`, so it renders the "App not
found" fallback (now correctly caught by the QA smoke regex). Pre-existing, not a
regression; flagged for the Strategist/Builder to either register or retire it.

**Main state:** 🟢 green and releasable at `716e070`. Build + 27/27 tests verified
locally post-checkout of #13. ⚠️ On-device visual confirmation still pending — the
new synapse arcs / handoff ticker can't be exercised headless in this session.

**Housekeeping:** branch deletion via the sandbox git proxy still returns HTTP 403,
so the two merged `routine/auto-*` heads (and older ones) linger — harmless; the
PRs are merged.

**Next step:** ROADMAP NOW — thread a source through `SEND_TO_LEARNING` (emit a
`HANDOFF` or add a source field to `LEARNING_LOGGED`) so Track-as-Learning lights
its arc too (the last cross-app action still radiating only CORE→app), and pick up
the orphaned-`goals` triage. Still worth the cheap CI guard (assert built CSS keeps
a top-level `.empire-desktop` rule) so a silent comment-balance break can't pass a
green build again.

---

## 2026-06-21 · `routine/auto-20260621T053000Z` — `HANDOFF` event: every cross-app synapse lights

**Increment:** INTERCONNECT. Closed the standing next-step queued by the last 4
runs: until now only `SEND_TO_NOTES` lit a directed app→app arc in The Network
(via the `from-<id>` note tag). The other cross-app transfers — **Open in Code
Editor / Count Tokens / Use as Prompt / Ask Hermes / Ask Hermes to Analyze** —
navigated silently, so their synapse never lit.

**Why:** The vision is "one living organism." Those 5 actions are real,
observable handoffs but emitted nothing on the bus, so the mesh couldn't portray
them. Now every cross-app transfer is an honest, bus-observable directed edge —
no invented relationships.

**Changed:**
- `src/lib/eventBus.ts` — new typed event `HANDOFF { fromId; toId; label? }`: a
  generic directed cross-app transfer, the bus-level primitive the mesh reads.
- `src/lib/appActions.ts` — added a small `handoff(fromId, toId, label)` helper
  (no-ops on empty/self) and emit it from all 5 sessionStorage-based actions
  *before* navigation: → `editor` (`editing`), `token-counter` (`counting`),
  `prompt-generator` (`prompting`), `ai-chat` (`asking` / `analyzing`). Also
  **fixed a latent id mismatch in `SEND_TO_NOTES`**: it called `Date.now()`
  twice (once for the stored note, once for the emitted `NOTE_CREATED.noteId`),
  so the two could land on different milliseconds. Now computed once and shared.
- `src/apps/network/Network.tsx` — `flowForEvent` returns `{fromId,toId}` for a
  `HANDOFF` (alongside the existing `from-` note tag); `appIdForEvent` lights the
  `toId` node; `labelForEvent` renders the handoff verb in the live ticker. The
  arc/flare rendering is unchanged — it already drew any flow `flowForEvent`
  surfaced.
- `src/lib/appActions.test.ts` (new) — 6 tests: each navigating action emits a
  directed `HANDOFF` to the right target; `SEND_TO_NOTES`' stored note id equals
  its emitted `NOTE_CREATED.noteId`.

**Verified:** `npm run build` 🟢 (`tsc -b && vite build`, PWA precache 56
entries). `npx eslint` clean on all 4 touched files. `npx vitest run` →
**27/27 pass** (21 prior + 6 new). Additive and reversible; no localStorage/
schema changes; no Calendar syncer.
*Not verifiable here (no rendered UI):* on-device — open **The Network** in one
window, then from another app's agent bar use e.g. **Use as Prompt** or **Count
Tokens**; a curved packet should race `source → target` (e.g. `Calculator →
Prompt Generator`) with both nodes flaring and a ticker row `● source → target ·
prompting · now`. (Note: these actions navigate via `_self`, so the arc lights in
the moment before the route change.)

**Checkout note:** the env's local `main` branch is stale (`f6e1e74`); the true
tip is `origin/main` `9eb5e4d`. Based this branch on `origin/main` after fetching.

**Next step:** thread a source through `SEND_TO_LEARNING` (emit a `HANDOFF` or
add a source field to `LEARNING_LOGGED`) so the Track-as-Learning transfer lights
its arc too — the last cross-app action still radiating only CORE→app. Also worth
the cheap CI guard flagged earlier (assert built CSS keeps a top-level
`.empire-desktop` rule) so a silent comment-balance break can't pass a green build.

---

## 2026-06-21 · Integration run — merged #11 + #9 (docs-only); reviewed #2

**Integrated (both docs-only `routine/auto-*`, batched this run):**
- **PR #11** (`routine/auto-20260621T000553Z`) — squash-merged to `main`
  (`68120dd`). Touched only `docs/ROUTINE-LOG.md` (the prior run's integration
  entry); `mergeable_state: clean`, no build required for pure docs.
- **PR #9** (`routine/auto-roadmap-20260620T230454Z`) — the strategist's first
  `docs/ROADMAP.md` (NOW/NEXT/LATER/DONE backlog) + its ROUTINE-LOG entry.
  Was cut from a stale base (`0381aa1`) and both #11 and #9 inserted at the same
  spot in `ROUTINE-LOG.md`, so after #11 landed #9 conflicted. **Rebased #9 onto
  current `main` on its branch**, resolved the ROUTINE-LOG conflict (kept all
  entries newest-first: 2026-06-21 integration → 2026-06-20 QA → 2026-06-20
  strategist → #8 integration), force-pushed the branch, confirmed
  `mergeable_state: clean`, squash-merged (`2ebf23f`). Diff stayed docs-only
  (`+168`, ROADMAP.md + ROUTINE-LOG.md only).

**Reviewed, not merged:** PR #2 (`packaging/pwa-android-ci`, the human's own
branch). A prior run already posted a thorough review recommending the human
**close** it — the packaging is already live on `main`, the branch is stale and
would *revert* later work (Cakra rebrand, #5 fonts, Network event-bus) if merged.
Nothing changed on #2 since, so no redundant comment added. Left for the human.

**Main state:** 🟢 green and releasable at `2ebf23f`. This run added no code —
only docs (a backlog + log entries), which don't affect the build. ⚠️ On-device
visual confirmation of the desktop shell (restored by #10 last run) is still
pending — no rendered UI in this session.

**Housekeeping note:** branch deletion via the sandbox git proxy returns HTTP
403, so merged `routine/auto-*` heads can't be pruned from here (several older
ones linger for the same reason). Harmless — the PRs are merged/closed.

**Next step:** pick up ROADMAP NOW #1 — emit a `HANDOFF` event from
`src/lib/appActions.ts` so the other 5 cross-app actions (Editor / Token Counter
/ Prompt Gen / AI Chat / Analyze) light their Network synapse arcs, not just
`SEND_TO_NOTES`; fold in the latent double-`Date.now()` id mismatch in
`SEND_TO_NOTES`. That's a CODE PR for the builder routine.

---

## 2026-06-21 · Integration run — merged #10 (CRITICAL: desktop-shell CSS fix)

**Integrated:** PR #10 (`routine/auto-qa-20260620T231527Z`, QA visual+smoke) —
squash-merged to main after **independently reproducing and verifying** its bug
fix. This was the highest-value action available: a genuine, *live* regression on
`main` that a green build was hiding.

**The bug (confirmed on `main` before merging):** `src/design-system.css` line 132
documented the XENO-owned tokens as `(--bg/--text*/--grad/--holo-*/--nav-* …)`. The
substrings `--text*/` and `--holo-*/` each form a `*/`, **closing the CSS comment
early**. Confirmed the imbalance directly: 60 `/*` vs **62** `*/`. The two stray
`*/` knocked brace-matching off by a level, so in the *built* bundle every
`.empire-*` shell rule was absorbed into `@media(max-width:640px){.hide-sm
.empire-desktop{…}}` — scoped under `.hide-sm` inside a mobile media query — and
never applied. Confirmed in `dist/assets/*.css`: **15** `.hide-sm .empire-desktop`
matches and **0** top-level `.empire-desktop{`. The desktop launcher/home shell
rendered with no layout (HUD stacked top-left, no grid/dock); individual apps
survived because they use Tailwind utilities, not the `empire-*` layer — which is
why `tsc -b && vite build` stayed green and nothing flagged it.

**The fix (#10, comment-only):** spaces added around the glob slashes
(`--bg / --text* / --grad / --holo-* / --nav-*`) so the doc text no longer forms
`*/`. Zero behavioral change. Independently re-verified post-merge on synced
`main`: `npm run build` 🟢 (PWA precache), comment balance **60/60**, built CSS
`.hide-sm .empire-desktop` = **0**, top-level `.empire-desktop{` = **1** (restored).
PR also refreshed the post-fix QA screenshots + `REPORT.md` (27/27 routes render).

**Main state:** 🟢 green and releasable at the #10 squash merge — desktop shell
layout restored. ⚠️ On-device visual confirmation still pending (no rendered UI in
this session beyond the headless smoke #10 already ran).

**Reviewed, not merged:** PR #9 (`routine/auto-roadmap-…`, docs-only ROADMAP) and
PR #2 (`packaging/pwa-android-ci`, the human's own packaging branch) — both left
for the human; #9 is low-risk docs but based on stale `main` and would want a
rebase before merge.

**Next step:** the standing INTERCONNECT item — emit a lightweight `HANDOFF` event
from `src/lib/appActions.ts` so the other 5 cross-app actions (Editor / Token
Counter / Prompt Gen / AI Chat / Analyze) light their Network synapse arcs, not
just `SEND_TO_NOTES`; fold in the latent double-`Date.now()` id mismatch in
`SEND_TO_NOTES` while there. Also worth a cheap CI guard (assert the built CSS
keeps a top-level `.empire-desktop` rule) so a silent comment-balance break can't
pass a green build again.

---

## 2026-06-20 · QA visual + smoke — **found & fixed: desktop shell rendered fully unstyled**

**Headline:** First QA run to actually render the UI in-cloud (prior runs noted "visual
confirmation pending" — Playwright's CDN is blocked here, so I drove the pre-installed
`/opt/pw-browsers/chromium-1194` binary via `executablePath`). It immediately caught a
**runtime/visual regression the green build hid**: the entire desktop shell (the
launcher/home screen) was rendering with **no layout at all** — HUD telemetry stacked in
the top-left, app names as a flat text run, no grid or dock — while every individual app
rendered perfectly.

**Root cause:** `src/design-system.css` had a comment typo. The doc line
`(--bg/--text*/--grad/--holo-*/--nav-* are owned by XENO.)` contains `*/` sequences
(`--text*/`, `--holo-*/`) that **close the CSS comment early**. The trailing comment text
spilled out as malformed CSS and left two stray `*/` tokens (confirmed: 60 `/*` vs 62 `*/`),
which knocked the parser's brace-matching off by a level. In the built bundle every
`.empire-*` rule ended up rewritten as `@media(max-width:640px){.hide-sm .empire-desktop{…}}`
— scoped to a `.hide-sm` ancestor inside a mobile media query — so it never applied on the
real desktop. Apps survived because they're styled with Tailwind utility classes, not the
`empire-*` custom layer; that's why `tsc -b && vite build` stayed 🟢 and nothing else flagged it.

**Fix (in this PR, tiny + obviously safe):** added spaces around the glob slashes so the
doc text no longer forms `*/` — comment-only, zero behavioral change. Rebuilt: comment
balance 60/60, `.hide-sm .empire-desktop` occurrences 0, base `.empire-desktop{` restored as
a top-level rule. Desktop now renders the intended centered HUD (glowing core, clock,
status pills, app-icon grid) — see `docs/screenshots/latest/desktop.png`.

**Verified:** `npm run build` 🟢 (PWA precache 56 entries). Headless smoke over the desktop
shell + 26 app routes: **27/27 rendered, 0 crashes, 0 uncaught JS exceptions.** Screenshots
overwritten in `docs/screenshots/latest/` + `REPORT.md` regenerated. Non-issues noted in the
report: `goals` route is a stale id in the smoke list (not in `registry.ts`); `files` 500 /
`datacenter` 401 are expected backend responses in the offline sandbox.

**Next step:** the human merges this QA PR to restore the desktop on `main`. Optional
follow-ups: drop the stale `goals` id from `scripts/qa-smoke.mjs`, and consider a cheap CI
guard (e.g. assert `.empire-desktop` resolves to `position:fixed` in a headless check) so a
silent CSS-cascade break like this can't pass a green build again.

---

## 2026-06-20 · Strategist run — created docs/ROADMAP.md (first prioritized backlog)

Zoomed out over README, docs (ARCHITECTURE/SPEC/ENHANCEMENTS/ROUTINE-LOG), the
latest QA REPORT, `src/lib/registry.ts`, `eventBus.ts`, `appActions.ts`, and recent
git log. State: main green, 26/26 routes mount, QA flags **no** open bugs (the
`/api/files` 500 and `/api/dc/tables` 401 are env-expected). No ROADMAP existed yet —
created `docs/ROADMAP.md` as the single backlog the build routine pulls from.
Top of NOW: emit a `HANDOFF` event from `appActions.ts` so *every* cross-app synapse
lights in the Network mesh (not just →Notes) — the standing next-step from the last
three build runs — then close the loop on the receiving side, unify the design tokens
(one palette for DOM + canvas), and bring the README's stale "21 apps / Hermes" copy
current (25 apps / Cakra). PR on `routine/auto-roadmap-20260620T230454Z`.

(Checkout note: the env's local `main` was stale at `f6e1e74`; fetched + based this
branch on the true `origin/main` `0381aa1` so the roadmap sits on current state.)

---

## 2026-06-20 · Integration run — merged #8 (synapse arcs); reviewed #2

**Integrated:** PR #8 (`routine/auto-20260620T200722Z`, code) — squash-merged to
main after local verification: `npm run build` 🟢 (tsc -b && vite build, PWA precache
56 entries), `npx vitest run` → 21/21 pass, `npx eslint src/apps/network/Network.tsx`
clean. Reviewed the diff: additive and reversible, DOM styled via tokens only (canvas
keeps `rgba()` literals per the file's existing pattern since 2D ctx can't read CSS
vars), no localStorage/schema changes, no Calendar central syncer, one focused
increment. `flowForEvent` only lights an edge for a real `from-<id>` tag (unknown
sources fall back to normal single-app behavior — no false positives).

**Reviewed, not merged:** PR #2 (`packaging/pwa-android-ci`) — non-auto branch, the
user's own packaging work; left for the human (already reviewed a prior run, no new
commits). No action taken.

**Main state:** green and releasable at the #8 squash merge. ⚠️ On-device visual
confirmation still pending (no rendered UI in cloud): the synapse arc / ticker
`source → target` rendering can't be exercised here. Cleanup note: the GitHub MCP
merge and the git proxy in this environment couldn't delete the merged head branch
(`routine/auto-20260620T200722Z` lingers, like a few earlier merged `routine/auto-*`
branches) — safe to prune manually; no effect on main.

**Next step:** broaden `flowForEvent` to the other real handoffs (`SEND_TO_LEARNING`
already emits `LEARNING_LOGGED`; emit a lightweight `HANDOFF` from `appActions.ts` for
the sessionStorage-based transfers) so every synapse lights its edge, not just →Notes.

---

## 2026-06-20 · `routine/auto-20260620T200722Z` — App→app synapse arcs (nodes light each other)

**Increment:** INTERCONNECT. The mesh only ever lit CORE→app links; now a genuine
app→app *handoff* lights a curved link directly between the two instruments — the
exact "next step" queued by the ticker run (e.g. a calc result saved into Notes
lights the **Calculator → Notes** link). Also merged the queued ticker PR (#7) onto
main first so this builds on it.

**Why:** The vision is "one living organism," not a hub-and-spoke. Until now every
signal radiated from CORE. The Empire already has a real cross-app transfer layer
(`src/lib/appActions.ts` · `CROSS_APP_ACTIONS.SEND_TO_NOTES`) that tags the new note
`from-<sourceAppId>` and emits `NOTE_CREATED`. That tag is a real, bus-observable
directed edge — so the mesh can portray actual nerve traffic between apps **without
inventing relationships** (ordinary notes carry `tags:[]`, so there are no false
positives). Honest edges only.

**Changed (`src/apps/network/Network.tsx`):**
- `flowForEvent(e)` — returns `{ fromId, toId }` for a genuine handoff (today:
  `NOTE_CREATED` whose tags contain `from-<id>`, with `<id>` a real app ≠ notes),
  else `null`. One small, extensible seam for future observable app→app events.
- Canvas `Arc` list (capped at `MAX_ARCS=5`): on a handoff the source node also
  flares and an arc is pushed. `frame()` draws each arc as a quadratic-bezier link
  bowed toward CORE (routes *through* the organism), brightness/width ∝ remaining
  life, with a packet sweeping source→target as it settles (`life 1→0 ⇒ p 0→1`),
  decaying to rest in ~1.5 s. Arcs self-prune on expiry / stale indices.
- Ticker + subtitle now render the directed flow as `source → target` (source
  accent dot, `→` in `--text3`, target name) instead of a single instrument; the
  header subtitle reads `▸ signal · Calculator → Notes`.
- Canvas fills stay `rgba()` literals (2D ctx can't read CSS vars — matches the
  file's existing pattern); all DOM styling through tokens. No new i18n needed
  (app names already mapped; `→` is a glyph).

**Verified:** `npm run build` 🟢 (`tsc -b && vite build`, PWA precache 56 entries).
`npx eslint src/apps/network/Network.tsx` clean. `npx vitest run` → 21/21 pass.
No localStorage/schema changes; no Calendar syncer; no new subsystem; additive and
reversible. Respects `prefers-reduced-motion` (renders one frame per event, no RAF).
*Not verifiable here (no rendered UI):* on-device — open **The Network**, then in any
app use the agent bar's **Save to Notes** action (e.g. from Calculator). Watch a
curved packet race **Calculator → Notes** while both nodes flare, and a row glide
into the ticker reading `● Calculator → Notes  now`.

**Next step:** Broaden `flowForEvent` to the other real handoffs once they emit on
the bus — `SEND_TO_LEARNING` (already emits `LEARNING_LOGGED`; thread the source
through it) and the sessionStorage-based ones (Editor/Token-Counter/Prompt-Gen/AI
Chat) by emitting a lightweight `HANDOFF` event from `appActions.ts` — so every
synapse, not just →Notes, lights its edge.

---

## 2026-06-20 · `routine/auto-20260620T183724Z` — Live signal ticker in The Network

**Increment:** INTERCONNECT + POLISH. Turned the Network mesh into a glanceable
activity monitor by adding a live signal ticker — the exact "next step" queued by
the mesh-wiring run.

**Why:** The Network already pulses CORE→app when any cross-app event fires, but the
*what/when* was ephemeral (only a fading subtitle). The ticker gives the organism a
readable nerve-traffic log: the last 6 signals, newest first, each as `● App · verb · age`.
It makes the "one living organism" legible at a glance without opening every app.

**Changed (`src/apps/network/Network.tsx`):**
- `labelForEvent()` — maps all 34 `EmpireEvent` variants to a terse instrument verb
  (`note saved`, `calculated`, `message sent`, `tool run`, …; unknown → `signal`).
- `ago()` — compact relative age (`now`/`12s`/`3m`/`1h`).
- `signals` state (capped at `MAX_SIGNALS=6`), prepended in the existing `onAny`
  handler alongside the flare/lastActive logic — one new entry per real event.
- A 1s `setInterval` that re-renders **only while signals exist** to age the ticker
  (the canvas RAF loop is untouched — its effect deps are unchanged, so the mesh
  animation is undisturbed).
- Ticker overlay: a `.gp` glass panel, bottom-left, `pointerEvents:none` so node
  clicks pass through. Header dot lights `--signal` when active. Each row uses the
  app's registry accent as a glowing dot; rows fade down the stack (opacity ramp);
  the newest row animates in via the existing `.animate-fade-in-up` (skipped under
  `prefers-reduced-motion`). Empty state reads `awaiting signal…` in mono.
- All through tokens (`--space-*`, `--radius-*`, `--text-xs`, `--mono`, `--signal`,
  `--text/2/3`); zero hardcoded colours except the canvas (2D ctx can't read CSS vars).
- i18n: added `network.live` + `network.awaiting` (EN + ID).

**Verified:** `npm run build` 🟢 (`tsc -b && vite build`, PWA precache 56 entries).
`npx eslint` clean on both touched files. `npx vitest run` → 21/21 pass. No
localStorage/schema changes; no Calendar syncer; no new subsystem.
*Not verifiable here (no rendered UI):* on-device — open **The Network**, act in any
app (save a note, do a calc), and watch a new row glide into the bottom-left ticker
(`● Notes · note saved · now`) while the matching node pulses; ages tick up live.

**Next step:** Fold apps into a real shared graph so nodes can also light *each
other* (app→app intents), not just CORE→app — e.g. a calc result that lands in Notes
lights the Calculator→Notes link.

---

## 2026-06-20 — Integration run (PR review & merge)

**Integrated.** Reviewed the 3 open PRs in a fresh cloud checkout.
- **#6 `QA: visual + smoke 2026-06-20`** — docs-only auto PR (screenshots +
  `REPORT.md` + a QA-table row in this log). Verified diff is docs-only, `mergeable`
  clean. **Squash-merged.**
- **#5 `fix(fonts): self-host JetBrains Mono`** — the one code PR this run. Branch was
  far behind main, so merged current main into it and resolved the `ROUTINE-LOG.md`
  add/add conflict. Reviewed: one focused increment (remove CDN `<link>`s, add local
  `@font-face` + 2 vendored woff2), uses the existing `--mono` token, no logic/
  localStorage changes, reversible. `npm run build` 🟢 + `vitest` 21/21; both hashed
  woff2 emit into `dist/assets/` and the built CSS references them. **Squash-merged.**
- **#2 `Package The Empire as installable PWA + Android APK`** — non-`routine/auto-*`
  branch. The packaging is already on main (commit `912f4dc`); the branch is now stale
  and would revert later work if merged. **Review-only — commented, left for the human.**

**Main state.** 🟢 GREEN — build + tests pass post-merge. On-device visual confirmation
of the JetBrains Mono HUD is still pending (no rendered UI in cloud). Note: the env's git
proxy blocks branch-delete (HTTP 403), so the two merged `routine/auto-*` branches remain
and can be pruned manually.

---

## 2026-06-20 · `routine/auto-20260620T131613Z` — Self-host JetBrains Mono (offline-first fix)

**Increment:** FIX + COMPLETE-THE-PWA. Vendored the JetBrains Mono telemetry/code
font locally instead of loading it from the Google Fonts CDN.

**Why:** QA flagged a real, reproducible bug — `fonts.googleapis.com` is unreachable
offline / in the installed PWA, so on the **desktop home `/`** the telemetry HUD text
overlapped and dock labels ran together (mono metrics fell back to a proportional system
font), and every route threw a font-fetch console error. The brand font (Sora) was already
vendored; the mono face was the last external dependency in the type system. Self-hosting
it makes the interface render identically offline — directly on the path to an installable,
offline-capable PWA/APK.

**Changed:**
- Added `src/design-system/fonts/JetBrainsMono-latin.woff2` + `…-latin-ext.woff2`
  (variable woff2, weights 100–800; latin + latin-ext subsets — covers EN/ID).
- `src/design-system/colors_and_type.css`: two `@font-face` rules for JetBrains Mono
  next to the existing Sora faces (same vendored pattern, relative `url('fonts/…')`).
- `index.html`: removed the 4 Google Fonts `<link>` tags (preconnect ×2, preload,
  stylesheet); updated the comment. No more `googleapis`/`gstatic` references in the app.

**Verified (integration run, against current main):**
- `npm run build` → green (`tsc -b && vite build`); Vite emits both hashed `.woff2`
  files into `dist/assets/` and the built CSS references them. Sora `.ttf` still bundles.
- `npx vitest run` → all pass. No remaining CDN font references in the app.
- Merged latest main (packaging + Cakra rebrand) into the branch; resolved the
  `docs/ROUTINE-LOG.md` add/add conflict (this file).
- **Not verifiable here (no rendered UI):** on-device, the desktop `/` HUD should now align
  and read in JetBrains Mono with no console font error, on first load and offline.

**Next step:** Resume the `src/lib/core/*` organism-graph work now that type is fully
local and packaging has landed on main.

---

## 2026-06-20 — Integration run (PR review & merge)

**Integrated.** Reviewed the 3 open PRs in a fresh cloud checkout.
- **#3 `feat(network): wire the mesh to the live event bus`** — verified locally
  (build green via `tsc -b && vite build`, 21/21 vitest pass, eslint clean on all
  touched files), reviewed for design-system/correctness/scope: clean. The one
  DOM-styled element uses the `--signal` token; canvas `rgba()` literals match the
  file's existing pattern (canvas 2D can't read CSS vars). No Calendar syncer, no
  localStorage changes, proper effect cleanup. **Squash-merged to main.**
- **#4 `QA: visual + smoke 2026-06-20`** — QA artifacts (27 screenshots + REPORT.md
  + this log + an inert standalone `scripts/qa-smoke.mjs`). Low-risk auto PR;
  resolved the `docs/ROUTINE-LOG.md` add/add conflict (this file). **Squash-merged.**
- **#2 `Package The Empire as installable PWA + Android APK`** — non-`routine/auto-*`
  branch (user's own packaging work). Review-only, **left for the human** — never
  auto-merged.

**Main state.** 🟢 GREEN — build + tests pass post-merge. On-device visual
confirmation of the Network pulse animation is still pending (no rendered UI in cloud).

---

## 2026-06-20 — Wire the Network mesh to the live event bus

**Did.** The Network app (`src/apps/network/Network.tsx`) was a beautiful but
*inert* node-graph: packets travelled CORE→node on a fixed timer, disconnected
from anything actually happening in the OS. Now the mesh is a live readout of
the organism. Added `onAny()` to `src/lib/eventBus.ts` — a subscribe-to-every-
event hook. Network subscribes to it; each cross-app event resolves to its
instrument (via `appIdForEvent`) and sets that node's `flare` to 1, which:
- fires a bright teal **surge packet** outward from CORE along that link,
- swells the node's radius + glow, brightens/thickens its link,
- makes CORE breathe harder as total activity rises,
- decays smoothly (~1.4s) so the mesh settles back to its calm idle state.
The header subtitle now shows `▸ signal · <App>` in accent colour when a node
fires (falls back to the idle hint after 2.6s). Respects
`prefers-reduced-motion` (renders one frame per event instead of animating).

**Why.** Priority #2 INTERCONNECT. The vision is "one living organism" — the
Network is the literal portrait of that, so it should pulse with *real* nerve
traffic, not a screensaver loop. `onAny` is reusable nervous-system plumbing
for any future whole-graph observer. No new subsystem invented; built on the
existing `eventBus` (the `graph.ts/intents.ts/mirrorCollection` infra named in
the routine brief does not exist in this tree — `eventBus` is the real spine).

**Verified.** `npm run build` green (tsc -b && vite build). `npx vitest run` →
21 passed (added an `onAny` deliver/unsubscribe test). `npx eslint` clean on
all touched files. Event→app mapping covers all 33 `EmpireEvent` variants;
unknown/unmapped ids no-op safely. localStorage schemas untouched.
*Not verified (no rendered UI available):* the on-device visual — described
above for the user to confirm: open **The Network**, then act in another app
(do a calculation, save a note, open any app) and watch a bright pulse race
from CORE to that app's node while the subtitle reads `▸ signal · <App>`.

**Next.** Add a live event ticker/legend to the Network panel (last N signals
as a scrolling list with timestamps + per-app colour), turning the mesh into a
glanceable activity monitor. Then start folding apps into a real shared graph
so nodes can also light *each other* (app→app intents), not just CORE→app.

---

## Visual + Smoke QA runs

Append-only log of unattended cloud QA runs. Newest first.

| UTC datetime | Build | Routes rendered | Notes |
|---|---|---|---|
| 2026-06-20T13:08Z | 🟢 GREEN | 27/27 | All app routes mount; no uncaught JS / error boundaries. Findings: Google Fonts CDN blocked offline (desktop `/` HUD looks rough w/o webfont — cosmetic); `/api/files` 500 (Android path absent) & `/api/dc/tables` 401 (no auth) — both env-expected, UI stable. |
| 2026-06-20T18:09Z | 🟢 GREEN | 26/26 | Desktop + 25 registry apps all mount; no uncaught exceptions / React errors / app-origin request failures. Cakra rebrand confirmed live in UI (Calculator "Cakra" badge, dock labels). **Infra note:** the env's egress policy now blocks `cdn.playwright.dev`, so `npx playwright install` fails (403). Worked around by sourcing a headless Chromium binary from the npm registry (`@sparticuz/chromium`, installed `--no-save`) and driving it with `playwright`. Same env-expected non-bugs as prior run (fonts CDN blocked, `/api/files` 500, `/api/dc/tables` 401). |
| 2026-06-21T04:18Z | 🟢 GREEN | 26/27 | All 26 **registry** apps + desktop shell render cleanly — no uncaught JS / error boundaries. **Finding:** `/app/goals` shows the "App not found" fallback — `goals` is wired in `appComponents.tsx` (and its chunk builds) but is **missing from `registry.ts`**, so the route is orphaned/unreachable from the desktop. Pre-existing, not a new regression. **Tooling fix (this PR):** the smoke script's crash-detection regex only matched Window.tsx's "App not available" and silently passed AppShell.tsx's "App not found" — prior runs false-passed `goals` as ✅. Regex now matches both, so orphaned routes are caught. **Infra note:** `cdn.playwright.dev` still egress-blocked; used the env's pre-installed Chromium at `/opt/pw-browsers` (build 1194) by pinning `playwright@1.56` (`--no-save`). Same env-expected non-bugs: fonts CDN blocked (cosmetic), `/api/files` 500 (Android path absent), `/api/dc/tables` 401 (no auth). |
