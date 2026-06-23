# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-23T13:16:35.095Z · green main `6435a81`

**Result:** 28/28 rendered without crash, 0 failed. **No runtime bugs found.**

## 🎯 Headline — EPIC-1 (Organism Completeness) DONE: both-ways **9/9** entity-apps-with-inbound

**EPIC-1 S6c CONFIRMED LIVE.** The new permanent **Inbound-lands guard** (in `scripts/qa-smoke.mjs`,
table below) seeds each `empire-<x>-clipboard` payload the way `appActions.ts` `SEND_TO_<X>` does,
reloads, and asserts the receiver shows a **"Received from …" ProvenanceChip** AND **prefilled a real
control** — **3/3 ✅** (`s6c-inbound-{calendar,goals,messages}.png`):

| Receiver | From | ProvenanceChip | Prefilled field |
|---|---|---|---|
| **Calendar** | editor | ✅ | New-Event title "Quarterly planning sync", date=today, desc |
| **Goals** | notes | ✅ | New-Goal title/desc "Ship the organism epic" |
| **Messages** | ai-chat | ✅ | composer draft "Heads up: deploy at 5pm" |

With Notes / Learning / Prompt-Gen (S6a) + Editor / Token-Counter / AI-Chat (S6b) already both-ways,
the entity emit↔receive loop is **CLOSED: both-ways = 9/9 entity-apps-with-a-natural-inbound**
(files/photos/datacenter + tool apps stay emit-only *by design*). **EPIC-1's target metric hit → EPIC-1
DONE; EPIC-2 (design-token violations 501 → 0) promoted to ACTIVE.** *Cloud limit:* the source→target
Network arc needs a seeded graph + cross-page nav, so the arc itself isn't screenshotted (receiver-side
provenance + prefill is the live proof).

### Metric deltas (vs prior QA `b6cd0c3` → now `6435a81`)

| Metric | Prior (post-S6b) | Now (post-S6c) | Δ |
|---|---|---|---|
| Routes rendering clean | 28/28 (incl. desktop) | 28/28 (incl. desktop) | ±0 ✅ |
| Apps both-ways into organism | 6/9 entity-apps-with-inbound | **9/9 entity-apps-with-inbound** | **+3 → target hit** |
| Test cases (vitest run) | 100 / 14 files | **103 / 14 files** | +3 (S6c `appActions` HANDOFF cases) |
| Design-token violations | 501 | 501 | ±0 |
| Bundle gz (KB) | 242.8 | 243.5 | +0.7 (S6c inbound code) |

SHELL-IS-STYLED ✅ · REGISTRY-COVERAGE ✅ (27 apps) · INBOUND-LANDS ✅ (3/3) · vitest **103/103 🟢**.

### Env-expected net noise (not bugs)
- `files`: `/api/files?path=/storage/emulated/0` → HTTP 500 (Android-only storage path).
- `datacenter`: `/api/dc/tables` → HTTP 401 (authed API, no headless session).

---

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

## Inbound-lands guard (organism emit↔receive loop)

Each entity receiver was seeded with a cross-app payload + reloaded; PASS = a "Received from <source>" chip rendered AND a control was prefilled.

| Receiver | From | Chip | Prefilled | Result |
|---|---|---|---|---|
| calendar | editor | ✅ | ✅ | ✅ |
| goals | notes | ✅ | ✅ | ✅ |
| messages | ai-chat | ✅ | ✅ | ✅ |

## Screenshots

See PNGs in this folder. `desktop.png` is the shell; `app-<id>.png` is each app route.
