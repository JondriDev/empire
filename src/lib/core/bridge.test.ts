import { describe, it, expect } from 'vitest'
import {
  dayStamp, isContentNode, eventsOn, goalStats,
  recentEntities, organismStats, greetingSlot, bridgeSnapshot, agoLabel,
} from './bridge'
import type { CoreNode } from './graph'

// Minimal CoreNode fixture — only the fields the selectors read.
function node(id: string, over: Partial<CoreNode> = {}): CoreNode {
  return {
    id,
    type: 'note',
    title: id,
    data: {},
    links: [],
    meta: { created: 0, updated: 0, app: 'notes' },
    ...over,
  }
}

// A fixed local-noon instant so hour/date readings are timezone-stable.
const NOON = new Date(2026, 6, 3, 12, 0, 0).getTime()
const TODAY = dayStamp(NOON)

describe('dayStamp', () => {
  it('formats a local YYYY-MM-DD matching Calendar data.date', () => {
    expect(dayStamp(new Date(2026, 0, 5).getTime())).toBe('2026-01-05')
    expect(dayStamp(new Date(2026, 11, 31).getTime())).toBe('2026-12-31')
  })
})

describe('isContentNode', () => {
  it('excludes shell app:* mirrors, keeps real entities', () => {
    expect(isContentNode(node('a', { type: 'app:network' }))).toBe(false)
    expect(isContentNode(node('b', { type: 'note' }))).toBe(true)
    expect(isContentNode(node('c', { type: 'task' }))).toBe(true)
  })
})

describe('eventsOn', () => {
  it('keeps only events dated the given day, earliest time first', () => {
    const nodes = [
      node('late',   { type: 'event', data: { date: TODAY, time: '18:00' } }),
      node('early',  { type: 'event', data: { date: TODAY, time: '08:30' } }),
      node('other',  { type: 'event', data: { date: '1999-01-01', time: '09:00' } }),
      node('n', { type: 'note' }),
    ]
    expect(eventsOn(nodes, TODAY).map(n => n.id)).toEqual(['early', 'late'])
  })

  it('sinks untimed events after timed ones', () => {
    const nodes = [
      node('untimed', { type: 'event', data: { date: TODAY, time: '' } }),
      node('timed',   { type: 'event', data: { date: TODAY, time: '23:00' } }),
    ]
    expect(eventsOn(nodes, TODAY).map(n => n.id)).toEqual(['timed', 'untimed'])
  })
})

describe('goalStats', () => {
  it('splits active vs done and averages active progress', () => {
    const nodes = [
      node('g1', { type: 'goal', data: { progress: 40, completed: false } }),
      node('g2', { type: 'goal', data: { progress: 80, completed: false } }),
      node('g3', { type: 'goal', data: { progress: 100, completed: true } }),
      node('n',  { type: 'note' }),
    ]
    expect(goalStats(nodes)).toEqual({ active: 2, done: 1, avgProgress: 60 })
  })

  it('handles missing progress fields and an empty graph', () => {
    expect(goalStats([node('g', { type: 'goal', data: {} })]))
      .toEqual({ active: 1, done: 0, avgProgress: 0 })
    expect(goalStats([])).toEqual({ active: 0, done: 0, avgProgress: 0 })
  })
})

describe('recentEntities', () => {
  it('returns content nodes newest-updated first, capped', () => {
    const nodes = [
      node('old',   { meta: { created: 1, updated: 1, app: 'notes' } }),
      node('new',   { meta: { created: 1, updated: 9, app: 'goals' } }),
      node('shell', { type: 'app:network', meta: { created: 1, updated: 99, app: 'network' } }),
      node('mid',   { meta: { created: 1, updated: 5, app: 'reader' } }),
    ]
    expect(recentEntities(nodes, 2).map(n => n.id)).toEqual(['new', 'mid'])
  })

  it('excludes finished tasks — done is not resumable', () => {
    const nodes = [
      node('done', { type: 'task', data: { done: true },  meta: { created: 1, updated: 9, app: 'goals' } }),
      node('open', { type: 'task', data: { done: false }, meta: { created: 1, updated: 2, app: 'goals' } }),
    ]
    expect(recentEntities(nodes).map(n => n.id)).toEqual(['open'])
  })
})

describe('organismStats', () => {
  it('counts content entities, all links, and distinct owning apps', () => {
    const nodes = [
      node('a', { links: ['b'], meta: { created: 0, updated: 0, app: 'notes' } }),
      node('b', { type: 'task', meta: { created: 0, updated: 0, app: 'goals' } }),
      node('c', { type: 'app:network', links: ['a'], meta: { created: 0, updated: 0, app: 'network' } }),
    ]
    // Shell node excluded from entities/apps but its links still count as mesh wiring.
    expect(organismStats(nodes)).toEqual({ entities: 2, links: 2, apps: 2 })
  })
})

describe('agoLabel', () => {
  it('renders terse minute/hour/day ages and clamps the future to now', () => {
    const now = 1_000_000_000
    expect(agoLabel(now, now)).toBe('now')
    expect(agoLabel(now - 4 * 60_000, now)).toBe('4m')
    expect(agoLabel(now - 3 * 3_600_000, now)).toBe('3h')
    expect(agoLabel(now - 6 * 86_400_000, now)).toBe('6d')
    expect(agoLabel(now + 60_000, now)).toBe('now')
  })
})

describe('greetingSlot', () => {
  it('maps hours onto the four EN/ID greeting slots', () => {
    expect(greetingSlot(6)).toBe('morning')
    expect(greetingSlot(13)).toBe('afternoon')
    expect(greetingSlot(17)).toBe('evening')
    expect(greetingSlot(22)).toBe('night')
    expect(greetingSlot(3)).toBe('night')
  })
})

describe('bridgeSnapshot', () => {
  it('composes one coherent reading from a graph snapshot', () => {
    const nodes = [
      node('ev', { type: 'event', data: { date: TODAY, time: '10:00' }, meta: { created: 1, updated: 1, app: 'calendar' } }),
      node('t',  { type: 'task', data: { done: false }, meta: { created: 1, updated: 8, app: 'goals' } }),
      node('g',  { type: 'goal', data: { progress: 50, completed: false }, meta: { created: 1, updated: 2, app: 'goals' } }),
    ]
    const s = bridgeSnapshot(nodes, NOON)
    expect(s.todayEvents.map(n => n.id)).toEqual(['ev'])
    expect(s.openTasks.map(n => n.id)).toEqual(['t'])
    expect(s.goals).toEqual({ active: 1, done: 0, avgProgress: 50 })
    expect(s.recent[0].id).toBe('t') // newest-updated leads the continue strip
    expect(s.organism.entities).toBe(3)
    expect(s.greeting).toBe('afternoon')
  })
})
