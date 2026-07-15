# Visual + Smoke QA — 2026-07-15 (green main `ea2aef2`)

**No runtime bug found.** main RUNS clean: build 🟢, 32/32 routes render without a
crash, all guards green, all six conformance axes 0 & LOCKED (`--assert-zero` exit 0).

## Headline

- **Build:** `tsc -b && vite build` 🟢 — PWA precache **89 entries** (3142 KiB), no gap.
- **Smoke (`node scripts/qa-smoke.mjs`):** **32/32 passed, 0 failed** (desktop shell + 31 registry apps).
- **Metrics ratchet:** `node scripts/metrics.mjs --assert-zero` **exit 0** — all six axes 0 & LOCKED.
- **Visual inspection (local only, never committed):** desktop + Network render fully styled and legible
  (SHELL-IS-STYLED confirmed by eye — greeting, cockpit tiles, "Needs you" feed, full app dock;
  Network CORE hub + satellites + node-type legend + Memory/Live-Signal panels).

## Active-epic acceptance — EPIC-19 · The organism relates (`RELATED` target)

- **S1 (pure `src/lib/core/related.ts` engine — measure-only) DONE & CONFIRMED.** `npx vitest run related`
  → **17/17 green**; `relatedTo`/`significantTerms` exported + typed; `--assert-zero` exit 0 (six axes 0).
- **Target metric `RELATED 0 → 5/5` has NOT moved yet — EXPECTED, no contradiction.** The `RELATED` guard is
  authored only at **S4**; S1 is the pure spine and drives no UI, so no relatedness surface exists to guard yet
  (mirrors every prior epic's measure-only S1). S2 (mount `<RelatedConstellation>` on the Network inspector)
  → S3 (Timeline + Search) → S4 (guard + lock) still ahead.
- **Bug Hunter fix `ea2aef2` verified holding:** `relatedTo` same-day bucketing now uses the canonical **local**
  `dayStamp` (not UTC `toISOString()`); TZ-forced regression tests are part of the 17 green cases.

## Pass/fail table

| Route / guard | Result | Notes |
|---|---|---|
| desktop shell (`/`) | ✅ | fully styled; SHELL-IS-STYLED green |
| 31 registry apps | ✅ 31/31 | 0 uncaught JS · 0 error boundaries · none blank |
| SHELL-IS-STYLED | ✅ | top-level `.empire-desktop` styled; no blank-dark trap |
| REGISTRY-COVERAGE | ✅ | smoke ↔ registry exact at 31 apps (32 routes incl. desktop) |
| INBOUND-LANDS | ✅ 4/4 | calendar·goals·messages·mail — chip + prefilled |
| MEDIA-PERSISTS | ✅ 3/3 | music·video·photos — added + survived reload (IDB) |
| GRAPH-LEGIBLE | ✅ 3/3 | reader/book · crypto/wallet · mail/draft — node + persisted |
| GLOBAL-SEARCH | ✅ 1/1 | book·task·twoApps·tagOnly (groups reader,goals) |
| NODE-LINEAGE | ✅ 1/1 | rendered·title·persisted·search·clickable |
| INTENT-ROUNDTRIP | ✅ 2/2 | make-note-from · add-to-learning (stored·mirrored·persisted) |
| TIMELINE | ✅ 1/1 | ordered·grouped·flow·persisted·filtered·descendants |
| HOME-ALIVE | ✅ 1/1 | today·tasks·recent·land·ask |
| HOME-ATTENTION | ✅ 6/6 | overdue ▸ event ▸ handoff ▸ goal ▸ open ▸ reading (score order) |
| SHELL-ATTENTION | ✅ 4/4 | homeHidden·awayShows·urgent·tapHome |
| PROVENANCE-PERSISTS | ✅ 3/3 | editor→notes/ai-chat/prompt-generator survive reload |
| PROVENANCE-ENTITY | ✅ 3/3 | calculator→goals · editor→messages · notes→calendar |
| PRECACHE-AUDIT | ✅ | 89 entries; 53 JS + 3 CSS emitted — no gap |
| OFFLINE-BOOT | ✅ 5/5 | / · clock · maps · network · photos boot cold-offline |

## Console errors — env-expected noise only (NOT bugs)

- `maps` — net:8 (Leaflet OSM tile PNGs egress-blocked in the sandbox; container + attribution still render).
- `mail` — net:1 (401 on the authed/Android-only API; graceful "not configured", no boundary).
- All other 29 routes: net:0, uncaught:0.

## Auto-metrics (from `scripts/metrics.mjs`) — vs last QA `aa9acf7`

| Metric | Value | Δ |
|---|---|---|
| Apps / routes | 31 | ±0 |
| Test cases | 514 | +17 (EPIC-19 S1 `related.test.ts` + attention TZ cases) |
| Test files | 68 | +1 (`related.test.ts`) |
| Token violations | 0 | ±0 |
| Off-system utils | 0 | ±0 |
| Off-system style | 0 (r0/t0/m0) | ±0 |
| Off-shell controls | 0 (b0/i0/s0/t0) | ±0 |
| Keyboard a11y | 0 | ±0 |
| Doc mass (over) | 0 | ±0 |
| Bundle gz (KB) | 734.1 | ±0 |

**Done / Verified / Next.** Done: full visual + smoke QA on green main `ea2aef2`. Verified: 32/32 render
clean, all guards green, six axes 0 & LOCKED, EPIC-19 S1 engine 17/17. Next: EPIC-19 S2 —
`<RelatedConstellation>` on the Network inspector (first UI mover toward `RELATED 5/5`).
