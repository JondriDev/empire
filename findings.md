# Findings & Decisions

## Requirements
- Fix bugs across 20 apps in The Empire
- Improve overall quality and consistency
- Ensure cross-app data flow works correctly

## Research Findings

### Critical Bugs Found

**1. Notes app — edit doesn't save**
- File: `src/apps/notes/Notes.tsx`
- Issue: `handleSaveEdit(id)` calls `emit({ type: 'NOTE_UPDATED' })` but NEVER calls `updateNote(id, {...})`
- Impact: All edits are lost on save
- Fix: Call `updateNote(id, { title, content })` before emit

**2. registry.ts — missing Bot/Sparkles in iconMap**
- File: `src/lib/registry.ts`
- Issue: Imports `Bot, Sparkles` from lucide-react but `iconMap` object only contains 18 icons
- Impact: `getAppIcon('Bot')` returns `Terminal` (fallback) — ai-chat app shows wrong icon
- Fix: Add `Bot, Sparkles` to iconMap

**3. design-system.css — @import ordering**
- File: `src/design-system.css` line 7
- Issue: `@import url(...)` comes after CSS variable definitions
- Impact: Vite build warning: "@import rules must precede all rules aside from @charset and @layer"
- Fix: Move `@import` to absolute top of file (line 1)

**4. LearningTracker — mastered toggle doesn't emit event**
- File: `src/apps/learning-tracker/LearningTracker.tsx`
- Issue: `toggleMastered()` calls `updateLearningItem()` but never emits `LEARNING_CHALLENGE` event
- Impact: HermesAgentBar activity feed misses mastered achievements
- Fix: Add emit call in toggleMastered

**5. DataCenter — deleteRow doesn't emit event**
- File: `src/apps/datacenter/DataCenter.tsx`
- Issue: `deleteRow()` calls `loadRows()` but never emits `DATA_TABLE_UPDATED`
- Impact: Activity feed misses deletions
- Fix: Add emit({ type: 'DATA_TABLE_UPDATED', ... }) before/after deletion

### Cross-App Data Flow Issues

**6. TokenCounter clipboard format mismatch**
- appActions sends: `{ text, from }`
- TokenCounter reads: `sessionStorage.getItem('empire-token-clipboard')` → expects `{ content }`
- File: Need to check `src/apps/token-counter/TokenCounter.tsx`
- Status: UNCONFIRMED — need to verify

**7. Editor clipboard format mismatch**
- appActions sends: `{ code, language, from }`
- Editor reads: `sessionStorage.getItem('empire-editor-clipboard')` → expects `{ content }`
- File: `src/apps/editor/Editor.tsx`
- Status: UNCONFIRMED — need to verify

**8. PromptGenerator clipboard format mismatch**
- appActions sends: `{ text, from }`
- PromptGenerator reads: `sessionStorage.getItem('empire-prompt-clipboard')` → expects `{ content }`
- File: `src/apps/prompt-generator/PromptGenerator.tsx`
- Status: UNCONFIRMED — need to verify

### Stub Apps (Need Completion)

**9. Browser — not functional**
- File: `src/apps/browser/Browser.tsx`
- Status: Shows placeholder text, doesn't actually load URLs
- Potential: Use server's `/api/proxy` endpoint for web access
- Potential: Use iframe with sandbox restrictions

**10. Calendar — not functional**
- File: `src/apps/calendar/Calendar.tsx`
- Status: Only emits hardcoded "New Event", no real CRUD
- Potential: Use Zustand store (already has events array)

**11. Maps — not functional**
- File: `src/apps/maps/Maps.tsx`
- Status: Unknown state, needs investigation

**12. Clock — not investigated**
- File: `src/apps/clock/Clock.tsx`
- Status: Needs investigation

### Architecture Notes
- Framework: Vite + React + TypeScript + Tailwind CSS v4
- State: Zustand with localStorage persistence
- Router: React Router (hash-based via BrowserRouter not confirmed)
- Backend: Express.js + WebSocket (ws)
- Icons: Lucide React
- Build: Clean (`npx tsc --noEmit` passes with no errors)
- AI: OpenRouter proxy at `/api/ai/chat` (DeepSeek V4 Flash default)

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Fix data flow before UI | Core UX depends on working clipboard |
| iconMap fix is quick win | 2-line change, immediate visual improvement |
| Use server /api/proxy for Browser | Android security restrictions limit iframe use |
| Zustand for calendar events | Store already has events[], just needs UI |

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| TypeScript types in eventBus.ts on() function use `any` cast | Cast is necessary due to dynamic event type system; acceptable tradeoff |

## Resources
- Project root: `/data/data/com.termux/files/home/Desktop/empire`
- Server: `server.js` (port 3001)
- Design system: `src/design-system.css`
- Registry: `src/lib/registry.ts`
- Event bus: `src/lib/eventBus.ts`
- Store: `src/lib/store.ts`
- Build command: `cd /data/data/com.termux/files/home/Desktop/empire && npm run build`

## Visual/Browser Findings
- Vite build warning on @import ordering in design-system.css (line 7)
- Build succeeds but warns about CSS @import position
- No TypeScript errors (clean compile)