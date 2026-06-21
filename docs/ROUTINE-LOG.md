# Routine Log — The Empire

Autonomous build/refinement journal. Newest entry first. Each entry = one
increment: what changed, why, what's verified, and the single best next step.

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
