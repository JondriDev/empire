# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-23 (post-S6b, commit `b6cd0c3`) · Build 🟢 GREEN (`tsc -b && vite build`)

**Result:** 28/28 rendered without crash, 0 failed. **No runtime bug found.**

> **PASS** = the app rendered with no uncaught JS exception / error boundary / blank screen.
> Network & console noise (failed external CDN fetches, backend API calls needing auth) is
> listed separately — expected in the offline cloud sandbox and **not** a render failure.

## Harness guards (pre-render)
- **SHELL-IS-STYLED ✅** — built CSS has top-level `.empire-desktop{…position:fixed…}`, 0 `.hide-sm .empire-desktop` (blank-dark trap clear).
- **REGISTRY-COVERAGE ✅** — all 27 registry apps are in the smoke list (none silently skipped).
- **vitest 100/100 🟢** (14 files), incl. S6b `SendResultMenu.test.tsx` (3).

## Epic-acceptance — EPIC-1 S6b (Editor / Token-Counter / AI-Chat emit onward) · **CONFIRMED LIVE**
S6b's claim was that the three dead-end sinks now *emit onward* via the shared `SendResultMenu`,
moving **both-ways 3 → 6**. Verified headless in the running app (`editor-send-menu.png`):
- The Editor's **"Send code to…"** button is **disabled when the buffer is empty**, **enabled** once code is typed.
- Opening it lists **4 targets — Send to Notes / Use as Prompt / Ask Hermes / Count Tokens** — and
  **excludes Editor itself** (no self-handoff; `ACTION_TARGET` filter working live, not just in the unit test).
- Token-Counter ("Send text to…") and AI-Chat ("Send reply to…") use the **same component** with their
  own `source`; the HANDOFF emission (`fromId` = the sink) is asserted by `SendResultMenu.test.tsx` (3 passing).
- **Cloud limit (honest):** the resulting source→target *arc in The Network* needs a seeded graph + a
  cross-page navigation to observe, so the arc itself is not screenshotted; the live affordance + the
  unit-tested handoff together confirm the metric moved. → **both-ways now 6 / 9 entity-apps-with-inbound.**

## Metric deltas (vs post-S6a snapshot, commit `d066e80`)
| Metric | post-S6a | now (post-S6b) | Δ |
|---|---|---|---|
| Apps / routes | 27 | 27 | ±0 |
| Test cases (static / vitest) | 93 / 97 | 96 / **100** | +3 / +3 |
| Test files | 13 | 14 | +1 (`SendResultMenu.test.tsx`) |
| Design-token violations | 501 | **501** | ±0 (hover tints use `color-mix`, not raw rgba) |
| Bundle gz (KB) | 240.9 | 242.8 | +1.9 (the `SendResultMenu` chunk wired into 3 apps) |
| Routes rendering clean | 27/27 | **27/27** (28/28 incl. desktop) | ±0 ✅ |
| Apps wired both-ways | 3/26 | **6/9 entity-apps-with-inbound** | +3 (S6b) |

## Pass/fail table
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
| files | ✅ | — | /api/files?path=%2Fstorage%2Femulated%2F0 → HTTP 500 (Android-only path, env-expected) |
| cache | ✅ | — | — |
| browser | ✅ | — | — |
| editor | ✅ | — | — |
| notes | ✅ | — | — |
| photos | ✅ | — | — |
| datacenter | ✅ | — | /api/dc/tables → HTTP 401 (authed API, no headless session, env-expected) |
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

## Env-expected noise (NOT bugs)
- `files` → `/api/files?path=/storage/emulated/0` HTTP 500 — Android-only device path absent in the cloud sandbox.
- `datacenter` → `/api/dc/tables` HTTP 401 — authed backend API, no headless session.

## Screenshots
`desktop.png` (shell) · `app-<id>.png` (each of 27 routes) · `editor-send-menu.png` (S6b emit-onward confirmation).
Retained feature demos from prior confirmed stages: `notes-provenance.png` / `learning-provenance.png` (S6a),
`inbox-populated.png` (S5), `palette.png` (S4).
