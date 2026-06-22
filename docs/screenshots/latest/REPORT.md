# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-22T06:53:07.016Z

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

---

## Metric deltas (vs prior main, #23)

| Metric | Value | Δ |
|---|---|---|
| Apps / routes | 26 | ±0 |
| Test cases | 64 | ±0 |
| Test files | 8 | ±0 |
| Design-token violations | 503 | ±0 |
| Bundle gz (KB) | 236.1 | ±0 |

No integration has landed since the #23 QA run, so the auto metrics are flat.

**Manual rows:**
- **Routes rendering clean: 26/26** ✅ (27/27 incl. desktop shell). SHELL-IS-STYLED assertion passed: built CSS has a top-level `.empire-desktop{…position:fixed…}` and **0** `.hide-sm .empire-desktop` (blank-dark trap clear). Visually confirmed: desktop HUD + Network mesh are fully styled (XENO palette), not blank-dark.
- **Apps fully wired both-ways: 1/26** — only `prompt-generator` both emits (`NodeActions`/`mirrorCollection`) and receives (`useInboundHandoff`). Emit-only: 10 apps; receive-only: 4 apps. This is the headline gap EPIC-1 exists to close.

## Epic-acceptance confirmation (EPIC-1 · Organism Completeness)

- **Active stage S2** (every app emits on transfer) is **NOT yet shipped** — its target metric (every cross-app action lights a directed arc) has therefore **not moved** this run. No contradiction; simply pending the Builder.
- **Last shipped stage S1** (inbound provenance chips) remains confirmed: the 4 receivers (Editor, Token Counter, Prompt Gen, AI Chat) carry `useInboundHandoff` + `<ProvenanceChip>` and render clean.
- **Routes-rendering target (26/26) holds.** ✅

## Env-expected non-bugs (not regressions)

- `/api/files?path=/storage/emulated/0` → HTTP 500 (no Android filesystem in the cloud sandbox).
- `/api/dc/tables` → HTTP 401 (DataCenter backend needs auth; none headless).
- Both are backend/device-only paths; the UIs render and degrade gracefully.

## Notes

- `goals` route renders clean and is in `registry.ts` — the earlier "orphan `/app/goals`" finding is **resolved** (retired from CONTEXT follow-ups).
- The Network shows "0 nodes" headless because there is no persisted user data in a fresh checkout (no localStorage). Satellites still render; not a bug.
- **No runtime bug found this run.**
