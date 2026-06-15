/**
 * Cross-App Automation Rules — Hermes as the conductor
 *
 * I watch all eventBus events and automatically trigger actions
 * across apps. I am the connective tissue that makes the Empire feel
 * like one living system, not 21 disconnected apps.
 */

import { on, emit, type EmpireEvent } from './eventBus'

// ── Rule definition ──────────────────────────────────────────────────────────
interface AutomationRule {
 id: string
 name: string
 description: string
 trigger: { type: EmpireEvent['type']; filter?: (_event: EmpireEvent) => boolean }
 action: (_event: EmpireEvent, _dispatch: (action: CrossAppAction) => void) => void
 enabled: boolean
 oncePerSession: boolean
}

interface CrossAppAction {
  type: string
  payload: Record<string, unknown>
}

// ── Built-in rules ───────────────────────────────────────────────────────────

const rules: AutomationRule[] = [
  // ── AI Chat → Context awareness ──────────────────────────────────────────────
  {
    id: 'ai-chat-open-context',
    name: 'AI Chat pre-loads context',
    description: 'When AI Chat opens, check for queued context from other apps',
    trigger: { type: 'APP_OPENED', filter: (e) => e.type === 'APP_OPENED' && e.appId === 'ai-chat' },
    action: (_, dispatch) => {
      try {
        const stored = sessionStorage.getItem('empire-ai-clipboard')
        if (stored) {
          const ctx = JSON.parse(stored)
          dispatch({
            type: 'HERMES_CTX_QUEUED',
            payload: { text: ctx.text, title: ctx.title, from: ctx.from },
          })
          // Clear it so it doesn't persist
          sessionStorage.removeItem('empire-ai-clipboard')
        }
      } catch { /* ignore parse errors */ }
    },
    enabled: true,
    oncePerSession: false,
  },

  // ── Notes ────────────────────────────────────────────────────────────────────
  {
    id: 'note-created-broadcast',
    name: 'Note broadcast to activity',
    description: 'When a note is created, log it for AI awareness',
    trigger: { type: 'NOTE_CREATED' },
    action: (e) => {
    if (e.type !== 'NOTE_CREATED') return
    emit({
    type: 'AI_QUERY',
    query: `Note created: "${e.title}"`,
    context: buildBriefContext(),
    app: 'system',
    })
    },
    enabled: true,
    oncePerSession: false,
  },

  // ── Calculator ───────────────────────────────────────────────────────────────
  {
    id: 'calc-result-log',
    name: 'Log calculation results',
    description: 'Broadcast calculation results for AI to remember',
    trigger: { type: 'CALCULATION_RESULT' },
    action: (e) => {
    if (e.type !== 'CALCULATION_RESULT') return
    emit({
    type: 'AI_QUERY',
    query: `Calculation: ${e.expression} = ${e.result}`,
    context: buildBriefContext(),
    app: 'system',
    })
    },
    enabled: true,
    oncePerSession: false,
  },

  // ── Code Editor ──────────────────────────────────────────────────────────────
  {
    id: 'code-run-log',
    name: 'Log code runs',
    description: 'When code runs in the editor, ask Hermes to review it',
    trigger: { type: 'CODE_RUN' },
    action: (e, dispatch) => {
    if (e.type !== 'CODE_RUN') return
    dispatch({
    type: 'CODE_REVIEW_QUEUED',
    payload: { code: e.code, language: e.language },
    })
    },
    enabled: true,
    oncePerSession: false,
  },

  // ── Learning ─────────────────────────────────────────────────────────────────
  {
    id: 'learning-complete-review',
    name: 'Trigger review on mastered topic',
    description: 'When a learning topic is marked mastered, suggest review schedule',
    trigger: { type: 'LEARNING_CHALLENGE' },
    action: (_, dispatch) => {
      dispatch({
        type: 'REVIEW_SCHEDULE_SUGGESTED',
        payload: { message: 'Time to review your recently mastered topics!' },
      })
    },
    enabled: true,
    oncePerSession: false,
  },

  // ── Data Center ───────────────────────────────────────────────────────────────
  {
    id: 'data-table-log',
    name: 'Log data updates',
    description: 'When a data table is updated, log the change',
    trigger: { type: 'DATA_TABLE_UPDATED' },
    action: (e) => {
    if (e.type !== 'DATA_TABLE_UPDATED') return
    emit({
    type: 'AI_QUERY',
    query: `Data updated: ${e.tableName} now has ${e.rowCount} rows`,
    context: buildBriefContext(),
    app: 'system',
    })
    },
    enabled: true,
    oncePerSession: false,
  },

  // ── Token Counter ─────────────────────────────────────────────────────────────
  {
    id: 'token-count-log',
    name: 'Log token counts',
    description: 'Broadcast token counts for context window management',
    trigger: { type: 'TOKEN_COUNTED' },
    action: (e) => {
    if (e.type !== 'TOKEN_COUNTED') return
    if (e.count > 8000) {
    emit({
    type: 'AI_QUERY',
    query: `Warning: ${e.count} tokens — consider shortening context`,
    context: buildBriefContext(),
    app: 'system',
    })
    }
    },
    enabled: true,
    oncePerSession: false,
  },

  // ── App usage tracking ────────────────────────────────────────────────────────
  {
    id: 'app-usage-track',
    name: 'Track app usage patterns',
    description: 'Count app opens for AI to learn user patterns',
    trigger: { type: 'APP_OPENED' },
    action: (e) => {
    try {
    const key = 'empire-app-stats'
    const stats = JSON.parse(localStorage.getItem(key) || '{}')
    if (e.type === 'APP_OPENED') {
    stats[e.appId] = (stats[e.appId] || 0) + 1
    stats._lastApp = e.appId
    }
    localStorage.setItem(key, JSON.stringify(stats))
    } catch { /* ignore */ }
    },
    enabled: true,
    oncePerSession: false,
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildBriefContext(): string {
  try {
    const stats = JSON.parse(localStorage.getItem('empire-app-stats') || '{}')
    const last = stats._lastApp || 'unknown'
    return `Last app: ${last}, Total app opens: ${Object.values(stats).filter((v, i) => i > 0).reduce((a: number, b) => a + (b as number), 0)}`
  } catch {
    return ''
  }
}

function buildDispatch(actionType: string) {
  // Dispatch system-level actions that components can listen to
  return { type: actionType }
}

// ── Automation engine ─────────────────────────────────────────────────────────

const firedOncePerSession = new Set<string>()
let initialized = false

export function initAutomation() {
  if (initialized) return
  initialized = true

  rules.forEach((rule) => {
  if (!rule.enabled) return

  on(rule.trigger.type, (event: EmpireEvent) => {
  if (rule.oncePerSession && firedOncePerSession.has(rule.id)) return
  if (rule.trigger.filter && !rule.trigger.filter(event)) return

  try {
  rule.action(event, buildDispatch as unknown as (action: CrossAppAction) => void)
  if (rule.oncePerSession) firedOncePerSession.add(rule.id)
  } catch (err) {
  console.warn(`[Automation] Rule "${rule.id}" failed:`, err)
  }
  })
  })

  console.log(`[Hermes] Automation initialized with ${rules.filter(r => r.enabled).length} rules`)
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getRules(): AutomationRule[] {
  return rules
}

export function toggleRule(ruleId: string, enabled: boolean): void {
  const rule = rules.find(r => r.id === ruleId)
  if (rule) {
    rule.enabled = enabled
    console.log(`[Hermes] Rule "${rule.id}" ${enabled ? 'enabled' : 'disabled'}`)
  }
}

export function addRule(rule: AutomationRule): void {
 rules.push(rule)
 // Immediately wire the new rule
 on(rule.trigger.type, (event: EmpireEvent) => {
 if (!rule.enabled) return
 if (rule.trigger.filter && !rule.trigger.filter(event)) return
 try {
 rule.action(event, buildDispatch as unknown as (action: CrossAppAction) => void)
 } catch (err) {
 console.warn(`[Automation] Rule "${rule.id}" failed:`, err)
 }
 })
}

// Auto-init when this module loads
initAutomation()