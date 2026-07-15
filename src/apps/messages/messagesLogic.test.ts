import { describe, it, expect } from 'vitest'
import type { Message } from '../../lib/store'
import { threadFor, lastInThread } from './messagesLogic'

const mk = (over: Partial<Message>): Message => ({
  id: over.id ?? Math.random().toString(),
  sender: 'Me',
  content: '',
  timestamp: 0,
  ...over,
})

describe('threadFor', () => {
  it('includes messages received from the contact', () => {
    const msgs = [mk({ sender: 'Work', content: 'hi', id: 'a' })]
    expect(threadFor(msgs, 'Work').map(m => m.id)).toEqual(['a'])
    expect(threadFor(msgs, 'Family')).toEqual([])
  })

  it('scopes a sent message to its recipient only — no cross-thread leak', () => {
    const sentToWork = mk({ sender: 'Me', to: 'Work', content: 'ping', id: 'w' })
    const msgs = [sentToWork]
    expect(threadFor(msgs, 'Work').map(m => m.id)).toEqual(['w'])
    // The regression this locks: a 'Me' message used to appear in EVERY thread.
    expect(threadFor(msgs, 'Family')).toEqual([])
    expect(threadFor(msgs, 'Urgent')).toEqual([])
  })

  it('surfaces a legacy sent message (no `to`) in every thread — migrate-in-place', () => {
    const legacy = mk({ sender: 'Me', content: 'old', id: 'legacy' }) // to: undefined
    const msgs = [legacy]
    expect(threadFor(msgs, 'Work').map(m => m.id)).toEqual(['legacy'])
    expect(threadFor(msgs, 'Family').map(m => m.id)).toEqual(['legacy'])
  })

  it('builds a two-sided conversation in order and excludes other contacts', () => {
    const msgs = [
      mk({ sender: 'Work', content: 'a', id: '1', timestamp: 1 }),
      mk({ sender: 'Me', to: 'Family', content: 'b', id: '2', timestamp: 2 }),
      mk({ sender: 'Me', to: 'Work', content: 'c', id: '3', timestamp: 3 }),
    ]
    expect(threadFor(msgs, 'Work').map(m => m.id)).toEqual(['1', '3'])
  })
})

describe('lastInThread', () => {
  it('returns the most recent message for the contact', () => {
    const msgs = [
      mk({ sender: 'Me', to: 'Work', content: 'first', id: '1' }),
      mk({ sender: 'Work', content: 'reply', id: '2' }),
    ]
    expect(lastInThread(msgs, 'Work')?.id).toBe('2')
  })

  it('returns undefined for an untouched contact', () => {
    expect(lastInThread([mk({ sender: 'Me', to: 'Work', id: '1' })], 'Family')).toBeUndefined()
  })
})
