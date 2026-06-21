# The Empire — Visual + Smoke QA Report

- **Run (UTC):** 2026-06-21 13:04
- **Commit under test:** `12e0180` (current `main`)
- **Build:** ✅ GREEN — `tsc -b && vite build` succeeded (PWA precache 56 entries)
- **Renderer:** Playwright 1.56.1 + pre-installed Chromium (build 1194, headless), viewport 1440×900
- **Result:** **26 / 27 routes render without crash** — all 25 registered apps + the desktop shell pass; the only non-render is the orphaned `/app/goals` route (known, see below). No uncaught JS exceptions anywhere.

> **PASS** = app rendered with no uncaught exception / error boundary / blank screen.
> Backend API calls that need auth or a real device filesystem return errors in
> the cloud sandbox — listed separately, **not** render failures.

## Pass / Fail table

| App | Route | Render | Console notes |
|-----|-------|:------:|---------------|
| Desktop shell | `/` | ✅ | clean |
| Cakra Agent | `/app/ai-agent` | ✅ | clean |
| Calculator | `/app/calculator` | ✅ | clean |
| Calendar | `/app/calendar` | ✅ | clean |
| Clock | `/app/clock` | ✅ | clean |
| Weather | `/app/weather` | ✅ | clean |
| Grammar Fix | `/app/grammar` | ✅ | clean |
| Language Lab | `/app/language` | ✅ | clean |
| Music | `/app/music` | ✅ | clean |
| Video | `/app/video` | ✅ | clean |
| Files | `/app/files` | ✅ | `GET /api/files` → 500 (no device FS in sandbox; env-only) |
| Cache Cleaner | `/app/cache` | ✅ | clean |
| Browser | `/app/browser` | ✅ | clean |
| Code Editor | `/app/editor` | ✅ | clean |
| Notes | `/app/notes` | ✅ | clean |
| Photos | `/app/photos` | ✅ | clean |
| Data Center | `/app/datacenter` | ✅ | `GET /api/dc/...` → 401 (not logged in; env-only) |
| Maps | `/app/maps` | ✅ | clean |
| Messages | `/app/messages` | ✅ | clean |
| Prompt Gen | `/app/prompt-generator` | ✅ | clean |
| Token Counter | `/app/token-counter` | ✅ | clean |
| Learning Tracker | `/app/learning-tracker` | ✅ | clean |
| Cakra CC | `/app/hermes-cc` | ✅ | clean |
| AI Chat | `/app/ai-chat` | ✅ | clean |
| Artifacts | `/app/artifacts` | ✅ | clean |
| Network | `/app/network` | ✅ | clean — node-graph + live-signal ticker render |
| ~~Goals~~ (orphan) | `/app/goals` | ❌ "App not found" | clean |

## Notable findings

1. **Orphaned `goals` route (known, unchanged from prior runs).** `Goals` is in
   `src/lib/appComponents.tsx` (built as a `Goals-*.js` chunk) but is **not** in
   `src/lib/registry.ts`. `AppShell` requires *both* a registry `appDef` and a
   component, so `/app/goals` renders **"App not found"** and the app is
   unreachable from the desktop/dock — dead weight, not a regression. The fix is
   a one-liner (add a `goals` entry to the registry) or delete the component;
   left for the reviewer to decide product intent. **No runtime bug.**

## Environmental noise (NOT app bugs — caused by the headless sandbox)

- **Files `500` / Data Center `401`:** backend API calls that need a real
  `EMPIRE_ROOT` device filesystem and an authenticated session; neither exists
  in the ephemeral QA container. Expected; would work on a real device.

## Verdict

**main (`12e0180`) is GREEN and runs.** All 25 registered apps and the desktop
shell render cleanly with no uncaught exceptions and no external-resource
errors. The single ❌ is the long-standing orphan `goals` route (cosmetic dead
code). Per-app screenshots are in this folder.
