/**
 * Empire Event Bus — cross-app communication hub
 * Typed pub/sub so every app can broadcast events and react to others.
 *
 * I am the connector — the Event Bus is my nervous system.
 */

export type EmpireEvent =
  | { type: 'NOTE_CREATED'; noteId: string; title: string; content: string; tags: string[] }
  | { type: 'NOTE_DELETED'; noteId: string }
  | { type: 'NOTE_UPDATED'; noteId: string; title: string; content: string }
  | { type: 'CALCULATION_RESULT'; expression: string; result: string }
  | { type: 'EVENT_CREATED'; eventId: string; title: string; date: string; time: string }
  | { type: 'EVENT_DELETED'; eventId: string }
  | { type: 'EVENT_UPDATED'; eventId: string; title: string; date: string; time: string }
  | { type: 'MESSAGE_SENT'; sender: string; content: string }
  | { type: 'CODE_RUN'; language: string; code: string; output: string }
  | { type: 'LEARNING_LOGGED'; topic: string; learned: string }
  | { type: 'LEARNING_CHALLENGE'; mode: string; topic: string; score: number }
  | { type: 'TOKEN_COUNTED'; text: string; count: number; model: string }
  | { type: 'PROMPT_GENERATED'; prompt: string }
  | { type: 'FILE_OPENED'; filePath: string }
  | { type: 'AI_QUERY'; query: string; context: string; app: string }
  | { type: 'AI_RESPONSE'; query: string; response: string; app: string }
  | { type: 'APP_OPENED'; appId: string }
  | { type: 'APP_CLOSED'; appId: string }
  | { type: 'DATA_TABLE_UPDATED'; tableName: string; rowCount: number }
  | { type: 'WEATHER_UPDATED'; temp: number; condition: string; humidity: number; windSpeed: number; location: string; description: string }
  | { type: 'HERMES_STATUS_REFRESHED'; version: string; model: string; provider: string }
  | { type: 'HERMES_APP_LAUNCHED'; appId: string; appName: string }
  | { type: 'HERMES_TOOL_EXECUTED'; toolId: string; toolName: string }
  | { type: 'HERMES_SKILL_LOADED'; skillName: string }
  | { type: 'HERMES_MCP_CONNECTED'; mcpName: string; status: string }
  // A directed cross-app handoff: data sent *from* one app *to* another (e.g.
  // "use as prompt" routes the current selection into Prompt Generator). The
  // Network mesh reads these as honest app→app synapse arcs. `label` is an
  // optional terse verb for the live ticker (defaults to "handoff").
  | { type: 'HANDOFF'; fromId: string; toId: string; label?: string }

type EventHandler<E extends EmpireEvent> = (_event: E) => void
type EventUnsubscribe = () => void

const listeners = new Map<string, Set<EventHandler<EmpireEvent>>>()
const anyListeners = new Set<EventHandler<EmpireEvent>>()
const history: EmpireEvent[] = []
const MAX_HISTORY = 100

/** Subscribe to an event type. Returns an unsubscribe function. */
export function on<E extends EmpireEvent['type']>(
  type: E,
  handler: EventHandler<Extract<EmpireEvent, { type: E }>>
): EventUnsubscribe {
  if (!listeners.has(type)) listeners.set(type, new Set())
  listeners.get(type)!.add(handler as EventHandler<EmpireEvent>)
  return () => listeners.get(type)?.delete(handler as EventHandler<EmpireEvent>)
}

/** Subscribe to an event type, but only fire once. */
export function once<E extends EmpireEvent['type']>(
  type: E,
  handler: EventHandler<Extract<EmpireEvent, { type: E }>>
): EventUnsubscribe {
  const wrapped: EventHandler<EmpireEvent> = (event) => {
    if (event.type === type) {
      unsub()
      handler(event as Extract<EmpireEvent, { type: E }>)
    }
  }
  if (!listeners.has(type)) listeners.set(type, new Set())
  listeners.get(type)!.add(wrapped)
  const unsub = () => listeners.get(type)?.delete(wrapped)
  return unsub
}
/**
 * Subscribe to EVERY event regardless of type. Returns an unsubscribe function.
 * Useful for observers that watch the whole organism — e.g. the Network mesh
 * lighting up the node whose app just emitted activity.
 */
export function onAny(handler: EventHandler<EmpireEvent>): EventUnsubscribe {
  anyListeners.add(handler)
  return () => anyListeners.delete(handler)
}

export function emit(event: EmpireEvent): void {
  history.push(event)
  if (history.length > MAX_HISTORY) history.shift()
  const handlers = listeners.get(event.type)
  if (handlers) handlers.forEach(h => h(event))
  anyListeners.forEach(h => h(event))
}

/** Get recent events of a specific type. */
export function getRecent<E extends EmpireEvent['type']>(
  type: E,
  count = 10
): Extract<EmpireEvent, { type: E }>[] {
  return history.filter(e => e.type === type).slice(-count) as Extract<EmpireEvent, { type: E }>[]
}

/** Get all recent events. */
export function getAllRecent(count = 20): EmpireEvent[] {
  return history.slice(-count)
}

/** Clear all event history. */
export function clearHistory(): void {
  history.length = 0
}

/** Count events by type. */
export function getStats(): Record<string, number> {
  const stats: Record<string, number> = {}
  history.forEach(e => {
    stats[e.type] = (stats[e.type] || 0) + 1
  })
  return stats
}