# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-22T02:30:46.757Z

**Result:** 27/27 rendered without crash, 0 failed.

**Shell-is-styled:** static CSS assertion ✅ (top-level `.empire-desktop{position:fixed}`, 0 nested under `.hide-sm`); live DOM computed `position:fixed` ✅.

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

### Network / console notes — env-expected (NOT render failures)

- **files** → `GET /api/files?path=/storage/emulated/0` **HTTP 500**: the backend tries to
  read the Android storage root, which doesn't exist in the cloud sandbox. App renders fine.
- **datacenter** → `GET /api/dc/tables` **HTTP 401**: the DataCenter API requires auth; no
  session in headless. App renders fine. Both are authed/Android-only calls, not regressions.

## Fitness metrics (this run)

| Metric | Value | Δ vs prior | Direction |
|---|---|---|---|
| Apps / routes | 26 | ±0 | steady |
| Test cases | 64 | ±0 | ↑ |
| Test files | 8 | ±0 | ↑ |
| Token violations | 503 | ±0 | ↓ |
| Bundle gz (KB) | 236.1 | ±0 | ↓ |

No code changed on `main` since #23 (EPIC-1 S1), so the machine metrics are flat — expected.

### Manual / organism rows (QA-measured)

- **Routes rendering clean: 26 / 26** ✅ (every app route + desktop shell rendered with no
  uncaught JS / error boundary / blank screen; shell styled both statically and at runtime).
- **Apps fully wired both-ways (emit AND receive honest handoffs): 3 / 26.**
  Honest code audit of `src/lib/appActions.ts` + `<NodeActions>` + `useInboundHandoff`:
  - **Emit-capable (render ⚡ Send-to / `<NodeActions>`): 10/26** — artifacts(Kanban),
    calendar, datacenter, files, goals, learning-tracker, messages, notes, photos,
    prompt-generator.
  - **Receive-capable: 6/26** — editor, token-counter, prompt-generator, ai-chat (provenance
    chip, S1) + notes, learning-tracker (in-place create via `NOTE_CREATED`/`LEARNING_LOGGED`).
  - **Both emit AND receive: 3/26** — prompt-generator, notes, learning-tracker.
  The gap to 26/26 is exactly what EPIC-1 S2–S6 target (S2 widens emit; S6 wires the rest).

## EPIC-1 acceptance — confirmation

**Active epic:** EPIC-1 · Organism Completeness. **Last shipped stage:** S1 (inbound
provenance, #23). **Next stage:** S2 (every app emits on transfer) — not yet shipped.

**S1 acceptance CONFIRMED end-to-end (headless).** Seeded each receiver's
`sessionStorage` clipboard with a `{from:<source>}` payload, navigated to the app, and
asserted the "From <source>" provenance chip rendered:

| Receiver | Seeded source | Chip rendered |
|---|---|---|
| token-counter | calculator | ✅ |
| prompt-generator | notes | ✅ |
| ai-chat | editor | ✅ |
| editor | datacenter | ✅ |

The receive-half of the cross-app HANDOFF rail is live and visible. **No new stage shipped
this run, so no new metric movement to confirm** — S2 will move the emit/both-ways rows above.

## Screenshots

See PNGs in this folder. `desktop.png` is the shell; `app-<id>.png` is each app route.
