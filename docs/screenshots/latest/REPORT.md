# Visual + Smoke QA — 2026-07-12 (EPIC-14 S9 acceptance confirm)

**Tree:** green `main` @ `aaea9ac` (build 🟢). First independent QA since **EPIC-14 S9** shipped
(`ba96850` — Cakra family part 1, tabs + chat surface, migrated onto the `ui` shell). Commits since the
last QA (`0a6d8db`, the S8 confirm): `ba96850` (S9) → `e7a9d07` (world-solver briefs) → `7faf9cd`
(daily digest) → `aaea9ac` (browser keyboard-a11y polish). Only `ba96850` touches product render /
`offShellControls`; the other three are docs/solver-feed/a11y-only.

## ⛑ Runtime bug: NONE this run.
No uncaught exceptions, no error boundaries, no blank routes, no console errors on any of the 32 routes.

---

## Result: 32 / 32 routes render clean · all 13 guards green · ratchet holds

| Check | Result |
|---|---|
| Build (`tsc -b && vite build`) | 🟢 green — 91 precache entries (3126.69 KiB) |
| Routes render clean | **32 / 32** (desktop + all 31 registry apps), 0 uncaught / 0 boundaries / 0 console errors |
| INBOUND-LANDS | **4 / 4 ✅** (calendar←editor, goals←notes, **messages←ai-chat**, mail←notes) |
| MEDIA-PERSISTS | **3 / 3 ✅** (music / video / photos — added + survived-reload) |
| GRAPH-LEGIBLE | **3 / 3 ✅** (reader/book, crypto/wallet, mail/draft) |
| GLOBAL-SEARCH | **1 / 1 ✅** (book + task + twoApps + tagOnly) |
| NODE-LINEAGE | **1 / 1 ✅** (rendered + title + persisted + search + clickable) |
| INTENT-ROUNDTRIP | **2 / 2 ✅** (make-note-from, add-to-learning — stored + mirrored + persisted) |
| TIMELINE | **1 / 1 ✅** (ordered + grouped + flow + persisted + filtered + descendants — 6 axes) |
| HOME-ALIVE | **1 / 1 ✅** (today + tasks + recent + land + ask) |
| PROVENANCE-PERSISTS | **3 / 3 ✅** (editor→notes, **editor→ai-chat**, **editor→prompt-generator**) |
| PROVENANCE-ENTITY | **3 / 3 ✅** (calculator→goals, editor→messages, notes→calendar) |
| PRECACHE-AUDIT | **91 entries, no gap** — every emitted JS/CSS chunk in the SW precache |
| OFFLINE-BOOT | **5 / 5 ✅** (/, /app/clock, /app/maps, /app/network, /app/photos cold-offline) |
| `metrics.mjs --assert-zero` | **exit 0** — tokenViolations=0, offSystemUtilities=0, offSystemStyle=0 |

The three S9-relevant guards all exercise the migrated Cakra apps LIVE:
**INBOUND messages←ai-chat ✅**, **PROVENANCE editor→ai-chat ✅ + editor→prompt-generator ✅** — the
chat + handoff wiring survived the shell migration intact.

Per-route smoke (uncaught / net): editor 0/0 · notes 0/0 · photos 0/0 · datacenter 0/0 · maps 0/8
(CARTO tiles env-blocked) · messages 0/0 · prompt-generator 0/0 · token-counter 0/0 · learning-tracker
0/0 · ai-chat 0/0 · goals 0/0 · artifacts 0/0 · network 0/0 · inbox 0/0 · reader 0/0 · search 0/0 ·
timeline 0/0 · solver 0/0 · mail 0/1 (himalaya 401 env) · crypto 0/0. **All net noise is
environment-expected (blocked CDN tiles / authed provider 401), never a product error.**

---

## Fitness metric — EPIC-14 S9 acceptance CONFIRMED

`node scripts/metrics.mjs` on the fresh checkout reproduces the S9 target **EXACTLY**:

**`offShellControls = 83 (b72/i10/s0/t1)`, Δ ±0** vs the S9 committed snapshot
→ **EPIC-14 S9 acceptance (Cakra tabs + chat surface, `122 → 83`, −39) CONFIRMED.**

All seven S9 files are off the offenders list (AIChat 13→0, Editor 9→0, PromptGenerator 9→0,
TokenCounter 3→0, WorkspacePanel 3→0, CakraShell 1→0, ArtifactCard 1→0). Top offenders now the
remaining Cakra family — **the exact S10 targets** — heaviest-first:

```
8  src/apps/cakra/AgentSurface.tsx
8  src/apps/cakra/solver/SolverPanel.tsx
8  src/components/Desktop.tsx
7  src/apps/cakra/components/SettingsPanel.tsx
6  src/apps/cakra/solver/ProblemDetail.tsx
6  src/components/AppShell.tsx
4  src/apps/cakra/components/ModelPicker.tsx
4  src/apps/network/Network.tsx
```

Auto-metrics Δ ±0 vs committed snapshot: apps/routes 31, test cases 460, test files 64, bundle gz 731.1.
Design-system conformance still fully locked (colour/util/style axes all 0; `--assert-zero` exit 0).

---

## Visual inspection (screenshots captured + inspected locally; none committed — `docs/screenshots/latest/*.png` is gitignored)

All six inspected shots render clean and **style-preserving** after the S9 shell migration:

- **`ai-chat.png`** — the migrated **CakraShell tab bar** (Chat · Solver · Artifacts · Prompt · Tokens ·
  Code) with the active "Chat" `role="tab"` Button highlighted + underline; the model **`Select`**
  dropdown (OpenRouter · llama-3.1); the compose **`Input`** ("Ask me to do something…") with the round
  teal **send `IconButton`** (▶) hard-right — the embedded-send compose reads correctly; the right
  **WorkspacePanel** ("Cakra's Workspace / Nothing yet") with its ⚡/panel/trash/settings header
  IconButtons. No boundary.
- **`editor.png`** — the language **`Select`** (JavaScript, top-right), stats-toggle + askCakra + copy
  **IconButtons**, the borderless transparent **`TextArea`** ("Write or paste javascript code…"), and the
  Save (teal) / Run (green-wash) / "Send code to…" **Buttons**. Shelled + clean.
- **`prompt-generator.png`** — Templates/Custom ghost-Button toggle (`aria-pressed`), the All/General/…/
  Communication category-filter chip Buttons, the 8 template rows as clickable **Buttons** each with its
  per-category colour badge (Coding blue · Creative red · Analysis blue · Learning green · Communication
  amber — the `CATEGORY_TOKENS` map), "Saved Prompts / No saved prompts yet". Clean.
- **`token-counter.png`** — model-select toggle Buttons + `TextArea` inputs, clean.
- **`solver.png`** — renders clean (SolverPanel is an **S10** target, not yet migrated): daily-budget
  Input, "Solve everything" Button, "Add a problem to solve…" Input + `+` IconButton, "Import world
  catalog (32)" Button, the 32-problem world feed with per-item Import, the green-puzzle "The world has
  problems" empty state. No boundary.
- **`desktop.png`** — the Bridge home + full app launcher dock, clean.

**On-device confirm (style-preserving by construction, not headless-verifiable):** the CakraShell tab
underline animation, the AIChat space-between rich rows (WorkspacePanel activity, ArtifactCard trailing
chevron), and the AIChat quick-prompt pills.

---

## Verdict

**Done / Verified:** build green; 32/32 routes render clean; all 13 guards green; `--assert-zero` exit 0;
**EPIC-14 S9 acceptance CONFIRMED** (`offShellControls 122 → 83, −39`, reproduced Δ ±0). No runtime bug,
no drift.

**Next:** EPIC-14 **S10** — Cakra family part 2 (AgentSurface 8 + SolverPanel 8 + SettingsPanel 7 +
ProblemDetail 6 + ModelPicker 4 + ConfirmModal 2 → 0; `83 → 48`). The six S10 files sit at the top of the
offenders list, ready for the Builder.
