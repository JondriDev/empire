# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-20T23:14:04.681Z

**Result:** 27/27 rendered without crash, 0 failed.

> **PASS** = the app rendered with no uncaught JS exception / error boundary / blank screen.
> Network & console noise (failed external CDN fetches, backend API calls needing auth) is
> listed separately — expected in the offline cloud sandbox and **not** a render failure.

| App | Render | Uncaught JS / crash | Network / console notes |
|---|---|---|---|
| desktop | ✅ | — | — |
| calculator | ✅ | — | — |
| calendar | ✅ | — | — |
| clock | ✅ | — | — |
| weather | ✅ | — | — |
| grammar | ✅ | — | — |
| language | ✅ | — | — |
| music | ✅ | — | — |
| video | ✅ | — | — |
| files | ✅ | — | /api/files?path=%2Fstorage%2Femulated%2F0 → HTTP 500 |
| cache | ✅ | — | — |
| browser | ✅ | — | — |
| editor | ✅ | — | — |
| notes | ✅ | — | — |
| photos | ✅ | — | — |
| datacenter | ✅ | — | /api/dc/tables → HTTP 401 |
| maps | ✅ | — | — |
| messages | ✅ | — | — |
| prompt-generator | ✅ | — | — |
| token-counter | ✅ | — | — |
| learning-tracker | ✅ | — | — |
| ai-agent | ✅ | — | — |
| ai-chat | ✅ | — | — |
| goals | ✅ | — | — |
| hermes-cc | ✅ | — | — |
| artifacts | ✅ | — | — |
| network | ✅ | — | — |

## Screenshots

See PNGs in this folder. `desktop.png` is the shell; `app-<id>.png` is each app route.

## Notes (this run)

- **Desktop shell was rendering completely unstyled** (HUD telemetry stacked top-left,
  app names as a flat text band, no grid/dock) on a clean build of `main`. Root cause:
  a comment typo in `src/design-system.css` — the doc line `(--bg/--text*/--grad/--holo-*/--nav-* …)`
  contained `*/` sequences (`--text*/`, `--holo-*/`) that **closed the comment early**,
  spilling malformed CSS and two stray `*/` tokens that knocked the parser's brace-matching
  off by a level. Every `.empire-*` rule got absorbed into `@media(max-width:640px){.hide-sm …}`
  and never applied. **Fixed in this PR** (spaces added around the glob slashes — comment-only,
  zero behavioral risk). Individual apps were unaffected (they use Tailwind utilities), which
  is why the build stayed green and only the shell broke. The `desktop.png` here is the
  post-fix render.
- `goals` route shows "App not found" — `/app/goals` is **not** in `src/lib/registry.ts`
  (the closest app is `learning-tracker`). This is a stale id in the smoke harness's route
  list, not a product regression. `app-goals.png` captures the graceful fallback.
- `files` → HTTP 500 and `datacenter` → HTTP 401 are **expected** backend responses in the
  cloud sandbox: `files` reads `/storage/emulated/0` (Android path, absent here) and
  `datacenter` calls an authed endpoint without a logged-in session. Neither is a render failure.
