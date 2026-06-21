import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CROSS_APP_ACTIONS } from './appActions'
import { onAny, clearHistory, type EmpireEvent } from './eventBus'
import { useStore } from './store'

beforeEach(() => {
  clearHistory()
  useStore.setState({ notes: [] })
  // window.open does a full navigation we don't want in jsdom; stub it.
  vi.spyOn(window, 'open').mockReturnValue(null)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SEND_TO_NOTES', () => {
  it('stores a note whose id matches the emitted NOTE_CREATED event', () => {
    const events: EmpireEvent[] = []
    const off = onAny(e => events.push(e))

    CROSS_APP_ACTIONS.SEND_TO_NOTES.execute({ text: 'hello', source: 'calculator' })
    off()

    const note = useStore.getState().notes.at(-1)!
    const created = events.find(e => e.type === 'NOTE_CREATED')
    expect(created).toBeDefined()
    // Single Date.now() id — the stored note and the event must agree.
    expect(created && created.type === 'NOTE_CREATED' && created.noteId).toBe(note.id)
    expect(note.tags).toEqual(['from-calculator'])
  })
})

describe('HANDOFF emission', () => {
  const cases = [
    ['SEND_TO_EDITOR', 'editor'],
    ['SEND_TO_TOKEN_COUNTER', 'token-counter'],
    ['SEND_TO_PROMPT_GEN', 'prompt-generator'],
    ['SEND_TO_AI_CHAT', 'ai-chat'],
  ] as const

  it.each(cases)('%s emits a directed HANDOFF from source to %s', (key, toId) => {
    const events: EmpireEvent[] = []
    const off = onAny(e => events.push(e))

    CROSS_APP_ACTIONS[key].execute({ text: 'x', source: 'calculator' })
    off()

    const handoff = events.find(e => e.type === 'HANDOFF')
    expect(handoff).toBeDefined()
    expect(handoff && handoff.type === 'HANDOFF' && handoff.fromId).toBe('calculator')
    expect(handoff && handoff.type === 'HANDOFF' && handoff.toId).toBe(toId)
  })

  it('ASK_HERMES_TO_ANALYZE emits a HANDOFF into ai-chat', async () => {
    const events: EmpireEvent[] = []
    const off = onAny(e => events.push(e))

    await CROSS_APP_ACTIONS.ASK_HERMES_TO_ANALYZE.execute({ text: 'x', source: 'notes' })
    off()

    const handoff = events.find(e => e.type === 'HANDOFF')
    expect(handoff && handoff.type === 'HANDOFF' && handoff.toId).toBe('ai-chat')
    expect(handoff && handoff.type === 'HANDOFF' && handoff.fromId).toBe('notes')
  })
})
