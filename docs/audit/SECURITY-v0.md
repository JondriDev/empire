# Security Audit v0 — server.js

**Auditor:** Hermes (foundation stream)
**Date:** 2026-07-06
**Scope:** `server.js` (~2K LOC) — 52 routes
**Method:** static read of route handlers + auth/middleware + tool dispatch

---

## CRITICAL (must-fix before any integration lane ships)

### C1 — `/api/proxy` is unauth and SSRF-prone
- File: server.js:985
- Auth: **none**
- Issue: hits internal helper `isSafeProxyUrl()` (line 977). Trust boundary is the helper. If helper is faulty, attacker-controlled URL → leak.
- **Risk if EMPIRE_HOST=0.0.0.0:** anyone on the LAN hits it.
- **Fix:** gate behind `authMiddleware`, add per-IP rate limit, log every URL hit, return a max body cap.

### C2 — `/api/ai/chat` is unauth
- File: server.js:1001
- Auth: **none**
- Issue: SSE proxy to NVIDIA/OpenRouter/etc. Any unauth caller consumes your API quota and burns money.
- **Fix:** require auth; add per-user + global rate limit; surface call cost in response.

### C3 — `/api/tools/execute` is unauth and grants shell/code/file-write
- File: server.js:1115
- Auth: **none**, gated only by env flag `EMPIRE_ENABLE_DANGEROUS_TOOLS=1`
- Issue: shell_exec + code_exec + file_write operate inside `ALLOWED_BASE` (storage/emulated/0 — your whole SD card). One path-bypass in `safePath()` → RCE on your photos, notes, downloads.
- `safePath()` (line 354) is the wall; it has a known-pitfall pattern (sibling-prefix bypass is checked with trailing sep — *looks* correct, but `userPath` of empty string → returns base, OK).
- **Fix:** require auth even with dangerous-tools disabled; force `EMPIRE_ENABLE_DANGEROUS_TOOLS=1` to imply auth; log all tool calls to a tamper-evident audit table.

## HIGH

### H1 — `/api/files` and `/api/file/download` are unauth
- Files: 942, 954
- Bypass target: `safePath()` is the *only* gate. If EMPIRE_HOST=0.0.0.0, your entire phone is exposed.
- **Fix:** require auth for any file path outside a small public dir.

### H2 — `/api/hermes/{status,skills,mcps}` unauth by design
- Files: 775, 847, 903
- Issue: leaks internal skill/MCP inventory. Low blast radius (read-only) but fingerprints the box.
- **Fix:** auth-gate or strip internal path/error details.

### H3 — static JSON body limit hardened but `/api/tools/execute` not
- 256kb body cap (line 329) is good.
- But `file_write` tool has no size cap — `content` field unbounded. Attacker posts {content:"x".repeat(500MB)} → filled disk.
- **Fix:** per-tool body cap; reject files > N MB.

### H4 — CORS reflects any Origin
- Line 316: `Access-Control-Allow-Origin: <origin>` echoed.
- Pair with token-bearing requests → CSRF/double-submit risk if the JWT lives in a cookie. (Currently looks like bearer header so OK, but defensively lock to known origins once integration lanes ship.)
- **Fix:** explicit allow-list (`http://localhost:3001`, upcoming tunnel URLs) when integrations hit.

## MEDIUM

### M1 — no request-log of sensitive endpoints
- Login + auth + anything hitting `safePath` should be logged to a tamper-evident table.
- **Fix:** add `req_log` table.

### M2 — login rate limit is per-IP, not per-account
- Line 369 limit is 10/15min per IP. VPN attacker rotates through IPs.
- **Fix:** also rate-limit by `username` (after first lookup).

### M3 — JWT default 7d expiry is generous for a personal device
- **Fix:** 24h refresh; PIN re-prompt every cold boot.

## LOW

### L1 — `ALLOWED_BASE` should refuse path components with `..` early
- Defense-in-depth: reject before resolving.
- **Fix:** throw 400 on `..` segments.

---

## LOCKED ACTIONS (foundation stream)

1. Apply **C1–C3 + H1** before ANY new route ships.
2. Add `authMiddleware` to `/api/proxy`, `/api/ai/chat`, `/api/tools/execute`, `/api/files`, `/api/file/download`.
3. Add body-size cap to `file_write`.
4. Add `req_log` table.
5. Update README "Security" with the new posture.

This gate MUST pass before the integrations lane activates.
