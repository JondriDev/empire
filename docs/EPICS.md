# The Empire — Epics (reaction pathways)

> **Why this file exists (first principles):** a real capability is a high-
> activation-energy reaction — one time-boxed run can't supply it, so the old
> "pick the next small chore" model fumbled a fraction each run and re-planned
> every time (HANDOFF took *four* runs). An **epic** lowers the activation energy
> by pre-decomposing one big leap into a sequence of **stages**, each a meaty but
> green, reviewable PR with a concrete acceptance check. The Builder executes the
> next stage *at full speed* (no re-planning); the stages compound into a coherent
> leap. **Direction and decomposition, not code.**

## Rules

- **Exactly ONE active epic at a time** (`▶ ACTIVE`). This keeps every PR coherent
  and matches the Reviewer's single-gate / green-hard-gate model (bounded leap).
- Only the **Strategist** edits epic definitions and ordering. The **Builder/QA**
  check off `[x]` stages and append discovered stages; they don't invent epics.
- Each epic names a **target metric** (`docs/METRICS.md`). An epic is `DONE` only
  when its stages ship **and** QA confirms the metric moved.
- A stage must be executable in one run **without re-planning**: name the files,
  the shape, and the acceptance check. *A vague stage = a small builder step = failure.*
- Rank epics by **gradient = capability gain ÷ stages of effort.** Highest first.

---

## ⚠️ Builder/Strategist note — REDESIGN LANDED 2026-06-28 (user-directed)

The user-directed "JondriDev pass" landed on `main` (see CONTEXT.md → "🎨 REDESIGN LANDED"). It **partly
pre-delivers EPIC-3** ("depth pass on shallow instruments"): **Maps** (real Leaflet + OSM + Nominatim),
**Weather** (Open-Meteo, no key), **DataCenter** (local-first localStorage, offline), and **Language**
(Cakra `chat()` translation) are now genuinely functional. **Strategist:** when seeding EPIC-3 stages,
treat those four as done (add only a unit test if wanted) and aim the depth pass at the still-shallow
instruments (Photos / Video / Music / Clock). **Intentional metric deltas — NOT regressions:** apps
**27 → 25** (Hermes Agent + Hermes CC deleted, AI unified into **Cakra**), bundle **+~40 KB** (`leaflet`
for the real Maps), token-violations **held at 0**. Do not re-add the deleted apps or strip `leaflet`.

---

## ⚠️ Builder/Strategist note — SOLVER LANDED 2026-07-04 (user-directed)

Cakra gained the **Problem Solver** (Solver tab, `src/apps/cakra/solver/**` + `public/solver/feed.json` +
registry alias `solver`) — see CONTEXT.md → "🧩 SOLVER LANDED" for seams and invariants. Treat it as shipped
capability: don't re-add it as an epic, don't refactor it away, and don't hand-edit `feed.json` (the
World-Solver routine owns that file). Wiring solutions deeper into Inbox/Bridge is fair game for future epics.
Note for EPIC-11: the solver views use Tailwind structural classes + `var()`-token inline colours only — they
audit at 0 on `offSystemStyle`; keep them that way when reducing.

---

## ▶ ACTIVE — EPIC-14 · Shell conformance — the component shell becomes total (no app renders a bare interactive control)

> **RATIFIED + PROMOTED by the Strategist 2026-07-10.** EPIC-13 is retired to DONE (below — `GRAPH-LEGIBLE 1/1 → 3/3` +
> `INBOUND-LANDS 3/3 → 4/4` QA-render-CONFIRMED LIVE on green main `a9bec85`; the last two graph-islands closed). Every
> interconnection epic EPIC-1..13 is DONE — the organism has no islands left, so the priority bias descends one band from
> **interconnection** to **design-system consistency**, and the Strategist audited that band for the steepest remaining
> cloud-executable gradient.
>
> **The gap (code-confirmed this run — `src/components/ui/index.tsx` + a repo-wide control census):** EPIC-5 locked the
> *colour* axis (`tokenViolations`=0, `offSystemUtilities`=0) and EPIC-11 locked the *non-colour token* axis (`offSystemStyle`
> r/t/m = 0). But the **component/control shell** — *are you rendering `ui`'s `Button`/`Input`/`TextArea` or a bare
> `<button>`/`<input>`/`<select>`/`<textarea>`?* — is the **last unlocked conformance axis, and NOTHING measures it.** A
> census of app code (the same `appCodeFiles()` set the colour/style audits walk, minus `src/components/ui/`) finds **148 bare
> interactive controls across 27 files** (`<button>`×127, text `<input>`×~14, `<select>`×5, `<textarea>`×2). **Root cause:** the
> `ui` primitive set is INCOMPLETE — it ships `Button`/`Input`/`TextArea`/`Card`/`Badge` only. There is **no `Select`, no
> `IconButton`, no `Segmented`/tab primitive** — so an app that needs a dropdown, an icon-only toggle, or a tab bar has *no
> shell component to reach for* and drops to bare HTML. That incompleteness is precisely **why Mail + Crypto shipped as
> raw-HTML islands** (EPIC-13's entire premise: "bare `<button>`/`<select>`/`<input>`/`<textarea>` … none of `src/components/
> ui`"): the shell had no home for their controls, and no metric caught the regression.
>
> **Why this is the highest-gradient move now (one line):** it closes the exact structural gap that created EPIC-13 and
> **locks it so islands can never creep back** — completing the `ui` primitive set is a real capability leap (every future app
> has a shell home; "one organism, alien technology" becomes *structurally enforced*, not vibes), it has a natural, honest
> **0 target** (unlike an adoption-count that only ever "grows"), it is 100 % cloud + metric verifiable (a static audit + the
> render-smoke; no backend), and it reuses the exact EPIC-5/11 **measure → drive-to-0-by-descending-file-mass → lock**
> template with no invention and no new deps. It also **folds in the ad-hoc a11y work** the fleet has been doing between epics
> (language/music aria passes): migrating a bare icon `<button>` → `ui.IconButton` *forces* an `aria-label`, and a tab row →
> `ui.Segmented` *forces* `aria-pressed`/`role` — a11y comes free with the primitive instead of one-off per app.

**Leap:** the `ui` component layer becomes *complete* (gains `Select`, `IconButton`, `Segmented`) and **every app renders its
controls through it** — no instrument is a bolted-on raw-HTML panel. The whole Empire's buttons, dropdowns, toggles, and tab
bars re-tune from ONE place (the primitives), the same way EPIC-5 made colour and EPIC-11 made radii/type/motion re-tune from
one place — the design-system trilogy completed (colour · tokens · **components**). A new `offShellControls` metric measures
it; a lock stage adds it to `--assert-zero` so it can't rot.

**Target metric (new — Builder instruments it; QA confirms it moved):** a NEW **`offShellControls`** row in
`scripts/metrics.mjs` (**≈148 → 0**, sub-counts `b/i/s/t` = button/input/select/textarea). Detector = a new pure, dependency-
free `scripts/controlAudit.mjs` `scanControlViolations(text) → {button,input,select,textarea,total}`, unit-pinned in
`scripts/controlAudit.test.mjs`, run over the same `appCodeFiles()` set the colour/style audits already walk (**plus a new
`src/components/ui/` dir-exclusion** so the primitives may legitimately render the bare elements they wrap). **Scope decision
(so the number is DRIVEABLE to 0, not noise — mirrors EPIC-11's spacing exclusion):** the `input` sub-count EXCLUDES
`type="file|checkbox|radio"` (toggle/file-picker controls with no text-field home — a *future* epic may add `ui.Checkbox`/
`ui.FileButton`); `date`/`time`/`number`/text inputs DO count (they become `ui.Input`, which spreads `type`). *Routes
rendering clean* stays **31/31**; `tokenViolations`/`offSystemUtilities`/`offSystemStyle` stay **0** (`--assert-zero` must keep
passing through every stage).

### Rails to reuse (read ONCE — do NOT reinvent)
- **`src/components/ui/index.tsx`** — the existing primitives to mirror in structure/token-discipline: `Button` (`:94`,
  `variant`/`size`/`icon`/`fullWidth`, token styles), `Input` (`:144`, `value`/`onChange(string)`/`icon`/`mono`, spreads
  `...rest` so `type` passes through), `TextArea` (`:205`), `Card` (`:24`), `Badge`. All are **token-clean** (`var(--radius-*)`,
  `var(--text-*)`, `var(--ease-*)`, token colours) — the three NEW primitives (S1) copy that discipline verbatim so they audit
  at `tokenViolations`/`offSystemUtilities`/`offSystemStyle` = 0.
- **`scripts/metrics.mjs`** — `appCodeFiles()` (`:58`, the DS-infra-allowlisted `.ts/.tsx/.css` walk; the `design-system/` dir
  and the `DS_INFRA` set `:50` are excluded), and the metric-function shape (`styleViolations()` `:143`, `tokenViolations()`
  `:90`) → snapshot field → table row (`:224`) → offenders list → optional `--assert-zero` gate (`:248`). The new
  `controlViolations()` slots in exactly as `styleViolations()` did in EPIC-11 S1.
- **`scripts/styleAudit.mjs` + `styleAudit.test.mjs`** — the exact template for a pure, unit-pinned, dependency-free detector
  (`scanStyleViolations(text) → {radii,type,motion,total}` + 16 test cases). Copy the module shape for `controlAudit.mjs`
  (`scanControlViolations(text) → {button,input,select,textarea,total}`).
- **The MIGRATION MAPPING RULE (shared by every S2–S8 migration stage — apply mechanically, no re-planning):**
  - bare `<button>` **with a text/label child** → `ui.Button` (pick `variant` by role: primary action = `primary`, else
    `secondary`/`ghost`; keep existing `onClick`/`disabled`/`aria-*`).
  - bare `<button>` **icon-only** (single glyph/emoji child, close ✕, nav ‹›, favorite ♥, play/pause, delete) → **`ui.IconButton`**
    (S1) — it REQUIRES an `aria-label` (supply one from the action; this is the a11y dividend).
  - a **row of mutually-exclusive toggle buttons** (tabs, grid/list, provider toggle, quick-set chips) → **`ui.Segmented`** (S1)
    — `items={[{value,label|icon,ariaLabel?}]}` + `value` + `onChange`; renders `role="tablist"`/`radiogroup` with
    `aria-pressed`/`aria-selected` per item.
  - bare `<select>` → **`ui.Select`** (S1) — `value`/`onChange(string)`/`options={[{value,label}]}` (native `<select>` under the
    hood for a11y + keyboard; token-styled chrome). Carries the accessible name the call site already had.
  - bare `<input>` (text/search/number/date/time…) → `ui.Input` (`type` spreads through `...rest`); bare `<textarea>` →
    `ui.TextArea`. (`type="file|checkbox|radio"` inputs are OUT of scope this epic — leave them, they don't count.)
  - **Behaviour-preserving:** keep every handler, `value`, `disabled`, key, and existing `aria-*`; this changes the rendered
    element + styling, NOT the logic. Because it *is* a DOM/visual change (unlike EPIC-11's pure value swaps), each stage is
    bounded to a small file group and its acceptance includes the render-smoke.

Stages (Builder takes the topmost `[ ]`; each one run, downhill given the ones before, build+vitest+eslint green,
`tokenViolations`/`offSystemUtilities`/`offSystemStyle` stay 0; `offShellControls` marches toward 0):

- [x] **S1 · Build the audit + COMPLETE the primitive set + establish the baseline (drive nothing yet). ✅ SHIPPED 2026-07-11 (`main`).**
  Real baseline **`offShellControls` = 341 (b271/i48/s6/t16) across 54 files** — the honest comprehensive count over the full
  `appCodeFiles()` set (the ratified ≈148/b127 estimate was a subset census; the detector's true number is higher, which only
  makes S2–S8 more valuable). `scripts/controlAudit.mjs` + `controlAudit.test.mjs` (13 tests) shipped; `metrics.mjs` gained
  `controlViolations()` + the `offShellControls`/`offShellControlDims` snapshot fields + `b/i/s/t` row + offenders list + a
  `src/components/ui/` dir-exclusion in `appCodeFiles()` (colour/style metrics verified Δ ±0). The three primitives
  `Select`/`IconButton`/`Segmented` shipped in `src/components/ui/index.tsx` (exported), unit-pinned by new `ui.test.tsx`
  (8 tests). build🟢 vitest 450→471🟢 eslint clean; tokens/off-system/offSystemStyle 0 (`--assert-zero` STILL exit 0 — new
  metric ungated); bundle gz 729.8 ±0 (primitives tree-shaken until S2 mounts them), no new deps. ▶ NEXT = **S2 (migrate Reader
  16→0)**. *Top offenders: Reader 19, FormBuilder 16, Calendar 15, Calculator 14, DataCenter 14, AIChat 13, Maps 12, Photos 12.*
  <details><summary>original S1 spec</summary>
  The additive, fully-downhill foundation — no app migration, zero render risk.
  - **New `scripts/controlAudit.mjs`** — pure, dependency-free `export function scanControlViolations(text) →
    {button,input,select,textarea,total}`: count opening tags `<button`, `<select`, `<textarea`, and `<input>` where the tag
    does NOT carry `type="file|checkbox|radio"` (scan the tag up to its `>` for the `type=` attr). Mirror `styleAudit.mjs`'s
    module shape (header comment stating the scope decision + the exclusion rationale).
  - **New `scripts/controlAudit.test.mjs`** (≥8): counts a bare `<button>`; a `<select>`; a `<textarea>`; a text `<input>`;
    EXCLUDES `type="file"`/`"checkbox"`/`"radio"` inputs; COUNTS a `type="date"`/`"number"` input; a multi-line `<button\n …>`
    tag; returns 0 for a file that only uses `ui.Button`/`<Input>` (capitalised components are not bare tags).
  - **`scripts/metrics.mjs`** — add `controlViolations()` (mirror `styleViolations()` `:143`) over `appCodeFiles()`, but add a
    `src/components/ui/` **dir-exclusion** (alongside the existing `design-system/` one at `:60`) so the primitives' own bare
    elements aren't counted. Add `offShellControls` (total) + `offShellControlDims {button,input,select,textarea}` to the
    snapshot; add the table row (`b/i/s/t` breakdown, like the `offSystemStyle` `r/t/m` row at `:224`); add an offenders list.
    Do **NOT** add it to `--assert-zero` yet (it's non-zero — S9 locks it, exactly as EPIC-5 S8 / EPIC-11 S4 did).
  - **Complete the `ui` primitive set in `src/components/ui/`** — three new token-clean, a11y-correct primitives (each unit-
    pinned in a new/extended `src/components/ui/ui.test.tsx`):
    - **`Select`** — `{ value, onChange:(v:string)=>void, options:{value:string;label:string}[], className?, ariaLabel? }`; a
      native `<select>` under the hood (keyboard/AT), token-styled (`.gp`/`var(--radius-*)`/`var(--text-*)`), `aria-label` from
      the prop.
    - **`IconButton`** — `{ icon:ReactNode, onClick, 'aria-label':string (REQUIRED via typed prop), variant?, size?, disabled? }`;
      a square/circular token target; TypeScript forces the `aria-label` (the a11y dividend).
    - **`Segmented`** — `{ value, onChange:(v:string)=>void, items:{value:string;label?:ReactNode;icon?:ReactNode;ariaLabel?:string}[],
      className? }`; renders a token-styled segmented control (`role="radiogroup"`, each option `aria-pressed`/`aria-checked`);
      collapses the ubiquitous tab-bar / grid-list / provider-toggle idiom.
    Export all three from `src/components/ui/index.tsx` (and re-export path the apps already use).
  - **Baseline:** run `node scripts/metrics.mjs`; record `offShellControls` (expected ≈148, `b127/i≈14/s5/t2` — report the EXACT
    number the detector yields after the input-type exclusion) into the metrics table + `metrics.json`.
  - *Acceptance:* `controlAudit.test.mjs` green; `Select`/`IconButton`/`Segmented` exist, exported, unit-pinned, and audit at
    tokens/off-system/offSystemStyle 0; the `offShellControls` row + snapshot field appear with the real baseline; build🟢
    vitest🟢 eslint clean; `--assert-zero` STILL exit 0 (colour/style metrics untouched, new metric not yet gated); bundle gz
    ±0 (dev script + tiny components), no new deps.
  </details>

- [ ] **S2 · Migrate Reader (16 → 0) — the single heaviest file, alone.** `src/apps/reader/Reader.tsx` — apply the mapping
  rule to all 16 bare controls (mostly reader-toolbar icon buttons → `IconButton`; any dropdown → `Select`). Keep every handler
  + the file-`<input>` (`type="file"`, out of scope) as-is. *Acceptance:* `node scripts/metrics.mjs` → `offShellControls`
  Reader-attributed count = 0 (headline ≈148 → ≈132); Reader renders clean in the smoke (`GRAPH-LEGIBLE reader/book` axis still
  ✅); build🟢 vitest🟢 eslint clean; tokens/off-system/offSystemStyle 0.

- [ ] **S3 · Migrate Calendar (15 → 0) — alone (complex date-grid; keep keyboard nav intact).** `src/apps/calendar/Calendar.tsx`
  — mapping rule; the month/nav arrows → `IconButton`, view toggles → `Segmented`, the `useInboundHandoff` receive path +
  `ProvenanceChip` untouched. *Acceptance:* Calendar count = 0 (≈132 → ≈117); Calendar renders clean + `INBOUND-LANDS
  calendar/editor` axis still ✅; build🟢 vitest🟢 eslint clean; conformance 0.

- [ ] **S4 · Migrate Clock (13) + Photos (12) = 25 → 0 — the `Segmented`/`IconButton` showcase.**
  `src/apps/clock/Clock.tsx` (tab row → `Segmented`, quick-set-minute chips → `Segmented`, the `addCityTz` `<select>` `:267` →
  `Select`, alarm/remove/day-toggle icon buttons → `IconButton`) + `src/apps/photos/Photos.tsx` (grid-size + grid/list +
  favorites-filter toggles → `Segmented`, tag chips → `Segmented`, lightbox nav/close/favorite/delete → `IconButton`).
  *Acceptance:* both files' counts = 0 (≈117 → ≈92); both render clean + `MEDIA-PERSISTS photos` axis still ✅; conformance 0.

- [ ] **S5 · Migrate the artifacts family (27 → 0).** `src/apps/artifacts/artifacts/FormBuilder.tsx` (9; incl. `<select>` `:94`
  → `Select`), `Flashcards.tsx` (9), `Kanban.tsx` (4), `ChartBuilder.tsx` (4), `MarkdownStudio.tsx` (1) — one coherent sub-app
  family, repetitive control patterns. Mapping rule throughout. *Acceptance:* all five files = 0 (≈92 → ≈65); each artifact
  renders clean; conformance 0.

- [ ] **S6 · Migrate media + language (27 → 0).** `src/apps/video/Video.tsx` (8), `src/apps/language/Language.tsx` (7; both
  `<select>`s `:194`/`:207` → `Select` — reconcile with the existing aria-labels the a11y pass added), `src/apps/music/Music.tsx`
  (6; icon transport → `IconButton`, preserving the a11y names the 2026-07-10 polish added), `src/apps/browser/Browser.tsx` (6).
  *Acceptance:* all four = 0 (≈65 → ≈38); each renders clean + `MEDIA-PERSISTS music/video` axes still ✅; conformance 0.

- [ ] **S7 · Migrate the utility apps (16 → 0).** `src/apps/files/Files.tsx` (7), `src/apps/weather/Weather.tsx` (4),
  `src/apps/datacenter/DataCenter.tsx` (3), `src/apps/maps/Maps.tsx` (1), `src/apps/grammar/Grammar.tsx` (1). Mapping rule.
  *Acceptance:* all five = 0 (≈38 → ≈22); each renders clean (Files/Weather/Maps keep their env-gated-fetch behaviour);
  conformance 0.

- [ ] **S8 · Migrate the Cakra family + the shell components tail (≈22 → 0) — the LAST offenders.**
  `src/apps/cakra/tabs/PromptGenerator.tsx` (7; `<select>` `:397` → `Select`), `src/apps/cakra/tabs/Editor.tsx` (7; `<select>`
  `:142` → `Select`), `src/apps/cakra/tabs/TokenCounter.tsx` (2), `src/apps/cakra/solver/ProblemDetail.tsx` (2),
  `src/apps/cakra/components/SettingsPanel.tsx` (1), `src/apps/cakra/components/ModelPicker.tsx` (1), `src/apps/cakra/AIChat.tsx`
  (1), `src/components/AppHost.tsx` (3), `src/components/Bridge.tsx` (1). Re-run the census; drive ANY residual offender the
  earlier stages missed to 0 too — **do not stop at "mostly."** *Acceptance:* `node scripts/metrics.mjs` → **`offShellControls`
  = 0 (`b0/i0/s0/t0`)**; all routes render clean (31/31); build🟢 vitest🟢 eslint clean; tokens/off-system/offSystemStyle 0.

- [ ] **S9 · LOCK `offShellControls` in `--assert-zero` → ★ EPIC-14 CODE-COMPLETE.** Add `if (snapshot.offShellControls > 0)
  fail.push(...)` to the `--assert-zero` block (`scripts/metrics.mjs:248`, beside the existing `tokenViolations`/
  `offSystemUtilities`/`offSystemStyle` gates) + a `controlAudit` line to the success message. Add a header comment in
  `src/components/ui/index.tsx` stating the invariant: *app code renders interactive controls through the `ui` primitives —
  a bare `<button>`/`<select>`/`<textarea>`/text-`<input>` in an app file fails CI.* **Verify the lock BITES:** temporarily
  re-introduce one bare `<button>` in an app file → `--assert-zero` exits 1 → revert. *Acceptance:* `--assert-zero` gates
  `offShellControls=0` and goes RED on a single re-introduced bare control; build🟢 vitest🟢 eslint clean; conformance (all
  four axes) 0. **★ EPIC-14 CODE-COMPLETE (S1–S9) → QA confirms `offShellControls 0` LOCKED on green main → Strategist retires
  to DONE.**

> _**Ratified 2026-07-10.** Ordered so each stage is downhill: S1 is pure-additive (detector + the three missing primitives +
> baseline — zero migration risk, and it stands up the shell homes every later stage migrates INTO); S2–S8 sweep the 27
> offender files heaviest-first (the exact EPIC-5/11 descending-file-mass discipline), each bounded to a small group so the
> render-smoke fully covers it; S9 locks the metric so islands can never creep back — mirroring EPIC-5 S8 / EPIC-11 S4. When
> all nine ship AND QA confirms `offShellControls 0` LOCKED on green main → retire EPIC-14 to DONE. The next cloud-executable
> candidate is a measured **accessibility pass** (`prefers-reduced-motion` honoured across animations + an ARIA/keyboard
> coverage metric — now largely seeded by the IconButton/Segmented/Select a11y dividend) or the RFC's **`docMass`** doc-mass
> conformance metric; **EPIC-7 · Android stays device-gated.**_

---

## ✅ DONE — retired by the Strategist 2026-07-10 (S1–S3 all shipped + QA-render-CONFIRMED LIVE; `GRAPH-LEGIBLE 1/1 → 3/3` + `INBOUND-LANDS 3/3 → 4/4` on green main `a9bec85`; the last two graph-islands closed) — EPIC-13 · The last two islands join the organism (Mail + Crypto become first-class Empire citizens)

> **★ CODE-COMPLETE + QA-CONFIRMED 2026-07-10 (S1–S3 all shipped + render-confirmed on green main `a9bec85`): `GRAPH-LEGIBLE 3/3 ✅` + `INBOUND-LANDS 4/4 ✅`.** Mail + Crypto are now full citizens — graph-legible, shelled, emitting via ⚡, and Mail both receives handoffs and persists durable drafts. **Retired to DONE by the Strategist 2026-07-10; EPIC-14 (shell conformance) promoted to ACTIVE above.** *(EPIC-14's own premise — the incomplete `ui` set that forced Mail/Crypto to bare HTML — is the structural lock that keeps this win from regressing.)*

> **RATIFIED + PROMOTED by the Strategist 2026-07-09.** EPIC-12 is retired to DONE (below — `INTENT-ROUNDTRIP 0/2 → 2/2`
> QA-CONFIRMED LIVE on green main `17d2dd9`, S1–S3 all shipped + the reconcile-survival lock BITES). Every interconnection
> epic EPIC-1..12 that predates the mail+crypto apps is DONE. The Strategist audited the organism for the steepest REMAINING
> cloud-executable gradient and found it at the **top of the priority bias (interconnection, above design-consistency)**:
> **two brand-new apps shipped as raw-HTML ISLANDS that are not part of the organism at all.**
>
> **The gap (code-confirmed this run — `src/apps/mail/Mail.tsx`, `src/apps/crypto/CryptoApp.tsx`):** the **Mail** (email
> bridge, landed `e28b58c`) and **Crypto** (wallet-watch, landed `e28b58c`) apps are total organism outsiders on FOUR axes:
> 1. **Not in the Core graph.** Neither imports `useGraph` / `mirrorCollection`. A watched wallet address or an email/draft
>    is **invisible in The Network, Search, Timeline, and Inbox** — the organism literally cannot see them. Every other
>    collection-owning app (Reader/book, DataCenter/dataset, Files/file, Photos/photo, …) is graph-legible; these two are the
>    only remaining graph-islands, re-opening the exact gap EPIC-6 S4 closed for Reader.
> 2. **No inbound handoffs.** Neither uses `useInboundHandoff`. You can't "Send to Mail" a draft from Notes/Editor — the
>    receive half of the organism loop that 9 entity-apps already have.
> 3. **Off the design-system shell.** Both use bare `<button>`/`<select>`/`<input>`/`<textarea>` + inline flex/grid, with
>    **no registry glyph+accent header, no `.gp` glass surface, and none of the `src/components/ui` primitives**
>    (`Button`/`Input`/`TextArea`/`Card`). They *audit* at `offSystemStyle` 0 / `tokenViolations` 0 only because the build
>    routine tokenised their raw values in `234173e` — but they still bypass the component shell, so they read as a different
>    product bolted on, not "alien technology, one organism."
> 4. **No bespoke alien glyph.** `src/design-system/icons/index.ts` `alienIcons` has **no `Mail` or `Wallet` key**, so both
>    apps fall back to the bare orbital `Node` glyph (`getAppIcon` `FallbackIcon`) — they don't even have icons of their own.
>
> **Why this is the highest-gradient move now (one line):** the vision is "ONE interconnected organism that feels like alien
> technology"; two disconnected raw-HTML apps are its sharpest live contradiction, and interconnection ranks ABOVE
> design-consistency / the queued STATE-conformance candidate in the priority bias. It reuses the exact EPIC-6 `mirrorCollection`
> + EPIC-1 `useInboundHandoff` rails (no invention), is fully cloud-verifiable on the LOCAL-data paths (the backend inbox/
> balance fetches are 401-gated in cloud — see each stage's *cloud limit*), and needs no new deps.

**Leap:** Mail and Crypto stop being bolted-on raw-HTML panels and become full Empire citizens — rendered on the shared shell
(their own alien glyph + accent header + `.gp`/`ui` surfaces), **legible in the graph** (a watched wallet and a saved mail
draft appear as nodes in Network/Search/Timeline), **able to receive** ("Send to Mail" lands a prefilled draft with a
"From <source>" chip), and **able to emit** (⚡ `NodeActions` on wallet/draft rows spawn tasks/notes with honest provenance).
The organism has no islands left.

**Target metrics (Builder instruments them; QA confirms they moved):**
- **`GRAPH-LEGIBLE 1/1 → 2/2 → 3/3`** — Crypto's watch-list wallets (S1) + Mail's persisted drafts (S3) each become
  reload-durable graph nodes owned by the right app (the EPIC-6 S4 guard, extended per app).
- **`INBOUND-LANDS 3/3 → 4/4`** — Mail becomes a handoff receiver (S2), the EPIC-1 receive-loop guard extended.
- Both apps render on the Empire shell (new `Mail`/`Wallet` alien glyphs + accent header + `.gp`/`ui` components);
  *Routes rendering clean* stays **31/31** (mail included, now on the shell); `tokenViolations`/`offSystemUtilities`/
  `offSystemStyle` stay **0** (`--assert-zero` must keep passing).

### Rails to reuse (read ONCE — do NOT reinvent)
- **`src/lib/core/sync.ts` `mirrorCollection(type, app, items, { id, title, data })`** (`:112`) — the ~3-line rail that
  mirrors a collection living OUTSIDE the global store (own localStorage / component state) into the Core graph. **Reader is
  the exact precedent:** `Reader.tsx:45` `useEffect(() => mirrorCollection('book','reader', books, { id, title, data:
  bookNodeData }), [books])`, with the pure `data` mapper factored into `readerGraph.ts` + unit-pinned. Copy this shape
  verbatim; put each app's pure mapper in a sibling `*Graph.ts` so it unit-tests without React. Mirrored types created via
  `mirrorCollection` carry `data.sourceId` (reconcile keeps them) — they are NOT the phantom pattern EPIC-12 fixed.
- **`src/lib/useInboundHandoff.ts` `useInboundHandoff<T>(sessionKey)`** (`:25`) — the receiver half: reads/clears an
  `empire-*-clipboard` `sessionStorage` payload on mount, returns `{ payload, source, dismiss }`. **Calendar is the exact
  precedent:** `Calendar.tsx:81` `const inbound = useInboundHandoff<{text?;title?;from?}>('empire-calendar-clipboard')` +
  `Calendar.tsx:219` `<ProvenanceChip from={inbound.source} onDismiss={…}/>`.
- **`src/lib/appActions.ts`** — the SENDER half. Each cross-app action drops `sessionStorage['empire-<target>-clipboard'] =
  JSON.stringify({ …, from: data.source })` + `emit({type:'HANDOFF', fromId, toId, label})` (`:32`). The
  `empire-calendar-clipboard` (`:154`) / `empire-messages-clipboard` (`:188`) senders are the exact shape to copy for
  `empire-mail-clipboard`.
- **`src/components/ui/index.tsx`** — `Button` (`:94`), `Input` (`:144`), `TextArea` (`:205`), `Card` (`:24`), `Badge`,
  `Divider`; **`src/components/ui/NodeActions.tsx`** (⚡ menu → `intentsFor(node)`); **`src/components/ui/ProvenanceChip.tsx`**
  ("From <source>" badge). The **Search / Timeline** apps are the header idiom to mirror (registry glyph + `app.color` accent).
- **`src/design-system/icons/glyphs.tsx` + `index.ts`** — add a new alien glyph exactly as `Search`/`Timeline` were added
  (component in `glyphs.tsx`, `Wallet`/`Mail` key into `alienIcons` in `index.ts`; the registry already sets `icon:'Wallet'`
  / `icon:'Mail'`, today unresolved → `Node` fallback).
- **`src/apps/network/nodeColors.ts`** — the node-type → colour map for The Network legend; add `wallet` (S1) + `draft` (S3).
- **`scripts/qa-smoke.mjs`** — the `GRAPH-LEGIBLE` guard (`:249`, `readReaderBookNodes` reads `empire-core-graph` for a
  `type`+`app` node, drives → reload → asserts persistence) and the `INBOUND-LANDS` guard (`:136`, a `receivers` list seeds
  `empire-*-clipboard`, reloads, asserts a "From" chip + a prefilled control). Extend both, don't rewrite.

Stages (Builder takes the topmost `[ ]`; each one run, downhill given the ones before, build+vitest+eslint green,
`tokenViolations`/`offSystemUtilities`/`offSystemStyle` stay 0):

- [x] **S1 · Crypto becomes a graph-legible Empire app — `Wallet` glyph + shell + `wallet` nodes → `GRAPH-LEGIBLE 1/1 → 2/2`. ✅ SHIPPED 2026-07-10 (`main`).**
  Added a bespoke alien `Wallet` glyph (`glyphs.tsx` + `icons/index.ts` map → kills the `Node` fallback; registry already set `icon:'Wallet'`). New pure `src/apps/crypto/cryptoGraph.ts` (`walletItems` drops blank/whitespace addresses, stable `wallet:${coin}` ids; `walletNodeData` → `{coin,address}`) unit-pinned by `cryptoGraph.test.ts` (+6). `CryptoApp.tsx` re-shelled: header with `getAppIcon('Wallet')` + `var(--ember)` accent (= the registry `#c4a265` crypto gold, token-clean), raw `<button>`/`<input>` → `ui` `Button`/`Input` (mono), balances on `Card`/`.gp`; watch-list hydrate/persist preserved; `useEffect(mirrorCollection('wallet','crypto', walletItems(addresses), …), [addresses])` joins the organism. `nodeColors.ts` `wallet: '196,162,101'` (ember gold). GRAPH-LEGIBLE guard generalised (`readReaderBookNodes`→`readNodes(page,type,app)`) + a `crypto/wallet` axis (seed `crypto-watch-list` before mount, assert `wallet` node owned by `crypto`, survives reload) → headline `1/1 → 2/2`; REPORT table gains the row. build🟢 vitest 421→427🟢 eslint clean; tokens/off-system/offSystemStyle 0 (`--assert-zero` exit 0); bundle gz 728 ±0, no new deps. **Cloud limit:** the graph-legibility axis is fully local + headless-verifiable, but the smoke needs `playwright` (still not in package.json) so the `2/2` render-confirm is owed to the QA routine; the `/api/wallet/check` balance fetch stays an on-device confirm.
  The watch-list is 100% local (`localStorage['crypto-watch-list']`), so this whole stage is cloud-verifiable; only the
  balance fetch is backend-gated.
  - **`src/design-system/icons/glyphs.tsx`** — add a bespoke alien **`Wallet`** glyph component (mirror an existing glyph's
    `viewBox`/stroke/`currentColor` structure — e.g. `Datacenter`/`Files`); export it. If `AppIcon`'s union is explicit, add it.
  - **`src/design-system/icons/index.ts`** — `import { … Wallet }`, add `Wallet,` to the `alienIcons` map (registry already
    uses `icon:'Wallet'`; this removes the `Node` fallback).
  - **New `src/apps/crypto/cryptoGraph.ts`** (mirror `src/apps/reader/readerGraph.ts`): a pure
    `export function walletItems(addresses: Record<Coin,string>): { id: string; coin: Coin; address: string }[]` returning
    ONLY coins whose address is a non-empty trimmed string, each `{ id: `wallet:${coin}`, coin, address }`; plus
    `export function walletNodeData(w): Record<string,unknown> { return { coin: w.coin, address: w.address } }`. Pure → unit-testable.
  - **`src/apps/crypto/CryptoApp.tsx`** — (a) **shell:** a header with `getAppIcon('Wallet')` glyph + the `crypto` accent
    (`#c4a265`) + the name, matching the Search/Timeline header; replace raw `<button>`→`ui` `Button`, raw `<input>`→`ui`
    `Input`, wrap the results section in a `.gp`/`Card` glass surface. Keep the `crypto-watch-list` hydrate/persist logic
    untouched. (b) **mirror:** `useEffect(() => mirrorCollection('wallet','crypto', walletItems(addresses), { id: w => w.id,
    title: w => `${w.coin.toUpperCase()} · ${w.address.slice(0,6)}…${w.address.slice(-4)}`, data: walletNodeData }),
    [addresses])`.
  - **`src/apps/network/nodeColors.ts`** — add a `wallet` type colour (an unused-ish accent, e.g. the crypto gold `#c4a265`)
    so wallets read in the Network legend.
  - **Extend the `GRAPH-LEGIBLE` guard** (`scripts/qa-smoke.mjs`): generalise `readReaderBookNodes` to a
    `readNodes(page, type, app)` helper (or add a parallel `readWalletNodes`), then add a **`crypto/wallet`** axis — seed
    `localStorage['crypto-watch-list']` with a real address (e.g. `{btc:'bc1qxyqa...probe',eth:'',sol:'',xrp:'',doge:''}`)
    BEFORE navigating, open `/app/crypto` (the hydrate effect fires + mirrors), assert a `wallet` node owned by `app==='crypto'`
    in `empire-core-graph`, reload, assert it persists. Bump the console + the REPORT section to **`GRAPH-LEGIBLE 1/1 → 2/2`**
    (table gets a `crypto/wallet` row).
  - **Test `src/apps/crypto/cryptoGraph.test.ts`** (≥4): `walletItems` drops empty/whitespace addresses, keeps configured
    ones with correct `id`/`coin`/`address`, order is deterministic (COINS order); `walletNodeData` returns `{coin,address}`.
  - *Acceptance:* a watched wallet appears as a `wallet` node in Network/Search/Timeline that survives reload; Crypto renders
    on the Empire shell with the new `Wallet` glyph (no `Node` fallback); **`GRAPH-LEGIBLE 2/2`**; build🟢 vitest🟢 eslint clean;
    tokens 0, off-system 0, offSystemStyle 0 (`--assert-zero` exit 0); no new deps.
  - *Cloud limit:* live wallet balances are backend-gated (`/api/wallet/check` → 401 in cloud) — the watch-list mirror is
    fully local, so graph-legibility is cloud-verified headless; the balance fetch stays an on-device confirm.

- [x] **S2 · Mail becomes an Empire app + a handoff RECEIVER — `Mail` glyph + shell + inbound → `INBOUND-LANDS 3/3 → 4/4`. ✅ SHIPPED + RENDER-CONFIRMED 2026-07-10 (`main`).**
  Bespoke alien `Mail` envelope glyph (`glyphs.tsx`+`index.ts`, kills the `Node` fallback); `SEND_TO_MAIL` sender in `appActions.ts` (`empire-mail-clipboard` = `{subject,body,from}` + one `HANDOFF`→mail) wired into `SendResultMenu` `ACTION_TARGET`+`DEFAULT_ACTIONS`; `Mail.tsx` re-shelled (header `getAppIcon('Mail')` + `var(--signal)` accent, provider `<select>`→segmented `ui` `Button` toggle w/ `aria-pressed`, compose on a `Card` w/ `ui` `Input`/`TextArea`, inbox on `.gp`) + `useInboundHandoff('empire-mail-clipboard')` → opens compose prefilled + `<ProvenanceChip>`. `INBOUND-LANDS` guard grew a `mail`/`notes` case → **4/4 render-confirmed** on the production dist (32/32 routes clean, chip=true prefilled=true). build🟢 vitest 432→435🟢 eslint clean; tokens/off-system/offSystemStyle 0 (`--assert-zero` exit 0); bundle gz 728.2→728.6 (+0.4), no new deps.
  The inbound-receive + prefill is 100% local (a seeded `sessionStorage` payload), so it's cloud-verifiable; only send/inbox
  are backend-gated. Reuses S1's shell pattern.
  - **`src/design-system/icons/glyphs.tsx` + `index.ts`** — add a bespoke alien **`Mail`** glyph + the `Mail` key to
    `alienIcons` (registry already uses `icon:'Mail'` → removes the `Node` fallback).
  - **`src/lib/appActions.ts`** — add a **"Send to Mail"** sender mirroring the `empire-calendar-clipboard` sender (`:154`):
    `sessionStorage.setItem('empire-mail-clipboard', JSON.stringify({ subject: data.title, body: data.text, from: data.source }))`
    + `emit({type:'HANDOFF', fromId, toId:'mail', label:'to mail'})`. Wire it into the same `CROSS_APP_ACTIONS` / send-target
    list the other receivers use (so Notes/Editor/Grammar/… surface "Send to Mail" via `SendResultMenu`/`NodeActions`).
  - **`src/apps/mail/Mail.tsx`** — (a) **shell:** `getAppIcon('Mail')` glyph + the `mail` accent (`#1a8caa`) header; raw
    `<select>`/`<button>`/`<input>`/`<textarea>` → `ui` `Button`/`Input`/`TextArea` (the provider `<select>` may stay native
    or become a small `ui` control — keep it accessible); message list on a `.gp` surface. (b) **inbound:** `const inbound =
    useInboundHandoff<{ to?:string; subject?:string; body?:string; from?:string }>('empire-mail-clipboard')`; on a non-null
    payload, open the compose panel (`setComposeOpen(true)`) + prefill `compose` from `payload.to/subject/body`; render
    `<ProvenanceChip from={inbound.source} onDismiss={() => inbound.dismiss()} />` in the compose header (mirror `Calendar.tsx:219`).
  - **Extend the `INBOUND-LANDS` guard** (`scripts/qa-smoke.mjs:136`): add a **`mail`** receiver to the `receivers` list —
    `{ id:'mail', key:'empire-mail-clipboard', from:'notes', needle:'<seeded body substring>' }` (mirror the `calendar` entry
    at `:146`): seed the clipboard, reload `/app/mail`, assert a "From <source>" chip renders AND the compose body/subject is
    prefilled with the needle. Headline **`INBOUND-LANDS 3/3 → 4/4`**; REPORT table gets a `mail | notes` row.
  - **Tests:** extend `appActions.test.ts` — the "Send to Mail" action writes `empire-mail-clipboard` (with `from`) + emits
    exactly ONE `HANDOFF` arc to `mail`; extend `src/apps/mail/Mail.test.tsx` — a seeded `empire-mail-clipboard` payload →
    compose opens + body/subject prefilled + a `ProvenanceChip` renders (the first case goes RED without the hook).
  - *Acceptance:* "Send to Mail" from Notes/Editor lands a prefilled compose draft with a "From <source>" chip; Mail renders
    on the Empire shell with the new `Mail` glyph; **`INBOUND-LANDS 4/4`**, mail still renders clean (31/31); build🟢 vitest🟢
    eslint clean; tokens/off-system/offSystemStyle 0 (`--assert-zero` exit 0); no new deps.
  - *Cloud limit:* the actual send + inbox fetch are backend-gated (`/api/integrations/email/*` → 401 in cloud) — the
    inbound-receive + prefill is fully local and cloud-verified; send/inbox stay on-device.

- [x] **S3 · Mail drafts PERSIST + become graph-legible; both apps EMIT via ⚡ NodeActions → `GRAPH-LEGIBLE 2/2 → 3/3` → ★ EPIC-13 CODE-COMPLETE.** ✅ SHIPPED + RENDER-CONFIRMED 2026-07-10 (green main). Durable drafts (`empire-mail-drafts`) via new `mail/lib/draftStore.ts`; graph-mirror via new `mail/mailGraph.ts` (`draftNodeData`) + `mirrorCollection('draft','mail',…)`; Mail gained a Save-draft button + Drafts list (reopen/delete) with per-row ⚡ `<NodeActions type="draft" sourceId={d.id}>`; Crypto gained per-wallet ⚡ `<NodeActions type="wallet" sourceId={\`wallet:${coin}\`}>`; `make-task` now `accepts` `wallet`+`draft` (so both offer task AND note); `nodeColors.ts` `draft` colour. Guard grew the `mail/draft` axis → **`GRAPH-LEGIBLE 3/3 ✅`** render-confirmed (32/32 routes clean, INBOUND-LANDS 4/4). build🟢 vitest 435→445🟢 eslint clean; tokens/off-system/offSystemStyle 0 (`--assert-zero` exit 0); no new deps. **★ EPIC-13 CODE-COMPLETE (S1–S3) → ready for the Strategist to retire to DONE. NOTE (trap): mirrored nodes get a FRESH graph id (item id lands in `data.sourceId`), so ⚡ must use `type`+`sourceId` (the Reader precedent), NOT `nodeId` as the spec loosely suggested.**
  Today Mail's compose is **ephemeral** (a close/reload loses it) — a real capability gap. A durable local drafts store fixes
  that AND makes Mail graph-legible via the same rail as Crypto/Reader (fully cloud-verifiable — no backend). This is the
  capstone: both islands now emit, and Mail persists.
  - **New `src/apps/mail/lib/draftStore.ts`** — a tiny localStorage store (`empire-mail-drafts`): `Draft = { id: string; to:
    string; subject: string; body: string; updatedAt: number }`; `listDrafts(): Draft[]`, `saveDraft(d: Omit<Draft,
    'updatedAt'>): Draft` (upsert by id, stamps `updatedAt`), `deleteDraft(id: string): void`. Pure-ish (localStorage only) →
    unit-testable.
  - **New `src/apps/mail/mailGraph.ts`** (mirror `readerGraph.ts`): pure `export function draftNodeData(d: Draft):
    Record<string,unknown> { return { subject: d.subject, to: d.to } }` (title/body carry the rest via the mirror).
  - **`src/apps/mail/Mail.tsx`** — add a **"Save draft"** button in compose (persists the current `compose` via `saveDraft`,
    gives it a fresh id if new) + a **Drafts** list (from `listDrafts()`, each row opens it back into compose, with a delete);
    `useEffect(() => mirrorCollection('draft','mail', drafts, { id: d => d.id, title: d => d.subject || '(no subject)', data:
    draftNodeData }), [drafts])`; mount `⚡ <NodeActions nodeId={d.id}>` on each draft row (emit — a draft can spawn a task/note).
  - **`src/apps/crypto/CryptoApp.tsx`** — mount `⚡ <NodeActions nodeId={`wallet:${coin}`}>` on each configured wallet row
    (emit — a wallet can spawn a task/note; the node already exists from S1). Mirror Reader's per-card `<NodeActions>` idiom.
  - **`src/apps/network/nodeColors.ts`** — add a `draft` type colour.
  - **Extend the `GRAPH-LEGIBLE` guard** with a **`mail/draft`** axis: seed `localStorage['empire-mail-drafts']` with one
    draft, reload `/app/mail`, assert a `draft` node owned by `app==='mail'` in `empire-core-graph` + survives a 2nd reload.
    Headline **`GRAPH-LEGIBLE 2/2 → 3/3`**; REPORT table gets a `mail/draft` row.
  - **Tests:** `src/apps/mail/lib/draftStore.test.ts` (save→list→delete roundtrip; upsert by id; survives a fresh `listDrafts`)
    + `src/apps/mail/mailGraph.test.ts` (`draftNodeData` shape). ≥5 combined.
  - *Acceptance:* a saved Mail draft survives reload AND appears as a `draft` node in Network/Search/Timeline; both Crypto
    wallets and Mail drafts offer ⚡ intents (spawn task/note); **`GRAPH-LEGIBLE 3/3`**; build🟢 vitest🟢 eslint clean;
    tokens/off-system/offSystemStyle 0 (`--assert-zero` exit 0); no new deps. **★ EPIC-13 CODE-COMPLETE (S1–S3) → QA confirms
    `GRAPH-LEGIBLE 3/3` + `INBOUND-LANDS 4/4` on green main → Strategist retires to DONE.**
  - *Cloud limit:* the drafts store is 100% local → fully cloud-verified; the ⚡ intent-run window/focus change is unit-pinned
    in `NodeActions`' existing tests (the same on-device caveat every ⚡ surface carries).

> _**Ratified 2026-07-09.** Ordered so each stage is downhill: S1 stands up the shared shell pattern + the graph-mirror rail on
> the simplest (fully-local) app (Crypto → `GRAPH-LEGIBLE 2/2`); S2 reuses the shell + adds Mail's receive loop
> (`INBOUND-LANDS 4/4`); S3 gives Mail durable drafts (a real capability) that close the last graph-island
> (`GRAPH-LEGIBLE 3/3`) and light ⚡ emit on both. When all three ship AND QA confirms `GRAPH-LEGIBLE 3/3` + `INBOUND-LANDS 4/4`
> on green main → retire EPIC-13 to DONE. The next cloud-executable candidate is a measured design-system STATE/shell-adoption
> epic (a `raw-control`/state-primitive audit → `--assert-zero` lock, the EPIC-5/11 template — now that two apps have shown how
> islands creep back in) or a measured accessibility pass; **EPIC-7 · Android stays device-gated.**_

---

## ✅ DONE — retired by the Strategist 2026-07-09 (S1–S3 all shipped + QA-CONFIRMED LIVE; `INTENT-ROUNDTRIP 0/2 → 2/2` on green main `17d2dd9`; the reconcile-survival lock BITES) — EPIC-12 · Intent integrity (every cross-app creation makes a REAL, persistent entity — no phantom graph nodes)

> **RATIFIED + PROMOTED by the Strategist 2026-07-06.** EPIC-11 is retired to DONE (below — `offSystemStyle` 56→0 LOCKED
> + QA-CONFIRMED on green `main`) and every interconnection epic EPIC-1..10 is DONE, so the fleet had **no active epic and
> idled 3 runs on standalone empty-state polish** (adoption 1→6→13; see CONTEXT.md). The Strategist audited the organism
> for the steepest REMAINING cloud-executable gradient and found a latent **correctness bug in the core circulatory layer**
> — which sits at the very top of the priority bias (**fix-what's-broken → interconnection**), above any
> design-consistency / a11y / empty-state-lock polish.
>
> **The bug (code-confirmed this run, `src/lib/core/sync.ts`):** two of the three core cross-app intents create **phantom**
> entities. `make-note-from` (`sync.ts:139`) and `add-to-learning` (`sync.ts:153`) call `g.addNode({ type:'note'|'learning',
> … })` directly — they add a graph node but NEVER write to the real store (`useStore.addNote` / `addLearningItem`).
> Because `note`/`learning` are **centrally-mirrored types**, `reconcile()` (`sync.ts:63-65`) **DELETES any node of that
> type whose `data.sourceId` is absent from its store** — and these phantom nodes carry no `sourceId`. So the result of
> "Make Note from this" / "Add to Learning" is an entity that (a) **never appears in its home app** (Notes/Learning shows
> nothing to open or edit) and (b) is **pruned on the very next store mutation or page reload**. The graph momentarily
> claims an entity its app doesn't have, then loses it. (This is the exact "architecturally impossible" seam EPIC-9 S2 hit
> and documented in CONTEXT.md.) **`make-task` is NOT affected** — `task` is graph-only BY DESIGN (Inbox is the task lens
> over the graph; there is no task store), so its node survives the reconcile; leave it alone.

**Leap:** every cross-app creation produces a **real, editable, reload-durable** entity in its home app — the graph and the
apps can never disagree. "Make Note from this Calendar event" gives you a note you can open and edit in Notes (and it lights
an HONEST calendar→notes synapse arc); "Add to Learning" gives you a real Learning item. Provenance stays intact end-to-end
(`data.from` survives the round-trip → node-lineage `↖ ancestry` + descendants `→ spawned` keep working on the REAL node).

**Target metric (new — Builder instruments it; QA confirms it moved):** a **`INTENT-ROUNDTRIP` guard** in
`scripts/qa-smoke.mjs` — for each store-backed creation intent, seed a survivable source, run the intent, and assert a
**real store entry** appears AND is mirrored as a graph node owned by the RIGHT app with `data.from` preserved AND
**survives a reload + the boot reconcile** (the exact failure the bug causes). **Headline `INTENT-ROUNDTRIP 0/2 → 2/2`**
(note + learning) + the "+ a unit test" discipline (`sync.test.ts`). *Routes rendering clean* stays **30/30**;
`tokenViolations` / `offSystemUtilities` / `offSystemStyle` stay **0** (`--assert-zero` must keep passing).

### Rails to reuse (read ONCE — do NOT reinvent)
- **`src/lib/store.ts`** — `useStore.getState().addNote(note)` / `addLearningItem(item)` are the real store writers.
  `Note` = `{ id, title, content, updatedAt, tags }` (**NO `from` yet** — S1 adds it, backward-compatibly). `LearningItem`
  = `{ id, topic, learned, date, nextReview, mastered, from? }` (**already has `from?`**). The store persists to
  `empire-store` (localStorage), so a real entry survives reload.
- **`src/lib/core/sync.ts`** — the mirror layer. `useStore.subscribe(syncAll)` fires **synchronously** on every `set()`,
  so the moment `addNote(...)` returns, `reconcile()` has ALREADY materialized the mirrored `note` node (`sourceId`-keyed,
  owned by `notes`). The note mirror's `data` (`sync.ts:82`) = `{ content, tags }` and the learning mirror's (`:89`) =
  `{ learned, mastered, nextReview }` — **neither carries `from` today**, so lineage would be lost on the round-trip; each
  stage adds `from` to its mirror.
- **`src/lib/core/intents.ts`** — `runIntent(intentId, node)` runs an intent; `intentsFor(node)` lists the ones a node
  accepts. `make-note-from` `accepts: n => n.type !== 'note'`; `add-to-learning` `accepts: n => ['note','message']
  .includes(n.type)` (so its source must be a real note/message, NOT a task).
- **`src/components/ui/NodeActions.tsx`** — the ⚡ menu that surfaces `intentsFor(node)` and calls `runIntent`; the
  PROVENANCE guard already drives this exact surface (the Editor ⚡ Send menu). `announceTransfer` (`sync.ts:26`) fires a
  real synapse arc only on a genuine app-boundary crossing (self-transfers stay silent).
- **`nodeLineageOf` / `childrenOf` (`src/lib/core/nodeLineage.ts`)** walk `data.from` — preserving it end-to-end is what
  keeps `<NodeLineage>` / `<NodeDescendants>` legible on the real node.

Stages (Builder takes the topmost `[ ]`; each one run, downhill given the ones before, build+vitest+eslint green,
`tokenViolations`/`offSystemUtilities`/`offSystemStyle` stay 0):

- [x] **S1 · The round-trip rail + `make-note-from` writes a REAL note + the `INTENT-ROUNDTRIP` guard (0/1). ✅ SHIPPED 2026-07-06 (`main`).**
  Done: `store.ts` `Note.from?` added; `sync.ts` note mirror `data` carries `from`; `make-note-from` now routes through
  `useStore.getState().addNote({ id, title:'Note: …', content, tags:[], updatedAt, from:n.id })` (new `newNoteId()` helper),
  resolves the synchronously-mirrored node by `sourceId` + `g.link`s it, and fires an HONEST `announceTransfer(n.meta.app,
  'notes', …)`. New `INTENT-ROUNDTRIP` guard in `qa-smoke.mjs` (+ REPORT section) drives the REAL ⚡ `<NodeActions>` "Make
  Note from this" menu on the Inbox — NOT a DEV hook. **DEV-hook path REJECTED:** QA serves the **production** `dist/` via
  `node server.js` (BASE `localhost:3001`), so `import.meta.env.DEV` is `false` there → a DEV-gated `window.__coreIntents`
  would NOT exist for the guard. The ⚡-menu drive is production-honest and works against `dist`. `sync.test.ts` +4 (store-
  write w/ from+copied content+title; title-fallback; un-prunable mirror owned by `notes` w/ from+sourceId; phantom pruned
  while store-backed survives `syncAll()`); `coreIntents.test.ts` updated (make-note-from now lights `messages→notes`).
  build🟢 vitest 367→372🟢 eslint clean; tokens 0, off-system 0, offSystemStyle 0 (`--assert-zero` exit 0); bundle 718.3→718.5
  (+0.2), no new deps. **QA owes the `INTENT-ROUNDTRIP 0/1 → 1/1` headless confirm** (builder has no playwright dep).
  - **`src/lib/store.ts`** — add optional **`from?: string`** to `interface Note` (backward-compatible, mirrors
    `LearningItem.from?`; a one-line comment: source node id for cross-app provenance).
  - **`src/lib/core/sync.ts`** — (a) the note mirror `data` (`:82`) now includes `from` when present:
    `data: n => ({ content: n.content, tags: n.tags, ...(n.from !== undefined ? { from: n.from } : {}) })`. (b) Rewrite
    `make-note-from` `run` (`:139`): instead of `g.addNode`, compute `const content = typeof n.data.content === 'string'
    ? n.data.content : n.title`, generate a fresh id, then `useStore.getState().addNote({ id, title: `Note: ${n.title}`,
    content, tags: [], updatedAt: Date.now(), from: n.id })`. The subscribe→reconcile has now created the mirrored `note`
    node synchronously; resolve it (`Object.values(useGraph.getState().nodes).find(x => x.type === 'note' &&
    x.data.sourceId === id)`) and `g.link(n.id, thatNode.id)` (best-effort mesh edge; lineage already flows via `data.from`).
    `announceTransfer(n.meta.app, 'notes', 'make note')` — now an HONEST cross-app arc when the source isn't owned by notes.
  - **New `INTENT-ROUNDTRIP` guard in `scripts/qa-smoke.mjs`** (mirror the PROVENANCE / GRAPH-LEGIBLE blocks; non-fatal) +
    a REPORT section: seed a graph-survivable **`task`** source node in `empire-core-graph` (task survives the boot
    reconcile), reload (startCoreSync runs), run `make-note-from` on it, then assert (axes): `stored` = a real note with
    `from`=source id is in the `empire-store` `notes` array (read localStorage); `mirrored` = a `note` graph node owned by
    `app==='notes'` with `data.from`=source id exists; `persisted` = after a SECOND reload BOTH still hold (the store
    persists AND reconcile now KEEPS the node because it's store-backed — the exact regression the bug caused). **Headline
    `INTENT-ROUNDTRIP 0/1 → 1/1`** (note first; learning added in S2).
  - **How the guard invokes the intent:** prefer driving the ⚡ **`<NodeActions>`** menu on the seeded task where it renders
    (Inbox lists every task with ⚡, or the Network inspector) exactly as the PROVENANCE guard drives the Editor ⚡ Send menu.
    **If a headless ⚡ drive proves fragile,** expose a DEV-only hook in `src/main.tsx` — `if (import.meta.env.DEV)
    (window as any).__coreIntents = { runIntent, intentsFor }` (import.meta.env.DEV-gated → ZERO production surface,
    tree-shaken from the shipped PWA) — and call `runIntent('make-note-from', node)` from the guard. Pick the lower-risk
    path; note which in the log.
  - **Test `src/lib/core/sync.test.ts`** (new, ≥4): running `make-note-from` on a source node adds exactly one note to the
    store with `from`=source id, `content` copied from the source, title `Note: <src>`; the note mirror's `data` carries
    `from`; a **store-backed** note node SURVIVES a `syncAll()` reconcile (would have caught the bug) while a hand-added
    phantom `note` node (no `sourceId`) is PRUNED by `syncAll()`.
  - *Acceptance:* "Make Note from this" on any non-note entity creates a real note you can open+edit in Notes that survives
    reload; `INTENT-ROUNDTRIP 0/1 → 1/1`; `sync.test.ts` green. build🟢 vitest🟢 eslint clean; tokens 0, off-system 0,
    offSystemStyle 0 (`--assert-zero` exit 0); no new deps.
  - *Cloud limit:* the "open in Notes and edit" visual is on-device — the guard carries the store-write + mirror +
    reload-survival roundtrip; the intent's store-write is unit-pinned in `sync.test.ts`.

- [x] **S2 · `add-to-learning` writes a REAL Learning item (`INTENT-ROUNDTRIP` 1/1 → 2/2). ✅ SHIPPED 2026-07-06 (`main`).**
  Done: `sync.ts` learning mirror `data` now carries `from`; `add-to-learning` routes through
  `useStore.getState().addLearningItem({ id, topic:n.title, learned:'', date:<today ISO>, nextReview:<today>, mastered:false,
  from:n.id })` (renamed `newNoteId`→`newEntityId`, shared with make-note-from), resolves the synchronously-mirrored
  `learning` node by `sourceId` + `g.link`s it, fires the HONEST `announceTransfer(n.meta.app, 'learning-tracker', …)`.
  `INTENT-ROUNDTRIP` guard grew a `learning` axis (seeds a REAL note in `empire-store`, drives its ⚡ "Add to Learning"
  menu on `/app/notes`, asserts store-entry + `learning`-node-owned-by-`learning-tracker` + reload survival) → headline
  `1/1 → 2/2`. `sync.test.ts` +4 (learning store-write w/ from+topic+ISO dates; un-prunable mirror owned by learning-tracker;
  phantom pruned while store-backed survives `syncAll()`; source→mirror mesh link). build🟢 vitest 381🟢 eslint clean;
  tokens/off-system/offSystemStyle 0 (`--assert-zero` exit 0); bundle +0.1, no new deps. **QA owes the `INTENT-ROUNDTRIP
  1/1 → 2/2` headless confirm** (builder has no playwright dep — the ⚡-menu drive is unrun in cloud; store logic unit-pinned).
  Reuses S1's pattern; also fixes the learning mirror's dropped `from`.
  - **`src/lib/core/sync.ts`** — (a) learning mirror `data` (`:89`) now includes `from`: `data: l => ({ learned: l.learned,
    mastered: l.mastered, nextReview: l.nextReview, ...(l.from !== undefined ? { from: l.from } : {}) })`. (b) Rewrite
    `add-to-learning` `run` (`:153`): instead of `g.addNode`, generate a fresh id and call
    `useStore.getState().addLearningItem({ id, topic: n.title, learned: '', date: <today ISO, e.g.
    new Date().toISOString().slice(0,10)>, nextReview: <today>, mastered: false, from: n.id })`; resolve the mirrored
    `learning` node by `sourceId` and `g.link(n.id, thatNode.id)`; keep `announceTransfer(n.meta.app, 'learning-tracker',
    'to learning')`.
  - **Extend the `INTENT-ROUNDTRIP` guard** with a `learning` axis: seed a **real note** in `empire-store` (add-to-learning
    `accepts` note/message; a real note both SURVIVES and is a valid source — a seeded phantom note would be pruned before it
    could act), reload, run `add-to-learning` on the note's mirrored node, assert a real `learningItems` entry with `from`
    exists + mirrors to a `learning` node owned by `learning-tracker` + survives a second reload. `INTENT-ROUNDTRIP 1/1 →
    2/2`. `sync.test.ts` +≥3 (learning store-write + `from` in mirror + reconcile-survival).
  - *Acceptance:* "Add to Learning" on a note/message creates a real, reload-durable Learning item; guard 2/2. build🟢
    vitest🟢 eslint clean; tokens 0, off-system 0, offSystemStyle 0.

- [x] **S3 · LOCK intent integrity — a reconcile-survival invariant that would have caught the bug → ★ EPIC-12 CODE-COMPLETE. ✅ SHIPPED 2026-07-09 (`main`).**
  Exported `syncAll` from `sync.ts` + added the survival-invariant suite `intent integrity — reconcile-survival invariant (EPIC-12 S3)` to `sync.test.ts` (+4): make-task's graph-only task survives `syncAll()`; make-note-from's + add-to-learning's store-routed mirrors survive (sourceId preserved + real store item still backing); BOUNDARY case — a raw `g.addNode({type:'note'})` phantom IS pruned by `syncAll()`. Added the ★ INTENT INTEGRITY INVARIANT header comment to `registerCoreIntents`. **Lock verified BITES:** temporarily reverting `make-note-from` to the phantom `g.addNode` pattern turned 4 cases RED; restored → 21/21. build🟢 vitest 417→421🟢 eslint clean; tokens 0, off-system-utils 0, offSystemStyle 0 (r0/t0/m0), `--assert-zero` exit 0; bundle gz 727.7 ±0, no new deps. **★ EPIC-12 is CODE-COMPLETE (S1–S3) → awaiting QA `INTENT-ROUNDTRIP 2/2` on green main → Strategist retires to DONE.**
  The ratchet (mirrors EPIC-5 S8 / EPIC-11 S4 lock discipline).
  - **`src/lib/core/sync.test.ts`** — add a **survival-invariant** suite: for EACH core creation intent (`make-task`,
    `make-note-from`, `add-to-learning`), seed a valid source, run the intent, then call `syncAll()` (the boot/mutation
    reconcile) and assert the created entity STILL EXISTS afterward. This encodes the invariant: *an intent that creates a
    centrally-mirrored-type (`note`/`learning`/`message`) entity MUST route through the store so reconcile keeps it; a
    graph-only type (`task`) may stay in the graph.* Include the explicit boundary assertion that a raw
    `g.addNode({type:'note'})` phantom IS pruned by `syncAll()` (documents WHY the store route is required). Add a header
    comment in `sync.ts` `registerCoreIntents` stating the rule so future intents follow it. (`syncAll` is currently
    module-private — export it, or the test reaches it via `startCoreSync` + a store mutation; exporting a thin `syncAll`
    is the clean choice.)
  - *Acceptance:* the invariant suite is green AND goes RED if any intent is reverted to the phantom pattern (verify by
    temporarily reverting `make-note-from` to `g.addNode` → the suite fails → restore). `sync.test.ts` grows the survival
    suite; `INTENT-ROUNDTRIP` stays 2/2. build🟢 vitest🟢 eslint clean; tokens 0, off-system 0, offSystemStyle 0.
    **★ EPIC-12 CODE-COMPLETE (S1–S3) → QA confirms `INTENT-ROUNDTRIP 2/2` on green main → Strategist retires to DONE.**

> _**Ratified 2026-07-06.** Ordered so each stage is downhill: S1 builds the store-routing rail + the guard harness + the
> first (note) round-trip; S2 copies the pattern for learning; S3 locks the invariant so the phantom pattern can't return.
> When all three ship AND QA confirms `INTENT-ROUNDTRIP 2/2` on green main → retire EPIC-12 to DONE. The next
> cloud-executable candidate is a measured design-system STATE-conformance epic (empty/loading/error primitives → an
> adoption metric + `--assert-zero` lock, the EPIC-5/11 template) or a measured accessibility pass; **EPIC-7 · Android
> stays device-gated.**_

---

## ✅ DONE — retired by the Strategist 2026-07-06 (S1–S4 all shipped + QA-CONFIRMED LIVE; `offSystemStyle` 56→0 r0/t0/m0 LOCKED in `--assert-zero`; last QA `071a749`) — EPIC-11 · Design-system conformance II (the non-colour token axis)

> **RATIFIED by the Strategist 2026-07-04.** The Builder opened this 2026-07-04 as the topmost cloud-executable **ROADMAP
> NOW** item after **EPIC-10 · The Timeline retired to DONE** (S1–S3 shipped + QA-confirmed LIVE — `TIMELINE 1/1`, all six
> axes; no active stage remained), shipped S1 (audit + baseline `offSystemStyle`=56), and flagged it for ratification.
> **The Strategist has now: (a) confirmed this is the steepest remaining cloud-executable gradient** — nothing QA-reports
> broken (main is green, 29/29 render clean, every guard passes); every interconnection/organism epic EPIC-1..10 is DONE;
> **EPIC-7 · Android stays device-gated**. **(b) Confirmed the leap, the target (56→0), and the dim-major heaviest-first
> ordering** (S2 type → S3 radii → S4 motion+lock — mirrors the EPIC-5 playbook exactly; each stage drives ONE sub-count
> to 0 so QA confirms the exact metric move). **(c) Re-ran the audit and replaced the S2–S4 file lists with the
> AUTHORITATIVE exhaustive per-file breakdown below** — the S1 list omitted the `t1` tail files, and the Builder must
> reach EXACTLY 0, not "mostly". **Why this is the steepest remaining cloud-executable gradient:** EPIC-5 drove the two
> *colour* conformance metrics to **0** (`tokenViolations` raw hex/rgba = 0; `offSystemUtilities` Tailwind palette
> classes = 0, LOCKED via `--assert-zero`). But "tokens only" was only ever enforced for **colour** — app code still
> hardcodes the other design-token scales: **radii** (raw `4px` instead of `var(--radius-sm)`), **type** (raw `13px`
> instead of `var(--text-sm)`), and **easings** (raw `cubic-bezier(…)`/`ease-out` instead of `var(--ease-*)`). The design
> language ("motion = physics via `--ease`/`--dur` tokens; one radius scale") is therefore only *half* true. This epic
> makes it fully true, is 100% cloud + metric verifiable, reuses the exact EPIC-5 playbook (measure → drive to 0 by
> descending file mass → lock), and needs no new deps.
>
> **★ Cross-cutting hotspot: `Calculator.tsx` (13 total = t9/r3/m1) is the single heaviest file AND appears in ALL THREE
> reduction stages.** Dim-major ordering is deliberate — Calculator is touched in S2, S3, and S4; that redundancy is
> accepted in exchange for crisp, unambiguous per-stage acceptance (one sub-count → 0). **Authoritative token scales**
> (from `src/design-system.css` + `colors_and_type.css` — quote these, don't guess): **radii** `--radius-sm≈10px ·
> -md≈16px · -lg≈22px · -xl≈30px · -2xl≈40px` (`--r-full`=9999px pills + `50%` circles excluded); **type** `--text-xs
> ≈11px(.6875rem) · -sm≈13px(.8125rem) · -base≈15px(.9375rem) · -lg≈17px(1.0625rem) · -xl≈20px(1.25rem) · -2xl≈24px
> (1.5rem) · -3xl≈30px(1.875rem) · -4xl≈36px(2.25rem) · -5xl≈48px(3rem)`; **motion** `--ease-out`=`cubic-bezier(0.16,1,
> 0.3,1)` · `--ease-spring`=`cubic-bezier(0.34,1.56,0.64,1)`.

**Leap:** the whole Empire's radii, type sizes, and motion curves re-tune from ONE place (the token scales), the same
way EPIC-5 made colour re-theme from one place — the visual analogue completed. **Target metric:** the NEW
`offSystemStyle` row in `scripts/metrics.mjs` (**56 → 0**, sub-counts `r/t/m` = radii/type/motion), then a lock stage
adds it to `--assert-zero` so it can't rot — exactly as EPIC-5 S8 locked `offSystemUtilities`.

- [x] **S1 · Build the audit + establish the baseline (this run, 2026-07-04 — `main`).** New pure, dependency-free
  **`scripts/styleAudit.mjs`** `scanStyleViolations(text) → {radii,type,motion,total}`: radii = raw `border-radius`/
  `borderRadius` px/rem/em (semantic `50%` circles + `9999px` pills excluded); type = raw `font-size`/`fontSize`
  px/rem/unitless-JS-px (relative `em`/`%` allowed); motion = raw `cubic-bezier(…)` + `ease-in`/`-out`/`-in-out`
  keywords (a `(?<![-\w])` lookbehind means `var(--ease-out)` token refs are NOT counted). 16 cases in
  `scripts/styleAudit.test.mjs`. Wired into **`metrics.mjs`** as `styleViolations()` (reusing a newly-extracted shared
  `DS_INFRA`/`appCodeFiles()` helper the two colour audits now also call — DRY, behaviour-preserving: token/util
  violations held at 0) → new **Off-system style** table row + `offSystemStyle`/`offSystemStyleDims` snapshot fields +
  offenders list. **Baseline = 56 (r12/t42/m2).** Also landed the one PROVABLY-identical fix (`--ease-out` ≡
  `cubic-bezier(0.16,1,0.3,1)`): `Toast.tsx` `cubic-bezier`→`var(--ease-out)`, motion 3→2, total 57→56. build🟢
  vitest 318→334🟢 (+16, +1 file) eslint clean; tokenViolations 0, offSystemUtilities 0 (`--assert-zero` still exit 0 —
  NOT yet locking the new metric while it's non-zero); bundle 705.4 ±0, no new deps.
- [x] **S2 · Reduce TYPE — the heaviest sub-count (t42 → 0) — in ONE run (all 13 files).** ✅ SHIPPED 2026-07-04 (`main`,
  this run) — `offSystemStyle` **56 → 14** (`r12/t42/m2` → `r12/t0/m2`, Δ-42); TYPE sub-count is 0, radii/motion held
  EXACTLY. All 13 files' raw `font-size`/`fontSize` mapped onto `--text-*` by nearest step via a one-shot deterministic
  transform (validate-all-then-write). **Mapping rule:** nearest step; on an exact tie (even-px raw between two odd-px
  tokens) round UP to the larger token — `12px→sm(13)`, `14→base(15)`, `22→2xl(24)`. On-device confirm (>1.5px shift):
  `Calculator 32px→3xl(30)` −2, `ChartBuilder 22→2xl(24)` +2 (×3 SVG chart labels), `ErrorBoundary 2.5rem/40px→4xl(36)` −4
  (decorative ⚠️ emoji), `MarkdownStudio 2rem/32px→3xl(30)` −2, and all `9px→xs(11)` +2 (tiny footnote/kbd labels).
  `MarkdownStudio 0.85em` left untouched (relative em, not counted). CSS-string / injected-HTML / SVG `<text>` sites all
  take `var(--text-*)` (custom props cascade from `:root`). build🟢 vitest 334🟢 (refactor — no test count change; the
  `styleAudit.test.mjs` cases already pin the pattern) eslint clean on all 13 touched files; `--assert-zero` exit 0 (colour
  metrics tokenViolations 0 / offSystemUtilities 0 untouched); bundle 705.4 ±0, no new deps. Headless render-smoke is the
  independent QA step (playwright is not a builder dep — installing it would violate no-new-deps); pure CSS-value
  substitutions + passing tsc make runtime render risk negligible. **▶ NEXT = S3 (radii r12→0).** _(original spec below)_
- [ ] **S2 (orig spec) · Reduce TYPE — the heaviest sub-count (t42 → 0) — in ONE run (all 13 files).** Map every raw `font-size`/
  `fontSize` px/rem/unitless-JS-px onto the `--text-*` scale by NEAREST step (`--text-xs .6875rem/11px`, `-sm .8125rem/
  13px`, `-base .9375rem/15px`, `-lg 1.0625rem/17px`, `-xl 1.25rem/20px`, `-2xl 1.5rem/24px`, `-3xl 1.875rem/30px`,
  `-4xl 2.25rem/36px`, `-5xl 3rem/48px`). **Authoritative offenders (audit re-run 2026-07-04 — this is the FULL t42, drive
  every one to 0):**

  | File | type count |
  |---|---|
  | `src/apps/calculator/Calculator.tsx` | **t9** |
  | `src/apps/artifacts/artifacts/ChartBuilder.tsx` | **t9** |
  | `src/components/CommandPalette.tsx` | **t5** |
  | `src/apps/artifacts/artifacts/MarkdownStudio.tsx` | **t4** |
  | `src/apps/notes/Notes.tsx` | **t3** |
  | `src/components/ErrorBoundary.tsx` | **t3** |
  | `src/components/ui/Utility.tsx` | **t3** |
  | `src/apps/cakra/components/ChatPanel.tsx` | t1 |
  | `src/apps/cakra/components/ConfirmModal.tsx` | t1 |
  | `src/components/Desktop.tsx` | t1 |
  | `src/components/ui/NodeActions.tsx` | t1 |
  | `src/components/ui/SendResultMenu.tsx` | t1 |
  | `src/components/ui/index.tsx` | t1 |
  | **= t42** | ↓ **0** |

  The seven heavy files (t3–t9 = 36) carry the leap; the six `t1` tail files finish it to EXACTLY 0 — **do not stop at
  "mostly."** This is a single meaty run: deterministic nearest-step mapping, each file independent, mechanical.
  **This is a VISUAL change NOT fully cloud-verifiable** — a raw `10px`→`--text-xs`(11px) shifts a pixel; pick the nearest
  token, and for any raw value >1.5px from its nearest step note it per-file as "on-device confirm." **Acceptance:** re-run
  `node scripts/metrics.mjs` → `offSystemStyle` **type sub-count = 0** (`r12/t0/m2`, total 56→14); radii/motion unchanged;
  build🟢 vitest🟢 eslint clean; `--assert-zero` still exit 0 (colour metrics untouched); every touched app still renders
  in QA (render-smoke catches crashes; pixel shifts are on-device).
- [x] **S3 · Reduce RADII (r12 → 0) — SHIPPED 2026-07-05 (`main`).** `offSystemStyle` **14 → 2** (`r12/t0/m2` → `r0/t0/m2`, Δ-12); all 12 raw `border-radius`/`borderRadius` px across the 6 files mapped onto `--radius-*` by nearest step (sm=10 is the floor → every ≤13px value → `sm`; ErrorBoundary `1rem`→`md`; asymmetric `0 Npx Npx 0` → `0 var(--radius-sm) var(--radius-sm) 0`). Type (t0) + motion (m2) held EXACTLY. build🟢 vitest 334🟢 eslint clean; `--assert-zero` exit 0; bundle 705.4 ±0, no new deps. _(original spec below)_
- [ ] ~~**S3 · Reduce RADII (r12 → 0) — in ONE run (6 files).**~~ Map every raw `border-radius`/`borderRadius` px onto
  `--radius-*` by NEAREST step (`sm≈10px · md≈16px · lg≈22px · xl≈30px · 2xl≈40px`); keep semantic `50%` circles +
  `9999px` pills. **Authoritative offenders (full r12):**

  | File | radii count |
  |---|---|
  | `src/apps/calculator/Calculator.tsx` | **r3** |
  | `src/apps/artifacts/artifacts/MarkdownStudio.tsx` | **r3** |
  | `src/apps/notes/Notes.tsx` | **r2** |
  | `src/components/ErrorBoundary.tsx` | **r2** |
  | `src/apps/cakra/components/ChatPanel.tsx` | r1 |
  | `src/components/ui/Toast.tsx` | r1 |
  | **= r12** | ↓ **0** |

  Same visual-change caveat as S2 (nearest step, note >1.5px deltas for on-device). **Acceptance:** `offSystemStyle`
  **radii sub-count = 0** (`r0/t0/m2`, total 14→2); type/motion unchanged; build🟢 vitest🟢 eslint clean; `--assert-zero`
  exit 0; touched apps render in QA.
- [x] **S4 · Reduce residual MOTION (m2 → 0) + LOCK → ★ EPIC-11 CODE-COMPLETE.** ✅ SHIPPED 2026-07-05 (`main`, this run) —
  the last two raw easings are tokenised and the metric is LOCKED at 0. **`offSystemStyle` 2 (r0/t0/m2) → 0 (r0/t0/m0), Δ-2.**
  - **`src/apps/artifacts/ArtifactGallery.tsx:229`** `.animate-fadeIn { animation: fadeIn 0.5s ease-out; }` → `var(--ease-out)`
    (unambiguous — the `ease-out` keyword IS the token's intent; custom prop cascades into the `<style>{`…`}</style>` block).
  - **`src/apps/calculator/Calculator.tsx:428`** cyan status-dot pulse `animation: 'pulse-ring 1.5s ease-in-out infinite'` →
    `var(--ease-in-out)`. `ease-in-out` is SYMMETRIC — neither `--ease-out` nor `--ease-spring` is equivalent, so mapping to
    either would change the infinite pulse rhythm. Per the ratified spec, added EXACTLY ONE new token
    **`--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)`** (standard symmetric ease) to `src/design-system/colors_and_type.css:106`
    beside `--ease-out`/`--ease-spring`, then swapped the keyword to it. Legit design-system extension (noted here + in the log).
  - **LOCK:** added `if (snapshot.offSystemStyle > 0) fail.push(...)` to the `--assert-zero` gate in `scripts/metrics.mjs:252`
    (mirrors the tokenViolations/offSystemUtilities gates exactly) + updated the success line. **Verified by exit code both
    directions:** clean tree → `--assert-zero` exit 0; seed a raw `borderRadius: '7px'` in Calculator → `offSystemStyle 1 (r1)`,
    exit 1; remove → exit 0. build🟢 vitest 360🟢 eslint clean (touched files); tokens 0, off-system-utils 0; bundle 718.9 ±0,
    no new deps. **★ EPIC-11 CODE-COMPLETE (S1–S4) — QA to confirm `offSystemStyle` 56→0 on green main → Strategist retires to DONE.**

> _**Ratified 2026-07-04.** Dim-major, heaviest-first (S2 type t42 → S3 radii r12 → S4 motion m2+lock): each stage drives
> ONE sub-count to 0 so the metric move is unambiguous for QA, mirroring EPIC-5's measure→drive-to-0→lock playbook. Per-file
> counts are the authoritative audit re-run (S1's list omitted the `t1` tail). **When all four ship AND QA confirms
> `offSystemStyle` 56→0 on green main → retire EPIC-11 to DONE.** The next cloud-executable candidate is a deeper
> interconnection/organism theme (see ROADMAP NEXT); **EPIC-7 · Android** stays device-gated until an on-device QA path
> exists._

---

## ✅ DONE — retired by Builder 2026-07-04 (S1–S3 all QA-confirmed LIVE — `TIMELINE 1/1`, all six axes `ordered/grouped/flow/persisted/filtered/descendants`; last confirm `6a1a0b2`, health re-confirm `698bbe2`) — EPIC-10 · The Timeline (the organism's lifestream — a TEMPORAL lens)

> **Promoted 2026-07-03** (EPIC-9 retired to DONE — its headline `NODE-LINEAGE 1/1` moved + QA-confirmed; every prior
> epic DONE; EPIC-7 · Android stays device-gated / not cloud-verifiable). **Why this is the highest realizable gradient
> now** (one line): the organism already has three *lenses* over its one Core graph — **Network** (STRUCTURAL: how
> entities connect), **Search** (QUERY: find any entity by term), **Inbox** (TASK: open work) — but it has **no TEMPORAL
> lens**, even though it has quietly carried the data the whole time: **every `CoreNode` stamps `meta.created` +
> `meta.updated`** (`graph.ts:27,71`) and **every `ProvEdge` stamps `at`** (`provenance.ts`). Nothing has ever surfaced
> *when* the organism did things — you cannot scroll its history, watch a day's activity, or replay how an artifact came
> to be in time. The steepest remaining interconnection gradient is the missing 4th lens: **one stream, newest-first,
> grouped by day, that merges every entity-birth and every app→app handoff into the organism's living history** — each
> row one keystroke from its entity (`openEntity`), its ancestry inline (`<NodeLineage>`), and (S3) its descendants
> (`childrenOf`, built in EPIC-9 S1 and still UNUSED). It ranks above device-gated Android, is fully cloud-verifiable
> (pure merge/sort/bucket + a headless guard), reuses every rail, and is the natural payoff of EPIC-1 (everything
> mirrors in) + EPIC-6 (durable edge memory) + EPIC-9 (node lineage): the whole organism, one timeline.

**Leap:** The Empire stops being a place you only ever see in the *present tense*. A new **Timeline** lens replays the
organism's whole life as one time-ordered stream — "09:12 · «Field log» created in Notes → 09:13 · Notes fed Goals →
09:15 · «Chart the anomaly» task born, ← «Field log»" — every entity birth and every handoff, newest-first, grouped by
day, each moment navigable to its entity, its ancestry, and what it spawned. Search is the organism's WHERE; the
Timeline is its WHEN.

**Target metric (new — Builder instruments it; QA confirms it moved):** a **`TIMELINE` guard** in `scripts/qa-smoke.mjs`
— seed ≥2 `CoreNode`s across ≥2 apps with distinct `meta.created` **and** a `ProvEdge` in `empire-provenance`, reload
(persist rehydrate), open `/app/timeline`, and assert the stream renders the entries **newest-first, grouped by day**,
that the flow edge appears as an `A → B` row, and that each entity row deep-links (`openEntity`). **Headline:
`TIMELINE 0/1 → 1/1`** + the "+ a unit test" discipline (`timeline.test.ts`). *Routes rendering clean* rises to
**28/28** (the new Timeline app); *token-violations*/*off-system* stay **0** (`--assert-zero` must keep passing).

### Rails to reuse (read ONCE — do NOT reinvent)
- **`src/lib/core/graph.ts`** — `useGraph(s => s.nodes)` is the live corpus; **`CoreNode.meta.created` / `meta.updated`
  are real `Date.now()` timestamps** (`graph.ts:27,71`) — the honest temporal ordering key, never surfaced until now.
  Read reactively; do NOT add a private store.
- **`src/lib/core/provenance.ts`** — `useProvenance(s => s.edges)` is the durable app→app ledger; each `ProvEdge` has
  `{ fromApp, toApp, label?, at }`. `recentEdges(edges, n)` already returns them newest-first — the flow half of the stream.
- **`src/lib/core/nodeLineage.ts`** — `nodeLineageOf` (ancestors) + **`childrenOf(nodes, id)` (descendants — BUILT in
  EPIC-9 S1, unit-pinned, and UNUSED)**. S3 finally surfaces `childrenOf`. `<NodeLineage nodeId>` drops the ancestry
  trail into any row verbatim.
- **`src/apps/search/Search.tsx` (EPIC-8)** — the exact precedent for a reactive graph-reading **lens** app: registry
  glyph+accent headers, `openEntity` on a result row, ⚡ `<NodeActions nodeId>`, faceted chips + roving keyboard nav.
  Timeline mirrors its shape (grouped sections, chips, ↑/↓/Enter). **Copy this idiom; don't reinvent it.**
- **`src/lib/windowStore.ts` `openEntity(appId, nodeId)`** (EPIC-8 S2) — open the app + set the gaze (`focusedId`); the
  deep-link rail every row uses. **`src/lib/registry.ts`** app identity; **`src/design-system/icons/glyphs.tsx`** + the
  barrel (add one new alien `Timeline` glyph, exactly as `Search` was added); the `appComponents` map (where
  Search/Inbox/Network are wired) registers the 28th app.

Stages (Builder takes the topmost `[ ]`; each is one run, downhill given the ones before, build+vitest+eslint green,
`tokenViolations`/`offSystemUtilities` stay 0):

- [x] **S1 · The timeline spine + the Timeline lens app + the guard (the organism's history becomes scrollable, end-to-end).**
  ✅ SHIPPED 2026-07-04 (`main`) — the 4th lens stands up end-to-end. Pure `src/lib/core/timeline.ts`
  (`buildTimeline`/`dayKey`/`groupByDay`/`relativeDayLabel`, all `(nodes,edges,…)→value`, no `Date.now()`); the 28th app
  `src/apps/timeline/Timeline.tsx` (reactive `useGraph`+`useProvenance` → `groupByDay(buildTimeline())`, sticky day
  headers, entity rows → `openEntity`+`<NodeLineage>`+⚡, flow rows `from→to`); alien `Timeline` glyph; new `TIMELINE`
  guard. **Ran the full smoke LIVE: TIMELINE 1/1 ✅** (`ordered=true grouped=true flow=true persisted=true`), 29/29
  render clean, every other guard green. build🟢 vitest 292→307🟢 eslint clean; tokens 0, off-system 0; apps 27→28,
  bundle 701.4→703.5 (+2.1, no new deps). **The load-bearing stage — it stood the whole lens up. Everything after only deepens it.**
  - **New pure `src/lib/core/timeline.ts`** (all `(nodes, edges, …) → value`, no store access, so it unit-tests without React):
    - `export interface TimelineEntry { id: string; kind: 'entity' | 'flow'; at: number; nodeId?: string; app: string;
      title: string; type?: string; toApp?: string; label?: string }` — one time-ordered moment. An **entity** entry
      wraps a `CoreNode` (`kind:'entity'`, `at: node.meta.created`, `nodeId: node.id`, `app: node.meta.app`, `title`,
      `type`); a **flow** entry wraps a `ProvEdge` (`kind:'flow'`, `at: edge.at`, `app: edge.fromApp`, `toApp: edge.toApp`,
      `label`, `title` = a synthesized "`<from>` → `<to>`").
    - `export function buildTimeline(nodes: Record<string, CoreNode>, edges: ProvEdge[], limit = 200): TimelineEntry[]`
      — map every node → an entity entry (keyed on `meta.created`), map every edge → a flow entry (keyed on `at`), merge,
      **sort strictly newest-first by `at`** (stable tie-break by `id` so the order is deterministic for the guard/tests),
      cap to `limit`.
    - `export function dayKey(at: number): string` — the **UTC** calendar-day bucket `YYYY-MM-DD` (use `new Date(at)`'s
      `getUTCFullYear/Month/Date`, zero-padded — deterministic, no locale/`Date.now()`, so tests + the guard are stable).
    - `export function groupByDay(entries: TimelineEntry[]): { day: string; entries: TimelineEntry[] }[]` — bucket by
      `dayKey(entry.at)`, **days newest-first, entries within each day newest-first** (input is already sorted, so preserve
      order). Returns an ordered array (NOT a map) so render order is fixed.
    - `export function relativeDayLabel(day: string, now: number): string` — pure, takes `now` explicitly (NEVER call
      `Date.now()` inside `timeline.ts`): `dayKey(now)` → "Today", the prior day → "Yesterday", else the `day` string.
      (Only the component passes `Date.now()`; the module stays pure/testable.)
  - **New `src/apps/timeline/Timeline.tsx`** — the 28th app / **4th lens**: reactive `const nodes = useGraph(s => s.nodes)`
    + `const edges = useProvenance(s => s.edges)`; `const stream = groupByDay(buildTimeline(nodes, edges))`. Render an
    autoscrolled column of **day sections** (a sticky day header via `relativeDayLabel(day, Date.now())`, glass token
    surface), each listing its entries newest-first:
    - an **entity** row = the owning-app registry glyph+accent + the entity title + a muted `type` chip + a relative time,
      the whole row a `<button>` → `openEntity(entry.app, entry.nodeId!)`, with `<NodeLineage nodeId={entry.nodeId!}>`
      under it (ancestry inline; self-hides when none) and ⚡ `<NodeActions nodeId={entry.nodeId!}>`.
    - a **flow** row = `fromApp` glyph `→` `toApp` glyph + both names + the label + a relative time (a durable handoff
      moment; not a `<button>` — it has no single entity to open, matching the Network memory panel's idiom).
    - idle/empty state ("The organism has no history yet — create or hand off anything and it lands here").
    - **Register as the 28th app:** add `{ id: 'timeline', name: 'Timeline', icon: 'Timeline', route: '/app/timeline',
      description: 'The organism's history, one stream', color: <an unused-ish accent, e.g. '#8fb4d8'>, cakraEnabled: false }`
      to `registry.ts`; add a new alien **`Timeline`** glyph to `design-system/icons/glyphs.tsx` + the barrel (mirror the
      `Search` glyph add); wire it into the `appComponents` map beside `search`/`inbox`/`network`.
  - **New `TIMELINE` guard in `scripts/qa-smoke.mjs`** (mirror the `GLOBAL-SEARCH`/`NODE-LINEAGE` block, non-fatal like the
    others) + `timeline` in the smoke render list + a REPORT section: seed the `empire-core-graph` with **two graph-
    survivable `task` nodes** (use `task` — graph-only, survives `startCoreSync`'s boot reconcile; see the TRAP below) with
    **distinct `meta.created`** owned by **two different `app`s**, seed `empire-provenance` with one `{fromApp,toApp,at}`
    edge, **reload**, open `/app/timeline`, and assert (axes): `ordered` = the two entity rows appear newest-`created`
    first; `grouped` = at least one `[data-timeline-day]` section header renders; `flow` = a flow row for the seeded edge
    renders (`[data-timeline-kind=flow]`); `persisted` = all of the above still hold after a **second** reload. **Headline
    `TIMELINE 0/1 → 1/1`.**
  - **Test `src/lib/core/timeline.test.ts`** (≥10): `buildTimeline` merges nodes+edges and sorts strictly newest-first
    (mixed `created`/`at`); the `id` tie-break is deterministic; the `limit` cap holds; `dayKey` is stable UTC + zero-pads;
    `groupByDay` buckets correctly with days + entries both newest-first and preserves order; `relativeDayLabel` returns
    Today/Yesterday/date for a passed `now`; an empty graph → `[]`.
  - *Acceptance:* open `/app/timeline` → the organism's entity-births + handoffs render as one newest-first, day-grouped
    stream; each entity row opens its entity (`openEntity`) with its ancestry inline; `timeline.test.ts` green;
    `TIMELINE 0/1 → 1/1`. **The temporal lens exists end-to-end.** build🟢 vitest🟢 eslint clean; tokens 0, off-system 0
    (`--assert-zero` exit 0); apps 27→28, routes 28/28, bundle +small (no new deps).
  - *Cloud limit:* the sticky-header day stream + relative labels are an on-device visual — the pure
    `buildTimeline`/`groupByDay`/`dayKey` are unit-pinned, the guard carries the seed→persist→rehydrate→ordered-render
    roundtrip headless.
  - **TRAP (inherited from GLOBAL-SEARCH / NODE-LINEAGE — bake it into the guard):** `startCoreSync()` (`sync.ts`) prunes
    centrally-mirrored types (`note`/`learning`/`message`) that are absent from their (empty, fresh-QA) stores on boot.
    Seed **`task`** (graph-only → survives the reconcile). A `note`-typed seed would be DELETED before the timeline renders.

- [x] **S2 · Filter the stream + traverse it by keyboard (the temporal lens gets controls) — copy Search's faceted idiom verbatim.** ✅ SHIPPED 2026-07-04 (`main`, this run) — `TIMELINE 1/1` grew a live `filtered` axis. Three pure helpers in `timeline.ts` (`TimelineFilter`, `filterTimeline`, `timelineFacets` — reusing `Facet`/`toggleFacet` from `search.ts`); `Timeline.tsx` holds `appFilter`/`kindFilter`/`activeIndex`, renders Kind + App chip rows (signal tint, `aria-pressed`, `data-timeline-facet="<dim>:<value>"`), regroups the FILTERED stream, roves the flat filtered list via ↑/↓/Enter on the focused scroll container (Enter opens entity rows only; active row = `inset 0 0 0 1px var(--ion)` + always-on ⚡; `data-timeline-id` per row). Guard grew a `filtered` axis (click `app:goals` chip → only the goals entity, drop notes entity + flow). `timeline.test.ts` 15→22 (+7). **Ran full smoke LIVE: TIMELINE 1/1 ✅** (`ordered grouped flow persisted filtered` all true), 29/29 routes clean, every guard green. build🟢 vitest 307→314🟢 eslint clean; tokens 0, off-system 0; static 265→272, bundle 703.5→704.8 (+1.3, no new deps).
  Search already solved faceting + roving keyboard nav (EPIC-8 S3); the Timeline reuses the exact same shape so this stage
  is downhill.
  - **`src/lib/core/timeline.ts`** — add three pure helpers mirroring `search.ts`'s `filterHits`/`hitFacets`/`toggleFacet`:
    `filterTimeline(entries, { apps?, kinds?, types? })` (AND-across-dims, OR-within; empty dims → return input untouched,
    order preserved), `timelineFacets(entries): { apps: Facet[]; kinds: Facet[] }` (distinct values w/ counts busiest-first,
    computed over the **UNFILTERED** entries so chips always widen back), and reuse/duplicate `toggleFacet`. (`Facet` =
    `{ value, count }`.)
  - **`Timeline.tsx`** — hold `appFilter`/`kindFilter` state; render **App** + **Kind** (`entity`/`flow`) chip rows between
    the header and the stream (the `chip()` idiom from Search: ion tint when on, `aria-pressed`), regroup the FILTERED
    entries via `filterTimeline`. Add roving keyboard nav over the FLAT filtered entity list (`stream.flatMap(s =>
    s.entries)`, same order rendered): ↑/↓ clamp + `scrollIntoView({block:'nearest'})` off a `[data-timeline-id]` attr,
    Enter → `openEntity` for an entity entry (a flow entry is a no-op on Enter); active row gets the
    `boxShadow: inset 0 0 0 1px var(--ion)` cursor + always-on ⚡ actions; reset `activeIndex` to 0 on
    `[appFilter, kindFilter]` change.
  - **Extend the `TIMELINE` guard** with a `filtered` axis: apply an app filter (or assert `filterTimeline` narrows to one
    app's entries) → only that app's rows render. `timeline.test.ts` +≥5 (`filterTimeline` AND-across + OR-within +
    order-preserved + empty-dims-passthrough; `timelineFacets` counts busiest-first).
  - *Acceptance:* click an App chip → only that app's moments; click the Kind chip → only entities (or only flows); ↑/↓/Enter
    walks + opens a moment mouse-free; `TIMELINE` guard grows a `filtered` axis, still 1/1. build🟢 vitest🟢 eslint clean;
    tokens 0, off-system 0.
  - *Cloud limit:* chip narrowing + roving cursor are on-device interactions — `filterTimeline`/`timelineFacets` are
    unit-pinned; the guard's `filtered` axis carries the narrowing headless.
  - **SEAM (reuse, do NOT reinvent):** the roving cursor = `flat = stream.flatMap(s => s.entries)` + `activeIndex` clamped +
    `scrollIntoView({block:'nearest'})` off a `[data-timeline-id]` attr (flatten in render order so the visual cursor
    matches); facets derive from the **UNFILTERED** set, render the **FILTERED** set (never facet the filtered set or you
    can't widen back) — the same three rules EPIC-8 S3 baked in.

- [x] **S3 · Every moment shows what it spawned (surface the unused `childrenOf` walker — the timeline becomes a lineage tree in time).** ✅ SHIPPED 2026-07-04 (`main`, this run) — `TIMELINE 1/1` grew a live `descendants` axis; EPIC-10 CODE-COMPLETE (S1–S3). New `src/components/ui/NodeDescendants.tsx` mirrors `NodeLineage.tsx`'s `EntityToken` verbatim: reactive `useGraph(s=>s.nodes)` → `childrenOf(nodes, nodeId)`, renders "→ spawned" + one navigable `role="button"` span per child (`.gp-lineage-hop`, `openEntity(child.meta.app, child.id)` on click/Enter with `stopPropagation`+`preventDefault` so it's valid nested in the Timeline row `<button>`), returns `null` when childless, `data-node-descendants="<nodeId>"` attr. `Timeline.tsx` EntityRow mounts it beside `<NodeLineage>` in the meta line (a moment now reads `↖ ancestry` AND `→ spawned`) + the title div got `data-timeline-title` to isolate the guard's title read from the embedded trail titles. Guard: newer seed's `data.from` = older → older row surfaces `[data-node-descendants=qa-tl-older]` naming the newer child (`descendants` axis); `readTimelineTitles` scoped to `[data-timeline-title]` so lineage/descendants text can't contaminate `ordered`/`filtered`. `NodeDescendants.test.tsx` (+4: renders each token; click/Enter → `activeWindowId`=child app + `focusedId`=child id; empty→null). **Ran full smoke LIVE: TIMELINE 1/1 ✅** (`ordered grouped flow persisted filtered descendants` all true), 29/29 routes clean (0 uncaught), every guard green. build🟢 vitest 314→318🟢 eslint clean; tokens 0, off-system 0 (`--assert-zero` exit 0); static 272→276 (+4), test files 32, bundle 704.8→705.3 (+0.5, no new deps).
  EPIC-9 shipped `childrenOf` (descendants) but never surfaced it and deferred the "ancestry mini-tree". The Timeline is
  its natural home: an entity row already shows its ancestors inline (`<NodeLineage>`); S3 adds the forward direction, so
  each moment is legible BOTH ways.
  - **New `src/components/ui/NodeDescendants.tsx`** (mirror `NodeLineage.tsx`'s idiom + the S3 `EntityToken` navigation
    rail): `<NodeDescendants nodeId />` — reactive `useGraph(s => s.nodes)`, calls `childrenOf(nodes, nodeId)`, renders a
    compact "→ spawned N" affordance that expands to list each descendant as a **navigable** `role="button"` token
    (`openEntity(child.meta.app, child.id)` on click/Enter, `stopPropagation`+`preventDefault` so it's valid nested in the
    Timeline row `<button>` — the exact pattern EPIC-9 S3 established for `EntityToken`); reuse the `.gp-lineage-hop`
    affordance class; returns **null** when `childrenOf` is empty. `data-node-descendants="<nodeId>"` attr for the guard.
  - **`Timeline.tsx`** — mount `<NodeDescendants nodeId={entry.nodeId!}>` on each entity row (beside/under the existing
    `<NodeLineage>`), so a moment shows "← «Field log» (ancestry)" AND "→ spawned «Chart the anomaly» (descendants)".
  - **Extend the `TIMELINE` guard** with a `descendants` axis: the S1 seed already has a parent + a child whose
    `data.from` = the parent (reuse the NODE-LINEAGE seed shape) → assert the parent's Timeline row surfaces
    `[data-node-descendants=<parentId>]` naming the child. `NodeDescendants.test.tsx` (+≥3: renders each descendant token;
    click/Enter → `useWindowStore.activeWindowId` = the child's app + `useFocus.focusedId` = the child id; empty → null).
  - *Acceptance:* a Timeline moment for a note that spawned a task shows a navigable "→ spawned «that task»" row that
    climbs to it; `TIMELINE` guard grows a `descendants` axis (still 1/1); `NodeDescendants.test.tsx` green. build🟢
    vitest🟢 eslint clean; tokens 0, off-system 0. **★ EPIC-10 is then CODE-COMPLETE (S1–S3) → QA confirms `TIMELINE 1/1`
    on the new green main; the descendants walker is finally live; then EPIC-7 · Android if an on-device QA path exists.**
  - *Cloud limit:* the expand-and-climb is an on-device interaction — `childrenOf` + the navigation are unit-pinned
    (`NodeDescendants.test.tsx`), the guard's `descendants` axis carries the render + correct-child-id headless.

_S1 stands the lens up end-to-end and moves the headline `TIMELINE 0/1 → 1/1`; S2 gives it controls (filters + keyboard,
copied from Search); S3 surfaces the long-dormant `childrenOf` walker so each moment is legible both ways. When all three
ship AND QA confirms `TIMELINE 1/1` on green main → retire EPIC-10 to DONE. The next cloud-executable candidate is
**design-system conformance II** (extend the audit to spacing/radii/type with its own `metrics.mjs` row — ROADMAP NEXT);
**EPIC-7 · Android** stays device-gated._

---

## ✅ DONE (code-complete 2026-07-03, QA to confirm) — EPIC-8 · Global cross-app search (the organism becomes queryable)

> **Promoted 2026-07-02** (EPIC-6 CLOSED, QA-confirmed on green main `e262f1b`; every prior epic DONE; EPIC-7 ·
> Android stays device-gated / not cloud-verifiable). **Why this is the highest realizable gradient now** (one line):
> the organism now *remembers* movement (EPIC-6) and *mirrors* every collection into one Core graph — but you still
> navigate it one silo at a time (open Notes for notes, Inbox for tasks, Reader for books…). The steepest remaining
> interconnection gradient is making that unified graph **queryable from one lens**: type a word, see every matching
> entity across every app, ranked, grouped, one keystroke from its home. It ranks above device-gated Android in the
> priority bias, is fully cloud-verifiable (pure ranking + a headless guard), reuses every existing rail
> (`useGraph`/`empire-core-graph`, `registry`, `openAppById`, `NodeActions`, the Inbox "real-home-app" precedent),
> and is the natural payoff of EPIC-1 (everything mirrors in) + EPIC-6 (durable memory): the whole organism, one field.

**Leap:** The Empire stops being 26 silos you navigate one at a time. One Search surface queries **every** app's real
entities at once — notes, tasks, events, goals, messages, learning, files, photos, books, prompts, datasets — ranked by
relevance, grouped by owning app, each result one click from its app (`openAppById`) or onward via ⚡ `NodeActions`.

**Target metric (new — Builder instruments it; QA confirms it moved):** a **`GLOBAL-SEARCH` guard** in
`scripts/qa-smoke.mjs` — seed the Core graph with entities that share a rare term across ≥2 apps, reload (persist
rehydrate), type the term into the Search field, and assert BOTH surface **grouped under their own app sections**.
**Headline: `GLOBAL-SEARCH 0/1 → 1/1`** + the "+ a unit test" discipline (`search.test.ts`). *Routes rendering clean*
rises to **27/27** (the new Search app); *token-violations*/*off-system* stay **0** (`--assert-zero` must keep passing).

### Rails to reuse (read ONCE — do NOT reinvent)
- **`src/lib/core/graph.ts`** — `useGraph(s => s.nodes)` is the live corpus (`empire-core-graph`); every collection app
  already mirrors into it via `mirrorCollection`. Search reads it reactively; it does NOT own a private store.
- **`src/lib/core/search.ts` (S1, 2026-07-02)** — the pure ranking spine: `searchNodes(nodes, query, limit)`,
  `scoreNode`, `nodeBodyText`, `queryTerms`, `groupHitsByApp`. AND semantics (all terms must match), title-prefix ≫
  substring ≫ body, type-name match, recency tie-break. **Add filters/fields here, not in the component.**
- **`src/apps/inbox/Inbox.tsx`** — the exact precedent for a graph-reading "real home" app (reactive `useGraph`,
  registry glyph+accent chips, `<NodeActions nodeId>`). Search mirrors its shape.
- **`src/lib/windowStore.ts` `openAppById(id)`** — resolves aliases → opens the app. **`src/lib/registry.ts`** app
  identity; **`src/design-system/icons/`** the alien glyph set (new `Search` glyph added in S1).

Stages (Builder takes the topmost `[ ]`; each one run, downhill given the ones before, build+vitest+eslint green,
`tokenViolations`/`offSystemUtilities` stay 0):

- [x] **S1 · The search spine + the Search app + the guard (the queryable organism, end-to-end).** ✅ SHIPPED
  2026-07-02. New pure `src/lib/core/search.ts` (`searchNodes`/`scoreNode`/`nodeBodyText`/`queryTerms`/
  `groupHitsByApp`) with `search.test.ts` (13 cases). New `src/apps/search/Search.tsx` — reactive `useGraph`, an
  autofocused query field, idle/empty/no-match states, results grouped by owning app (registry glyph+accent header),
  each row → `openAppById` + ⚡ `<NodeActions nodeId>`. Registered as the **27th app** (registry `search`,
  `appComponents`, new alien `Search` glyph). New `GLOBAL-SEARCH` guard in `qa-smoke.mjs` (seed 2 apps → reload →
  type → assert both grouped hits) + `search` added to the smoke list + a REPORT section. build🟢 vitest 242→255🟢
  eslint clean; tokens 0, off-system 0 (`--assert-zero` exit 0); apps 26→27, bundle 693.6→696.0 (+2.4, no new deps).
  - *Acceptance:* type a term matching entities in ≥2 apps → the Search app lists them grouped by app, each opening
    its app; `search.test.ts` green; `GLOBAL-SEARCH 0/1 → 1/1`. **The queryable organism exists end-to-end.**
  - **✅ QA-CONFIRMED LIVE 2026-07-02** (`REPORT.md`, green main incl. `ac6af7b`): 28/28 routes render clean (the new
    `search` route among them), vitest 213 static / all guards green, `metrics.mjs --assert-zero` exit 0. **`GLOBAL-
    SEARCH 1/1 ✅`** — the Core graph was seeded with a `note` (Notes) + a `task` (Goals) sharing the rare term
    *"Xenolith"*, reloaded (persist rehydrate), the term typed into Search → **BOTH surfaced, grouped under their own
    app sections.** The headline metric moved (apps 26→27, GLOBAL-SEARCH 0/1→1/1). **S2 is next.**

- [x] **S2 · Land on the exact entity (deep-link a hit to its item) + close the one real corpus gap (arrays).**
  **✅ SHIPPED 2026-07-03 (`main`).** Both gaps closed in one run. **(a)** `nodeBodyText` (`search.ts`) now flattens
  the scalar elements of array values (nested objects still skipped) → `tags` are searchable; `search.test.ts` +2
  (array-flatten + a `searchNodes` tag-only case). **(b)** new `openEntity(appId, nodeId)` in `windowStore.ts`
  (opens the app via `openAppById` then `useFocus.getState().setFocus(nodeId)`); both Search result-row buttons point
  at it; **Notes** lands on the focused card — reads `useFocus(s=>s.focusedId)`, maps the graph node to its note via
  `node.data.sourceId`, `scrollIntoView` + a token-only `.focus-land` signal ring (design-system.css, no raw hex).
  `GLOBAL-SEARCH` guard extended with a **tag-only** seed (`Tessellate` living ONLY in `data.tags` of a graph-survivable
  task) — **ran LIVE `tagOnly=true`, GLOBAL-SEARCH 1/1 ✅, 28/28 routes clean.** build🟢 vitest 255→257🟢 eslint 0;
  tokens 0, off-system 0 (`--assert-zero` exit 0); apps 27, bundle 696.0→696.4 (no new deps). *Cloud limit:* the
  Notes scroll+ring is a visual (screenshot) — the `setFocus` wiring + array-flatten are unit- & guard-pinned.
  **Strategist audit (2026-07-02, code-confirmed — this SUPERSEDES S2's original "bodies aren't searchable" premise):**
  the corpus is already deeper than assumed. `nodeBodyText` (`search.ts:43`) concatenates **every string/number/boolean
  in `node.data`**, and the primary text of every text-bearing app is already mirrored there — Notes `content`,
  Messages `content`, Goals `description`, Calendar `description`, Prompt-Gen `content`, Learning `learned` (audited in
  `sync.ts:74-98` + each app's `mirrorCollection`). So a body-only word ALREADY matches; the "enrich each
  `mirrorCollection`" work is **mostly already done — do NOT re-mirror fields that are already present.** Two honest
  gaps remain — close both in this one run:
  - **(a · the real corpus gap) `nodeBodyText` skips arrays, so `tags` are unsearchable.** `notes.data.tags`,
    `calendar.data.tags`, `photos.data.tags` are string arrays; the `for…of Object.values` loop in `nodeBodyText`
    only handles scalars, so a search for a tag word misses the note that carries it. Fix it **in one place** —
    `src/lib/core/search.ts` `nodeBodyText`: when a value is an **array**, push each string/number/boolean element
    (skip nested objects, keep it cheap, still lowercased+joined). Do NOT touch the per-app `mirrorCollection` calls
    (the arrays are already mirrored; only the *reader* skipped them). Add a `search.test.ts` case: a node with
    `data:{ tags:['xenon'] }` and no other match → `searchNodes(…, 'xenon')` returns it. (Reader `book` content stays
    title-only **by design** — full book text is too large to mirror; leave it.)
  - **(b · the meaty half) deep-link a hit onto its exact entity.** Today a Search row calls `openAppById(appId)`
    (`Search.tsx:142,159`) → the app opens on its **default view**, not the clicked item. Add a thin
    **`openEntity(appId, nodeId)`** to `src/lib/windowStore.ts` beside `openAppById` (line 105): resolve+open the app
    exactly as `openAppById` does, then `useFocus.getState().setFocus(nodeId)` (import from `lib/core/focus.ts` — the
    SAME rail the Network inspector already uses to gaze at a node). Point each Search result row at
    `openEntity(appId, hit.node.id)` instead of `openAppById`. Then make **one** target app land on the focused item as
    the proof: **`src/apps/notes/Notes.tsx`** — on mount read `useFocus(s => s.focusedId)`, map it to this app's mirrored
    node (`node.data.sourceId === note.id`), scroll that card into view (`ref.scrollIntoView`) and briefly highlight it
    (a token ring class — NO raw hex, NO off-system palette class). Notes is the acceptance example and already mirrors
    `content`, so its hit is body-matchable end-to-end. (Scroll-to-focus for the other apps is later polish; S2 proves
    the rail on Notes.)
  - **Guard + tests:** extend the `GLOBAL-SEARCH` block in `scripts/qa-smoke.mjs` with a **tag-only match** (seed a
    Notes node whose term lives ONLY in `data.tags`, reload, type it → the note surfaces) so (a) is covered headless;
    the deep-link scroll is a visual QA screenshot (Notes opens scrolled+highlighted to the hit — flag for QA; the
    `setFocus` wiring + `nodeBodyText` array case are unit-pinned). *Acceptance:* a word that lives only in a note's
    **tag** returns that note; clicking any hit opens its app **focused on that entity** (Notes scrolls+rings the card).
    `search.test.ts` +1 (array body), `GLOBAL-SEARCH` guard extended. Build🟢 vitest🟢 eslint clean; tokens 0,
    off-system 0 (`--assert-zero` exit 0); routes 27/27.

- [x] **S3 · Type/app filters + keyboard nav + summon-from-anywhere (Search becomes the organism's command surface).**
  ✅ **Shipped 2026-07-03 (`main`) — EPIC-8 CODE-COMPLETE.** All three parts landed: (a) **filter chips** — new pure
  helpers in `search.ts` (`filterHits(hits, {types?, apps?})` AND-across/OR-within, `hitFacets(hits)` → distinct
  type/app facets w/ counts busiest-first, `toggleFacet`) drive Type + App chip rows above the results; chips derive
  from the UNFILTERED hits (always show every way to widen back), the results render `filterHits(hits, …)`. (b)
  **keyboard nav** — `activeIndex` roves the FLAT rank-ordered list (`groups.flatMap(g=>g.hits)`, same order the groups
  render); ↑/↓ move + `scrollIntoView({block:'nearest'})`, Enter → `openEntity(hit.node.meta.app, hit.node.id)`; the
  active row gets an `inset 0 0 0 1px var(--ion)` ring + always-visible ⚡ actions; index resets to 0 on query/filter
  change. (c) **global summon** — a THIRD distinct shell key **⌘/Ctrl+Shift+F** in `Desktop.tsx`'s keydown handler
  (distinct from ⌘K focused-node palette + Ctrl+Space app-search — lowest shell-risk per the "don't overload"
  decision): `openAppById('search')` + `dispatchEvent(new CustomEvent('empire:summon-search'))`; `Search.tsx` listens
  and (re)focuses+selects the field even when already foregrounded (mount autofocus covers first-open). `search.test.ts`
  +8 (`filterHits` ×5 incl. AND-across-dims + rank-order-preserved, `hitFacets` ×2, `toggleFacet` ×1). **VERIFIED:**
  build🟢, vitest 257→265🟢, eslint . clean, `metrics.mjs --assert-zero` exit 0 (tokens 0, off-system 0); static
  215→223 (+8), bundle 696.4→697.5 (+1.1, chips/keyboard/summon UI + helpers, **no new deps**); **smoke 28/28 render
  clean incl. search, GLOBAL-SEARCH 1/1 ✅ still holds.** *Cloud limit:* filter-chip narrowing + ↑/↓/Enter roving +
  ⌘⇧F summon are on-device interactions — the pure `filterHits`/`hitFacets`/`toggleFacet` are unit-pinned, the smoke
  carries the render+GLOBAL-SEARCH roundtrip headless. **★ EPIC-8 is CODE-COMPLETE (S1–S3 all shipped) → QA confirms
  then Strategist promotes node-level lineage.**

_S1 has shipped **and** QA confirmed **`GLOBAL-SEARCH 1/1`** (a term surfaced entities across ≥2 apps, grouped) — the
epic's headline metric has moved. S2–S3 deepen it (land on the exact entity → filters/keyboard/summon). When all
three ship → retire EPIC-8 to DONE. The next cloud-executable
candidate is **node-level lineage** (correlate a `HANDOFF` with the specific entity it created — per-artifact
ancestry, `lineageOf` in `provenance.ts` is the rail); **EPIC-7 · Android** stays device-gated._

---

## ✅ DONE — retired by Strategist 2026-07-03 (S1–S3 all QA-confirmed LIVE; S3 `0378d8e` confirmed by QA run `5d45ce8` — `NODE-LINEAGE 1/1`, 5 axes incl. `clickable`, vitest 292, 28/28 clean) — EPIC-9 · Node-level lineage (per-artifact ancestry)

> **RATIFIED + RETIRED by the Strategist 2026-07-03.** All three stages shipped AND QA-confirmed LIVE; the headline
> `NODE-LINEAGE 0/1 → 1/1` moved and was confirmed at S1 (`fcfa06d`), S2 (`f878844`), and S3 (`0378d8e`, by QA run
> `5d45ce8`: `rendered=true title=true persisted=true search=true clickable=true`, vitest 292, 28/28 routes clean).
> **`childrenOf` (the descendants walker) shipped in S1, is unit-pinned, and is still UNUSED — EPIC-10 finally surfaces
> it (S3).** **EPIC-10 · The Timeline is promoted to ▶ ACTIVE** (see top of file). Original "why highest gradient" retained:
> **Why this was the highest realizable gradient at promotion** (one line): the organism *remembers* movement
> at the **app** level (EPIC-6: "Goals ← Calculator") but not at the **entity** level — you can't yet see that *this
> exact task* was made from *that exact note*. Yet the data already exists: the three core intents
> (`make-task`/`make-note-from`/`add-to-learning`, `sync.ts:120-159`) stamp `data.from = sourceNode.id` on every node
> they create AND `link()` the pair, so `empire-core-graph` already holds a durable per-artifact ancestry edge. The
> steepest remaining interconnection gradient is making that ancestry **legible** — walk it, and show the real entity
> chain wherever an artifact appears. Fully cloud-verifiable (pure walker + a headless guard), reuses every rail.

**Leap:** every derived artifact shows *exactly which entity it descended from* — "Inbox task ← «Field log» (Notes) ←
«Anomaly» (Messages)" — the real entity chain, not just app names. Provenance stops being app→app and becomes node→node.

**Target metric:** a **`NODE-LINEAGE` guard** in `scripts/qa-smoke.mjs` — seed a parent node + a child whose
`data.from` points at it, reload, assert the child's row renders the parent entity's real title (durable across a
second reload). **Headline: `NODE-LINEAGE 0/1 → 1/1`** + the "+ a unit test" discipline (`nodeLineage.test.ts`).
*token-violations*/*off-system* stay **0**.

### Rails to reuse (read ONCE — do NOT reinvent)
- **`src/lib/core/nodeLineage.ts` (S1, 2026-07-03)** — the pure spine: `parentIdOf(node)` (reads `data.from`),
  `nodeLineageOf(nodes, id, maxDepth=6)` (walk `data.from` backwards → live CoreNode chain, cycle-guarded,
  stops at a missing/foreign parent), `childrenOf(nodes, id)` (descendants). **Add walks/queries here, not in components.**
- **`src/components/ui/NodeLineage.tsx` (S1)** — the reusable surface: `<NodeLineage nodeId />` renders the ancestor
  entity chain (real titles + owning-app registry accent/glyph, `data-node-lineage` attr, token-only). Drop it into
  any app row. Mirrors `LineageTrail`'s idiom but node-level (entity titles, not app names).
- **`data.from`** — the honest ancestry link, stamped ONLY by the three core intents (`sync.ts`). Never invent one.

- [x] **S1 · The node-lineage walker + the reusable surface + the guard (per-artifact ancestry becomes legible).**
  ✅ SHIPPED 2026-07-03 (`main`). New pure `src/lib/core/nodeLineage.ts` (`parentIdOf`/`nodeLineageOf`/`childrenOf`,
  11 cases in `nodeLineage.test.ts`). New `src/components/ui/NodeLineage.tsx` — reactive `useGraph`, walks
  `nodeLineageOf`, renders the ancestor entity chain (real titles + registry accent/glyph), null when no ancestry.
  Wired into the **Inbox** `TaskRow` beside the source-app chip (every make-task task carries `data.from`). New
  `NODE-LINEAGE` guard in `qa-smoke.mjs` (seed parent+child `task` nodes → reload → assert the child row shows the
  parent's title, durable across a 2nd reload) — **ran LIVE 1/1 ✅** (`rendered=true title=true persisted=true`),
  28/28 routes clean, every other guard green. build🟢 vitest 265→276🟢 eslint clean; tokens 0, off-system 0
  (`--assert-zero` exit 0); static 223→234, bundle 697.5→698.1 (+0.6, no new deps).
  - *Acceptance:* a task made via ⚡ make-task from a note shows "↖ «that note»" in the Inbox, surviving reload;
    `nodeLineage.test.ts` green; `NODE-LINEAGE 0/1 → 1/1`. **Per-artifact ancestry is legible + queryable.**
  - *Cloud limit:* the Inbox trail is an on-device visual — the pure walker is unit-pinned + the guard carries the
    graph→persist→rehydrate→render roundtrip headless (`[data-node-lineage]` + parent title).
  - **✅ QA-CONFIRMED LIVE 2026-07-03 (green main `fcfa06d`) — S1 done-confirmed, `NODE-LINEAGE 0/1 → 1/1` moved.**
    First independent QA since S1 landed. `NODE-LINEAGE 1/1 ✅` reproduced (`rendered=true title=true persisted=true`,
    durable across two reloads); **also confirmed VISUALLY** (`docs/screenshots/latest/s1-node-lineage-inbox.png` — an
    Inbox row shows `↖ ⌾ <parent entity title>`). 28/28 routes render clean (0 uncaught JS), vitest **276/276**, eslint 0,
    `metrics.mjs --assert-zero` exit 0, every other guard green. No runtime bug, no contradiction. **▶ NEXT = S2.**

- [x] **S2 · Surface node-lineage on the graph's node-rendering views (Network inspector + Search).** ✅ SHIPPED
  2026-07-03 (`main`). Dropped `<NodeLineage nodeId>` on the two surfaces that render REAL graph nodes by id: the
  **Network inspector's per-entity list** (upgraded from bare type-counts to an actual entity list — newest-first,
  capped at `ENTITY_ROWS=12` + a "+ N more" line — each row showing the entity title + type dot + its ancestry trail)
  and **Search result rows** (lineage under the type/snippet meta line). Both reuse the S1 component + walker verbatim —
  zero new logic. Extended the `NODE-LINEAGE` guard with a **Search axis** (`search=true`): query "anomaly" → the seeded
  child hit renders `[data-node-lineage=qa-lineage-parent]`. **Ran the full smoke LIVE: NODE-LINEAGE 1/1 ✅**
  (`rendered=true title=true persisted=true search=true`), 28/28 clean, every guard green. build🟢 vitest 288🟢 eslint
  clean; tokens 0, off-system 0 (`--assert-zero` exit 0); bundle gz 701.2 ±0 (NodeLineage already bundled).
  - **⚠️ CORRECTION to the original premise — Notes/Learning app cards CANNOT carry node-lineage (architectural, not
    skipped):** the intents `make-note-from`/`add-to-learning` (`sync.ts:139-159`) create standalone GRAPH nodes with
    `data.from`, NOT local Notes/Learning store items — and those `note`/`learning` graph nodes get PRUNED by the
    central reconcile (`sync.ts:64`) on the next store tick (they have no `sourceId` in their store). Meanwhile the
    Notes/Learning apps render ONLY local `useStore` items (`notes`/`learningItems`), whose mirror mapping drops `from`
    entirely (`sync.ts:80-91` map only content/tags, learned/mastered) → a local note/learning item NEVER carries
    `data.from`. So `<NodeLineage>` on a Notes/Learning card is always null. The derived nodes that DO carry `data.from`
    (durably: make-task tasks, owned by their source app) live in the graph → surfaced in **The Network inspector** and
    **Search**, which is exactly where S2 mounted them. *(Descendants (`childrenOf`) row deferred — not needed to move
    the metric; a candidate for S3's ancestry view.)*

- [x] **S3 · Make node-lineage NAVIGABLE (each ancestry hop climbs to its source entity).** ✅ SHIPPED 2026-07-03
  (`main`). Every `<NodeLineage>` hop is now a real control: `EntityToken` became a `role="button"` span (tabIndex 0,
  Enter/Space) that `openEntity(node.meta.app, node.id)`s the ancestor — opens its owning app + points the organism's
  gaze (`focusedId`) at it — so from any Search hit / Inbox row / Network inspector row you climb the ancestry
  mouse-free. `stopPropagation`+`preventDefault` keeps it valid + self-contained even nested inside Search's outer
  `<button>` row (a span-with-role isn't interactive content, so no invalid button-in-button). Token-only
  `.gp-lineage-hop` affordance in `design-system.css` (ion hover tint + focus-visible ring, `color-mix`, no raw hex).
  **`NodeLineage.test.tsx` (+4)** deterministically pins the navigation: click/Enter a hop → `useWindowStore.activeWindowId`
  = the ancestor's owning app AND `useFocus.focusedId` = the ancestor id. **`NODE-LINEAGE` guard grew a 5th axis
  `clickable`:** in the live Search DOM the parent hop renders as a `[role="button"]` whose accessible name targets the
  parent entity, then the guard clicks it (handler must not throw). **Ran the full smoke LIVE: NODE-LINEAGE 1/1 ✅**
  (`rendered=true title=true persisted=true search=true clickable=true`), 28/28 routes clean, every other guard green.
  build🟢 vitest 288→292🟢 eslint clean; tokens 0, off-system 0 (`--assert-zero` exit 0); static 246→250, bundle
  701.2→701.4 (+0.2, no new deps). **Cloud limit:** on the `/app/search` *route* AppShell renders by URL param, not
  windowStore, so the in-app window swap isn't observable headless — the `clickable` axis carries the live click-path +
  correct wiring; the actual window/focus state change is unit-pinned. **Ancestry mini-tree deferred** (optional, not
  needed to make lineage navigable — the `childrenOf` descendants walker stays built + unit-pinned for a future view).
  **★ EPIC-9 is CODE-COMPLETE (S1–S3 all shipped) → QA confirms on the new green main; then EPIC-7 · Android if an
  on-device QA path exists.**

_S1 shipped **and QA-confirmed LIVE** on green main `fcfa06d` (`NODE-LINEAGE 1/1`, 28/28 clean, vitest 276) — the epic's
headline metric has moved. **S2 shipped 2026-07-03** (node-lineage legible on the Network inspector's per-entity list +
Search rows; guard grew a `search=true` axis; Notes/Learning cards proven architecturally impossible — see S2
correction). **S3 shipped 2026-07-03** — each lineage hop is now NAVIGABLE (`openEntity` on click/Enter; guard grew a
`clickable` axis, unit-pinned window+focus in `NodeLineage.test.tsx`). **★ EPIC-9 RETIRED to DONE by the Strategist
2026-07-03** — the headline metric moved + was QA-confirmed across S1–S3 (S3 `0378d8e` confirmed by QA run `5d45ce8`,
`clickable=true`). **▶ EPIC-10 · The Timeline promoted to ACTIVE** (temporal lens — surfaces the unused `childrenOf`
walker + the untouched `meta.created` ordering key). **EPIC-7 · Android** stays device-gated._

---

## ✅ DONE — EPIC-6 · Organism Memory (durable provenance & lineage)

> **Promoted 2026-07-01** (EPIC-5 CLOSED; every prior epic DONE). **Why this is the highest-gradient move now**
> (one line): the organism has a reflexive nervous system that **fires and forgets** — a `HANDOFF` lights one
> arc, then the only trace is Network's capped, in-memory 6-item ticker that fades and does **not survive a
> reload**; giving the organism *durable memory* is the steepest remaining interconnection gradient (it ranks
> above design/PWA/Android in the priority bias, is fully cloud-verifiable, reuses every existing rail — `HANDOFF`,
> `flowForEvent`, the graph, the `qa-smoke` guard pattern — and turns "one living organism" from a per-session
> illusion into a persistent truth). It also **subsumes and closes the last two open interconnection follow-ups**:
> organism-completeness-II (post-redesign wiring) and the Reader graph-island.

**Leap:** The Empire stops forgetting. Every cross-app transfer is recorded in a **durable, queryable provenance
store**; The Network gains a **persistent memory** (not a fading ticker) and each app's inspector shows its
whole-history "fed by / feeds" adjacency; entities that arrived via a handoff show their **source durably across a
reload**; and the last graph-island (Reader's books) becomes legible in the mesh. The nervous system grows a memory.

**Target metric (new — Builder instruments it; QA confirms it moved):** a **`PROVENANCE-PERSISTS` guard** in
`scripts/qa-smoke.mjs` (mirrors the existing `INBOUND-LANDS` / `MEDIA-PERSISTS` guards) — seed a cross-app handoff,
**reload**, and assert the receiving entity still shows its source from the *durable provenance store* (not the
consumed sessionStorage chip). **Headline number: `PROVENANCE-PERSISTS 0/3 → 3/3`** (Calculator→Notes,
notes→Goals, editor→Messages — three durable receivers). Secondary: **graph-legible apps** — every collection-
owning app's real entities mirrored into The Network → **close the one gap (Reader)**; and the "+ a unit test"
discipline (`provenance.test.ts`, `LineageTrail` test). *Routes rendering clean* stays **26/26**,
*token-violations*/*off-system* stay **0** throughout (`--assert-zero` must keep passing).

### Rails to reuse (read ONCE — do NOT reinvent)
- **`src/lib/eventBus.ts`** — `onAny(handler)` (subscribe to every event), `emit`, the `HANDOFF { fromId, toId,
  label? }` event. In-memory `history` here is **not** persistence — the new store is the durable spine.
- **`src/lib/core/flow.ts`** — `flowForEvent(e): Flow | null` (`{fromId,toId}`) is the ONE honest "did data move
  app→app?" predicate (covers `HANDOFF` + `NOTE_CREATED` `from-<src>` tag + `LEARNING_LOGGED.from`). **The
  provenance tracker records exactly what `flowForEvent` returns** — never invent an edge the user didn't cause.
- **`src/lib/core/focus.ts` + `main.tsx:16-17`** — the exact precedent for a global `onAny` tracker started once
  in `main.tsx` (`startFocusTracking()`); the new `startProvenanceTracking()` mirrors it (added at `main.tsx:18`).
- **Zustand+persist** — `src/lib/core/graph.ts` (`empire-core-graph`) is the persist-store pattern to copy.
- **`src/lib/registry.ts`** — `apps` (id→name/icon/color/route); `getAppIcon()` for the source glyph in a trail.
- **`src/components/ui/ProvenanceChip.tsx`** — the styled "From <app>" glass pill; `LineageTrail` reuses its
  token idiom (accent = `${app.color}` / `cssVar`/`tint`; **no raw hex, no off-system palette class**).

Stages (Builder takes the topmost `[ ]`; each is one run, downhill given the ones before, build+vitest+eslint green,
`tokenViolations`/`offSystemUtilities` stay 0):

- [x] **S1 · The durable provenance store + tracker (the memory spine — pure infra, zero UI risk).** ✅ SHIPPED
  2026-07-02. `src/lib/core/provenance.ts` (`ProvEdge`, `useProvenance` persist store key `empire-provenance`,
  `MAX_EDGES=500`/`DEDUP_MS=1500`, pure `recordEdges`/`edgesInto`/`edgesFrom`/`lineageOf`, `startProvenanceTracking()`
  wired once at `main.tsx:20`). `provenance.test.ts` **14 cases** green. Build🟢 vitest 216→230🟢 eslint clean;
  tokens 0, off-system 0 (`--assert-zero` exit 0), bundle 691.4→691.8. **Spine laid — S2 is next.**
  **New `src/lib/core/provenance.ts`:**
  - `export interface ProvEdge { fromApp: string; toApp: string; label?: string; at: number }` — one durable
    record of a real app→app transfer.
  - A **Zustand+persist** store `useProvenance` (persist key `'empire-provenance'`, mirror `graph.ts`'s setup):
    state `{ edges: ProvEdge[] }` + actions `record(edge: ProvEdge)` (append, **cap to the last `MAX_EDGES = 500`**
    via slice, and **coalesce an immediate duplicate** — same `fromApp`+`toApp`+`label` fired within `DEDUP_MS = 1500`
    just updates the existing edge's `at` instead of appending, so a double-emit doesn't double-count) and `clear()`.
  - **Pure, exported helpers** (all `(edges, …)` → value, no store access, so they unit-test without React):
    `edgesInto(edges, appId): ProvEdge[]` (edges where `toApp===appId`, newest-first), `edgesFrom(edges, appId)`
    (`fromApp===appId`), and `lineageOf(edges, appId, maxDepth = 6): string[]` — walk the newest incoming edge
    backwards (`appId ← its newest fromApp ← …`) building an ancestry path, **cycle-guarded** (stop if an app
    repeats) and depth-capped; returns `[appId, parent, grandparent, …]` (length 1 when no inbound history).
    Also export the pure `recordEdges(edges, edge, now): ProvEdge[]` that `record` wraps (append+cap+coalesce) so
    the cap/dedup logic is testable without the store.
  - `export function startProvenanceTracking(): void` — `onAny(e => { const f = flowForEvent(e); if (f)
    useProvenance.getState().record({ fromApp: f.fromId, toApp: f.toId, label: 'label' in e ? e.label : undefined,
    at: Date.now() }) })`. Idempotent-safe (a module-level `started` guard like focus.ts). **Call it once in
    `src/main.tsx`** right after `startFocusTracking()` (line 18): `import { startProvenanceTracking } from
    './lib/core/provenance'; startProvenanceTracking()`.
  - **Test `src/lib/core/provenance.test.ts`** (≥8 cases): `recordEdges` appends; caps at `MAX_EDGES`; coalesces a
    same-pair edge within `DEDUP_MS` (no new entry, `at` bumped) but appends after it; `edgesInto`/`edgesFrom`
    filter+order correctly; `lineageOf` builds a 3-deep chain, stops on a cycle (A←B←A), and returns `[app]` with
    no history. (Pure — no jsdom/store needed.)
  - *Acceptance:* firing a `HANDOFF{fromId:'calculator',toId:'notes'}` (or any `flowForEvent` match) appends a
    `ProvEdge` that **survives a reload** (persisted under `empire-provenance`); `provenance.test.ts` green.
    Build🟢 vitest🟢 (test-files +1) eslint clean; `metrics.mjs --assert-zero` still exit 0 (tokens 0, off-system 0).
    **No UI, no visual change — this is the load-bearing spine S2–S4 build on.**

- [x] **S2 · The Network remembers — durable "Fed by / Feeds" in the inspector + a persistent memory panel.** ✅
  SHIPPED 2026-07-02. `Network.tsx` subscribes `useProvenance(s => s.edges)` reactively. **Inspector** gained a
  *Provenance · all-time* section (below the live structural neighbours): **Fed by** (`fedBy(provEdges, selected)`)
  and **Feeds** (`feeds(provEdges, selected)`) — each a clickable row with the app glyph+registry accent, name, and
  the newest edge's relative age (`ago`), opening that app. **Persistent Memory panel** added to the bottom-left,
  stacked *above* the live ticker in a shared column: lists `recentEdges(provEdges, 12)` newest-first as
  `source → target` rows (both registry icons+accents + age), a plasma pulse-dot header. It reads the store, so it
  **survives a reload** while the ticker starts empty. New pure helpers in `provenance.ts`: `fedBy`/`feeds`
  (de-duped `ProvNeighbor[]`, newest-first) + `recentEdges` — 6 new tests in `provenance.test.ts` (194 static /
  236 vitest). Colours via `cssVar('plasma')`/`tint('signal',N)` + registry `${app.color}` identity — tokens 0,
  off-system 0 (`--assert-zero` exit 0). build🟢 eslint clean; bundle 691.8→692.5. *Cloud limit:* the panels are a
  visual render QA screenshots; the pure selection is unit-pinned. Original spec ↓
  Today `Network.tsx`'s inspector (EPIC-1 S3) shows only *current-graph* `appAdjacency`, and the ticker is capped/
  in-memory/fading. Give the mesh durable memory sourced from S1's store:
  - **`src/apps/network/Network.tsx`** — subscribe reactively `const provEdges = useProvenance(s => s.edges)`.
    In the inspector panel for `selected`, add a **provenance section** below the live neighbours: **"Fed by"** =
    `edgesInto(provEdges, selected).` unique `fromApp`s (each a row: source icon+name from `registry` + a count/last-
    `at` age, a button → `openApp(fromApp)`); **"Feeds"** = `edgesFrom(provEdges, selected)` unique `toApp`s. Label it
    so it reads as *history* ("has fed / been fed", all-time) vs the live graph adjacency (structural, now).
  - **Persistent memory panel:** render a small always-available panel (corner, glass token surface, `--mono`)
    listing the **most recent `N≈12` `ProvEdge`s newest-first** — each a `source → target` row with both registry
    icons+accents and a relative age (reuse the ticker's age formatter). This is the durable analogue of the live
    ticker: it is populated **from the store on mount**, so after a reload the organism's recent history is still
    there (the ticker starts empty). Keep the existing live ticker as-is (it shows *this-session* pulses); the memory
    panel is the persistent record. Both use **`nodeColors`/`registry` accents via `rgbCss`/`cssVar`/`tint`** — no raw
    hex, no off-system class.
  - **Test:** extend `src/apps/network/adjacency.test.ts` **or** a new `provenanceView.test.ts` — assert the pure
    selection the panel uses (unique `fromApp`s from `edgesInto`, unique `toApp`s from `edgesFrom`) dedupes and orders
    newest-first over a fixture edge list. (The canvas render itself isn't unit-tested; pin the selector.)
  - *Acceptance:* seed a few handoffs → open The Network → the inspector shows durable "Fed by/Feeds" and the memory
    panel lists them; **reload → they persist** (the ticker is empty, the memory panel is not). Build🟢 vitest🟢
    eslint clean; tokens 0, off-system 0 (`--assert-zero` exit 0). *Cloud limit:* the live canvas/panel render is a
    visual change QA screenshots; the selector logic is unit-pinned.

- [x] **S3 · Durable per-entity provenance — the "From <source>" survives a reload (headline-metric stage).** ✅
  SHIPPED 2026-07-02. New `src/components/ui/LineageTrail.tsx` (`role="note"` glass row, direct `<app> ← <from>` pair
  or `lineageOf` walk, registry icons+accents, renders nothing with no ancestry). Added `from?: string` to the
  persisted `Message`/`Goal`/`CalendarEvent` shapes; Calendar/Goals/Messages now stamp `from` (from `inbound.payload.from`,
  via a `draftFrom` state kept off the effect deps so dismiss no longer re-prefills) onto the saved entity and render
  `{entity.from && <LineageTrail …/>}` on its card/bubble/row. `LineageTrail.test.tsx` (3). Added a **distinct**
  `PROVENANCE-ENTITY` guard to `qa-smoke.mjs` (seed→reload→create→reload→assert trail; does NOT clobber the edge-level
  `PROVENANCE-PERSISTS`) + a `PROVENANCE-ENTITY N/3` REPORT section. build🟢 vitest 236→239🟢 eslint 0; tokens 0,
  off-system 0 (`--assert-zero` exit 0); bundle 692.5→693.5. *Cloud limit:* the trail render is visual (QA screenshots);
  the selection is unit-pinned + the guard exercises the full flow headless. **✅ QA-CONFIRMED LIVE 2026-07-02 (green
  main `13a48dc`): `PROVENANCE-ENTITY` 3/3** ({calculator→goals, editor→messages, notes→calendar} — trail survives the
  second reload off the persisted entity) + visually via `s3-lineage-goals.png` (durable `Goals ← Calculator` pill after
  reload). The headline metric moved → S3 done-confirmed; only S4 (Reader island) remains to CLOSE EPIC-6. Original spec ↓
  The receivers that persist their entities carry `from` durably (Notes as a `from-<src>` tag, Learning as
  `item.from`), so their chip is already reload-durable. The gap: **Calendar / Goals / Messages** (S6c receivers)
  read the source from `sessionStorage` (`useInboundHandoff`, consumed on mount) — so after a reload the created
  event/goal/draft has **lost its provenance**. Close it by stamping `from` onto the **persisted entity** exactly as
  Notes/Learning do, and rendering a durable `<LineageTrail>` from it:
  - **New `src/components/ui/LineageTrail.tsx`** — `<LineageTrail app={appId} from?={sourceId} />`: a compact glass
    row (reuse `ProvenanceChip`'s token styling) rendering the ancestry `lineageOf(useProvenance.getState().edges,
    app)` **or**, when a concrete `from` is supplied, the direct "`<app>` ← `<from>`" pair with registry icons+
    accents. It reads the **durable store**, so it renders whether or not the sessionStorage chip is still present.
  - **`src/lib/store.ts`** (or wherever `CalendarEvent`/`Goal`/`Message` persist) — add an optional `from?: string`
    to those persisted shapes (backward-compatible; old items simply lack it), mirroring `LearningItem.from`.
  - **`src/apps/calendar/Calendar.tsx` / `goals/Goals.tsx` / `messages/Messages.tsx`** — in the `[inbound.payload]`
    create-form effect, set `from: inbound.source` on the entity that gets saved; render `{entity.from &&
    <LineageTrail app='<app>' from={entity.from} />}` on that entity's card/row (keep the existing session
    `<ProvenanceChip>` for the immediate pre-save hint). Dismiss clears `from` via the store updater (as Notes/
    Learning do).
  - **Add the `PROVENANCE-PERSISTS` guard to `scripts/qa-smoke.mjs`** (mirror the `INBOUND-LANDS` block exactly):
    for each of **`{calculator→notes, notes→goals, editor→messages}`**, seed the `empire-*-clipboard` payload **and**
    prime the persisted entity, **reload**, and assert the receiving entity renders a **durable lineage/source**
    (the trail is present with the sessionStorage key already consumed). Fold a `PROVENANCE-PERSISTS N/3` line into
    `REPORT.md`. (Notes/Goals already persist `from`; Messages/Calendar gain it here.)
  - **Test:** `src/components/ui/LineageTrail.test.tsx` (≥2) — renders the `from` pair with the right source name; a
    no-history `app` with no `from` renders nothing (or just the app), no crash.
  - *Acceptance:* ⚡ Send-to-Goals from Calculator → **reload** → the goal still shows "Goals ← Calculator"; same for
    Messages/Calendar. **`PROVENANCE-PERSISTS 0/3 → 3/3`.** Build🟢 vitest🟢 eslint clean; tokens 0, off-system 0.

- [x] **S4 · Close the last graph-island: Reader's books → the mesh (+ book-level emit). EPIC-6 CLOSE.** — SHIPPED
  2026-07-02. `Reader.tsx` mirrors the whole book library into the Core graph as `book` nodes via `mirrorCollection`
  (pure shape in `readerGraph.ts`, unit-pinned) + a `<NodeActions type="book">` emit affordance per card; `make-task`
  now accepts `book`. New `GRAPH-LEGIBLE` guard in `qa-smoke.mjs` — **verified live 1/1 ✅** (loaded book → reader-owned
  `book` node → survives reload). Every collection-owning app is now graph-legible. **EPIC-6 DONE.**
  **✅ QA-CONFIRMED LIVE 2026-07-02 (green main `e262f1b`): `GRAPH-LEGIBLE` 1/1** (added=node=persisted=true) + 27/27
  routes render clean, vitest 242/242, all guards green (INBOUND 3/3, MEDIA 3/3, PROVENANCE-PERSISTS 3/3,
  PROVENANCE-ENTITY 3/3, OFFLINE 5/5, PRECACHE 79 no-gap), `--assert-zero` exit 0. **All four EPIC-6 acceptance metrics
  have now moved → EPIC-6 CLOSED. The Strategist should promote the next epic (node-level lineage OR global cross-app
  search — both cloud-executable; EPIC-7 Android device-gated).**
  Reader (the newest app) holds a real collection — loaded books — but **never mirrors them into the graph**, so it
  is invisible in The Network (only a `SendResultMenu` on Cakra replies exists at `Reader.tsx:379`). It is the one
  remaining collection-owning app that isn't graph-legible. Close it exactly like Files/Photos/Notes:
  - **`src/apps/reader/Reader.tsx`** — on the book library changing, `mirrorCollection('book', books.map(b => ({
    sourceId: b.id, title: b.title, app: 'reader', data: { format: b.format } })))` (use the real book shape — read
    the component for its list state; **accumulate the whole library**, not one open book, per the `mirrorCollection`
    prunes-unseen trap documented in CONTEXT). Add a `<NodeActions type='book' sourceId={b.id} />` (or the existing
    emit affordance) on each book so a passage/selection can emit onward — Reader becomes a legible **emitter** in
    the mesh (an honest emit-only source, like files/photos — a text→book *inbound* stays unnatural, do NOT invent one).
  - **`scripts/qa-smoke.mjs`** — extend the graph-legibility check (or add a small `GRAPH-LEGIBLE` assertion): after
    seeding a Reader book, assert a `book` node appears for `app==='reader'` (mirrors how Files/Photos are covered).
  - **Test:** if Reader gains a pure mirror-shape helper, pin it (`readerGraph.test.ts`); otherwise the mirror is the
    same tested `mirrorCollection` rail and QA's node assertion carries it.
  - *Acceptance:* load a book in Reader → it appears as a node in The Network (and in its inspector's entities);
    **every collection-owning app is now graph-legible.** With S1–S3 shipped and `PROVENANCE-PERSISTS 3/3` confirmed
    by QA, **EPIC-6 is DONE.** Build🟢 vitest🟢 eslint clean; tokens 0, off-system 0; routes 26/26.

_When S1–S4 ship and QA confirms **`PROVENANCE-PERSISTS 3/3`** (durable source survives reload) **and** Reader is
graph-legible → retire EPIC-6 to DONE and promote **EPIC-7 · Android** only if an on-device QA path then exists;
otherwise the next cloud-executable candidate is **node-level lineage** (correlate a `HANDOFF` with the entity it
created for a true per-artifact ancestry, the natural depth-follow-on to this app-level memory) or **global
cross-app search** (query every app's persisted collection — see ROADMAP LATER)._

---

## ✅ DONE — EPIC-1 · Organism Completeness

> **DONE 2026-06-23** (QA-confirmed on green main `6435a81`). All stages S1–S6c shipped;
> target metric **moved to its honest success state**: *Apps fully wired both-ways* = **9/9
> entity-apps-with-a-natural-inbound** (was 1/26 at epic start), *Routes rendering clean* held
> **27/27**. S6c live-confirmed by QA (`scripts/qa-s6c-confirm.mjs` → Calendar/Goals/Messages each
> show a "From <source>" ProvenanceChip + prefilled create form; 3/3 ✅, screenshots
> `s6c-inbound-*.png`). **EPIC-2 promoted to ▶ ACTIVE** (design-token violations 501 → 0).
> Full stage history retained below for reference.

**Leap:** The Empire stops being 26 apps with a few wired synapses and becomes one
organism where **every** app both *emits* and *receives* honest handoffs, the
Network mesh portrays the full adjacency, and a human can navigate the whole graph.

**Target metric:** *Apps fully wired both-ways* (emit AND legibly receive) → **1/26 → 9/9
entity-apps-with-a-natural-inbound**; *Routes rendering clean* stays **26 / 26**.
(See the settled audit under S6 — "26/26" was the old literal target; a Calculator has no
collection and no natural inbound, so the honest target is "every entity-owning app that can
take input is both-ways" (9: notes, learning, prompt-gen, editor, token-counter, ai-chat,
calendar, goals, messages), while files/photos/datacenter + the tool apps stay emit-only sources.)
**Why highest gradient:** the product's entire thesis is "one living organism." The
*rails* are now built — `HANDOFF` fires on every transfer (S2 ✅), receivers acknowledge
provenance (S1 ✅), `mirrorCollection`/`NodeActions` exist. The remaining gradient is
**making the organism legible and navigable** (S3), then surfacing its intents globally
(S4/S5), then closing the wiring gaps (S6). Each is now downhill given the ones before.

Stages (Builder takes the topmost `[ ]`; **confirm current state vs. code first** —
some may already be shipped):

- [x] **S1 · Inbound provenance.** Each `sessionStorage` receiver (Editor, Token
  Counter, Prompt Gen, AI Chat) shows a dismissible **"From <source>"** chip
  (token-styled, source app's accent) and preloads the payload. *Acceptance:* send
  from Calculator → Token Counter opens pre-filled with a "From Calculator" chip;
  same for the other three. Build 🟢, vitest 🟢, eslint clean; add a unit test.
  **Shipped 2026-06-22:** `useInboundHandoff` hook + `<ProvenanceChip>`; fixed a
  latent bug (Editor never read its clipboard). See ROUTINE-LOG 2026-06-22.
- [x] **S2 · Every app emits on transfer.** Audit `CROSS_APP_ACTIONS`; every transfer
  emits an arc-bearing event (no invented edges). *Acceptance:* every cross-app action
  lights a directed arc in The Network; one test asserts each action emits exactly one
  arc-bearing event with the correct source. **Already shipped (confirmed in code
  2026-06-22):** all five navigating transfers (`SEND_TO_EDITOR` / `_TOKEN_COUNTER` /
  `_PROMPT_GEN` / `_AI_CHAT` / `ASK_HERMES_TO_ANALYZE`) call `handoff(from,to,label)` →
  emit `HANDOFF{fromId,toId}`; the two in-place transfers (`SEND_TO_NOTES`,
  `SEND_TO_LEARNING`) emit `NOTE_CREATED`/`LEARNING_LOGGED` carrying `from` (a separate
  HANDOFF would double-count the ticker — see `Network.flowForEvent`). The deferred
  "HANDOFF-everywhere vs typed-with-`from`" decision was resolved as **typed-with-`from`**
  (option b). `src/lib/appActions.test.ts` asserts each action emits exactly one
  arc-bearing event with the right source. No Builder work remained; marked shipped here.
- [x] **S3 · Network inspector + legend** — **Shipped 2026-06-22.** Make the organism
  *legible*: clicking an app node opens an inspector panel showing that app's real graph
  entities and its true cross-app neighbors, plus a persistent legend mapping node-type →
  accent. Today `Network.tsx`'s canvas `onClick` only `openApp(...)`s — there is no
  inspector and no legend, so the colored entity dots and arcs are unreadable.
  **Done:** new `adjacency.ts` (`appAdjacency`/`entitiesByApp`, 5 tests) + `nodeColors.ts`
  (extracted `TYPE_RGB`/`typeRgb` + `rgbCss`, one source for canvas+legend); `Network.tsx`
  click → select, reactive inspector panel (entities by type, ↔/→/← neighbours, ⚡ Open, ✕)
  + always-visible legend. Build🟢 vitest🟢 86/86 eslint clean; token-violations 503→501.
  **Files & shape:**
  - **New** `src/apps/network/adjacency.ts` — a pure, testable seam. Export
    `appAdjacency(nodes: CoreNode[]): Record<string, { out: string[]; in: string[] }>`
    that, for every CoreNode `n`, walks `n.links` and maps `owner(n)=n.meta.app` →
    `owner(target)` for each linked node, accumulating directed app→app adjacency
    (skip self-edges and unknown owners). Also export
    `entitiesByApp(nodes): Record<string, CoreNode[]>` grouping nodes by `meta.app`.
  - **`src/apps/network/Network.tsx`** — add `const [selected, setSelected] = useState<typeof apps[number] | null>(null)`.
    In the canvas `onClick`, change behavior: a single click **selects** (`setSelected(layout[i].app)`)
    instead of opening; the inspector's button opens the app. Render an absolutely-
    positioned inspector panel (glass token surface, `--mono`, design-system classes —
    NO raw hex) when `selected` is set, listing: the app name+icon+accent; its entities
    from `entitiesByApp(useGraph nodes)[id]` grouped/counted by type; its neighbors from
    `appAdjacency(...)[id]` (each row a button → `openApp(neighbor)`); a "⚡ Open <app>"
    button and a ✕ to deselect. For the panel, subscribe with `const nodes = useGraph(s => s.nodes)`
    (the render loop already reads `useGraph.getState().nodes` imperatively — keep that;
    add the reactive subscription only for the panel so it updates as the graph changes).
  - **Legend:** a small always-visible panel (corner) listing each entity node-type
    (note/task/message/learning/goal/prompt + "other") with its accent swatch. Source the
    colours from the existing `TYPE_RGB` map in `Network.tsx` (export it) so canvas and
    legend can't drift — do **not** re-hardcode the rgb strings in the DOM.
  - **Test:** `src/apps/network/adjacency.test.ts` — given a fixture graph (a `note`
    owned by `calculator` linking a `task` owned by `goals`), assert
    `appAdjacency(nodes).calculator.out` contains `goals` and `.goals.in` contains
    `calculator`; assert self-links and unknown owners are dropped.
  - *Acceptance:* click any app node in The Network → inspector lists its real entities
    + true neighbors, each neighbor row opens that app; the legend's swatches match the
    canvas dot colours; ✕ deselects. Build 🟢, `vitest` 🟢 (incl. the new adjacency test),
    eslint clean on touched files; no new token violations (legend reuses `TYPE_RGB`).
- [x] **S4 · Global "⚡ Send to…" in the command palette** — **Shipped 2026-06-22.** No palette
  existed (only the Ctrl+Space app-search), so built a minimal one: `src/components/CommandPalette.tsx`
  (⌘/Ctrl-K `gp` modal, reuses the shell's `empire-search-*` glass) targets the FOCUSED node and lists
  `intentsFor(node)` + an "Open in <app>" action, running the choice via `runIntent` + toast (mirrors
  `NodeActions`). "Focused node" = the last node touched anywhere, derived from the event bus by the new
  `src/lib/core/focus.ts` (`useFocus` store + pure `focusIdForEvent` + `startFocusTracking()` in `main.tsx`);
  Network's inspector also `setFocus`es the selected app's newest node. Build🟢 vitest 92/92 (focus.test.ts
  +6) eslint clean; token-violations 501 (±0 — used `rgbCss`). *Acceptance met:* ⌘K lists the focused node's
  intents and runs them from one surface. *Honest cloud limit:* keyboard summon + run not exercised headless
  (fresh graph is empty); seam + 6 unit tests verify focus logic, not live keypress.
- [x] **S5 · "Inbox / Today" view.** — **Shipped 2026-06-22.** Built a dedicated **Inbox app**
  (a real always-reachable home for tasks, not a buried panel) instead of the Network-panel
  fallback. `src/lib/core/tasks.ts` (pure seam: `partitionTasks`/`taskNodes`/`isTaskDone`, 4
  tests) aggregates every graph `task` node into open/done buckets (newest-first by `created` so
  toggling done doesn't reorder). `src/apps/inbox/Inbox.tsx` subscribes to the graph reactively,
  lists tasks with a checkbox that flips `data.done` via `updateNode`, a source-app chip
  (icon+name from registry), and a ⚡ `<NodeActions>` bar. `NodeActions` gained an optional
  `nodeId` prop so graph-only nodes (tasks have no store `sourceId`) can be targeted directly.
  Registry+appComponents entry added (`inbox`, 27th app). *Acceptance met:* a task made via
  ⚡ make-task from any app surfaces in the Inbox; toggling the checkbox flips `data.done` on the
  graph node. Build🟢 vitest 96/96 eslint clean; token-violations **501 (±0** — Inbox is pure
  tokens; the new registry accent's +1 was offset by removing a dead `var(--ion,#hex)` fallback in
  Goals). *Honest cloud limit:* a fresh checkout's graph is empty, so the populated list / live
  toggle can't be exercised headless — covered by the 4 unit tests + the seam.
**S6 · Close the emit↔receive loop (the headline metric).** The audit is now DONE (see
below — no more "audit first" hand-waving). The metric *apps fully wired both-ways* has been
stuck at **1/26** (only `prompt-generator` emits AND legibly receives) since S1, because three
honest gaps remain. S6 closes them in three downhill stages, each one Builder run, each moving
the number. **Audit (settled, code-confirmed 2026-06-22):**
  - **Emitters (10)** — `<NodeActions>` + mirror into the graph: artifacts/kanban, calendar,
    datacenter, files, goals, learning-tracker, messages, notes, photos, prompt-generator.
  - **Chip-receivers (4)** — `useInboundHandoff` + `<ProvenanceChip>`: editor, prompt-generator,
    token-counter, ai-chat.
  - **Silent in-place receivers (2)** — `SEND_TO_NOTES`/`SEND_TO_LEARNING` land content but show
    NO provenance: notes (tags the note `from-<source>` but never renders it), learning-tracker
    (drops the source entirely — `LearningItem` has no `from` field).
  - **Dead-end sinks (3)** — editor, token-counter, ai-chat receive but emit nothing onward.
  - **Emit-only entity apps with a *natural* inbound (3)** — calendar, goals, messages own
    entities and emit, but no `CROSS_APP_ACTION` targets them, so they can't receive.
  - **Honest non-receivers** — files, photos, datacenter are *manage/browse* stores (a generic
    text handoff INTO them is unnatural — they stay emit-only by design); tool apps (calculator,
    clock, weather, grammar, language, music, video, cache, browser, maps) own no collection and
    participate as emit-only *sources*. **Do NOT invent inbound for these to chase a literal 26/26.**

- [x] **S6a · Surface provenance on the two silent in-place receivers (Notes + Learning).**
  **Shipped 2026-06-23.** `LearningItem` gained `from?: string`; `SEND_TO_LEARNING` now sets
  `from: data.source`. Notes cards split a `from-<source>` tag out of the badge list and render
  `<ProvenanceChip>` (dismiss strips only `from-*` tags, keeps user tags); Learning cards render
  the chip for `item.from` (dismiss clears `from` via `updateLearningItem`). `appActions.test.ts`
  asserts the stored item persists `from === data.source` (97 vitest tests, +1). Build🟢 eslint
  clean; token-violations **501 (±0)** (reused `ProvenanceChip`), bundle gz 240.5→240.9 (+0.4).
  **both-ways 1/26 → 3/26.** *Honest cloud limit:* fresh-checkout graph/stores are empty, so the
  live chip render isn't exercised headless — covered by the unit test + the existing S1 chip.
  Lowest-risk first: the data already arrives, just make the receive *legible* so both apps
  count as both-ways. **Files & shape:**
  - **`src/lib/store.ts`** — add `from?: string` to `interface LearningItem` (optional →
    backward-compatible; existing persisted items just lack it).
  - **`src/lib/appActions.ts`** — in `SEND_TO_LEARNING.execute`, set `from: data.source` on the
    `addLearningItem({...})` object (Notes already carries `tags: ['from-' + data.source]`, no change).
  - **`src/apps/notes/Notes.tsx`** — for any note whose `tags` contains a `from-<source>` entry,
    render `<ProvenanceChip from={source} onDismiss={…}/>` on that note's card; dismiss removes
    only that one tag via `updateNote(id, { tags: tags.filter(...) })` (keep the user's other tags).
  - **`src/apps/learning-tracker/LearningTracker.tsx`** — for any item with `item.from`, render
    `<ProvenanceChip from={item.from} onDismiss={…}/>`; dismiss clears `from` via the store updater.
  - **Test:** extend `src/lib/appActions.test.ts` — assert `SEND_TO_LEARNING.execute` persists a
    `from` equal to `data.source` on the created learning item.
  - *Acceptance:* ⚡ Send-to-Notes from Calculator → the new note card shows a "From Calculator"
    chip (source-accent, dismissible); ⚡ Track-as-Learning from Notes → the new learning item
    shows a "From Notes" chip. **both-ways 1/26 → 3/26.** Build🟢 vitest🟢 eslint clean; reuse
    `ProvenanceChip` (no new colours) so token-violations do NOT regress.

- [x] **S6b · Make the three dead-end sinks emit onward (Editor, Token Counter, AI Chat).**
  *(Shipped 2026-06-23.)* New shared `src/components/ui/SendResultMenu.tsx` (glass `gp` dropdown
  modeled on `NodeActions`, roving-focus keyboard nav, disabled on empty text, drops any action
  whose target === source so no self-handoff). Wired into Editor ("Send code to…", over the buffer),
  Token Counter ("Send text to…", over the counted text) and per assistant reply in AI Chat
  ("Send reply to…"). Each menu item runs an existing `CROSS_APP_ACTIONS` executor with
  `{ text, title, source }` → the executor `handoff(...)`s → a real source→target arc lights in the
  Network. **both-ways 3/26 → 6/26.** Tests: `SendResultMenu.test.tsx` (3) — running an action emits
  a `HANDOFF` whose `fromId` is the sink; self-action excluded; disabled when empty. Token-violations
  flat at **501** (hover tints use `color-mix(in srgb, var(--signal) …)`, not raw rgba). Build🟢
  vitest 97→100🟢 eslint clean. *Cloud limit:* the source→target arc is a visual Network change not
  verifiable headless — flagged for QA.
  They receive but the signal dies there — give each a ⚡ "Send to…" affordance that re-injects
  its output, so each becomes both-ways. **Reuse the existing `CROSS_APP_ACTIONS` executors**
  (they already call `handoff(...)` → light a Network arc); do NOT add new collections. **Shape:**
  a tiny shared `<SendResultMenu source="<app>" text={…} title?={…}/>` button (new
  `src/components/ui/SendResultMenu.tsx`) that lists a couple of relevant `CROSS_APP_ACTIONS`
  (e.g. Notes / Prompt Gen) and runs the chosen one with `{ text, title, source }`. Wire it:
  - **`src/apps/editor/Editor.tsx`** — "Send code to…" over the current buffer (`source:'editor'`).
  - **`src/apps/token-counter/TokenCounter.tsx`** — "Send text to…" over the counted text (`source:'token-counter'`).
  - **`src/apps/ai-chat/AIChat.tsx`** — per assistant reply, "Send reply to…" (`source:'ai-chat'`).
  - **Test:** `src/components/ui/SendResultMenu.test.tsx` (or extend `appActions.test.ts`) — assert
    running the menu's action emits a `HANDOFF` whose `fromId` is the sink app's id.
  - *Acceptance:* from Editor, "Send to Notes" creates a note AND lights an `editor → notes` arc in
    The Network; same for `token-counter → notes` and `ai-chat → notes`. **both-ways 3/26 → 6/26.**
    Build🟢 vitest🟢 eslint clean; token-violations not regressed.

- [x] **S6c · Natural inbound for the last three entity apps (Calendar, Goals, Messages) + retarget
  the metric honestly.** ✅ Shipped 2026-06-23. `SEND_TO_CALENDAR` (text → draft event, opens New
  Event form prefilled on today), `SEND_TO_GOALS` (text → New Goal form prefilled),
  `SEND_TO_MESSAGES` (text → composed draft) added to `appActions.ts`; each app wired with
  `useInboundHandoff` + a `[inbound.payload]` create-form preload + `<ProvenanceChip>`. All three
  added to `SendResultMenu` `ACTION_TARGET` + `DEFAULT_ACTIONS` so the loop is UI-reachable.
  `appActions.test.ts` HANDOFF cases extended (+3, now 11 in file; vitest 100→103). **both-ways 6/9
  → 9/9 entity-apps-with-inbound — EPIC-1 entity loop CLOSED.** build🟢 vitest🟢 (103) eslint clean;
  token-violations 501 (±0). **QA: confirm live, then retarget the METRICS both-ways row to 9/9 and
  promote EPIC-2.** Original spec below:
  Each owns entities and already emits but has no inbound `CROSS_APP_ACTION`;
  give each a *natural* text→entity receive so the organism's loop closes for every entity app that
  honestly takes input. **Shape (mirror the S1 receiver rail — ~3 lines/app):**
  - **`src/lib/appActions.ts`** — add `SEND_TO_CALENDAR` (text → draft event), `SEND_TO_GOALS`
    (text → new goal), `SEND_TO_MESSAGES` (text → composed draft): each `sessionStorage.setItem`
    an `empire-<x>-clipboard` payload `{ text, title?, from: data.source }`, call
    `handoff(data.source, '<app>', '<verb>')`, then `window.open('/app/<x>', '_self')`.
  - **`src/apps/calendar/Calendar.tsx` / `goals/Goals.tsx` / `messages/Messages.tsx`** — each:
    `const inbound = useInboundHandoff<{text;title?}>('empire-<x>-clipboard')`, a
    `[inbound.payload]` effect that opens the app's *create* form prefilled from the payload, and
    `{inbound.source && <ProvenanceChip from={inbound.source} onDismiss={inbound.dismiss}/>}`.
  - **Test:** extend `appActions.test.ts` — each new action emits exactly one arc-bearing `HANDOFF`
    with the correct `toId`.
  - **Metric retarget (flag for QA, do not edit METRICS yourself):** EPIC-1's honest success state
    is **"every entity-owning app with a natural inbound is both-ways"** = notes, learning, prompt-gen,
    editor, token-counter, ai-chat, calendar, goals, messages (**9**); files/photos/datacenter stay
    emit-only *by design* (manage/browse stores); tool apps stay emit-only sources. QA should rewrite
    the "Apps fully wired both-ways" METRICS row to **9 / 9 entity-apps-with-inbound** (+ a note that
    files/photos/datacenter + tool apps are intentionally emit-only) rather than a dishonest 26/26.
  - *Acceptance:* ⚡ Send-to-Calendar / -Goals / -Messages from any text opens that app with a
    "From <source>" chip and a prefilled create form; each lights a Network arc. **both-ways 6/26 →
    9/26 (= the honest target).** Build🟢 vitest🟢 eslint clean; token-violations not regressed.

_When S6a–c ship and QA confirms the both-ways count climbed to the honest target (9 entity-apps-
with-inbound, files/photos/datacenter + tool apps emit-only by design) → move EPIC-1 to DONE and
promote EPIC-2 (design-token violations → 0)._

---

## ✅ DONE — EPIC-2 · Design-system conformance → zero token violations

> **DONE 2026-06-28.** Promoted 2026-06-23 when EPIC-1 hit its honest target (both-ways 9/9). **S1–S8
> SHIPPED**; target metric *Design-token violations* **501 → 0** (`node scripts/metrics.mjs` 2026-06-28).
> One palette, consumed via the `cssVar`/`tint`/`CATEGORICAL` rails in `src/design-system/tokens.ts` (DOM)
> and `rgbCss` in `nodeColors.ts` (canvas); genuine brand/content identity data (registry, ai-agent
> providers, ColorPalette tool) exempted in `metrics.mjs` `DS_INFRA` with rationale. Stage history retained
> below. **EPIC-3 · Depth pass on shallow instruments promoted to ▶ ACTIVE.**

### EPIC-2 · Design-system conformance → zero token violations
**Leap:** one palette, rendered identically in DOM and canvas; no app hardcodes color.
**Target metric:** *Design-token violations* **501 → 0** (was 496 at epic draft; 501 at S1 start).
Stage seeds: extract `src/design-system/tokens.ts` (plain TS consts) as the single
source; then sweep app code per the `metrics.mjs` "top offenders" list replacing raw
hex/rgb with `cssVar`/`tint` — one cluster of apps per stage, build green each time.

Stages (Builder takes the topmost `[ ]`; reuse the `cssVar`/`tint` rails from `tokens.ts`):

- [x] **S1 · Palette seam + Hermes cluster.** — **Shipped 2026-06-23.** Built
  `src/design-system/tokens.ts` (`PALETTE` + `cssVar(name)` + `tint(name,pct)` color-mix helper;
  `tokens.test.ts` 4 cases) and swept `hermes-command-center/HermesCommandCenter.tsx` (64→0) +
  `components/HermesAgentBar.tsx` (49→0). Found & recorded the **alpha-append trap** (`` `${color}18` ``
  breaks on a `var()` — convert to `color-mix`). Build🟢 vitest 107/107🟢 (15 files) eslint clean;
  **token-violations 501 → 388 (−113)**, tests +4, bundle gz +0.1. *Visual recolor (Tailwind→XENO) is
  intentional but not cloud-verifiable.*
- [x] **S2 · Next cluster.** — **Shipped 2026-06-27.** Swept `ai-agent/components/SettingsPanel.tsx` (38→0),
  `apps/calculator/Calculator.tsx` (38→0), `artifacts/artifacts/MarkdownStudio.tsx` (29→0) with the
  `cssVar`/`tint` rails. amber/orange→`ember`, slate→`abyss`/`xenon`/`ion`, greens→`c-success`, reds→`c-danger`,
  cyan→`signal`, text greys→`text`/`text2`/`text3`. Gradients/darken-lighten via `color-mix(… var(--ember) N%,
  var(--void)/var(--text))` (works in inline styles AND the `<style>{`…`}</style>` template literal). All three
  files report **0 hex/rgba** in `metrics.mjs`; build🟢 vitest 107🟢 eslint clean; **token-violations 388 → 283
  (−105)**, no regression elsewhere.
- [x] **S3 · Shared UI primitives cluster.** — **Shipped 2026-06-27.** Swept the shared primitives
  `components/ui/index.tsx` (26→0: Button primary/danger, Input/TextArea focus borders, the whole `badgeColors`
  map, Badge custom-`color` prop, Divider) and `ai-agent/components/ModelPicker.tsx` (24→0: overlay/panel chrome,
  Cakra-Auto toggle, provider tabs, model list, API-key status) with the `cssVar`/`tint` rails, plus the 3 safe
  **DOM** hex fallbacks in `apps/network/Network.tsx` (`var(--signal, #34f5d6)` → `var(--signal)`, 24→21).
  Mappings: cyan→`signal`, NVIDIA-green `#76b900`→`aurora`, white→`xenon`, slate panel `#111827`→`abyss`/border
  `#1e2d4a`→`tint('xenon',10)`, emerald→`c-success`, amber→`c-warn`, red→`c-danger`, text greys→`text`/`text2`/
  `text3`. **Alpha-append trap fixed** in two spots (Badge `${color}18` and ModelPicker `${p.color}22`/`+'44'`)
  by switching to `color-mix(in srgb, ${var} N%, transparent)` so a CSS-var-valued `color` no longer renders
  nothing. build🟢 vitest 107🟢 eslint clean; **token-violations 321 → 268 (−53)**. (Note: pre-S3 baseline was
  321, not 283 — the two post-S2 Cakra commits regressed it +38; net since S2-claim is 283→268.)
- [x] **S4 · registry accents + Network canvas.** — **Shipped 2026-06-27.**
  (a) **Decided path (1): exempt `lib/registry.ts`** in `scripts/metrics.mjs` (added to `DS_INFRA`). It is the per-app
  accent *identity manifest* — the single source consumed across the shell as `${app.color}` / `rgbOf(app.color)`
  (37 consumers, many using the `${app.color}NN` alpha-append idiom in Desktop/Dashboard/Window/Hermes), so a CSS-var
  migration would be a large multi-file change with the alpha-append trap; exempting palette-data is principled and
  matches how `design-system/**` is already exempt. (−27)
  (b) **Network canvas de-hexed:** routed every `rgba(${triplet},a)` and the `#34f5d6` core-label fill through
  `rgbCss(triplet, alpha)`; added named accent triplet consts to `nodeColors.ts` (`SIGNAL` 52,245,214 / `ION`
  77,155,255 / `PLASMA` 176,107,255 / `VOID` 3,6,14). `Network.tsx` now reports **0** hex/rgba. New `nodeColors.test.ts`
  (5 cases) pins `rgbCss`/`typeRgb`/the accent-triplet shape. (−21)
  build🟢 vitest 112🟢 (+5, +1 file) eslint clean; **token-violations 268 → 221 (−47)**, bundle gz 248.3 (±0).
- [x] **S5 · ai-agent cluster → zero.** — **Shipped 2026-06-27.** De-hexed the entire ai-agent app's render
  code with the `cssVar`/`tint` rails: `Agent.tsx` (17→0), `components/ChatPanel.tsx` (19→0),
  `components/ConfirmModal.tsx` (16→0), `components/WorkspacePanel.tsx` (16→0), `components/ThinkingTrace.tsx`
  (6→0), and the semantic activity accents in `lib/activityStore.ts` (8→0: thinking→`signal`, write/shell→`ember`,
  search/fetch→`plasma`, code→`c-success`). Mappings: cyan `#22d3ee`→`signal`, indigo `#6366f1`→`ion`, NVIDIA-green
  `#76b900`→`aurora`, amber `#f59e0b`→`ember`, green `#34d399`→`c-success`, red `#ef4444`→`c-danger`, text greys
  →`text`/`text2`/`text3`, white-glass→`tint('xenon',N)`, black-scrim `rgba(0,0,0,.7)`→`tint('void',70)`, slate
  panel `#111827`→`abyss`. **Alpha-append-in-HTML-string** handled: ChatPanel's `<code style>` injected via a
  template literal so `${tint('ion',15)}` interpolates. **`ai-agent/lib/providers.ts` exempted** in `metrics.mjs`
  `DS_INFRA` — it's the per-PROVIDER brand-accent identity manifest (consumed as `p.color` in ModelPicker to keep
  OpenRouter/Google/NVIDIA/etc. distinct; mapping brand colors onto our tokens would collapse two blue providers
  onto `ion`), the registry precedent. **token-violations 221 → 134 (−87).** build🟢 vitest 112🟢 eslint clean.
> **Remaining 134 violations — full enumeration (`node scripts/metrics.mjs`, 2026-06-27), partitioned into S6/S7/S8:**
> **Artifacts app (75):** ColorPalette 23 (→exempt), ChartBuilder 15, Kanban 13, FormBuilder 9, ArtifactGallery 8,
> ArtifactsApp 7. **Shared-UI + shell (45):** Toast 16, ErrorBoundary 7, Utility 6, Desktop 6, Dashboard 4, AppShell 3,
> NodeActions 3. **Long-tail entity apps (14):** Notes 6, Goals 3, AIChat 2, Weather 1, Calendar 1, nodeColors.ts 1.
> Sum = 134. After S6/S7/S8 land, the metric hits **0** and EPIC-2 is DONE.

- [x] **S6 · The artifacts app → zero, via ONE shared `CATEGORICAL` accent sequence.** **Shipped 2026-06-28.**
  Added `export const CATEGORICAL: string[]` to `tokens.ts` (8 distinct-hex XENO accents: ion/signal/ember/plasma/
  aurora/c-warn/c-danger/xenon — chose distinct *hexes* over the spec's c-success/c-info which collapse onto
  aurora/signal). Swept all 5 render files to 0: `ChartBuilder` (`COLORS = CATEGORICAL`; SVG grid→`tint('xenon',6)`,
  cyan line/stops→`cssVar('signal')`, pie scrim→`tint('void',40)`), `Kanban` (columns→`cssVar` ion/signal/c-success,
  `TAG_COLORS = CATEGORICAL`, seed tagColors→`CATEGORICAL[n]`, tag-pill alpha-append `+'33'`→`color-mix(… 20%)`),
  `FormBuilder` (field colors→`CATEGORICAL[i]`), `ArtifactGallery` + `ArtifactsApp` (per-artifact accents→matching
  `cssVar` tokens; all `${accent}NN` alpha-appends→`color-mix`; preview ASCII hex→`▦ 7 harmonies`). **Exempted
  `ColorPalette.tsx` in `metrics.mjs` `DS_INFRA`** (colour-theory tool; hexes are content). `tokens.test.ts` +3
  (CATEGORICAL len/var-shape/uniqueness/real-token). **token-violations 134 → 59 (−75).** build🟢 vitest 115🟢
  eslint clean. *(original spec text retained below for reference.)*
  <br/>**— original spec —** The artifacts app was
  the dominant remaining mass (75 of 134) and most of it was **categorical hue arrays** — `ChartBuilder.COLORS`,
  `Kanban` column accents + `TAG_COLORS` + per-task `tagColor` seeds, `FormBuilder` field-type colors,
  `ArtifactGallery` per-artifact accents — i.e. "give me N visually-distinct series colours." Don't dodge these
  and don't flatten them onto one token: serve the epic's actual thesis by giving the whole app **one categorical
  sequence drawn from the XENO palette** (8 distinct accents is plenty for any chart/tag/field set). This is a real
  single-source-of-truth coherence win, not metric-chasing. **Files & shape:**
  - **`src/design-system/tokens.ts`** — add `export const CATEGORICAL: string[] = [cssVar('ion'), cssVar('signal'),
    cssVar('ember'), cssVar('plasma'), cssVar('c-success'), cssVar('aurora'), cssVar('c-danger'), cssVar('c-info')]`
    (8 distinct XENO accents; the canonical "N-distinct-series" rail). Consumers index it `CATEGORICAL[i % CATEGORICAL.length]`.
    Extend `tokens.test.ts`: assert `CATEGORICAL.length === 8`, every entry is a `var(--…)` string, and entries are unique.
  - **`src/apps/artifacts/artifacts/ChartBuilder.tsx`** (15→0) — `const COLORS = [...8 hexes]` → `import { CATEGORICAL }`
    and use it (or `COLORS = CATEGORICAL`). SVG chrome is migratable (SVG `stroke`/`stopColor`/`fill` accept `var(--…)`):
    grid `stroke="rgba(255,255,255,0.06)"` → `stroke={tint('xenon',6)}`; the cyan line/area `#22d3ee` (stroke + both
    `<stop stopColor>`) → `cssVar('signal')`. Keep `stopOpacity` numbers as-is.
  - **`src/apps/artifacts/artifacts/Kanban.tsx`** (13→0) — column `accent` (3) and `TAG_COLORS` (6) → indices into
    `CATEGORICAL`; per-task seed `tagColor: '#…'` → `CATEGORICAL[n]`. Any chrome hex/rgba → `cssVar`/`tint`.
  - **`src/apps/artifacts/artifacts/FormBuilder.tsx`** (9→0) — the field-type `color: '#…'` palette → `CATEGORICAL`
    by index (one accent per field type).
  - **`src/apps/artifacts/ArtifactGallery.tsx`** (8→0) — per-artifact `accent: '#…'` → `CATEGORICAL` by index.
  - **`src/apps/artifacts/ArtifactsApp.tsx`** (7→0) — chrome hex/rgba (panel/border/glass) → `cssVar`/`tint` per the
    established mappings (slate panel→`abyss`, white-glass→`tint('xenon',N)`, void-scrim→`tint('void',N)`).
  - **`src/apps/artifacts/artifacts/ColorPalette.tsx`** (23) — **EXEMPT** (don't migrate): it's a colour-theory TOOL
    where the hexes ARE its content/output — seed palettes (`#6366F1`…), the CSS-export string, `fgFor` returning true
    `#0F172A`/`#FFFFFF` for the **WCAG contrast lab**, the placeholder, and the user's own swatch backgrounds.
    Recolouring to XENO tokens would break the contrast lab and lose the seed data (registry/providers precedent).
    Add `'src/apps/artifacts/artifacts/ColorPalette.tsx'` to the `DS_INFRA` set in `scripts/metrics.mjs` with a
    one-line rationale comment.
  - *Acceptance:* `node scripts/metrics.mjs` reports **0** for every non-exempt file under `src/apps/artifacts/**`
    (ColorPalette exempted); charts/kanban/forms/gallery render in XENO accents; **token-violations 134 → ~59**
    (−75: −23 exempt, −52 swept). Build🟢 `vitest`🟢 (incl. the extended `tokens.test.ts`) eslint clean on touched files.

- [x] **S7 · Shared UI primitives + shell chrome → zero.** *(DONE 2026-06-28 — token-violations 59 → 14, −45.)* The reusable surfaces every app inherits — migrate them
  with the `cssVar`/`tint` rails (all render code, no identity data; ~45 violations). **Files & shape:**
  - **`src/components/ui/Toast.tsx`** (16) — the per-type config map: success-green→`c-success`, error-red→`c-danger`,
    info-cyan `#22d3ee`→`signal`, warning-amber `#f59e0b`→`c-warn` (stripe = solid `cssVar`, fg = lighter via
    `color-mix(… var(--accent) 70%, var(--text))`, bg = `tint(accent,12)`); panel `rgba(13,18,36,0.85)`→`tint('void',85)`
    or `abyss`; white borders/inset → `tint('xenon',N)`; shadow `rgba(0,0,0,…)`→`tint('void',N)`; hover `rgba(255,255,255,0.06)`
    →`tint('xenon',6)`. (`fg: 'var(--color-cyan-3)'` on info is already a var — leave it or normalise to `cssVar('signal')`.)
  - **`src/components/ErrorBoundary.tsx`** (7) — fallback-panel chrome (danger accent + glass) → `cssVar('c-danger')`/`tint`.
  - **`src/components/ui/Utility.tsx`** (6) — shared utility chrome → `cssVar`/`tint`.
  - **`src/components/Desktop.tsx`** (6) — shell chrome hex/rgba → `cssVar`/`tint` (keep any `${app.color}` registry-accent
    interpolation as-is; that's identity data, not a violation in this file — only fix literal hex/rgba).
  - **`src/dashboard/Dashboard.tsx`** (4) + **`src/dashboard/AppShell.tsx`** (3) → `cssVar`/`tint`.
  - **`src/components/ui/NodeActions.tsx`** (3) → `cssVar`/`tint` (hover tints stay `color-mix`, never raw `rgba` — see trap).
  - *Acceptance:* all seven files report **0**; the desktop shell, toasts, error fallback and ⚡ menu render identically in
    XENO. **token-violations ~59 → ~14.** Build🟢 vitest🟢 eslint clean.

- [x] **S8 · Long-tail entity apps → ZERO (EPIC-2 CLOSE).** **Shipped 2026-06-28.** Swept the final scattered
  literals with the `cssVar`/`tint` rails (logic untouched — only colours): `Notes.tsx` 6→0 (left-rail
  `#eab308`→`cssVar('c-warn')`, action accents `#a855f7`→`cssVar('plasma')`/`#ef4444`→`cssVar('c-danger')`,
  footer border `rgba(255,255,255,0.04)`→`tint('xenon',4)`, analyze hover `rgba(34,211,238,0.08)`→`tint('signal',8)`,
  **alpha-append trap** `${accent}1F`→`color-mix(… 12%)` + fallback `rgba(255,255,255,0.06)`→`tint('xenon',6)`),
  `Goals.tsx` 3→0 (dropped hex fallbacks `var(--void,#03060e)`→`var(--void)` ×2, `var(--ember,#ff9b6b)`→`var(--ember)`),
  `AIChat.tsx` 2→0 (context banner `rgba(34,211,238,0.05)`→`tint('signal',5)`, modal scrim
  `rgba(0,0,0,0.6)`→`tint('void',60)`), `Calendar.tsx` 1→0 + `Weather.tsx` 1→0 (modal scrims→`tint('void',60)`),
  `nodeColors.ts` 1→0 (the lone literal was in a **comment** — `metrics.mjs` greps prose too; rephrased to drop the
  `rgb`-function spelling, kept the `rgbCss` rail). **token-violations 14 → 0 — EPIC-2 TARGET MET.** build🟢
  vitest 115🟢 eslint clean. *Visual: scrims/accents now resolve through XENO tokens, identical intent; not
  cloud-verifiable visually.* → **EPIC-2 DONE; QA to confirm 0 on green main.**

> **✅ EPIC-2 COMPLETE (2026-06-28):** target metric *Design-token violations* **501 → 0** across S1–S8. One
> palette, consumed via `cssVar`/`tint`/`CATEGORICAL`/`rgbCss` in DOM and canvas; genuine identity/content data
> (registry, providers, ColorPalette) exempted in `metrics.mjs` `DS_INFRA` with rationale. **EPIC-3 promoted to
> ▶ ACTIVE.**

## ✅ DONE — EPIC-3 · Depth pass on shallow instruments

> **DONE 2026-06-29** (QA-confirmed). Promoted 2026-06-28 when EPIC-2 hit 0 token violations. **✅ All stages S1–S4
> SHIPPED.** Function metric *shallow instruments with genuine persistent/offline function* = **8/8 (HIT at S3,
> QA-confirmed 2026-06-29)**; S4 landed the "+ a unit test" discipline for the two logic-heavy redesign instruments
> (DataCenter + Weather). EPIC-4 (PWA) shipped and closed after it; **EPIC-5 · Design-system utility conformance is
> now ▶ ACTIVE** (below). Stage history retained for reference.

**Leap:** the thin apps (Photos, Maps, Video, Music, Clock) get genuine offline-capable
function instead of placeholders — coherence over new surface area.
**Target metric (PRIMARY):** *Shallow instruments with genuine persistent/offline function* → **8/8**
(Weather, Maps, Language, DataCenter, Clock, Music, Video, Photos). **Now 7/8** — the 2026-06-28 redesign
pre-delivered the first four (Weather=Open-Meteo, Maps=Leaflet+Nominatim, Language=Cakra translation,
DataCenter=local-first localStorage); **S1** added Clock; **S2** added Music + Video. **Only Photos remains
(S3).** *Routes rendering clean* stays 25/25 throughout.
**Acceptance discipline (the "+ a unit test"):** every NEW deepening stage ships with a dedicated unit test
of its pure logic (Clock ✅ `clockLogic.test.ts`, Music/Video ✅ `mediaStore.test.ts`, Photos → S3). The four
redesign instruments pre-shipped without tests; **S4 backfills the two that have real pure logic
(DataCenter CRUD + Weather mapping)** — Maps/Language are thin Leaflet/Cakra wrappers whose honest coverage
is QA's render-smoke. EPIC-3 is **DONE** when the function metric hits 8/8 (S3) and S4's tests land.

> **Decomposition note:** EPIC-3 was Builder-seeded (2026-06-28) for the green Clock stage; the Strategist
> refined the target (function-8/8 primary, "+test" as discipline not a separate 8-test metric) and deeply
> re-specified S3 (exact `mediaStore` port from Music) + S4 (named logic modules + test fixtures) on 2026-06-28.

Stages (Builder takes the topmost `[ ]`; confirm current state vs. code first):
- [x] **S1 · Clock → persistent, offline instrument + countdown Timer.** **Shipped 2026-06-28.**
  Clock was session-only: alarms, the 12/24h preference and the world-clock list all reset to hardcoded
  seeds on every reload (a placeholder masquerading as function), and there was no countdown timer (the
  `Timer` icon was imported but only a stopwatch existed). **Done:** extracted pure, storage-agnostic logic
  to `src/apps/clock/clockLogic.ts` (`formatStopwatch`/`formatTimer`/`alarmShouldFire` + tolerant
  `serializeClockState`/`deserializeClockState` that migrate partial/old/corrupt saves field-by-field +
  `CITY_OPTIONS` picker data); Clock now lazy-loads + persists `{alarms, worldClocks, is24Hour}` to
  `empire-clock-state`, world clocks are **editable** (add from a curated offline city list, remove), a real
  **Timer tab** (presets 1/5/10/25m + custom mm:ss, start/pause/reset, progress bar, fires `EVENT_CREATED`
  on completion → Network pulse), and the formerly-dead "Play sound" now rings via a WebAudio `beep()` (no
  asset, fully offline). `clockLogic.test.ts` (17 cases) covers formatting, alarm-fire rule, and
  persistence round-trip/migration/corruption. *Acceptance met:* set an alarm / switch to 24H / add a city →
  reload → all restored; start a 1m timer → it counts down and beeps/pulses at zero. Build🟢 vitest 115→132🟢
  eslint clean; **token-violations 0 (±0)** (kept the existing Tailwind-class idiom, no raw hex), bundle gz
  288.6→290.7 (+2.1, the Timer tab). *Cloud limit:* the reload-restores-state and timer-beep behaviours are
  described for on-device confirmation; the persistence/alarm/timer *logic* is covered by the 17 unit tests.
- [x] **S2 · Music + Video → library actually survives a reload (IndexedDB blob store).** **Shipped 2026-06-28.**
  Both apps persisted their playlist to `localStorage` *including* `URL.createObjectURL` blob URLs (session-scoped
  → dead after reload), so the restored library was a list of unplayable ghosts (a latent data-integrity bug).
  **Done:** new shared `src/lib/mediaStore.ts` — a thin, tolerant IndexedDB wrapper (`putMedia`/`getMedia`/
  `deleteMedia`/`allMediaIds`/`loadMediaUrls`; opens DB `empire-media`/store `blobs`; **graceful no-op when IDB is
  absent** — private mode / jsdom resolve null/false/empty, never throw) storing real file `Blob`s keyed by id +
  the **pure, tested** transforms `toStorableMeta` (strip volatile `src`, drop `ephemeral`) / `rehydrateMedia`
  (attach fresh URLs, **drop ghosts**) / `shouldPersistBlob` (75 MB per-blob cap). `Music.tsx` + `Video.tsx` now
  persist **metadata only** (no `src`) and async-rehydrate on mount (read meta → recover blobs → rebuild library),
  with a `hydratedRef` gate so the initial empty render can't overwrite the saved library before its blobs load.
  Oversized files are persisted-skipped, flagged `ephemeral`, kept session-only with a "session-only" hint chip and
  excluded from localStorage (never become ghosts). Add → `putMedia`; remove/clear → `deleteMedia`.
  `mediaStore.test.ts` (11 cases) pins strip/rehydrate round-trip, the ghost-drop, the size-cap, and empties.
  *Acceptance:* add an audio/video file → reload → still in the playlist AND plays (the persistence/ghost-drop
  *logic* is unit-pinned; the IDB-roundtrip needs a real browser — jsdom has no IDB). Build🟢 vitest 132→143🟢
  eslint clean; **token-violations 0 (±0)**, bundle gz 290.7→291.9 (+1.2, the shared store). One commit, both apps.
- [x] **S3 · Photos → library survives a reload (reuse the S2 `mediaStore` blob rail) + a unit test.**
  **Shipped 2026-06-29.** Ported `Photos.tsx` to the shared `mediaStore` rail 1:1 from Music: `interface Photo
  extends MediaRecord`, field `url`→`src` (8 read sites incl. both grid/list `<img>`, lightbox `<img>`/`<a
  download>`, `addFiles`, `revokeObjectURL`), async-rehydrate on mount (`loadMediaUrls`+`rehydrateMedia` behind a
  `hydratedRef` gate), persist `toStorableMeta(photos)` only, `putMedia(id,file)` on add (oversized >75 MB →
  `ephemeral` + amber "session" chip in BOTH grid & list views), `deleteMedia(id)` on delete. New test
  `src/apps/photos/photosStore.test.ts` (6 cases). **Function metric 7/8 → 8/8 — all shallow instruments now
  offline-capable.** build🟢 vitest 149🟢 (19 files) eslint clean; token-violations 0 (±0), off-system +4 (the two
  amber chips, the mandated idiom), gz +0.3 (shared rail). *Cloud limit:* add→reload→still-renders needs a real
  browser with IDB (jsdom has none) — pure transforms carry the coverage, as in S2; QA should add `photos` to the
  MEDIA-PERSISTS guard's `mediaCases`.
  **This was the SAME latent data-integrity bug S2 just fixed in Music/Video — confirmed in code.**
  `Photos.tsx:51-58` persists each photo's `url` (a `URL.createObjectURL(file)` blob URL) to
  `localStorage('empire-photos')`; blob URLs are **session-scoped → dead after a reload**, so the restored
  gallery is a grid of broken images (a real bug, not a placeholder). Fix it by reusing the **exact rail**
  S2 built — store the real image `Blob` in IndexedDB, persist metadata only, re-mint URLs on mount, drop
  ghosts. Mirror `Music.tsx` 1:1; **this is a near-mechanical port, fully downhill.** Files & shape:
  - **`src/apps/photos/Photos.tsx`** — apply the Music pattern verbatim:
    - `import { putMedia, deleteMedia, loadMediaUrls, toStorableMeta, rehydrateMedia, shouldPersistBlob,
      type MediaRecord, type StoredMeta } from '../../lib/mediaStore'`.
    - Make `interface Photo extends MediaRecord` and **rename the field `url` → `src`** throughout (the
      transforms key on `src`; ~8 read sites: the two `<img src>`, the lightbox `<img>`/`<a download href>`,
      `URL.revokeObjectURL`, `addFiles`). Add `ephemeral?: boolean`.
    - **Mount effect** (replace the current `localStorage.getItem` load, lines 48-54): async-rehydrate —
      read `empire-photos` metadata, `const urls = await loadMediaUrls(meta.map(m=>m.id))`,
      `setPhotos(rehydrateMedia<Photo>(meta, id => urls.get(id) ?? null))`, then set a `hydratedRef`.
      Use the **`hydratedRef` gate** (a `useRef(false)`) exactly like Music so the initial empty render
      can't clobber the saved library before blobs load (the race S2 documents).
    - **Persist effect** (replace lines 56-58): `if (!hydratedRef.current) return;
      localStorage.setItem('empire-photos', JSON.stringify(toStorableMeta(photos)))`.
    - **`addFiles`** (lines 71-101): for each image set `const ephemeral = !shouldPersistBlob(file.size);
      if (!ephemeral) void putMedia(id, file)`; keep the `src = URL.createObjectURL(file)` for this session,
      set `ephemeral` on the record. Surface a "session" hint chip on `ephemeral` photos (mirror Music's
      `amber-*` chip) so an oversized photo isn't a silent ghost.
    - **`deletePhoto`** (lines 107-113): add `void deleteMedia(id)` alongside the existing `revokeObjectURL`.
    - The graph-mirror effect (lines 63-69) is unaffected (it already omits the url).
  - **Test (new file → +1 test-file metric):** `src/apps/photos/photosStore.test.ts` — with a Photo-shaped
    fixture, assert `toStorableMeta` strips `src` + drops `ephemeral` but **keeps `favorite`/`tags`/`width`/
    `height`/`date`**; assert `rehydrateMedia` re-attaches a URL and **drops a photo whose blob is missing**
    (the ghost case). (The shared transforms are already tested generically in `mediaStore.test.ts`; this
    pins the Photo contract so a future field-strip regression fails loudly.)
  - *Acceptance:* add a photo → reload → it still renders (its blob came back from IDB); delete a photo →
    its IDB blob is removed; an oversized (>75 MB) photo shows the "session" chip and is excluded from
    localStorage. **Function metric 7/8 → 8/8 (all shallow instruments offline-capable).** Build🟢 vitest🟢
    (+ the new file) eslint clean; **token-violations stay 0** (keep the Tailwind-class idiom — the hint chip
    uses `amber-*` utility classes like Music, NOT inline hex). *Cloud limit:* the add→reload→still-renders
    path needs a real browser with IDB (jsdom has none) — the pure transforms carry the coverage, as in S2.

- [x] **S4 · Backfill unit tests for the two logic-heavy redesign instruments (DataCenter + Weather) — EPIC-3 CLOSE.**
  **Shipped 2026-06-29.** Extracted `src/apps/datacenter/datacenterLogic.ts` (DCStore types + tolerant
  `deserializeStore`/`serializeStore` + immutable `addRow`/`updateCell`/`deleteRow`/`addTable`/`deleteTable`/
  `normalizeTableName`, all no-React) and `src/apps/weather/weatherLogic.ts` (`Cat`/`WeatherData`/`OpenMeteo*`
  types + `wmo()` code map + pure `mapForecast(data, place)`), rewired both components to delegate (no behaviour
  change). New `datacenterLogic.test.ts` (12 cases — CRUD immutability + no-op-on-missing-table + round-trip +
  4-way tolerant-parse fallback) and `weatherLogic.test.ts` (8 cases — wmo clear/rain/snow/cloud/storm + mapped
  current/daily/5-day-cap/missing-daily). build🟢 vitest 170🟢 eslint clean; test-files 19→21, token-violations
  0 (±0), bundle 292.2→292.3. **EPIC-3 is now CODE-COMPLETE (all of S1–S4 shipped); function metric 8/8 hit at
  S3.** → Strategist/QA: promote **EPIC-4 · PWA completion** (CONTEXT already points the next builder at S1).
  The four redesign instruments (Weather/Maps/Language/DataCenter) shipped working but **without a dedicated
  test**, so the "+ a unit test" discipline is uneven. Maps & Language are thin wrappers (Leaflet / Cakra
  `chat()`) with little pure logic worth unit-pinning — QA's render-smoke is their honest coverage. **DataCenter
  and Weather DO have real pure logic**; extract and test it so the suite's persistence/parsing is regression-
  guarded. Files & shape:
  - **DataCenter** — extract the table CRUD + (de)serialization out of `DataCenter.tsx` into a pure
    `src/apps/datacenter/datacenterLogic.ts` (mirror `clockLogic.ts`): move `loadStore`/serialize plus pure
    helpers `addRow(store, table, row)` / `deleteRow(store, table, id)` / `addTable(store, name, cols)` (return
    a new `DCStore`, no React). Rewire the component to call them. **Test `datacenterLogic.test.ts`:** add a
    table, add/delete rows, and a `load(serialize(store)) === store` round-trip incl. a corrupt/partial-JSON
    fallback (the tolerant-parse contract).
  - **Weather** — extract the **pure WMO-code → `{label,description,cat}` mapping** (`Weather.tsx:43 wmo()`)
    and the **Open-Meteo forecast JSON → `WeatherData`/`DayForecast[]` mapping** into a pure
    `src/apps/weather/weatherLogic.ts`. Rewire the component's fetch handler to call the mapper.
    **Test `weatherLogic.test.ts`:** feed a canned Open-Meteo response object → assert the mapped current
    temp + N-day forecast (`hi`/`lo`/`cat`) and a couple of `wmo()` codes (clear/rain/snow). No network — the
    mapper is pure over a fixture.
  - *Acceptance:* both new logic modules are imported by their components (no behavior change) and covered by
    `datacenterLogic.test.ts` + `weatherLogic.test.ts`; **test-files +2, all green.** Build🟢 vitest🟢 eslint
    clean; token-violations 0. **This closes EPIC-3** (function 8/8 after S3; the two logic-heavy redesign
    instruments now carry tests, Maps/Language render-smoke-covered) → QA confirms 8/8 and promotes **EPIC-4**.

_When S3 ships (function 8/8) and S4 lands (DataCenter+Weather tests) and QA confirms the function metric hit
8/8 → move EPIC-3 to DONE and promote **EPIC-4 · PWA + Android validation** (stages seeded below)._

## ✅ DONE — EPIC-4 · PWA completion → installable, offline-true
> **CODE-COMPLETE 2026-06-29** — all stages S1–S4 shipped on green main. Offline ✅ (`offline-boots` guard:
> 5/5 routes cold-boot from precache, no gap) + base-correct ✅ (`check-pwa-base.mjs` proves a `/empire/`
> sub-path install surface is consistent) + installable ✅ (S4 `auditInstallability` gates every browser
> install criterion against the real build). **Target metric** *Lighthouse PWA ≥ 90* is asserted as the
> deterministic, offline-checkable manifest-installability contract those audits gate (in-cloud Lighthouse
> rejected: heavy dep + flaky headless browser, wrong fit for the unattended routine — noted in S4).
> **→ QA next pass:** confirm S4's `check-pwa-base.mjs` → installable ✅ on green main (the offline-boots primary
> metric is already confirmed; S4 is deterministic + 205 green unit cases, so this is a formality). **Strategist
> promoted the DESIGN-SYSTEM utility sweep (off-system 1076 → 0) as the new ▶ ACTIVE EPIC-5, NOT Android** — see
> the gradient call in EPIC-5 below (Android renumbered to EPIC-6, QUEUED: device-gated, not unattended-executable).
> **Promoted 2026-06-29** when EPIC-3 went code-complete (function 8/8 + S4 tests). Highest gradient after EPIC-3 because the
> vision's end-state is "a complete offline-first PWA, then Android" and every app is now offline-capable
> — the shell itself is the last thing that isn't guaranteed to load with no network.

**Leap:** the installed PWA boots and runs **fully offline** (shell + all 25 app chunks precached), is
installable, and is byte-identical to dev — turning "26 offline apps" into "one offline product."
**Target metric:** *Lighthouse PWA ≥ 90* **and** a new **`offline-boots` smoke guard** = the built app
loads + renders the desktop with the network fully blocked (today's QA only blocks *external* hosts; it
never asserts a cold offline boot of the app's own chunks).
Stages (Strategist to finalize on promotion; first-pass seeds — each one Builder run, build-green):
- [x] **S1 · Offline-boot guard + SW precache audit.** **Shipped 2026-06-29.** Added pure
  `scripts/precacheAudit.mjs` (`extractPrecacheUrls`/`auditPrecache` — parses the inlined Workbox manifest out
  of `dist/sw.js` and cross-checks it against every emitted `dist/assets` chunk) + `scripts/precacheAudit.test.mjs`
  (6 cases; vitest `include` broadened to `scripts/**/*.test.mjs`). New `scripts/qa-offline.mjs` — self-contained
  (own `node:http` static server for `dist/` with SPA fallback + own browser): warm-loads so the SW installs +
  precaches, then `context.setOffline(true)` to block **ALL** network and asserts the shell `/` + 4 lazy routes
  (`clock`/`maps`/`network`/`photos`) still render from precache; writes `docs/screenshots/latest/OFFLINE.md` +
  `/tmp/qa-offline.json`. Wired into `qa-smoke.mjs` (spawned after the smoke pass, folded into REPORT.md, non-fatal).
  **Audit result: NO GAP** — 63 precache entries / 1150.93 KiB cover all 37 JS (incl. all 25 lazy app chunks) + 2 CSS
  + fonts + icons (the existing `globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,json}']` + 5 MB cap already
  catch everything; Maps' 160 KB chunk is under the cap). **Cold-offline boot 5/5 ✅** verified live this run.
  build🟢 vitest 170→176🟢 (+1 file, +6 cases) eslint clean; token-violations 0 (±0), bundle 292.3 (±0).
  *Used `setOffline(true)` rather than the seed's `page.route('**',abort)` — it's the faithful cold-offline
  primitive: it fails real network while Cache Storage still serves, so a non-precached chunk falls through to a
  dead network and the render breaks (exactly what the guard must catch).*
- [x] **S2 · Close the precache gap.** **No-op — done by S1's audit (2026-06-29).** S1 proved the precache has
  **zero gap**: the shell + every app chunk + fonts + the alien SVG icon set + `manifest.webmanifest` are already
  precached (63 entries), and `dist` ships `pwa-192/512`, `maskable-512`, `icon.svg`. The S1 offline-boot guard is
  green for the shell **and** cold-navigated app routes (5/5). There is no gap left to close, so this stage carries
  no code change — the precache config in `vite.config.ts` (Workbox `generateSW`, `globPatterns` + 5 MB cap) is
  already complete. *If a future chunk ever exceeds the 5 MB `maximumFileSizeToCacheInBytes` cap, the S1 audit will
  enumerate it as missing — that's the trip-wire.* → **EPIC-4 next real stage is S3.**
- [x] **S3 · Base-path + install-flow correctness.** **Shipped 2026-06-29.** Added a pure base-path auditor
  `scripts/pwaBaseAudit.mjs` (`auditPwaBase` + `auditHtmlBase`/`auditSwBase`/`auditRegisterSw`/`auditManifest`/
  `extractHtmlAssetUrls`/`normalizeBase`) + `scripts/pwaBaseAudit.test.mjs` (17 cases) and a self-contained runner
  `scripts/check-pwa-base.mjs` that **builds with `EMPIRE_BASE=/empire/` into a throwaway `dist-pwa-base-check`**
  (real `dist/` untouched) and asserts the whole install surface carries the base: every `<script src>`/`<link
  href>` in `index.html` is base-prefixed, the manifest is linked+prefixed, `sw.js` `navigateFallback ===
  base+'index.html'`, `registerSW.js` registers `base+'sw.js'` with `scope: base`, and the manifest is
  base-agnostic (`start_url`/`scope` relative `.`). **Fixed the one real install bug found:** manifest `id` was
  the bare root `'/'` — but `id` resolves against `start_url`'s **origin** (path ignored, per MDN), so on the
  shared `github.io` origin a root id collides with any other PWA and doesn't identify *this* app under `/empire/`.
  Changed to `id: 'empire'` → one stable `<origin>/empire` identity across every deploy base (same-origin-valid,
  never bare-root). **Acceptance MET:** `node scripts/check-pwa-base.mjs` ✅ — 11 assets prefixed, manifest linked,
  navigateFallback `/empire/index.html`, registerSW `/empire/sw.js` scope `/empire/`, start_url/scope `.`, id
  `empire`. build🟢 vitest 176→193🟢 (+1 file, +17 cases) eslint clean; token-violations 0 (±0), bundle 292.5 (±0).
  *Not browser-verifiable in cloud:* the actual install prompt + post-install boot under the Pages base needs a
  real device/Lighthouse; the check proves the asset/SW/manifest surface that the install relies on.
- [x] **S4 · Lighthouse-PWA / installability assertion (close the target metric). — SHIPPED 2026-06-29 (EPIC-4 CLOSE).**
  *Investigated Lighthouse first:* no `lighthouse` dep (npm registry reachable, `lighthouse@13.4.0`), but it would add
  a heavy devDep + a browser-driven, egress/Chrome-flag-flaky check — wrong fit for the unattended fresh-checkout
  cloud routine. **Took the pure-auditor path** (the stage's sanctioned fallback). Added `auditInstallability(manifest)`
  + `maxIconSize(sizes)` to `scripts/pwaBaseAudit.mjs` (name+short_name, a ≥192px AND a ≥512px `any` icon, a `maskable`
  icon, standalone-ish `display` incl. via `display_override`, `start_url`, `background_color`+`theme_color`); returns
  per-criterion `criteria{}` + flat `missing[]`. Folded into `auditPwaBase` (its issues join the base-path issues) and
  surfaced in `check-pwa-base.mjs` (console line + a PWA-BASE.md Installability table). +12 unit cases in
  `pwaBaseAudit.test.mjs` (17→29) — incl. that a maskable-ONLY icon doesn't satisfy the `any` buckets, a multi-purpose
  `any maskable` counts for both, missing `purpose` defaults to `any`, and `display_override` can supply standalone.
  *Acceptance met:* `node scripts/check-pwa-base.mjs` now asserts every installability criterion against the real
  `--base=/empire/` build → **installable ✅ (4 icons)**. build🟢 vitest 205/205🟢 eslint clean; metrics no-regression
  (tokens 0, bundle 292.5, apps 25). **EPIC-4 CLOSED** (offline ✅ + base ✅ + installable ✅).

## ✅ DONE — EPIC-5 · Design-system utility conformance → zero off-system utilities

> **DONE 2026-06-30.** Target metric *Off-system utilities* **1076 → 0** (`node scripts/metrics.mjs`,
> live grep) and *Token violations* held **0**. The S1–S7 sweep was realized **out-of-band by the
> user-directed redesign batch** (commits `75ef685`…`fb4c853`, 2026-06-30 — full-screen app model,
> Prompt-Gen/Token-Counter/Editor merged into **Cakra**, a new **Reader** app, and the bulk
> `98c61c7` "token-ize Tailwind palette classes across all apps" which drove every file's
> `offSystemUtilities` to 0; the per-stage file lists below are superseded by that whole-tree pass).
> **S8 (this run, 2026-06-30) LOCKED the win** so the 0 can't rot: wired
> `scripts/metrics.mjs --assert-zero` into the `verify.yml` CI gate (fails any PR/push that
> re-introduces a raw hex/rgb literal or an off-system palette class) **and** added
> `src/design-system/themeBridge.test.ts` (3 cases) asserting every `@theme inline` `--color-*`
> utility resolves to a `--token` actually declared in `colors_and_type.css` (a drifted bridge var
> now fails fast — also satisfies ROADMAP NOW #2, palette-drift lock). build🟢 vitest 205→208🟢
> eslint clean; tokens 0, off-system 0. **Next epic needs the Strategist** — EPIC-6 (Android) is
> device-gated/QUEUED; the next *cloud-executable* gradient is the DataCenter/Files whole-state
> graph-mirror theme (see the close note below). Stage history retained for reference.

> **Promoted 2026-06-29** (EPIC-4 closed). **Why this was the highest-gradient move** (one line):
> EPIC-2 swept raw `#hex`/`rgba()` *literals* to 0 but never touched the **1076 ergonomic Tailwind palette
> classes** (`text-gray-400`, `bg-cyan-600`, `bg-white/10`, `text-white`, `text-red-400`…) that still bypass the
> JondriDev tokens — so apps are only *partly* on-system **and theme-switching is silently broken** (`text-white`/
> `bg-gray-*` don't follow `[data-theme]`). This is the steepest **executable** metric gradient on the board
> (design-system consistency ranks above PWA/Android in the priority bias), the rail is already built, and unlike
> Android (EPIC-6) it is fully cloud + metric-verifiable. Closing it makes the organism's "one palette, themeable"
> thesis *true*, not aspirational.

**Leap:** every app consumes the design system through the token-backed utility vocabulary, so the whole Empire
re-themes from one place under `[data-theme]` — the visual analogue of EPIC-1's "one organism."
**Target metric:** *Off-system utilities* **1076 → 0** (`node scripts/metrics.mjs`, the `offSystemUtilities`
row). *Routes rendering clean* stays **25/25** and *token violations* stays **0** throughout (no raw hex may
sneak in while sweeping classes). The final stage flips `metrics.mjs --assert-zero` into a hard CI gate so the
0 can't rot (this also delivers ROADMAP NOW #2, "lock the palette against drift").

### The migration rail (already built — read ONCE, reuse every stage)

The `@theme inline` bridge in **`src/index.css:25-47`** already exposes the canonical tokens as Tailwind
utilities (theme-aware, because each resolves to `var(--token)` and follows `[data-theme]`). **`Clock.tsx` is
the worked reference — already at 0 off-system** (migrated in `9051409`); diff it for the exact idiom. The
canonical map (Builder: apply verbatim — do NOT invent new tokens unless a target is genuinely missing, in which
case add ONE `--color-*` to the `@theme` block + note it):

| Off-system class (and kin) | → token utility |
|---|---|
| `text-white`, `text-gray-100/200/300` (bright labels) | `text-fg` |
| `text-gray-400/500`, `text-slate-400`, `text-zinc-400` | `text-muted` |
| `text-gray-600`, `text-slate-500` (faintest), `text-white/40` | `text-faint` |
| `bg-white/5`, `bg-white/10` (glass surfaces) | `bg-glass` (keep the `/N` opacity if present) |
| `bg-gray-800/900`, `bg-slate-900`, `bg-black`, `bg-black/40` | `bg-void` (keep `/N`) |
| `border-white/10`, `border-gray-700/800`, `border-slate-800` | `border-hair` |
| `*-cyan-*`, `*-teal-*` (the brand accent) | `*-signal` (`text-`/`bg-`/`border-` all generate) |
| `*-blue-*`, `*-indigo-*` | `*-ion` |
| `*-purple-*`, `*-violet-*`, `*-fuchsia-*` | `*-plasma` |
| `*-amber-*`, `*-orange-*` | `*-ember` (or `*-warn` for warning-state semantics) |
| `*-emerald-*`, `*-green-*`, `*-lime-*` | `*-success` |
| `*-red-*`, `*-rose-*`, `*-pink-*` | `*-danger` |
| `*-sky-*` | `*-info` |
| `*-yellow-*` | `*-warn` |
| arbitrary `bg-[#…]` / `text-[rgb(…)]` | the matching token utility (NOT a new arbitrary value) |

**Acceptance discipline (every stage):** the named files report **0** in `node scripts/metrics.mjs`
(`offSystemUtilities` per-file → 0); `tokenViolations` stays **0** (you replaced classes with classes — never
drop in a raw hex/rgba); build🟢 `vitest`🟢 eslint clean; the migrated apps still render in QA (25/25). Decide
each accent by *role* (an accent button → `signal`; a destructive action → `danger`; a state pill → `success`/
`warn`/`danger`/`info`) — don't mechanically collapse every blue to `ion` if it's really an accent. **Stages are
ordered by descending mass so the heaviest leverage lands first; each is one Builder run, no re-planning.**

Stages (Builder takes the topmost `[ ]`; counts are current `metrics.mjs` per-file values):

- [x] **S1 · Confirm the bridge + sweep the two heaviest entity apps (Calendar 81 + Photos 76 → 0).**
  First, **verify the `@theme` bridge in `src/index.css` covers every target in the map above** (it does today —
  fg/muted/faint/hair/glass/void + signal/aurora/ion/ember/plasma/xenon + success/warn/danger/info; if a clean
  migration needs a token that's missing, add exactly one `--color-*: var(--…)` line there and note it). Then
  migrate **`src/apps/calendar/Calendar.tsx`** (81→0) and **`src/apps/photos/Photos.tsx`** (76→0) class-by-class
  per the map — Photos keeps its `ephemeral` "session" chip but swaps the `amber-*` utilities for `bg-warn`/
  `text-warn` (the chip was the off-system idiom the mandate flagged). *Acceptance:* `metrics.mjs` reports 0 for
  both files (off-system **1076 → ~919**); tokenViolations 0; build🟢 vitest🟢 eslint clean; both render in QA.
  *(~157.)*
- [x] **S2 · Artifacts cluster A (FormBuilder 71 + Flashcards 53 + ArtifactGallery 34 + ArtifactsApp 10 → 0).**
  `src/apps/artifacts/artifacts/FormBuilder.tsx`, `…/Flashcards.tsx`, `src/apps/artifacts/ArtifactGallery.tsx`,
  `src/apps/artifacts/ArtifactsApp.tsx`. These are categorical-heavy — where a class is a *series/field* colour,
  prefer the existing `CATEGORICAL` rail (`tokens.ts`) via inline style if a utility doesn't fit; otherwise map
  per the table. *Acceptance:* 0 for all four (off-system **~919 → ~751**); tokenViolations 0; build🟢 vitest🟢. *(~168.)*
- [x] **S3 · Artifacts cluster B — CLOSES artifacts (ChartBuilder 46 + MarkdownStudio 39 + Kanban 38 → 0).**
  `src/apps/artifacts/artifacts/ChartBuilder.tsx`, `…/MarkdownStudio.tsx`, `…/Kanban.tsx`. After this the whole
  `src/apps/artifacts/**` (291 at epic start) is 0 off-system (ColorPalette stays exempt — content). *Acceptance:*
  0 for all three (off-system **~751 → ~628**); tokenViolations 0; build🟢 vitest🟢. *(~123.)*
- [x] **S4 · Text-tool apps (TokenCounter 54 + PromptGenerator 52 + Grammar 51 → 0).**
  `src/apps/token-counter/TokenCounter.tsx`, `src/apps/prompt-generator/PromptGenerator.tsx`,
  `src/apps/grammar/Grammar.tsx`. Watch the provenance chips here (TokenCounter/PromptGenerator are S1 receivers) —
  the `<ProvenanceChip>` already uses tokens; only the surrounding app chrome needs the sweep. *Acceptance:* 0 for
  all three (off-system **~628 → ~471**); tokenViolations 0; build🟢 vitest🟢. *(~157.)*
- [x] **S5 · Files + media + editor (Files 49 + Music 44 + Video 35 + Editor 35 → 0).**
  `src/apps/files/Files.tsx`, `src/apps/music/Music.tsx`, `src/apps/video/Video.tsx`, `src/apps/editor/Editor.tsx`.
  Music/Video also carry the `ephemeral` "session" `amber-*` chip → `bg-warn`/`text-warn` (same swap as Photos S1).
  *Acceptance:* 0 for all four (off-system **~471 → ~308**); tokenViolations 0; build🟢 vitest🟢. *(~163.)*
- [x] **S6 · Cakra + Browser + Learning (Cakra 58 + Browser 40 + LearningTracker 35 → 0).**
  Cakra files: `src/apps/cakra/AIChat.tsx` (48), `…/AgentSurface.tsx` (7), `…/components/WorkspacePanel.tsx` (2),
  `…/components/ModelPicker.tsx` (1) — **`cakra/lib/providers.ts` stays exempt** (brand-identity data, already in
  `DS_INFRA`); plus `src/apps/browser/Browser.tsx` (40) and `src/apps/learning-tracker/LearningTracker.tsx` (35,
  an S6a provenance receiver). *Acceptance:* 0 for all six (off-system **~308 → ~175**); tokenViolations 0;
  build🟢 vitest🟢. *(~133.)*
- [x] **S7 · Long-tail → ZERO (Language 38 + Weather 38 + Messages 33 + Cache 22 + Maps 19 + DataCenter 16 +
  Dashboard 8 + Desktop 1 → 0).** `src/apps/language/Language.tsx`, `src/apps/weather/Weather.tsx`,
  `src/apps/messages/Messages.tsx`, `src/apps/cache/CacheCleaner.tsx`, `src/apps/maps/Maps.tsx`,
  `src/apps/datacenter/DataCenter.tsx`, `src/dashboard/Dashboard.tsx`, `src/components/Desktop.tsx` (keep the
  `${app.color}` registry-accent interpolation in Desktop — that's identity data, only the literal palette
  classes get swept). *Acceptance:* `node scripts/metrics.mjs` reports **off-system 0** across all of `src/`;
  tokenViolations 0; build🟢 vitest🟢 — every app on-system. *(~175.)*
- [x] **S8 · LOCK the win (EPIC-5 CLOSE). — ✅ SHIPPED this run (2026-06-30).** off-system was already 0 (the
  bulk redesign batch swept S1–S7's mass), so this run made the 0 un-rottable:
  - **CI gate wired:** added a `design-system conformance` step to `.github/workflows/verify.yml` running
    `node scripts/metrics.mjs --assert-zero` (the gate at `scripts/metrics.mjs:235-247` exits 1 if
    `tokenViolations>0 || offSystemUtilities>0`), beside the existing shell-styled + route-parity guards — so every
    PR/push to main that re-introduces a raw hex/rgb or an off-system palette class now fails red. Header comment
    updated to document it.
  - **Drift test added:** `src/design-system/themeBridge.test.ts` (3 cases) parses the `@theme inline` block in
    `src/index.css` and asserts every `--color-*` utility resolves to a `--token` actually declared in
    `colors_and_type.css` (+ a parse-floor guard so a broken regex can't pass vacuously, + a core-token-declared
    floor). A bridge edit that points a utility at a dead var now fails fast — satisfies ROADMAP NOW #2
    (palette-drift lock). vitest 205→208 (test-files 21→22 src, cases +3); build🟢 eslint clean; tokens 0,
    off-system 0.
  - *Acceptance MET:* `node scripts/metrics.mjs --assert-zero` →
    `✓ design-system conformance: tokenViolations=0, offSystemUtilities=0`; a drifted bridge var or a new
    off-system class now fails CI red. **EPIC-5 CLOSED — off-system 1076 → 0.**

_**EPIC-5 DONE 2026-06-30** (off-system 1076 → 0, locked by the S8 CI gate + drift test). **QA to confirm**
`node scripts/metrics.mjs --assert-zero` → green on main and the redesigned tree (full-screen app model, Cakra
merge, Reader) still renders 26/26. **Strategist: promote the next ▶ ACTIVE epic** — EPIC-6 Android stays
QUEUED (device-gated, not cloud-verifiable). **Builder progress (2026-06-30, no active epic):** the **Files
whole-state graph-mirror** half of that theme is **DONE** — `Files.tsx` now accumulates the session union of files
across every directory visited and mirrors the whole union (was: navigating pruned prior folders from the graph);
new pure `src/apps/files/filesGraph.ts` + `filesGraph.test.ts` (8). The **DataCenter** half was **stale** —
`DataCenter.tsx:57` already mirrors all tables with per-table row counts. **Remaining cloud-executable gradient:
organism-completeness-II** — re-audit both-ways wiring against the post-redesign 26-route registry (the Cakra merge
folded Prompt-Gen/Token-Counter/Editor into tabs; Reader is new; `SendResultMenu`/`useInboundHandoff` targets may
reference routes that changed)._

---

## ⏳ QUEUED — EPIC-7 · Android APK validation
> **Renumbered EPIC-5→6→7** (2026-07-01) — design-system utility conformance took the old EPIC-5 slot, then
> **EPIC-6 · Organism Memory** took the active slot as the higher *realizable* gradient (durable, cloud-verifiable
> interconnection > device-gated packaging). **Device-gated:** an unattended cloud builder on a fresh checkout cannot install
> an APK or run on-device smoke, so this epic's target metric isn't cloud-verifiable — **promote only when an
> on-device QA path exists.** **Leap:** the APK degrades gracefully with no LAN server (backend-optional layer).
> **Target metric:** APK installs + all offline-capable apps function on-device with `server.js` absent.
> Stage seeds: run the `Android APK` workflow; verify the backend-optional fallbacks (Files' `/api/files`
> 500 → on-device storage path, etc.); on-device smoke of the 8 offline instruments.

---

## DONE

- **EPIC-0 · Organism foundation** — A-bus / B-graph / C-intents, `mirrorCollection`,
  `NodeActions`, `HANDOFF` event, Network wired to the live bus + app→app arcs, core
  unit tests. (Shipped #3/#5/#7/#8/#13/#20, 2026-06-20 → 06-21.) EPIC-1 completes it.
