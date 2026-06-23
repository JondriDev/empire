# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-23 (post-S6a green main)

**Result:** 28/28 rendered without crash, 0 failed. **No runtime bugs found.**

> **PASS** = the app rendered with no uncaught JS exception / error boundary / blank screen.
> Network & console noise (failed external CDN fetches, backend API calls needing auth) is
> listed separately — expected in the offline cloud sandbox and **not** a render failure.

## Headline

- **Build:** 🟢 green (`tsc -b && vite build`). **vitest:** 🟢 97/97 (13 files).
- **SHELL-IS-STYLED:** ✅ top-level `.empire-desktop{…position:fixed…}`, 0 `.hide-sm .empire-desktop` (blank-dark trap clear).
- **REGISTRY-COVERAGE:** ✅ all 27 registry apps are in the smoke list.
- **Routes rendering clean: 27/27** (28/28 incl. desktop shell).
- **Epic-acceptance (EPIC-1 · S6a): CONFIRMED LIVE** — see below. **both-ways 1/27 → 3/27.**

## Epic-acceptance confirmation — EPIC-1 S6a (Notes + Learning provenance)

S6a's target was to make the two *silent in-place receivers* legible so they count as
both-ways. Confirmed **live, not just by code audit**: I seeded `empire-store` with a note
carrying a `from-calculator` tag and a learning item with `from:'notes'`, reloaded, and
captured the render.

- **Notes** — the "Imported snippet" card renders a dismissible **"From Calculator"**
  `ProvenanceChip` (source-accent) while the user's own `SNIPPET` tag is preserved.
  → `docs/screenshots/latest/notes-provenance.png`
- **Learning Tracker** — the "Spaced repetition" item renders a dismissible **"From Notes"**
  chip. → `docs/screenshots/latest/learning-provenance.png`
- 0 page errors on both. `appActions.test.ts` asserts `SEND_TO_LEARNING` persists
  `from === data.source`.

**Result:** apps fully wired both-ways climbed **1 → 3** (prompt-generator + **notes** +
**learning-tracker** now both emit AND legibly receive). EPIC-1 next stage is **S6b** (make the
three dead-end sinks Editor / Token-Counter / AI-Chat emit onward → both-ways 3→6), not yet started.

## Metric deltas (this run vs. recorded S6a snapshot)

Auto-metrics are **±0** — this run QA-confirms the already-committed S6a; no new code landed.

| Metric | Value | Δ |
|---|---|---|
| Apps / routes | 27 | ±0 |
| Test cases (vitest run) | 97 (93 static) | ±0 |
| Test files | 13 | ±0 |
| Design-token violations | 501 | ±0 |
| Bundle gz (KB) | 240.9 | ±0 |

Manual rows (`docs/METRICS.md`): Routes rendering clean **27/27** ✅; Apps both-ways **3/27**
(honest EPIC-1 target = 9/9 entity-apps-with-inbound).

## Env-expected network noise (NOT bugs)

- `files`: `/api/files?path=%2Fstorage%2Femulated%2F0` → HTTP 500 (Android-only storage path).
- `datacenter`: `/api/dc/tables` → HTTP 401 (authed backend API; no headless session).

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
`notes-provenance.png` / `learning-provenance.png` are the S6a live-chip confirmations.
