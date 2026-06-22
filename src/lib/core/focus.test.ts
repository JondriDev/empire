import { describe, it, expect, beforeEach } from 'vitest'
import type { EmpireEvent } from '../eventBus'
import { focusIdForEvent, useFocus, startFocusTracking } from './focus'
import { emit } from '../eventBus'

describe('focusIdForEvent', () => {
  it('returns the nodeId for node-touch events', () => {
    expect(focusIdForEvent({ type: 'NODE_CREATED', nodeId: 'a', nodeType: 'note', title: 'x', app: 'notes' })).toBe('a')
    expect(focusIdForEvent({ type: 'NODE_UPDATED', nodeId: 'b', nodeType: 'note' })).toBe('b')
    expect(focusIdForEvent({ type: 'INTENT_RUN', intentId: 'make-task', nodeId: 'c' })).toBe('c')
  })

  it('uses the source node for a link', () => {
    expect(focusIdForEvent({ type: 'NODES_LINKED', fromId: 'src', toId: 'dst' })).toBe('src')
  })

  it('returns null for events that do not reference a single node', () => {
    const irrelevant: EmpireEvent[] = [
      { type: 'APP_OPENED', appId: 'notes' },
      { type: 'HANDOFF', fromId: 'notes', toId: 'editor' },
      { type: 'NODE_DELETED', nodeId: 'a', nodeType: 'note' },
    ]
    for (const e of irrelevant) expect(focusIdForEvent(e)).toBeNull()
  })
})

describe('startFocusTracking', () => {
  beforeEach(() => useFocus.getState().setFocus(null))

  it('points focus at the last node touched on the bus', () => {
    startFocusTracking()
    emit({ type: 'NODE_CREATED', nodeId: 'n1', nodeType: 'note', title: 'x', app: 'notes' })
    expect(useFocus.getState().focusedId).toBe('n1')
    emit({ type: 'INTENT_RUN', intentId: 'make-task', nodeId: 'n2' })
    expect(useFocus.getState().focusedId).toBe('n2')
  })

  it('clears focus when the focused node is deleted', () => {
    startFocusTracking()
    useFocus.getState().setFocus('n3')
    emit({ type: 'NODE_DELETED', nodeId: 'n3', nodeType: 'note' })
    expect(useFocus.getState().focusedId).toBeNull()
  })

  it('leaves focus untouched when a different node is deleted', () => {
    startFocusTracking()
    useFocus.getState().setFocus('keep')
    emit({ type: 'NODE_DELETED', nodeId: 'other', nodeType: 'note' })
    expect(useFocus.getState().focusedId).toBe('keep')
  })
})
