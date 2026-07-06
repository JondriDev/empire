import { describe, it, expect, beforeEach } from 'vitest'
import { useGraph } from './graph'
import { useStore } from '../store'
import { intentsFor, runIntent } from './intents'
import { startCoreSync } from './sync'
import { flowForEvent } from './flow'
import { onAny, clearHistory, type EmpireEvent } from '../eventBus'
import type { CoreNode } from './graph'

// Register the real C-layer intents (make-task / make-note-from / add-to-learning)
// once, then drive them exactly as the ⚡ NodeActions menu does. This locks the
// S2 invariant: a cross-app intent lights exactly one honest arc; an in-app
// derivation lights none.
beforeEach(() => {
  startCoreSync()
  useGraph.setState({ nodes: {} })
  // make-note-from now writes the REAL store (EPIC-12 S1) — reset it so real notes
  // don't accumulate across tests (subscribe→reconcile would re-mirror stale rows).
  useStore.setState({ notes: [], learningItems: [], messages: [] })
  clearHistory()
})

/** Create a source CoreNode owned by `app` and return it. */
function source(type: string, app: string): CoreNode {
  return useGraph.getState().addNode({ type, title: `${type} one`, data: { content: 'body' }, app })
}

/** Run an intent on a node, capturing every event it emits. */
async function runCapturing(intentId: string, node: CoreNode): Promise<EmpireEvent[]> {
  const events: EmpireEvent[] = []
  const off = onAny(e => events.push(e))
  await runIntent(intentId, node)
  off()
  return events
}

/** The directed arcs a list of events would light in The Network. */
function arcs(events: EmpireEvent[]): Array<{ fromId: string; toId: string }> {
  return events.map(flowForEvent).filter((f): f is { fromId: string; toId: string } => f !== null)
}

describe('add-to-learning (cross-app intent)', () => {
  it('is offered on a note and lights exactly one notes → learning-tracker arc', async () => {
    const note = source('note', 'notes')
    expect(intentsFor(note).map(i => i.id)).toContain('add-to-learning')

    const events = await runCapturing('add-to-learning', note)

    // Exactly one HANDOFF, directed honestly from the source app to the tracker.
    const handoffs = events.filter(e => e.type === 'HANDOFF')
    expect(handoffs).toHaveLength(1)
    expect(arcs(events)).toEqual([{ fromId: 'notes', toId: 'learning-tracker' }])
  })

  it('lights messages → learning-tracker when run on a message', async () => {
    const msg = source('message', 'messages')
    const events = await runCapturing('add-to-learning', msg)
    expect(arcs(events)).toEqual([{ fromId: 'messages', toId: 'learning-tracker' }])
  })
})

describe('in-app derivations light no arc', () => {
  it('make-task on a note stays in Notes — no HANDOFF, no arc', async () => {
    const note = source('note', 'notes')
    const events = await runCapturing('make-task', note)
    expect(events.some(e => e.type === 'HANDOFF')).toBe(false)
    expect(arcs(events)).toEqual([])
  })

})

describe('make-note-from lights an honest arc into Notes (EPIC-12 S1)', () => {
  // The note is now a REAL store note owned by the `notes` app (not a graph-only
  // node stamped with the source app), so making a note from any non-notes source
  // is a genuine boundary crossing → exactly one <source> → notes arc.
  it('make-note-from on a message lights messages → notes', async () => {
    const msg = source('message', 'messages')
    const events = await runCapturing('make-note-from', msg)
    const handoffs = events.filter(e => e.type === 'HANDOFF')
    expect(handoffs).toHaveLength(1)
    expect(arcs(events)).toEqual([{ fromId: 'messages', toId: 'notes' }])
  })

  it('make-note-from on a note stays in Notes — no arc (self-transfer)', async () => {
    const note = source('note', 'notes')
    // A note can't spawn a note (accepts n => n.type !== 'note'), so this is a no-op
    // — but guard the invariant that a notes-owned source never crosses a boundary.
    expect(intentsFor(note).map(i => i.id)).not.toContain('make-note-from')
  })
})
