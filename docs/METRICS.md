# The Empire — Fitness Metrics (the potential field)

> **Why this file exists (first principles):** you cannot descend a gradient you
> don't measure. Before this, "better" was a vibe ("feels like alien technology"),
> so the fleet polished whatever was nearest and every run was a slight iteration.
> These north-star numbers turn "huge iteration" into something *measurable*: each
> run reports its delta, the **Strategist** ranks epics by steepest gradient, the
> **Reviewer** uses them as a no-regression gate, and the **Digest** plots the trend.

The machine-measurable rows are computed by [`scripts/metrics.mjs`](../scripts/metrics.mjs)
(dependency-free; run `node scripts/metrics.mjs`). It updates `docs/metrics.json`
(current snapshot + rolling history) and prints a table with deltas. **Build first**
(`npm run build`) if you want the bundle-size row populated.

## Auto metrics (from `scripts/metrics.mjs`)

| Metric | Current (QA 2026-06-29, after **EPIC-4 S3 (base-path + install-flow correctness)** — green main `1b5e695`) | Target | Direction |
|---|---|---|---|
| Apps / routes | 25 | ~26 (steady) | coherence over new surface — not a growth metric |
| Test cases | 163 (static) · 193 (vitest run) | 60+ | ↑ higher = safer to leap |
| Test files | 21 (metrics, `src/` only) · 23 (vitest, incl. `scripts/precacheAudit.test.mjs` + `scripts/pwaBaseAudit.test.mjs`) | grow with code | ↑ |
| Design-token violations | **0** | 0 | ↓ raw hex/rgb in app code that bypasses the design system |
| Off-system utilities | **1076** (↓ from 1164, −88: the `@theme` token utilities + Clock migration in `9051409`) | 0 | ↓ Tailwind palette classes (`text-gray-400`, `bg-cyan-600`, `bg-white/10`, `text-white`, `text-red-400`…) that bypass the JondriDev tokens — EPIC-2's blind spot, now being swept |
| Bundle gz (KB) | 292.5 | hold / shrink | ↓ |

> **Off-system utilities (added 2026-06-29).** `tokenViolations` only ever counted raw `#hex`/`rgba()`
> *literals*, so it hit 0 while ~1,160 ergonomic-but-off-system Tailwind palette classes still bypassed
> the design system (and broke theme-switching, since `text-white`/`bg-gray-*` don't follow `[data-theme]`).
> Migrate them to the token-backed utilities added in `src/design-system/theme.css`
> (`text-fg`/`text-muted`/`text-faint`, `bg-glass`, `border-hair`, `text-signal`/`bg-signal`,
> `text-success`/`text-warn`/`text-danger`/`text-info`), the `.gp`/`.glass` primitives + `src/components/ui`
> components, or `cssVar()`/`tint()`/`CATEGORICAL` for JS-computed colours. The lock stage flips
> `node scripts/metrics.mjs --assert-zero` into a hard gate so it can't regress.

> Last integration since prior QA snapshot (`9051409`, EPIC-4 S1, apps 25 / gz 292.5 / vitest 176 / files 22):
> one code commit landed — **`1b5e695` feat(epic-4): S3 — base-path + install-flow correctness check** (new pure
> auditor `scripts/pwaBaseAudit.mjs` + `pwaBaseAudit.test.mjs` 17 cases + runner `scripts/check-pwa-base.mjs`; fixed
> manifest `id:'/'`→`id:'empire'` in `vite.config.ts`). Δ: test cases **176 → 193 vitest (+17)** (`pwaBaseAudit.test.mjs`),
> test files **22 → 23 vitest (+1; metrics.mjs still 21, counts `src/` only — the new test is under `scripts/`)**,
> apps ±0 (25), token violations ±0 (**0**), off-system utilities ±0 (1076), bundle gz ±0 (292.5). CONFIRMED on green
> main `1b5e695`, no contradiction. **★ EPIC-4 S3 acceptance CONFIRMED MOVED: `node scripts/check-pwa-base.mjs` ✅** —
> a `--base=/empire/` build's install surface is provably consistent (11 base-prefixed assets + manifest linked,
> SW `navigateFallback="/empire/index.html"`, `registerSW("/empire/sw.js",{scope:"/empire/"})`, base-agnostic
> manifest `start_url="."`/`scope="."`/`id="empire"`). EPIC-4 S1 `offline-boots` guard still PASSES (5/5 cold-offline,
> 63 precache entries, no gap). EPIC-3 remains CODE-COMPLETE (function 8/8 held — MEDIA 3/3). **Next active stage:
> EPIC-4 S4 (Lighthouse-PWA / installability assertion — EPIC-4 CLOSE).**

> Prior context (still load-bearing): the **JondriDev redesign** (`bf76cf5`…`23df6ce`) intentionally set apps
> **27 → 25** (deleted `ai-agent` + `hermes-cc`; AI unified into **Cakra** at `/app/ai-chat`) and bundle gz
> **248 → 288.6** (real **Leaflet + OSM** Maps); palette swapped XENO → Earth-from-Space, alien SVG icon set,
> decorative HUD removed. **Do NOT regress-gate these intentional deltas.** It also made
> **Weather/Maps/Language/DataCenter genuinely work** (`b155992`) — pre-delivered the first four EPIC-3 instruments.

## Manual / CI metrics (QA + human)

| Metric | Source | Current (QA 2026-06-29, after **EPIC-4 S3 base-path/install-flow** green main `1b5e695`) | Target |
|---|---|---|---|
| Routes rendering clean | QA `REPORT.md` (headless render, no uncaught JS / blank) | **25 / 25** ✅ (26/26 incl. desktop shell; SHELL-IS-STYLED ✅ + REGISTRY-COVERAGE ✅ bidirectional + INBOUND-LANDS 3/3 ✅ + **MEDIA-PERSISTS 3/3 ✅ (music + video + photos)**) — re-confirmed 2026-06-29 on `1b5e695` (all 26 routes render with 0 uncaught JS, vitest 193/193; Earth-from-Space palette + alien icons + Cakra verified visually; desktop shell verified visually; Maps renders the real Leaflet container — only OSM/CARTO tiles grey, env-blocked). | 25 / 25 (every entity route) |
| Shallow instruments with offline function + a unit test (EPIC-3 target) | QA + code audit | **8 / 8 ✅ PRIMARY METRIC HIT** — Clock (S1: `empire-clock-state` persistence + `clockLogic.test.ts` 17 cases ✅) + Music + Video (S2: real `Blob`s in IndexedDB via `mediaStore.ts`, metadata-only localStorage, ghost-drop on rehydrate + `mediaStore.test.ts` 11 cases ✅) + **Photos (S3: same `mediaStore` IDB rail, `photosStore.test.ts` 6 cases ✅ — live IDB roundtrip CONFIRMED this run by the extended MEDIA-PERSISTS `photos` case: add image → reload → survives)** + the 4 redesign instruments Weather/Maps/Language/DataCenter (function ✅; DataCenter+Weather dedicated tests pending → S4 backfills, Maps/Language render-smoke-covered). **Moved 7/8 → 8/8 this run (S3 confirmed live). All eight shallow instruments now offline-capable.** | 8 / 8 ✅ |
| Apps fully wired into the organism (both **emit** and **receive** honest handoffs, visible in The Network) | QA + code audit | **9 / 9 entity-apps-with-inbound ✅ TARGET HIT (↑ from 6 — S6c)** — both-ways now: `prompt-generator`, `notes`, `learning-tracker`, `editor`, `token-counter`, `ai-chat` **+ `calendar`, `goals`, `messages`** (S6c: each gained a natural text→entity inbound via `useInboundHandoff` → opens its own create form prefilled + a "From <source>" `ProvenanceChip`; reachable from `SendResultMenu` & `NodeActions`). **Confirmed LIVE this run** (`scripts/qa-s6c-confirm.mjs`, screenshots `s6c-inbound-{calendar,goals,messages}.png`): seeding each `empire-<x>-clipboard` payload + reload shows the chip AND a prefilled field (Calendar New-Event title+date+desc, Goals New-Goal title+desc, Messages composer draft) — 3/3 ✅. The HANDOFF emission is unit-tested (`appActions.test.ts`, vitest 103). **Entity emit↔receive loop CLOSED.** Intentionally emit-only (by design, no natural inbound): files, photos, datacenter (browse/manage stores) + tool apps (calculator, clock, weather, etc.) via `NodeActions`. | 9 / 9 entity-apps-with-inbound ✅ |
| Lighthouse — PWA / Perf / A11y | CI (add to a workflow when feasible) | not measured headless | 90 / 90 / 90 |
| **EPIC-4 target — offline-boot guard + Lighthouse PWA ≥ 90** | QA `qa-offline.mjs` + `check-pwa-base.mjs` | **offline-boots ✅ PASS + base-path/install-flow ✅ — re-confirmed 2026-06-29 on green main `1b5e695`.** `qa-offline.mjs`: warm-load → `setOffline(true)` → **5/5 routes boot cold-offline** (`/`, `/app/clock`, `/app/maps`, `/app/network`, `/app/photos`) from the SW precache; PRECACHE-AUDIT 63 entries (37 JS + 2 CSS), **NO GAP** ✅. **★ EPIC-4 S3 acceptance CONFIRMED: `node scripts/check-pwa-base.mjs` ✅** — a `--base=/empire/` build's install surface (assets+manifest), SW `navigateFallback`/`registerSW` scope and base-agnostic manifest (`id="empire"`) are all consistent → no blank-on-install under a sub-path deploy. Lighthouse PWA score still not measured headless (→ S4 — Lighthouse run or a pure `auditInstallability`). | offline-boots PASS ✅ + PWA ≥ 90 (S4 pending) |
| Open `routine/auto-*` PR age | reviewer log | — | < one review cycle |

## How each routine uses this

- **Builder** — runs `metrics.mjs`, pastes the delta row into the PR body, must not regress any ↓/steady metric.
- **Reviewer** — re-runs it on the merge candidate; a regression is a **hard gate** (block or require justification in the epic).
- **Visual & Smoke QA** — updates the manual rows (routes rendering, organism wiring) every run and confirms the **active epic's target metric actually moved** before marking a stage done.
- **Strategist** — picks the active epic to maximize capability gradient = (metric gain ÷ stages of effort).
- **Daily Digest** — reports today's deltas as the headline (is the fleet leaping or stalling?).

> Keep this table's "Baseline/Target" columns honest: when a target is hit, raise
> it or retire the row. A flat metric for 3+ runs is a signal for the Routine
> Optimizer that the active epic is in a local minimum.
