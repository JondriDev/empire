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

| Metric | Current (QA 2026-06-29, after **EPIC-4 S1 (offline-boot guard) + design-system `@theme`/Clock fix** — green main `9051409`) | Target | Direction |
|---|---|---|---|
| Apps / routes | 25 | ~26 (steady) | coherence over new surface — not a growth metric |
| Test cases | 163 (static) · 176 (vitest run) | 60+ | ↑ higher = safer to leap |
| Test files | 21 (metrics, `src/` only) · 22 (vitest, incl. `scripts/precacheAudit.test.mjs`) | grow with code | ↑ |
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

> Last integration since prior QA snapshot (`2126481`, EPIC-3 S4 CLOSE, apps 25 / gz 292.3 / vitest 170 / files 21):
> two code commits landed — **`a119d71` EPIC-4 S1 (offline-boot guard `scripts/qa-offline.mjs` + pure precache audit
> `scripts/precacheAudit.mjs` + 6 audit tests; S2 also closed — zero precache gap)** and **`9051409`
> fix(design-system): `@theme` in entry CSS so token utilities generate + migrate Clock off Tailwind palette classes**.
> Δ: test cases **170 → 176 vitest (+6)** (`precacheAudit.test.mjs`), test files **21 → 22 vitest (+1; metrics.mjs
> still 21, counts `src/` only)**, **off-system utilities 1164 → 1076 (−88, the `@theme`/Clock migration)**, bundle gz
> **292.3 → 292.5 (+0.2)**, apps ±0 (25), token violations ±0 (**0**). CONFIRMED on green main `9051409`, no
> contradiction. **★ EPIC-4 S1 target metric CONFIRMED MOVED, LIVE: the `offline-boots` smoke guard PASSES** — the
> built app boots cold-offline (shell + 4 lazy routes from precache, 5/5) with ALL network blocked, and the precache
> audit shows NO GAP (63 entries cover all 37 JS + 2 CSS). EPIC-4 S2 confirmed no-op (zero gap). EPIC-3 remains
> CODE-COMPLETE (function 8/8 held — MEDIA 3/3). **Next active stage: EPIC-4 S3 (base-path + install-flow).**

> Prior context (still load-bearing): the **JondriDev redesign** (`bf76cf5`…`23df6ce`) intentionally set apps
> **27 → 25** (deleted `ai-agent` + `hermes-cc`; AI unified into **Cakra** at `/app/ai-chat`) and bundle gz
> **248 → 288.6** (real **Leaflet + OSM** Maps); palette swapped XENO → Earth-from-Space, alien SVG icon set,
> decorative HUD removed. **Do NOT regress-gate these intentional deltas.** It also made
> **Weather/Maps/Language/DataCenter genuinely work** (`b155992`) — pre-delivered the first four EPIC-3 instruments.

## Manual / CI metrics (QA + human)

| Metric | Source | Current (QA 2026-06-29, after **EPIC-4 S1 offline-boot guard** green main `9051409`) | Target |
|---|---|---|---|
| Routes rendering clean | QA `REPORT.md` (headless render, no uncaught JS / blank) | **25 / 25** ✅ (26/26 incl. desktop shell; SHELL-IS-STYLED ✅ + REGISTRY-COVERAGE ✅ bidirectional + INBOUND-LANDS 3/3 ✅ + **MEDIA-PERSISTS 3/3 ✅ (music + video + photos)**) — re-confirmed 2026-06-29 on `9051409` (all 26 routes render with 0 uncaught JS, vitest 176/176; Earth-from-Space palette + alien icons + Cakra verified visually; desktop shell + Clock (post-`@theme` migration) verified visually; Maps renders the real Leaflet container — only OSM/CARTO tiles grey, env-blocked). | 25 / 25 (every entity route) |
| Shallow instruments with offline function + a unit test (EPIC-3 target) | QA + code audit | **8 / 8 ✅ PRIMARY METRIC HIT** — Clock (S1: `empire-clock-state` persistence + `clockLogic.test.ts` 17 cases ✅) + Music + Video (S2: real `Blob`s in IndexedDB via `mediaStore.ts`, metadata-only localStorage, ghost-drop on rehydrate + `mediaStore.test.ts` 11 cases ✅) + **Photos (S3: same `mediaStore` IDB rail, `photosStore.test.ts` 6 cases ✅ — live IDB roundtrip CONFIRMED this run by the extended MEDIA-PERSISTS `photos` case: add image → reload → survives)** + the 4 redesign instruments Weather/Maps/Language/DataCenter (function ✅; DataCenter+Weather dedicated tests pending → S4 backfills, Maps/Language render-smoke-covered). **Moved 7/8 → 8/8 this run (S3 confirmed live). All eight shallow instruments now offline-capable.** | 8 / 8 ✅ |
| Apps fully wired into the organism (both **emit** and **receive** honest handoffs, visible in The Network) | QA + code audit | **9 / 9 entity-apps-with-inbound ✅ TARGET HIT (↑ from 6 — S6c)** — both-ways now: `prompt-generator`, `notes`, `learning-tracker`, `editor`, `token-counter`, `ai-chat` **+ `calendar`, `goals`, `messages`** (S6c: each gained a natural text→entity inbound via `useInboundHandoff` → opens its own create form prefilled + a "From <source>" `ProvenanceChip`; reachable from `SendResultMenu` & `NodeActions`). **Confirmed LIVE this run** (`scripts/qa-s6c-confirm.mjs`, screenshots `s6c-inbound-{calendar,goals,messages}.png`): seeding each `empire-<x>-clipboard` payload + reload shows the chip AND a prefilled field (Calendar New-Event title+date+desc, Goals New-Goal title+desc, Messages composer draft) — 3/3 ✅. The HANDOFF emission is unit-tested (`appActions.test.ts`, vitest 103). **Entity emit↔receive loop CLOSED.** Intentionally emit-only (by design, no natural inbound): files, photos, datacenter (browse/manage stores) + tool apps (calculator, clock, weather, etc.) via `NodeActions`. | 9 / 9 entity-apps-with-inbound ✅ |
| Lighthouse — PWA / Perf / A11y | CI (add to a workflow when feasible) | not measured headless | 90 / 90 / 90 |
| **EPIC-4 target — offline-boot guard + Lighthouse PWA ≥ 90** | QA `qa-offline.mjs` (wired into `qa-smoke.mjs`) | **offline-boots ✅ PASS — CONFIRMED LIVE 2026-06-29 on green main `9051409`** (first QA since S1 shipped). `scripts/qa-offline.mjs` warm-loads → `setOffline(true)` (ALL network blocked) → **5/5 routes boot cold-offline** (`/`, `/app/clock`, `/app/maps`, `/app/network`, `/app/photos`) from the SW precache. PRECACHE-AUDIT: 63 entries (37 JS + 2 CSS), **NO GAP** ✅ (S2 confirmed no-op). **EPIC-4 S1 acceptance metric MOVED.** Lighthouse PWA score still not measured headless (needs a Lighthouse run in CI). | offline-boots PASS ✅ + PWA ≥ 90 (Lighthouse pending) |
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
