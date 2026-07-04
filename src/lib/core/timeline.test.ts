import { describe, it, expect } from 'vitest'
import {
  buildTimeline,
  dayKey,
  groupByDay,
  relativeDayLabel,
  filterTimeline,
  timelineFacets,
  type TimelineEntry,
} from './timeline'
import type { CoreNode } from './graph'
import type { ProvEdge } from './provenance'

// Minimal CoreNode factory — only the fields the timeline reads matter.
const node = (
  id: string,
  created: number,
  opts: { app?: string; title?: string; type?: string } = {},
): CoreNode => ({
  id,
  type: opts.type ?? 'task',
  title: opts.title ?? id,
  data: {},
  links: [],
  meta: { created, updated: created, app: opts.app ?? 'goals' },
})

const graph = (...ns: CoreNode[]): Record<string, CoreNode> =>
  Object.fromEntries(ns.map(n => [n.id, n]))

const edge = (fromApp: string, toApp: string, at: number, label?: string): ProvEdge => ({
  fromApp, toApp, at, ...(label !== undefined ? { label } : {}),
})

// A fixed UTC instant so day math is deterministic: 2026-07-04T12:00:00Z.
const NOW = Date.UTC(2026, 6, 4, 12, 0, 0)
const DAY = 86_400_000

describe('buildTimeline', () => {
  it('merges entity births and flows into one stream', () => {
    const stream = buildTimeline(graph(node('a', 100), node('b', 200)), [edge('notes', 'goals', 150)])
    expect(stream).toHaveLength(3)
    expect(stream.filter(e => e.kind === 'entity')).toHaveLength(2)
    expect(stream.filter(e => e.kind === 'flow')).toHaveLength(1)
  })

  it('sorts strictly newest-first by `at` across both kinds', () => {
    const stream = buildTimeline(
      graph(node('a', 100), node('b', 300)),
      [edge('notes', 'goals', 200)],
    )
    expect(stream.map(e => e.at)).toEqual([300, 200, 100])
    expect(stream[1].kind).toBe('flow')
  })

  it('maps an entity entry from a CoreNode (created/app/title/type/nodeId)', () => {
    const [entry] = buildTimeline(graph(node('x', 500, { app: 'notes', title: 'Field log', type: 'note' })), [])
    expect(entry).toMatchObject({
      id: 'n:x', kind: 'entity', at: 500, nodeId: 'x', app: 'notes', title: 'Field log', type: 'note',
    })
  })

  it('maps a flow entry from a ProvEdge (at/fromApp/toApp/label + synthesized title)', () => {
    const [entry] = buildTimeline({}, [edge('notes', 'goals', 400, 'use as goal')])
    expect(entry).toMatchObject({
      id: 'e:notes:goals:400', kind: 'flow', at: 400, app: 'notes', toApp: 'goals', label: 'use as goal',
    })
    expect(entry.title).toBe('notes → goals')
    expect(entry.nodeId).toBeUndefined()
  })

  it('breaks `at` ties deterministically by id (descending)', () => {
    const s1 = buildTimeline(graph(node('a', 100), node('b', 100)), [])
    const s2 = buildTimeline(graph(node('b', 100), node('a', 100)), [])
    // Same order regardless of insertion order; id 'n:b' > 'n:a' so it leads.
    expect(s1.map(e => e.id)).toEqual(['n:b', 'n:a'])
    expect(s2.map(e => e.id)).toEqual(['n:b', 'n:a'])
  })

  it('caps the stream to `limit`, keeping the newest', () => {
    const nodes = graph(...Array.from({ length: 5 }, (_, i) => node(`n${i}`, i * 10)))
    const stream = buildTimeline(nodes, [], 3)
    expect(stream).toHaveLength(3)
    expect(stream.map(e => e.at)).toEqual([40, 30, 20])
  })

  it('returns [] for an empty graph and no edges', () => {
    expect(buildTimeline({}, [])).toEqual([])
  })
})

describe('dayKey', () => {
  it('buckets to a stable zero-padded UTC YYYY-MM-DD', () => {
    expect(dayKey(Date.UTC(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(dayKey(Date.UTC(2026, 11, 31, 0, 0))).toBe('2026-12-31')
  })

  it('is UTC-based — an instant just before UTC midnight stays on its UTC day', () => {
    // 2026-07-04T23:30:00Z is the 4th in UTC regardless of the runner's tz.
    expect(dayKey(Date.UTC(2026, 6, 4, 23, 30))).toBe('2026-07-04')
  })
})

describe('groupByDay', () => {
  it('buckets by day, days + entries both newest-first, order preserved', () => {
    const stream = buildTimeline(
      graph(
        node('today-late', NOW + 3 * 3600_000),
        node('today-early', NOW),
        node('yesterday', NOW - DAY),
      ),
      [],
    )
    const days = groupByDay(stream)
    expect(days.map(d => d.day)).toEqual(['2026-07-04', '2026-07-03'])
    expect(days[0].entries.map(e => e.nodeId)).toEqual(['today-late', 'today-early'])
    expect(days[1].entries.map(e => e.nodeId)).toEqual(['yesterday'])
  })

  it('returns [] for an empty stream', () => {
    expect(groupByDay([])).toEqual([])
  })

  it('returns an ordered array (not a map) so render order is fixed', () => {
    const entries: TimelineEntry[] = [
      { id: 'a', kind: 'flow', at: NOW, app: 'x', toApp: 'y', title: 'x → y' },
      { id: 'b', kind: 'flow', at: NOW - 2 * DAY, app: 'x', toApp: 'y', title: 'x → y' },
    ]
    expect(Array.isArray(groupByDay(entries))).toBe(true)
    expect(groupByDay(entries)).toHaveLength(2)
  })
})

describe('relativeDayLabel', () => {
  it('labels the current UTC day "Today"', () => {
    expect(relativeDayLabel(dayKey(NOW), NOW)).toBe('Today')
  })

  it('labels the prior UTC day "Yesterday"', () => {
    expect(relativeDayLabel(dayKey(NOW - DAY), NOW)).toBe('Yesterday')
  })

  it('falls back to the raw YYYY-MM-DD for older days', () => {
    expect(relativeDayLabel('2026-06-30', NOW)).toBe('2026-06-30')
  })
})

// A representative mixed stream: entities from notes(2)/goals(1) + one notes→goals flow.
const mixed = (): TimelineEntry[] =>
  buildTimeline(
    graph(
      node('a', 400, { app: 'notes', type: 'note' }),
      node('b', 300, { app: 'goals', type: 'task' }),
      node('c', 200, { app: 'notes', type: 'note' }),
    ),
    [edge('notes', 'goals', 100)],
  )

describe('filterTimeline', () => {
  it('empty filter returns the input untouched, order preserved', () => {
    const stream = mixed()
    expect(filterTimeline(stream, {})).toBe(stream)
    expect(filterTimeline(stream, { apps: [], kinds: [] }).map(e => e.id)).toEqual(stream.map(e => e.id))
  })

  it('an app filter keeps only that app’s entries (OR within the dimension)', () => {
    const kept = filterTimeline(mixed(), { apps: ['goals'] })
    // Only the goals entity 'b' — the notes entities + the flow (fromApp notes) drop.
    expect(kept.map(e => e.id)).toEqual(['n:b'])
  })

  it('a kind filter keeps only that kind', () => {
    const flowsOnly = filterTimeline(mixed(), { kinds: ['flow'] })
    expect(flowsOnly).toHaveLength(1)
    expect(flowsOnly[0].kind).toBe('flow')
    const entitiesOnly = filterTimeline(mixed(), { kinds: ['entity'] })
    expect(entitiesOnly.every(e => e.kind === 'entity')).toBe(true)
    expect(entitiesOnly).toHaveLength(3)
  })

  it('ANDs across dimensions (app AND kind must both pass)', () => {
    // notes + entity → the two notes entities, NOT the notes→goals flow.
    const kept = filterTimeline(mixed(), { apps: ['notes'], kinds: ['entity'] })
    expect(kept.map(e => e.id)).toEqual(['n:a', 'n:c'])
  })

  it('a types filter matches only entity entries (flows carry no type)', () => {
    const kept = filterTimeline(mixed(), { types: ['note'] })
    expect(kept.map(e => e.id)).toEqual(['n:a', 'n:c'])
  })
})

describe('timelineFacets', () => {
  it('counts distinct apps + kinds busiest-first, then value-asc', () => {
    const { apps: appFacets, kinds } = timelineFacets(mixed())
    // notes = 2 entities + 1 flow = 3; goals = 1 entity. notes leads on count.
    expect(appFacets).toEqual([
      { value: 'notes', count: 3 },
      { value: 'goals', count: 1 },
    ])
    // entity = 3, flow = 1.
    expect(kinds).toEqual([
      { value: 'entity', count: 3 },
      { value: 'flow', count: 1 },
    ])
  })

  it('is computed over the UNFILTERED stream (empty → empty facets)', () => {
    expect(timelineFacets([])).toEqual({ apps: [], kinds: [] })
  })
})
