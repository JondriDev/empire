# Routine Log — The Empire

Autonomous build/refinement journal. Newest entry first. Each entry = one
increment: what changed, why, what's verified, and the single best next step.

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
