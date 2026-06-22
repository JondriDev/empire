import { describe, it, expect } from 'vitest'
import { flowForEvent } from './flow'
import type { EmpireEvent } from '../eventBus'

describe('flowForEvent — HANDOFF', () => {
  it('returns the directed pair for a cross-app handoff', () => {
    const e: EmpireEvent = { type: 'HANDOFF', fromId: 'calculator', toId: 'token-counter', label: 'counting' }
    expect(flowForEvent(e)).toEqual({ fromId: 'calculator', toId: 'token-counter' })
  })

  it('suppresses a self-handoff (in-app derivation is not a synapse)', () => {
    const e: EmpireEvent = { type: 'HANDOFF', fromId: 'notes', toId: 'notes', label: 'make note' }
    expect(flowForEvent(e)).toBeNull()
  })

  it('suppresses a handoff missing an endpoint', () => {
    expect(flowForEvent({ type: 'HANDOFF', fromId: '', toId: 'notes' })).toBeNull()
  })
})

describe('flowForEvent — NOTE_CREATED', () => {
  it('draws source → notes when the note carries a from-<app> tag', () => {
    const e: EmpireEvent = { type: 'NOTE_CREATED', noteId: '1', title: 't', content: 'c', tags: ['from-calculator'] }
    expect(flowForEvent(e)).toEqual({ fromId: 'calculator', toId: 'notes' })
  })

  it('returns null for a note created inside Notes itself (no from- tag)', () => {
    const e: EmpireEvent = { type: 'NOTE_CREATED', noteId: '1', title: 't', content: 'c', tags: ['idea'] }
    expect(flowForEvent(e)).toBeNull()
  })

  it('returns null for a self-tagged note (from-notes is not an arc)', () => {
    const e: EmpireEvent = { type: 'NOTE_CREATED', noteId: '1', title: 't', content: 'c', tags: ['from-notes'] }
    expect(flowForEvent(e)).toBeNull()
  })
})

describe('flowForEvent — LEARNING_LOGGED', () => {
  it('draws source → learning-tracker when from is set', () => {
    const e: EmpireEvent = { type: 'LEARNING_LOGGED', topic: 't', learned: 'l', from: 'editor' }
    expect(flowForEvent(e)).toEqual({ fromId: 'editor', toId: 'learning-tracker' })
  })

  it('returns null for an entry logged inside the tracker (no from)', () => {
    const e: EmpireEvent = { type: 'LEARNING_LOGGED', topic: 't', learned: 'l' }
    expect(flowForEvent(e)).toBeNull()
  })
})

describe('flowForEvent — ordinary single-app activity', () => {
  it('returns null for events that are not transfers', () => {
    const events: EmpireEvent[] = [
      { type: 'CALCULATION_RESULT', expression: '1+1', result: '2' },
      { type: 'APP_OPENED', appId: 'calculator' },
      { type: 'TOKEN_COUNTED', text: 'x', count: 1, model: 'gpt' },
      { type: 'INTENT_RUN', intentId: 'make-task', nodeId: 'n1' },
    ]
    for (const e of events) expect(flowForEvent(e)).toBeNull()
  })
})
