# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-22T23:04:48.439Z

**No runtime bug found this run.** Main is GREEN; all 27 apps + the desktop shell render clean.

## TL;DR — metric deltas & epic acceptance (this run)

- **Routes rendering clean: 27/27 ✅** (28/28 incl. desktop shell). SHELL-IS-STYLED ✅ and the
  **new REGISTRY-COVERAGE guard** ✅ (all 27 registry apps are in the smoke list — added this run so a
  future app can't silently skip the smoke test). vitest **96/96 🟢** (13 files).
- **Apps fully wired BOTH-ways: 1/27 (unchanged)** — only `prompt-generator` emits AND receives.
  S5 (Inbox) added an 11th *emitter* but no receiver, so the headline overlap is flat. **Closing it is S6 (not started).**
- **EPIC-1 S5 (Inbox / Today view) — acceptance CONFIRMED LIVE.** Seeded 3 `task` nodes into
  `empire-core-graph` (open from Calculator, done from Notes, open from Goals); the Inbox app surfaced
  **all three** with their source-app chips and 0 page errors. Captured as `inbox-populated.png`. This is a
  stronger confirmation than prior runs (which only had the empty-graph state + unit tests). The EPIC-1
  **headline metric (both-ways 1/27) is still PENDING — needs S6.**
- **Auto metric deltas vs last QA (post-S4):** apps 26→27 (+1, inbox), test files 12→13 (+1, `tasks.test.ts`),
  vitest 92→96 (+4), token-violations **501 (±0** — Inbox is pure tokens), bundle gz 238.9→240.5 (+1.6).
  All deltas from S5 (commit a4f60a7).
- **Env-expected net noise (not bugs):** files `/api/files?path=/storage/emulated/0`→500 (Android-only path),
  datacenter `/api/dc/tables`→401 (authed API, no headless session).

**Result:** 28/28 rendered without crash, 0 failed.

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
| inbox | ✅ | — | — |

## Screenshots

See PNGs in this folder. `desktop.png` is the shell; `app-<id>.png` is each app route.
`inbox-populated.png` is the S5 acceptance shot (Inbox showing 3 seeded tasks across Calculator/Notes/Goals).
