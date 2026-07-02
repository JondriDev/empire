import { describe, it, expect } from 'vitest'
import {
  recordEdges,
  edgesInto,
  edgesFrom,
  fedBy,
  feeds,
  recentEdges,
  lineageOf,
  MAX_EDGES,
  DEDUP_MS,
  type ProvEdge,
} from './provenance'

const edge = (fromApp: string, toApp: string, at: number, label?: string): ProvEdge => ({
  fromApp,
  toApp,
  at,
  ...(label !== undefined ? { label } : {}),
})

describe('recordEdges', () => {
  it('appends a fresh edge to the ledger', () => {
    const out = recordEdges([], edge('calculator', 'notes', 1000), 1000)
    expect(out).toEqual([edge('calculator', 'notes', 1000)])
  })

  it('keeps distinct pairs as separate rows', () => {
    let e: ProvEdge[] = []
    e = recordEdges(e, edge('calculator', 'notes', 1000), 1000)
    e = recordEdges(e, edge('notes', 'goals', 5000), 5000)
    expect(e).toHaveLength(2)
    expect(e[0].toApp).toBe('notes')
    expect(e[1].toApp).toBe('goals')
  })

  it('coalesces a same-pair burst within DEDUP_MS (bumps at, no append)', () => {
    const start = [edge('calculator', 'notes', 1000)]
    const out = recordEdges(start, edge('calculator', 'notes', 1000 + DEDUP_MS), 1000 + DEDUP_MS)
    expect(out).toHaveLength(1)
    expect(out[0].at).toBe(1000 + DEDUP_MS)
  })

  it('coalescing refreshes the label but keeps the prior one when the new edge omits it', () => {
    const withLabel = recordEdges(
      [edge('calculator', 'notes', 1000, 'send result')],
      edge('calculator', 'notes', 1200),
      1200,
    )
    expect(withLabel[0].label).toBe('send result')
    const replaced = recordEdges(
      [edge('calculator', 'notes', 1000, 'send result')],
      edge('calculator', 'notes', 1200, 'use as note'),
      1200,
    )
    expect(replaced[0].label).toBe('use as note')
  })

  it('appends (does not coalesce) once the burst window has passed', () => {
    const start = [edge('calculator', 'notes', 1000)]
    const out = recordEdges(start, edge('calculator', 'notes', 1000 + DEDUP_MS + 1), 1000 + DEDUP_MS + 1)
    expect(out).toHaveLength(2)
  })

  it('caps the ledger at MAX_EDGES, dropping the oldest', () => {
    let e: ProvEdge[] = []
    for (let i = 0; i < MAX_EDGES + 10; i++) {
      // Distinct target each time so nothing coalesces; strictly increasing time.
      e = recordEdges(e, edge('src', `t${i}`, i * 10_000), i * 10_000)
    }
    expect(e).toHaveLength(MAX_EDGES)
    expect(e[0].toApp).toBe('t10') // first 10 dropped
    expect(e[e.length - 1].toApp).toBe(`t${MAX_EDGES + 9}`)
  })
})

describe('edgesInto / edgesFrom', () => {
  const ledger = [
    edge('calculator', 'notes', 1000),
    edge('goals', 'notes', 3000),
    edge('notes', 'goals', 2000),
  ]

  it('edgesInto filters by target, newest first', () => {
    const into = edgesInto(ledger, 'notes')
    expect(into.map(e => e.fromApp)).toEqual(['goals', 'calculator'])
  })

  it('edgesFrom filters by source, newest first', () => {
    const from = edgesFrom(ledger, 'notes')
    expect(from.map(e => e.toApp)).toEqual(['goals'])
  })

  it('returns an empty array when nothing matches', () => {
    expect(edgesInto(ledger, 'weather')).toEqual([])
    expect(edgesFrom(ledger, 'weather')).toEqual([])
  })
})

describe('fedBy / feeds (the Network inspector selection)', () => {
  const ledger = [
    edge('calculator', 'notes', 1000),
    edge('weather', 'notes', 2000),
    edge('calculator', 'notes', 4000, 'again'), // newer calculator→notes
    edge('notes', 'goals', 3000),
    edge('notes', 'calendar', 5000),
  ]

  it('fedBy = distinct sources into an app, newest first, carrying newest at/label', () => {
    const into = fedBy(ledger, 'notes')
    expect(into.map(n => n.app)).toEqual(['calculator', 'weather'])
    // calculator's newest inbound edge (4000, "again") wins the dedupe.
    expect(into[0]).toEqual({ app: 'calculator', at: 4000, label: 'again' })
    expect(into[1]).toEqual({ app: 'weather', at: 2000 })
  })

  it('feeds = distinct targets from an app, newest first', () => {
    const out = feeds(ledger, 'notes')
    expect(out.map(n => n.app)).toEqual(['calendar', 'goals'])
    expect(out[0].at).toBe(5000)
  })

  it('returns empty arrays when the app has no history on that side', () => {
    expect(fedBy(ledger, 'goals')).toEqual([{ app: 'notes', at: 3000 }])
    expect(feeds(ledger, 'goals')).toEqual([])
    expect(fedBy(ledger, 'weather')).toEqual([])
  })
})

describe('recentEdges (the durable memory panel feed)', () => {
  const ledger = [
    edge('a', 'b', 1000),
    edge('b', 'c', 2000),
    edge('c', 'd', 3000),
  ]

  it('returns the newest N edges, newest first', () => {
    expect(recentEdges(ledger, 2).map(e => e.at)).toEqual([3000, 2000])
  })

  it('returns all edges newest-first when fewer than N exist', () => {
    expect(recentEdges(ledger, 12).map(e => e.at)).toEqual([3000, 2000, 1000])
  })

  it('returns an empty array for an empty ledger', () => {
    expect(recentEdges([], 12)).toEqual([])
  })
})

describe('lineageOf', () => {
  it('returns [app] when the app has no inbound history', () => {
    expect(lineageOf([], 'notes')).toEqual(['notes'])
  })

  it('walks a 3-deep chain backwards via the newest inbound edge', () => {
    // weather → calculator → notes → goals ; ask for goals' ancestry.
    const ledger = [
      edge('weather', 'calculator', 1000),
      edge('calculator', 'notes', 2000),
      edge('notes', 'goals', 3000),
    ]
    expect(lineageOf(ledger, 'goals')).toEqual(['goals', 'notes', 'calculator', 'weather'])
  })

  it('follows the NEWEST inbound edge when several feed the same app', () => {
    const ledger = [
      edge('weather', 'notes', 1000),
      edge('calculator', 'notes', 5000), // newer → the true parent
    ]
    expect(lineageOf(ledger, 'notes')).toEqual(['notes', 'calculator'])
  })

  it('stops on a cycle (A←B←A) instead of looping forever', () => {
    const ledger = [
      edge('a', 'b', 1000),
      edge('b', 'a', 2000),
    ]
    expect(lineageOf(ledger, 'a')).toEqual(['a', 'b'])
  })

  it('honours maxDepth', () => {
    const ledger = [
      edge('w', 'x', 1000),
      edge('x', 'y', 2000),
      edge('y', 'z', 3000),
    ]
    expect(lineageOf(ledger, 'z', 1)).toEqual(['z', 'y'])
  })
})
