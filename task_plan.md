# Task Plan: Empire — Bugs & Improvements

## Goal
Fix all bugs in The Empire (20-app suite) and add meaningful improvements across UI, UX, data flow, and consistency.

## Current Phase
Phase 1: Requirements & Discovery

## Phases

### Phase 1: Requirements & Discovery
- [x] Audit all 20 apps for bugs
- [x] Identify cross-app data flow issues
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Critical Bug Fixes
- [ ] Fix Notes edit — handleSaveEdit never calls updateNote()
- [ ] Fix registry.ts iconMap — add missing Bot/Sparkles icons
- [ ] Fix CSS @import ordering — move to top of design-system.css
- [ ] Fix LearningTracker — mastered toggle doesn't emit LEARNING_CHALLENGE
- [ ] Fix DataCenter — deleteRow doesn't emit DATA_TABLE_UPDATED
- **Status:** pending

### Phase 3: Cross-App Data Flow Fixes
- [ ] Fix TokenCounter clipboard — data format mismatch with appActions
- [ ] Fix Editor clipboard — data format mismatch with appActions
- [ ] Fix PromptGenerator clipboard — data format mismatch with appActions
- [ ] Verify Notes → Hermes flow end-to-end
- [ ] Verify Learning Tracker → Hermes flow end-to-end
- **Status:** pending

### Phase 4: App Completions (stub apps)
- [ ] Browser app — real web proxy via /api/proxy
- [ ] Calendar app — real event CRUD with store
- [ ] Maps app — integrate a real maps solution
- [ ] Files app — ensure full functionality
- [ ] Clock app — alarms, world clock
- **Status:** pending

### Phase 5: UI/UX Improvements
- [ ] Add empty states to all apps that lack them
- [ ] Improve HermesAgentBar type safety
- [ ] Add loading states to async operations
- [ ] Consistent error handling across all apps
- [ ] Keyboard shortcuts consistency
- **Status:** pending

### Phase 6: Build & Verify
- [ ] npm run build succeeds with zero warnings
- [ ] All apps load without errors
- [ ] Cross-app event flow works
- [ ] Test Hermes AI integration end-to-end
- **Status:** pending

### Phase 7: Delivery
- [ ] Commit all changes
- [ ] Update findings.md with resolved issues
- [ ] Report to user
- **Status:** pending

## Key Questions
1. Which apps have the highest priority for completion?
2. Should stub apps (Browser, Calendar, Maps) be completed now or deferred?
3. Any specific feature requests from Jondri?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Fix data flow before UI | Broken clipboard integration breaks core UX |
| Add icons to iconMap | Quick fix, high visual impact |
| Move CSS @import to top | Eliminates build warning |
| Complete stub apps | Empire should be functional, not just pretty |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Notes edit doesn't save | 1 | handleSaveEdit calls emit but not updateNote — need to add updateNote call |
| Bot icon missing from iconMap | 1 | iconMap in registry.ts lacks Bot/Sparkles entries |
| CSS @import ordering | 1 | @import url() in design-system.css must precede all other rules |
| Clipboard format mismatches | 1 | appActions sends {text} but TokenCounter/Editor expect {content} |

## Notes
- Build: `cd /data/data/com.termux/files/home/Desktop/empire && npm run build`
- Start: `node server.js` (port 3001)
- TypeScript: clean (`npx tsc --noEmit` passes)