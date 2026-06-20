# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-20T13:08:11.755Z

**Result:** 27/27 rendered without crash, 0 failed.

> **PASS** = the app rendered with no uncaught JS exception / error boundary / blank screen.
> Network & console noise (failed external CDN fetches, backend API calls needing auth) is
> listed separately — expected in the offline cloud sandbox and **not** a render failure.

| App | Render | Uncaught JS / crash | Network / console notes |
|---|---|---|---|
| desktop | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_CERT_AUTHORITY_INVALID) |
| calculator | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| calendar | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| clock | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| weather | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| grammar | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| language | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| music | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| video | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| files | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED)<br>/api/files?path=%2Fstorage%2Femulated%2F0 → HTTP 500 |
| cache | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| browser | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| editor | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| notes | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| photos | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| datacenter | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED)<br>/api/dc/tables → HTTP 401 |
| maps | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| messages | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| prompt-generator | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| token-counter | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| learning-tracker | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| ai-agent | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| ai-chat | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| goals | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| hermes-cc | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| artifacts | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |
| network | ✅ | — | https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap (net::ERR_FAILED) |

## Screenshots

See PNGs in this folder. `desktop.png` is the shell; `app-<id>.png` is each app route.

## Notable findings

1. **Google Fonts (JetBrains Mono) is loaded from a CDN** and fails in the offline
   cloud sandbox (every route shows the `fonts.googleapis.com` fetch failing). Apps
   fall back to system fonts and render fine, but the **desktop home (`/`) looks rough**
   — the top-left telemetry HUD text overlaps and the dock labels run together
   (see `desktop.png`). App routes (e.g. `calculator`, `network`) look polished, so
   this is cosmetic/font-related, not a crash. Worth a human eye; self-hosting the
   font would also remove the per-route console error.
2. **`/api/files` → HTTP 500** (Files app): the server reads the Android path
   `/storage/emulated/0`, which doesn't exist in the cloud sandbox. Expected here;
   the UI handles it without crashing.
3. **`/api/dc/tables` → HTTP 401** (Data Center): backend call needs an auth token
   we don't have unattended. Expected; UI renders its empty/locked state cleanly.

None of the above are runtime regressions — all 27 routes mount without uncaught
exceptions or error boundaries.
