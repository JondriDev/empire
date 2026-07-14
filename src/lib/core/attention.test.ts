import { describe, it, expect } from 'vitest'
import { computeAttention, attentionSummary, shouldPulseAttention } from './attention'
import { dayStamp } from './bridge'
import type { CoreNode } from './graph'

const DAY = 86_400_000
const NOW = 1_700_000_000_000 // fixed clock so day stamps are deterministic
const TODAY = dayStamp(NOW)
const YESTERDAY = dayStamp(NOW - DAY)
const LAST_WEEK = dayStamp(NOW - 7 * DAY)

// Minimal CoreNode fixture — only the fields the scorers read.
function node(id: string, over: Partial<CoreNode> = {}): CoreNode {
  return {
    id,
    type: 'task',
    title: `Node ${id}`,
    data: {},
    links: [],
    meta: { created: NOW, updated: NOW, app: 'notes' },
    ...over,
  }
}

describe('computeAttention', () => {
  it('returns [] for an empty graph', () => {
    expect(computeAttention([], NOW)).toEqual([])
  })

  it('ranks overdue task ⟩ today event ⟩ plain open task', () => {
    const nodes = [
      node('open', { data: { done: false } }),
      node('event', { type: 'event', data: { date: TODAY } }),
      node('overdue', { data: { done: false, due: YESTERDAY } }),
    ]
    const feed = computeAttention(nodes, NOW)
    expect(feed.map(i => i.id)).toEqual(['overdue', 'event', 'open'])
    expect(feed.map(i => i.kind)).toEqual(['task-overdue', 'event-today', 'task-open'])
  })

  it('scores a more-overdue task above a just-overdue one', () => {
    const nodes = [
      node('just', { data: { done: false, due: YESTERDAY } }),
      node('stale', { data: { done: false, due: LAST_WEEK } }),
    ]
    const feed = computeAttention(nodes, NOW)
    expect(feed.map(i => i.id)).toEqual(['stale', 'just'])
    expect(feed[0].score).toBeGreaterThan(feed[1].score)
  })

  it('excludes done tasks entirely', () => {
    const nodes = [
      node('done', { data: { done: true, due: YESTERDAY } }),
      node('open', { data: { done: false } }),
    ]
    expect(computeAttention(nodes, NOW).map(i => i.id)).toEqual(['open'])
  })

  it('flags a low-progress AND aged goal as stalled', () => {
    const stalled = node('g1', {
      type: 'goal',
      data: { progress: 10, completed: false },
      meta: { created: NOW - 30 * DAY, updated: NOW - 30 * DAY, app: 'goals' },
    })
    const feed = computeAttention([stalled], NOW)
    expect(feed).toHaveLength(1)
    expect(feed[0].kind).toBe('goal-stalled')
  })

  it('does not flag a low-progress goal that was touched recently', () => {
    const recent = node('g1', {
      type: 'goal',
      data: { progress: 10, completed: false }, // low but fresh (updated NOW)
    })
    expect(computeAttention([recent], NOW)).toEqual([])
  })

  it('does not flag a completed or high-progress goal', () => {
    const nodes = [
      node('done-goal', {
        type: 'goal',
        data: { progress: 100, completed: true },
        meta: { created: NOW - 30 * DAY, updated: NOW - 30 * DAY, app: 'goals' },
      }),
      node('almost', {
        type: 'goal',
        data: { progress: 80, completed: false },
        meta: { created: NOW - 30 * DAY, updated: NOW - 30 * DAY, app: 'goals' },
      }),
    ]
    expect(computeAttention(nodes, NOW)).toEqual([])
  })

  it('includes an in-progress book as reading, excludes a finished one', () => {
    const nodes = [
      node('reading', { type: 'book', data: { progress: 0.4 }, meta: { created: NOW, updated: NOW, app: 'reader' } }),
      node('finished', { type: 'book', data: { progress: 1 }, meta: { created: NOW, updated: NOW, app: 'reader' } }),
      node('unopened', { type: 'book', data: { progress: 0 }, meta: { created: NOW, updated: NOW, app: 'reader' } }),
    ]
    expect(computeAttention(nodes, NOW).map(i => i.id)).toEqual(['reading'])
  })

  it('surfaces a fresh inbound handoff, but not a stale one', () => {
    const fresh = node('h1', { type: 'note', data: { from: 'src-a' } })
    const stale = node('h2', {
      type: 'note',
      data: { from: 'src-b' },
      meta: { created: NOW - 5 * DAY, updated: NOW - 5 * DAY, app: 'notes' },
    })
    const feed = computeAttention([fresh, stale], NOW)
    expect(feed.map(i => i.id)).toEqual(['h1'])
    expect(feed[0].kind).toBe('handoff')
  })

  it('surfaces a node once — the highest-scoring reason wins (de-dupe by id)', () => {
    // A just-created task carries data.from → it is BOTH a fresh handoff (70)
    // and an open task (50). It must appear exactly once, as the handoff.
    const dual = node('t1', { data: { done: false, from: 'src' } })
    const feed = computeAttention([dual], NOW)
    expect(feed).toHaveLength(1)
    expect(feed[0].kind).toBe('handoff')
  })

  it('breaks score ties by meta.updated (newest first)', () => {
    const nodes = [
      node('older', { data: { done: false }, meta: { created: NOW, updated: NOW - DAY, app: 'notes' } }),
      node('newer', { data: { done: false }, meta: { created: NOW, updated: NOW, app: 'notes' } }),
    ]
    const feed = computeAttention(nodes, NOW)
    expect(feed[0].score).toBe(feed[1].score)
    expect(feed.map(i => i.id)).toEqual(['newer', 'older'])
  })

  it('caps the feed at `limit`', () => {
    const nodes = Array.from({ length: 20 }, (_, i) =>
      node(`t${i}`, { data: { done: false }, meta: { created: NOW, updated: NOW - i, app: 'notes' } })
    )
    expect(computeAttention(nodes, NOW, 8)).toHaveLength(8)
    expect(computeAttention(nodes, NOW, 3)).toHaveLength(3)
  })

  it('carries the owning app id onto each item', () => {
    const feed = computeAttention([node('e', { type: 'event', data: { date: TODAY }, meta: { created: NOW, updated: NOW, app: 'calendar' } })], NOW)
    expect(feed[0].app).toBe('calendar')
    expect(feed[0].reasonKey).toBe('attention.event-today')
  })
})

describe('attentionSummary', () => {
  it('is empty and calm for an empty graph', () => {
    expect(attentionSummary([], NOW)).toEqual({ count: 0, top: null, urgent: false })
  })

  it('counts the feed and flags urgent when the top item is overdue', () => {
    const nodes = [
      node('open', { data: { done: false } }),
      node('overdue', { data: { done: false, due: YESTERDAY } }),
    ]
    const s = attentionSummary(nodes, NOW)
    expect(s.count).toBe(2)
    expect(s.top?.id).toBe('overdue')
    expect(s.urgent).toBe(true)
  })

  it('is not urgent when nothing overdue leads the feed', () => {
    const nodes = [
      node('open', { data: { done: false } }),
      node('event', { type: 'event', data: { date: TODAY }, meta: { created: NOW, updated: NOW, app: 'calendar' } }),
    ]
    const s = attentionSummary(nodes, NOW)
    expect(s.count).toBe(2)
    expect(s.top?.kind).toBe('event-today')
    expect(s.urgent).toBe(false)
  })

  it('respects the limit when counting', () => {
    const nodes = Array.from({ length: 12 }, (_, i) =>
      node(`t${i}`, { data: { done: false }, meta: { created: NOW, updated: NOW - i, app: 'notes' } })
    )
    expect(attentionSummary(nodes, NOW, 5).count).toBe(5)
  })
})

describe('shouldPulseAttention (S2 motion rule)', () => {
  it('pulses when a genuinely NEW item leads while inside an app', () => {
    expect(shouldPulseAttention('a', 'b', false)).toBe(true)
    expect(shouldPulseAttention(null, 'a', false)).toBe(true)
  })

  it('never pulses at home (the feed is already on screen)', () => {
    expect(shouldPulseAttention('a', 'b', true)).toBe(false)
    expect(shouldPulseAttention(null, 'a', true)).toBe(false)
  })

  it('does not pulse for the same top item you navigated past', () => {
    expect(shouldPulseAttention('a', 'a', false)).toBe(false)
  })

  it('does not pulse for an empty feed', () => {
    expect(shouldPulseAttention('a', null, false)).toBe(false)
    expect(shouldPulseAttention(null, null, false)).toBe(false)
  })
})
