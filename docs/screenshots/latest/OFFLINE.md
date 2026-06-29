# Empire QA — Offline-boot guard (EPIC-4 S1)

**Generated:** 2026-06-29T13:06:09.659Z

## Precache audit

SW precache manifest: **63 entries**. Emitted chunks: **37 JS + 2 CSS**.

✅ **No gap** — every emitted JS/CSS chunk is in the SW precache, so a cold offline boot can serve the shell + all 25 lazy app routes.

## Cold-offline boot (network fully blocked via setOffline)

| Route | Renders offline |
|---|---|
| / | ✅ |
| /app/clock | ✅ |
| /app/maps | ✅ |
| /app/network | ✅ |
| /app/photos | ✅ |

**Cold-offline boot: 5/5 ✅**
