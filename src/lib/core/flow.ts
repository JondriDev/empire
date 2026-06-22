/**
 * Empire Flow — the canonical "does this event light a directed app→app arc?"
 * predicate (B/A-layer).
 *
 * The Network mesh draws a synapse arc whenever data genuinely moves from one
 * instrument to another. That judgement lived inline in `Network.tsx`; it is
 * extracted here so it has ONE honest definition that every observer (the mesh,
 * tests, a future inspector) shares. **Honest edges only** — never invent a link
 * the user didn't cause.
 *
 * Three event shapes carry a real transfer today:
 *   • `HANDOFF { fromId, toId }`  — explicit directed handoff (CROSS_APP_ACTIONS
 *     navigating transfers + the C-layer intents that cross app boundaries).
 *   • `NOTE_CREATED` tagged `from-<src>` — a note saved *from* another app
 *     (SEND_TO_NOTES stays in place, so it rides its typed event).
 *   • `LEARNING_LOGGED { from }` — an entry tracked *from* another app
 *     (SEND_TO_LEARNING, likewise in-place).
 *
 * A transfer that lands back in its own app (`fromId === toId`) is NOT an arc —
 * that is an in-app derivation, not a synapse.
 */

import type { EmpireEvent } from '../eventBus'

/** A directed source→target pair, or null when the event is single-app activity. */
export interface Flow {
  fromId: string
  toId: string
}

/**
 * Resolve the directed app→app arc an event represents, or `null` when it is
 * ordinary single-app activity (or an in-app derivation that loops to itself).
 */
export function flowForEvent(e: EmpireEvent): Flow | null {
  // An explicit directed handoff carries both ends (CROSS_APP_ACTIONS transfers
  // + cross-app C-layer intents).
  if (e.type === 'HANDOFF') {
    if (e.fromId && e.toId && e.fromId !== e.toId) return { fromId: e.fromId, toId: e.toId }
    return null
  }
  // A note saved *from* another app via SEND_TO_NOTES tags it `from-<sourceId>`.
  if (e.type === 'NOTE_CREATED') {
    const tag = e.tags.find(x => x.startsWith('from-'))
    if (tag) {
      const fromId = tag.slice('from-'.length)
      if (fromId && fromId !== 'notes') return { fromId, toId: 'notes' }
    }
    return null
  }
  // An entry tracked *from* another app via SEND_TO_LEARNING carries `from`
  // (in-app logging leaves it undefined, so no false self-edge).
  if (e.type === 'LEARNING_LOGGED' && e.from && e.from !== 'learning-tracker') {
    return { fromId: e.from, toId: 'learning-tracker' }
  }
  return null
}
