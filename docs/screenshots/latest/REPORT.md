# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-22T08:04:09.446Z

**Result:** 27/27 rendered without crash, 0 failed.

## No runtime bugs found this run

Build 🟢, SHELL-IS-STYLED ✅, all 26 app routes + desktop shell render clean and styled
(XENO palette, app grid, clock all present in `desktop.png`; The Network shows CORE + all
satellites in `app-network.png`). The two network notes below are **env-expected**, not bugs:
- `files` → `/api/files?path=/storage/emulated/0` **HTTP 500** — Android-only filesystem path; expected on the cloud server.
- `datacenter` → `/api/dc/tables` **HTTP 401** — authed API (no logged-in session in headless); expected.

## Metric deltas (vs last QA / #23)

| Metric | Value | Δ |
|---|---|---|
| Routes rendering clean | **26 / 26** (27/27 incl. desktop) | ±0 ✅ |
| Apps fully wired both-ways | **1 / 26** (only `prompt-generator`) | ±0 |
| Test cases | 64 | ±0 |
| Token violations | 503 | ±0 |
| Bundle gz (KB) | 236.1 | ±0 |

All auto metrics are **flat** — no integration has merged to main since #23 (EPIC-1 S1).

## Epic-acceptance confirmation — EPIC-1, next stage S2

- **S1 (inbound provenance):** previously confirmed shipped; still holding (Editor/TokenCounter/PromptGen/AIChat render with their receiver code intact).
- **S2 (every app emits on transfer):** **NOT shipped yet → its target metric has not moved** (apps-fully-wired still 1/26). This is *pending*, **not a contradiction**. Code audit of `src/lib/appActions.ts` confirms the design described in CONTEXT.md is unchanged: navigating transfers call `handoff()` (emit `HANDOFF`); the two in-place transfers still emit typed events (`NOTE_CREATED`, `LEARNING_LOGGED`) instead of `HANDOFF`. S2's decision (uniform HANDOFF vs. "exactly one arc-bearing event") is still open for the Builder.

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
