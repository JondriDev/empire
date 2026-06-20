# Routine Log — Visual & Smoke QA

Append-only log of unattended cloud QA runs. Newest first.

| UTC datetime | Build | Routes rendered | Notes |
|---|---|---|---|
| 2026-06-20T13:08Z | 🟢 GREEN | 27/27 | All app routes mount; no uncaught JS / error boundaries. Findings: Google Fonts CDN blocked offline (desktop `/` HUD looks rough w/o webfont — cosmetic); `/api/files` 500 (Android path absent) & `/api/dc/tables` 401 (no auth) — both env-expected, UI stable. |
