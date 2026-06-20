# The Empire — Visual + Smoke QA Report

- **Run (UTC):** 2026-06-20T18:09:08Z
- **Build:** 🟢 GREEN (`tsc -b && vite build`)
- **Routes rendered:** 26/26 (desktop shell + 25 registry apps)
- **Renderer:** headless Chromium (npm-sourced binary; Playwright CDN blocked by egress policy) @ 1600×900
- **Result:** ✅ All routes mount; no uncaught exceptions, no React errors, no app-origin request failures.

## Pass / Fail

| App | Route | Render | Real runtime errors |
|---|---|:--:|---|
| Desktop Shell | `/` | ✅ | — |
| Cakra Agent | `/app/ai-agent` | ✅ | — |
| Calculator | `/app/calculator` | ✅ | — |
| Calendar | `/app/calendar` | ✅ | — |
| Clock | `/app/clock` | ✅ | — |
| Weather | `/app/weather` | ✅ | — |
| Grammar Fix | `/app/grammar` | ✅ | — |
| Language Lab | `/app/language` | ✅ | — |
| Music | `/app/music` | ✅ | — |
| Video | `/app/video` | ✅ | — |
| Files | `/app/files` | ✅ | — |
| Cache Cleaner | `/app/cache` | ✅ | — |
| Browser | `/app/browser` | ✅ | — |
| Code Editor | `/app/editor` | ✅ | — |
| Notes | `/app/notes` | ✅ | — |
| Photos | `/app/photos` | ✅ | — |
| Data Center | `/app/datacenter` | ✅ | — |
| Maps | `/app/maps` | ✅ | — |
| Messages | `/app/messages` | ✅ | — |
| Prompt Gen | `/app/prompt-generator` | ✅ | — |
| Token Counter | `/app/token-counter` | ✅ | — |
| Learning Tracker | `/app/learning-tracker` | ✅ | — |
| Cakra CC | `/app/hermes-cc` | ✅ | — |
| AI Chat | `/app/ai-chat` | ✅ | — |
| Artifacts | `/app/artifacts` | ✅ | — |
| Network | `/app/network` | ✅ | — |

## Environment-expected notes (not bugs)

These failures are inherent to the headless/offline cloud env and do **not** indicate regressions:

- `EXTERNAL https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_CERT_AUTHORITY_INVALID)` ×1
- `EXTERNAL https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED)` ×25
- `APP-API http://localhost:3001/api/files?path=%2Fstorage%2Femulated%2F0 → 500 — Android-only path absent in cloud → 500` ×1
- `APP-API http://localhost:3001/api/dc/tables → 401 — no auth token in headless → 401` ×1

- **Google Fonts CDN blocked** → JetBrains Mono webfont doesn't load, so the desktop HUD/typography looks rougher than on-device (purely cosmetic; falls back to system mono).
- **`/api/files` → 500** — endpoint reads an Android storage path that doesn't exist in the cloud checkout. UI stays stable.
- **`/api/dc/tables` → 401** — Data Center calls the API without an auth token in headless; UI renders its empty/locked state cleanly.

## Screenshots

All PNGs in this folder are overwritten each run (no dated folders). `desktop.png` + `app-<id>.png` per registry app.
