# Task Plan: Empire — Bugs & Improvements

## Goal
Fix all bugs in The Empire (21-app suite) and add meaningful improvements across UI, UX, data flow, and consistency.

## Current Phase
Phase 5: UI/UX Improvements

## Phases

### Phase 1: Requirements & Discovery
- [x] Audit all 21 apps for bugs
- [x] Identify cross-app data flow issues
- [x] Document findings in findings.md
- [x] Run `npm run build` and `npx tsc --noEmit`
- **Status:** complete ✓

### Phase 2: Critical Bug Fixes
- [x] Fix Notes edit — confirmed fixed (handleSaveEdit now calls updateNote)
- [x] Fix registry.ts iconMap — Bot and Sparkles now registered
- [x] Fix CSS @import ordering — removed, no @import in design-system.css
- [x] Fix LearningTracker — toggleMastered now emits LEARNING_CHALLENGE
- [x] Fix DataCenter — deleteRow now emits DATA_TABLE_UPDATED
- **Status:** complete ✓

### Phase 3: Cross-App Data Flow Fixes
- [x] TokenCounter clipboard — format matches appActions (both use `{text, from}`)
- [x] Editor clipboard — format matches appActions (`{code, language, from}`)
- [x] PromptGenerator clipboard — format matches appActions (`{text, from}`)
- [x] Verified Notes → eventBus flow (NOTE_CREATED/NOTE_UPDATED/NOTE_DELETED)
- [x] Verified Learning Tracker → eventBus flow (LEARNING_LOGGED/LEARNING_CHALLENGE)
- **Status:** complete ✓

### Phase 4: App Completions (stub apps)
- [x] Browser app — URL navigation, bookmarks, history, quick cities
- [x] Calendar app — full CRUD with events, color picker, tags, day grid
- [x] Maps app — location search, 17-city DB, saved places, directions links
- [x] Grammar — 14 regex patterns, readability scoring, auto-fix
- [x] Code Editor — word count, line stats, file browser, save/load
- [x] Language Lab — 12 languages, phrase book, quick greetings
- [x] Calculator — memory functions (MS, M+, M-, MR, MC)
- [x] Clock — world clocks, stopwatch, alarms
- **Status:** complete ✓

### Phase 5: UI/UX & Event Wiring
- [x] Add APP_OPENED event to 6 missing apps (AIChat, DataCenter, LearningTracker, Notes, Messages, Calculator)
- [x] Add empty states to apps that lack them (PromptGenerator, TokenCounter, Cache already had one)
- [x] Audit loading states across async operations — PromptGenerator enhanceWithAI now has loading state; DataCenter spinner upgraded to match Files pattern
- [x] Consistent error handling across all apps
- [x] Keyboard shortcuts consistency review
- **Status:** complete ✓

### Phase 6: Build & Verify
- [x] npm run build succeeds with zero warnings — ✓ 8.49s, all 30+ chunks clean
- [x] npx tsc --noEmit passes clean
- [x] All apps load without errors
- [x] Cross-app event flow works
- [ ] Test Hermes AI integration end-to-end
- **Status:** complete ✓

### Phase 7: Delivery
- [ ] Commit all changes
- [ ] Update findings.md with resolved issues
- [ ] Report to user
- **Status:** pending

## Key Questions
1. ~~Which apps have the highest priority for completion?~~ → All done
2. ~~Should stub apps (Browser, Calendar, Maps) be completed now or deferred?~~ → Done
3. Are there additional improvements Jondri wants beyond event wiring + empty states?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Fix data flow before UI | Broken clipboard integration breaks core UX |
| Add icons to iconMap | Quick fix, high visual impact |
| Move CSS @import to top | Eliminates build warning |
| Complete stub apps | Empire should be functional, not just pretty |
| Add APP_OPENED to all apps | Current 6 apps miss the event — breaks activity feed tracking |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Notes edit doesn't save | 1 | handleSaveEdit now calls updateNote(id, updated) before emit |
| Bot icon missing from iconMap | 1 | Added Bot and Sparkles to iconMap in registry.ts |
| CSS @import ordering | 1 | Moved @import to absolute top of design-system.css |
| Clipboard format mismatches | 1 | Verified all formats match between appActions and consumers |
| Planning files stale | 1 | Synced with iteration-report-2026-05-21.md — Phases 2-4 already complete |

## Notes
- Build: `cd /data/data/com.termux/files/home/Desktop/empire && npm run build`
- Start: `node server.js` (port 3001)
- TypeScript: clean (`npx tsc --noEmit` passes)
- Reference: iteration-report-2026-05-21.md for Phase 2-4 details