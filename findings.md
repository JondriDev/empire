# Findings & Decisions

## Requirements
- Fix bugs across 21 apps in The Empire
- Improve overall quality and consistency
- Ensure cross-app data flow works correctly
- Wire APP_OPENED events to all apps for activity feed

## Research Findings

### ✅ Resolved — Critical Bugs (Phase 2)

**1. Notes app — edit doesn't save** → FIXED
- `handleSaveEdit(id)` now calls `updateNote(id, { title, content })` before emit

**2. registry.ts — missing Bot/Sparkles in iconMap** → FIXED
- `Bot` and `Sparkles` now registered in iconMap

**3. design-system.css — @import ordering** → FIXED
- No @import rules — only `@layer base;` at top

**4. LearningTracker — mastered toggle** → FIXED
- `toggleMastered()` now emits `LEARNING_CHALLENGE` event

**5. DataCenter — deleteRow doesn't emit** → FIXED
- `deleteRow()` now emits `DATA_TABLE_UPDATED` event

### ✅ Resolved — Cross-App Data Flow (Phase 3)

**TokenCounter clipboard** → FIXED
- appActions sends: `{ text, from }` → TokenCounter reads `parsed.text` ✓

**Editor clipboard** → FIXED
- appActions sends: `{ code, language, from }` → Editor reads correctly ✓

**PromptGenerator clipboard** → FIXED
- appActions sends: `{ text, from }` → PromptGenerator reads `parsed.text` ✓

### ✅ Completed — Stub Apps (Phase 4)

All stub apps now fully functional (see iteration-report-2026-05-21.md):
- Browser: URL nav, bookmarks, history, quick cities — 213 lines
- Calendar: Full CRUD, color picker, tags, day grid — 391 lines
- Maps: Location search, 17-city DB, saved places — 391 lines
- Grammar: 14 regex patterns, readability scoring — 253 lines
- Editor: Word count, stats, file browser — 220 lines
- Language: 12 languages, phrase book — 273 lines
- Calculator: Memory functions — 248 lines

### ✅ Resolved — APP_OPENED Missing (Phase 5)

All 6 apps now emit APP_OPENED on mount:
1. **AIChat.tsx** — added `emit({ type: 'APP_OPENED', appId: 'ai-chat' })` in useEffect
2. **DataCenter.tsx** — added `emit({ type: 'APP_OPENED', appId: 'datacenter' })` in useEffect
3. **LearningTracker.tsx** — added `emit({ type: 'APP_OPENED', appId: 'learning-tracker' })` in useEffect
4. **Notes.tsx** — added `emit({ type: 'APP_OPENED', appId: 'notes' })` in useEffect
5. **Messages.tsx** — added `emit({ type: 'APP_OPENED', appId: 'messages' })` in useEffect
6. **Calculator.tsx** — added `emit({ type: 'APP_OPENED', appId: 'calculator' })` in useEffect

### ✅ Resolved — Empty States (Phase 5)

Apps that lacked empty states now have them:
- **PromptGenerator** — "Select a template or type a custom prompt" with Sparkles icon
- **TokenCounter** — "Enter text to analyze tokens" with Hash icon
- CacheCleaner already had an empty state

### ✅ Resolved — Loading States (Phase 5)

- **PromptGenerator** — `enhanceWithAI` fetch now has `enhancing` state: button shows "Enhancing…" with pulsing Sparkles icon, disabled during fetch
- **DataCenter** — loading spinner upgraded from plain text to animated spinner matching Files app pattern
- Weather, Files, AIChat already had proper loading states — no changes needed
- Grammar, Language, Editor, TokenCounter only have async clipboard copy (instant) — no loading state needed

### Build Status (2026-05-22, Phase 6)
- `npm run build` → 0 errors, 0 warnings — ✓ 8.49s
- `npx tsc --noEmit` → clean
- Bundle: 30+ chunks, ~227KB main + 40KB UI vendor + 48KB React vendor

### Architecture Notes
- Framework: Vite + React + TypeScript + Tailwind CSS v4
- State: Zustand with localStorage persistence
- Router: React Router (hash-based)
- Backend: Express.js + WebSocket (ws)
- Icons: Lucide React
- Build: Clean (`npx tsc --noEmit` — zero errors, `npm run build` — 0 warnings)
- AI: OpenRouter proxy at `/api/ai/chat` (DeepSeek V4 Flash default)
- 21 apps total, all functional

### Build Status (2026-05-22)
- `npm run build` → 0 errors, 0 warnings
- `npx tsc --noEmit` → clean
- Bundle: 21 apps, ~227KB main + 40KB UI vendor + 48KB React vendor

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Fix data flow before UI | Core UX depends on working clipboard |
| iconMap fix is quick win | 2-line change, immediate visual improvement |
| Use server /api/proxy for Browser | Android security restrictions limit iframe use |
| Zustand for calendar events | Store already has events[], just needs UI |
| Add APP_OPENED to all 21 apps | Consistency — 15 already do it, 6 missing |

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| TypeScript types in eventBus.ts on() function use `any` cast | Cast is necessary due to dynamic event type system; acceptable tradeoff |
| Planning files (task_plan, findings, progress) were stale | Synced with actual state from iteration-report-2026-05-21.md |
| 6 apps missing APP_OPENED | Identified — will add in Phase 5 |

## Resources
- Project root: `/data/data/com.termux/files/home/Desktop/empire`
- Server: `server.js` (port 3001)
- Design system: `src/design-system.css` (838 lines — Jondridev Earth-from-Space theme)
- Registry: `src/lib/registry.ts`
- Event bus: `src/lib/eventBus.ts`
- Store: `src/lib/store.ts`
- Build command: `cd /data/data/com.termux/files/home/Desktop/empire && npm run build`
- Iteration report: `iteration-report-2026-05-21.md`

## Visual/Browser Findings
- All 21 apps render in the dashboard
- Design system uses dark glassmorphism theme with teal/cyan accents
- HermesAgentBar shows recent events across apps