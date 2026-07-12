# The Empire — Visual + Smoke QA Report

**Run:** 2026-07-12 (cloud, fresh checkout) · **main:** `07d8c43` (product tree — `feat(cakra): power Cakra on NVIDIA NIM`) · **build:** 🟢 GREEN (`tsc -b && vite build`, 15.4s, PWA precache 91 entries)

> **⚠️ EPIC-14 CONFORMANCE DRIFT (not a runtime bug — for the Builder/Strategist):** `offShellControls` sits at **49, +1 above the S10 target of 48** (the committed snapshot already records 49 — the NIM commit baked the drift in, reproduced exactly here). S10 landed it at 48; the later NIM commit `07d8c43` reintroduced **one bare `<button>` in `src/apps/cakra/AIChat.tsx:380`** (the new collapsible "Thinking / Reasoning" trace disclosure header — `<button onClick={() => setOpen(o => !o)}>`). AIChat was a clean S9 file (0 before the NIM commit, confirmed via `git show 07d8c43^:src/apps/cakra/AIChat.tsx` → 0 bare buttons; now 1). It renders clean, so **not** a runtime regression — but it's a real design-system regression the metric caught. **Consequence: EPIC-14 S11's baseline is now `49 → 0`, not `48 → 0`** — the S11 sweep must fold in `AIChat.tsx` (map the disclosure toggle → `ui.Button variant="ghost"` / a disclosure, keeping `aria-expanded`). `--assert-zero` still exits 0 (offShellControls is ungated until S12).

## Result: 32 / 32 routes render clean · 0 failed · all 14 guard families green

- **0 uncaught JS exceptions, 0 error boundaries, 0 blank routes, 0 console errors** across desktop + all 31 registry apps.
- `SHELL-IS-STYLED` ✅ (top-level `.empire-desktop{position:fixed}`, 0 `.hide-sm .empire-desktop`)
- `REGISTRY-COVERAGE` ✅ smoke list ↔ registry exact (**31 apps**)
- Env-expected network noise only (blocked/authed endpoints): `weather` net:1, `files` net:1, `maps` net:8 (Leaflet OSM tiles env-blocked), `mail` net:1 (himalaya 401). None trip an error boundary.

### Guard suite (all green)
| Guard | Result |
|---|---|
| SHELL-IS-STYLED | ✅ |
| REGISTRY-COVERAGE | ✅ 31 apps, bidirectional |
| INBOUND-LANDS | 4/4 ✅ (incl. messages←ai-chat) |
| MEDIA-PERSISTS | 3/3 ✅ (music/video/photos, IDB survives reload) |
| GRAPH-LEGIBLE | 3/3 ✅ (reader/book + crypto/wallet + mail/draft) |
| GLOBAL-SEARCH | 1/1 ✅ (book+task+twoApps+tagOnly) |
| NODE-LINEAGE | 1/1 ✅ (5 axes) |
| INTENT-ROUNDTRIP | 2/2 ✅ (make-note-from + add-to-learning) |
| TIMELINE | 1/1 ✅ (ordered+grouped+flow+persisted+filtered+descendants) |
| HOME-ALIVE | 1/1 ✅ (The Bridge) |
| PROVENANCE-PERSISTS | 3/3 ✅ (editor→notes/ai-chat/prompt-generator) |
| PROVENANCE-ENTITY | 3/3 ✅ |
| PRECACHE-AUDIT | ✅ 91 entries, no gap (55 JS + 3 CSS chunks all precached) |
| OFFLINE-BOOT | 5/5 ✅ routes boot cold-offline from precache |

### Route render table (32/32 PASS)
desktop · calculator · calendar · clock · weather · grammar · language · music · video · files · cache · browser · editor · notes · photos · datacenter · maps · messages · prompt-generator · token-counter · learning-tracker · ai-chat · goals · artifacts · network · inbox · reader · search · timeline · solver · mail · crypto — **all PASS (uncaught:0, no error boundary, no blank)**.

## Fitness metrics (`node scripts/metrics.mjs`)
| Metric | Value | Δ vs committed | Note |
|---|---|---|---|
| Apps / routes | 31 | ±0 | registry = truth |
| Test cases | 460 | ±0 | |
| Test files | 64 | ±0 | |
| Token violations | 0 | ±0 | ratchet holds |
| Off-system utils | 0 | ±0 | ratchet holds |
| Off-system style | 0 (r0/t0/m0) | ±0 | ratchet holds |
| **Off-shell controls** | **49 (b45/i4/s0/t0)** | ±0 vs committed; **+1 vs S10 target 48** | **⚠️ NIM commit `07d8c43` already recorded 49 (added 1 bare button in AIChat.tsx — see banner); reproduced exactly here** |
| Bundle gz (KB) | 732.5 | +2.5 | fresh build vs the committed 730 (Cakra Auto/orchestration logic); snapshot refreshed |

`node scripts/metrics.mjs --assert-zero` → **exit 0** (tokenViolations=0, offSystemUtilities=0, offSystemStyle=0 all hold).

Top off-shell offenders (S11 sweep targets, heaviest-first): Desktop 8, AppShell 6, Network 4, Search 4, Bridge 4, GeneratedSection 3, ArtifactViewer 3, AppHost 3, ContextMenu 3 … **+ AIChat 1 (the new drift)**.

## Active epic — EPIC-14 · Shell conformance (`offShellControls → 0`, then LOCK)
- **S10 migration HOLDS:** all six S10 files (AgentSurface, SolverPanel, SettingsPanel, ProblemDetail, ModelPicker, ConfirmModal) are **0** in the full census — the Cakra part-2 migration is intact.
- **But the aggregate is 49, not the S10 target 48** — because the subsequent NIM commit reintroduced 1 bare control in AIChat.tsx (a previously-migrated S9 file). So this run **CONTRADICTS a clean 48**: S10's per-file work is confirmed, but a new drift landed on top. **S11 must sweep 49 → 0** (shell chrome + artifacts wrappers **+ AIChat.tsx**).
- **S11 not yet landed; S12 (lock) not yet landed.** No stage-acceptance to newly confirm this run beyond "S10 files stayed 0."

## Visual inspection (local screenshots — none committed)
- `desktop.png` — Bridge "Good night" home fully styled: greeting + "Ask Cakra anything…" bar, 4 live stat cards (Today/Open Tasks/Goals/Organism), full 32-tile launcher Cakra→Crypto, dock. Clean.
- `app-ai-chat.png` — Cakra shell: Chat/Solver/Artifacts/Prompt/Tokens/Code tab bar, "Cakra · AI Connector" header, the **new NIM "Auto" toggle pill** rendering top-right, compose Input + round teal send IconButton, "Cakra sees all apps · Press Enter to send" hint. Renders clean (the drifted disclosure only appears once a reasoning message exists).
- `app-network.png` — The Network: CORE hub-and-spoke mesh, Node-Types legend (note/task/message/learning/goal/prompt/wallet/draft/other), Memory + Live-Signal panels. GRAPH-LEGIBLE confirmed.

**No runtime bug.** One design-system drift (AIChat bare button, flagged above for S11).
