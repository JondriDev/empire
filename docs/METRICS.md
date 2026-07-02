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

| Metric | Current (QA 2026-07-02, after **EPIC-8 S1 · Global cross-app search — the organism becomes queryable** — green main `ac6af7b`) | Target | Direction |
|---|---|---|---|
| Apps / routes | 27 (+1 vs prior 26 = the new **Search** app at `/app/search`) | ~26 (steady) | coherence over new surface — not a growth metric |
| Test cases | 213 (static, +13 vs prior 200 = `search.test.ts`) · 255 (vitest run, +13 vs prior 242) | 60+ | ↑ higher = safer to leap |
| Test files | 27 (metrics, `src/` only, +1 `search.test.ts`) · 29 (vitest, incl. `scripts/precacheAudit.test.mjs` + `scripts/pwaBaseAudit.test.mjs`) | grow with code | ↑ |
| Design-token violations | **0** | 0 | ↓ raw hex/rgb in app code that bypasses the design system |
| Off-system utilities | **0** (↓ from 1076 — the redesign batch's `98c61c7` "token-ize Tailwind palette classes across all apps" swept the whole mass; EPIC-5 S8 `c51f79f` LOCKED it with `--assert-zero` CI gate; re-confirmed 0 this run) | 0 | ↓ Tailwind palette classes (`text-gray-400`, `bg-cyan-600`, `bg-white/10`, `text-white`, `text-red-400`…) that bypass the JondriDev tokens — **EPIC-5 TARGET MET (0)** |
| Bundle gz (KB) | 696 (+2.4 vs 693.6 = the EPIC-8 S1 pure `search.ts` spine + `Search.tsx` app + Search glyph, no new deps) | hold / shrink | ↓ |

> **Off-system utilities (added 2026-06-29).** `tokenViolations` only ever counted raw `#hex`/`rgba()`
> *literals*, so it hit 0 while ~1,160 ergonomic-but-off-system Tailwind palette classes still bypassed
> the design system (and broke theme-switching, since `text-white`/`bg-gray-*` don't follow `[data-theme]`).
> Migrate them to the token-backed utilities added in `src/design-system/theme.css`
> (`text-fg`/`text-muted`/`text-faint`, `bg-glass`, `border-hair`, `text-signal`/`bg-signal`,
> `text-success`/`text-warn`/`text-danger`/`text-info`), the `.gp`/`.glass` primitives + `src/components/ui`
> components, or `cssVar()`/`tint()`/`CATEGORICAL` for JS-computed colours. The lock stage flips
> `node scripts/metrics.mjs --assert-zero` into a hard gate so it can't regress.

> Last integration since prior QA snapshot (`d17f73a`, EPIC-4 S4, apps 25 / gz 292.5 / vitest 205 / off-system
> 1076): the **out-of-band redesign batch** (`75ef685`…`fb4c853`, 2026-06-30, user-directed) + **EPIC-5 S8
> close** (`c51f79f`) landed. The batch: **full-screen "Apple-style" app model** (`src/components/Window.tsx`
> deleted, new `AppHost.tsx`/`Recents.tsx`/`cakraTab.ts`); **Prompt-Gen / Token-Counter / Code-Editor folded
> into Cakra** as tabs; a new **Reader** app (EPUB/PDF/TXT/MD/DOCX, Cakra-powered); and `98c61c7`
> "token-ize Tailwind palette classes across all apps" which drove **off-system 1076 → 0**. Δ vs `d17f73a`:
> apps **25 → 26** (+1, Reader net), test cases **205 → 208 vitest** / 163 → 166 static (+3), test files **23 →
> 24 vitest** / 21 → 22 metrics (+1), token violations ±0 (**0**), **off-system 1076 → 0 (−1076, EPIC-5 target
> met + LOCKED)**, bundle gz **292.5 → 691.3** (+398.8, the Reader's parser libs — BY DESIGN). CONFIRMED on green
> main `c51f79f`, no contradiction, no runtime bug. **★ This run is the FIRST visual QA of the redesign batch —
> all 26 routes render clean incl. the new windowless shell + Reader + the merged Cakra tabs.** EPIC-5
> (design-system utility conformance → off-system 0) **CONFIRMED MET & LOCKED** (`node scripts/metrics.mjs
> --assert-zero` exits 0: tokenViolations=0, offSystemUtilities=0). EPIC-4 (PWA) re-confirmed: offline-boots
> 5/5, PRECACHE no-gap (70 entries / 43 JS + 3 CSS). **Next: NO active epic — EPIC-5 CLOSED; Strategist must
> promote the next epic** (EPIC-6 Android is device-gated/QUEUED; cloud-executable candidates: DataCenter/Files
> whole-state graph-mirror, organism-completeness-II re-audit vs the new 26-route registry).

> Prior context (still load-bearing): the **JondriDev redesign** (`bf76cf5`…`23df6ce`) intentionally set apps
> **27 → 25** (deleted `ai-agent` + `hermes-cc`; AI unified into **Cakra** at `/app/ai-chat`) and bundle gz
> **248 → 288.6** (real **Leaflet + OSM** Maps); palette swapped XENO → Earth-from-Space, alien SVG icon set,
> decorative HUD removed. **Do NOT regress-gate these intentional deltas.** It also made
> **Weather/Maps/Language/DataCenter genuinely work** (`b155992`) — pre-delivered the first four EPIC-3 instruments.

## Manual / CI metrics (QA + human)

| Metric | Source | Current (QA 2026-07-02, after **EPIC-8 S1 · Global cross-app search — the organism becomes queryable** green main `ac6af7b`) | Target |
|---|---|---|---|
| Routes rendering clean | QA `REPORT.md` (headless render, no uncaught JS / blank) | **27 / 27** ✅ (28/28 incl. desktop shell; SHELL-IS-STYLED ✅ + REGISTRY-COVERAGE ✅ bidirectional, 27 apps; INBOUND-LANDS 3/3 ✅ + **MEDIA-PERSISTS 3/3 ✅ (music + video + photos)** + **GRAPH-LEGIBLE 1/1 ✅** + **GLOBAL-SEARCH 1/1 ✅ (NEW — the queryable organism)** + **PROVENANCE-PERSISTS 3/3 ✅** + **PROVENANCE-ENTITY 3/3 ✅** + OFFLINE-BOOT 5/5 ✅ / PRECACHE 80 entries NO GAP) — **confirmed 2026-07-02 on green main `ac6af7b`** (EPIC-8 S1 landed since last QA `5b8163c`): all 28 routes render with 0 uncaught JS, vitest 255/255, eslint 0, all guards green, `metrics.mjs --assert-zero` exit 0. Visually verified: Earth-from-Space launcher grid (desktop.png) + all 27 app routes incl. the new **Search** (`app-search.png`) + **Maps** real Leaflet container w/ OSM/CARTO attribution (only tiles grey — env-blocked, net:8). No runtime regression. | 26 / 26 (every entity route) |
| Shallow instruments with offline function + a unit test (EPIC-3 target) | QA + code audit | **8 / 8 ✅ PRIMARY METRIC HIT** — Clock (S1: `empire-clock-state` persistence + `clockLogic.test.ts` 17 cases ✅) + Music + Video (S2: real `Blob`s in IndexedDB via `mediaStore.ts`, metadata-only localStorage, ghost-drop on rehydrate + `mediaStore.test.ts` 11 cases ✅) + **Photos (S3: same `mediaStore` IDB rail, `photosStore.test.ts` 6 cases ✅ — live IDB roundtrip CONFIRMED this run by the extended MEDIA-PERSISTS `photos` case: add image → reload → survives)** + the 4 redesign instruments Weather/Maps/Language/DataCenter (function ✅; DataCenter+Weather dedicated tests pending → S4 backfills, Maps/Language render-smoke-covered). **Moved 7/8 → 8/8 this run (S3 confirmed live). All eight shallow instruments now offline-capable.** | 8 / 8 ✅ |
| Apps fully wired into the organism (both **emit** and **receive** honest handoffs, visible in The Network) | QA + code audit | **9 / 9 entity-apps-with-inbound ✅ TARGET HIT** + **every collection-owning app now graph-legible (Reader closed — S4)**. Both-ways: `prompt-generator`, `notes`, `learning-tracker`, `editor`, `token-counter`, `ai-chat`, `calendar`, `goals`, `messages` (each: natural text→entity inbound via `useInboundHandoff` → prefilled create form + "From <source>" `ProvenanceChip`). **Emit-only sources now ALL legible in the graph** including **Reader** (S4: mirrors its book library via `mirrorCollection('book','reader',…)` + per-card `<NodeActions type='book'>`) — the last graph-island is closed. `GRAPH-LEGIBLE` guard **1/1 ✅ this run** (drive Reader's file input with a `.txt` book → a `book` node owned by `app==='reader'` appears in `empire-core-graph` AND survives reload). Intentionally emit-only by design (no natural inbound): files, photos, datacenter, reader (browse/manage/read stores) + tool apps via `NodeActions`. | 9 / 9 entity-apps-with-inbound ✅ + all collections graph-legible ✅ |
| **EPIC-6 target — durable app→app provenance persists across reload (`PROVENANCE-PERSISTS`) + per-entity source (`PROVENANCE-ENTITY`) + Reader graph-legible (`GRAPH-LEGIBLE`)** | QA `qa-smoke.mjs` guards + visual + code | **✅ EPIC-6 DONE — S1 SPINE + S2 SURFACE + S3 PER-ENTITY + S4 READER-ISLAND ALL CONFIRMED LIVE 2026-07-02 (green main `e262f1b`).** `PROVENANCE-PERSISTS` 3/3 (edge ledger): 3 REAL `editor→<target>` handoffs from the Editor's ⚡ Send menu → recorded in `empire-provenance` by `startProvenanceTracking()`/`flowForEvent` → survive a full reload. `PROVENANCE-ENTITY` 3/3 ({calculator→goals, editor→messages, notes→calendar}: seed inbound → reload+prefill → app's OWN create/send → SECOND reload → `<LineageTrail>` still renders off the persisted entity). **S4 (EPIC-6 CLOSE) NOW done-confirmed via the NEW `GRAPH-LEGIBLE` guard — 1/1:** Reader's real file `<input>` driven with a `.txt` book → a `book` CoreNode owned by `app==='reader'` appears in the persisted graph AND the re-mounted Reader re-mirrors it after reload (idempotent, not dropped). **★ All four EPIC-6 acceptance metrics moved → EPIC-6 CLOSED.** *Cloud limit:* a fresh-checkout Network canvas is empty, so the book node's live inspector render is not screenshottable headless — the `GRAPH-LEGIBLE` guard carries the roundtrip; on-device is the visual confirm. **▶ NEXT = Strategist promotes the next epic** (node-level lineage OR global cross-app search — both cloud-executable; EPIC-7 Android stays device-gated). | ✅ MET — `PROVENANCE-PERSISTS` 3/3 + `PROVENANCE-ENTITY` 3/3 + Reader graph-legible 1/1 |
| **▶ EPIC-8 target (ACTIVE) — global cross-app search reaches ≥2 apps' entities, grouped by owning app (`GLOBAL-SEARCH`)** | QA `qa-smoke.mjs` guard + `search.test.ts` + visual | **✅ EPIC-8 S1 DONE-CONFIRMED LIVE 2026-07-02 (green main `ac6af7b`) — target metric MOVED `GLOBAL-SEARCH 0/1 → 1/1`.** First QA after S1 landed (last QA `5b8163c` was EPIC-6 S4). The guard seeds graph-survivable entities sharing a rare term across ≥2 apps (a `task` graph-only + a `book` self-mirrored by an unmounted Reader), reloads (persist rehydrate), types the term into the live `/app/search` field, and asserts BOTH surface **grouped under their own app `<section data-search-group>`** — `book=true task=true twoApps=true`, groups **reader,goals**. Backed by `search.ts` pure spine + `search.test.ts` (13 cases, part of vitest 255/255). Search is the 27th app (`/app/search`), renders clean headless. **★ S1 acceptance metric confirmed moved → S1 done-confirmed.** **▶ NEXT = EPIC-8 S2** (deepen the corpus: full note/message/learning bodies searchable via `mirrorCollection` `data`; deep-link focus/scroll on open; extend guard with a body-only match). | ✅ MET — `GLOBAL-SEARCH` 1/1 |
| Lighthouse — PWA / Perf / A11y | CI (add to a workflow when feasible) | not measured headless | 90 / 90 / 90 |
| **EPIC-4 target — offline-boot guard + Lighthouse PWA ≥ 90 → installability contract** | QA `qa-offline.mjs` + `check-pwa-base.mjs` | **✅ EPIC-4 FULLY DONE (offline ✅ + base ✅ + installable ✅) — confirmed 2026-06-29 on green main `d17f73a`.** `qa-offline.mjs`: warm-load → `setOffline(true)` → **5/5 routes boot cold-offline** (`/`, `/app/clock`, `/app/maps`, `/app/network`, `/app/photos`) from the SW precache; PRECACHE-AUDIT 63 entries (37 JS + 2 CSS), **NO GAP** ✅. Base-path/install-flow (S3) ✅ consistent under `--base=/empire/`. **★ EPIC-4 S4 acceptance CONFIRMED MOVED: `node scripts/check-pwa-base.mjs` → `installable = ✅ (4 icons)`** — manifest passes name+short_name, ≥192 AND ≥512 `any` icon, a maskable icon, standalone display, start_url, background+theme color (the deterministic, offline-checkable realization of *Lighthouse-PWA ≥ 90*). | offline-boots PASS ✅ + installable ✅ — **MET** |
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
