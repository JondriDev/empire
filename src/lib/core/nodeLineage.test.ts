import { describe, it, expect } from 'vitest'
import { parentIdOf, nodeLineageOf, childrenOf } from './nodeLineage'
import type { CoreNode } from './graph'

// Minimal CoreNode factory. `from` is the per-artifact ancestry link the core
// intents stamp (make-task/make-note-from/add-to-learning → data.from).
const node = (
  id: string,
  opts: { from?: unknown; app?: string; title?: string; updated?: number } = {},
): CoreNode => ({
  id,
  type: 'task',
  title: opts.title ?? id,
  data: opts.from !== undefined ? { from: opts.from } : {},
  links: [],
  meta: { created: 0, updated: opts.updated ?? 0, app: opts.app ?? 'goals' },
})

const graph = (...ns: CoreNode[]): Record<string, CoreNode> =>
  Object.fromEntries(ns.map(n => [n.id, n]))

describe('parentIdOf', () => {
  it('returns the stamped from id', () => {
    expect(parentIdOf(node('c', { from: 'p' }))).toBe('p')
  })
  it('returns undefined when there is no from', () => {
    expect(parentIdOf(node('c'))).toBeUndefined()
  })
  it('ignores a non-string / empty from (e.g. a boolean flag)', () => {
    expect(parentIdOf(node('c', { from: true }))).toBeUndefined()
    expect(parentIdOf(node('c', { from: '' }))).toBeUndefined()
  })
})

describe('nodeLineageOf', () => {
  it('returns just the node when it has no ancestry', () => {
    const g = graph(node('a'))
    expect(nodeLineageOf(g, 'a').map(n => n.id)).toEqual(['a'])
  })

  it('returns [] when the node is not in the graph', () => {
    expect(nodeLineageOf(graph(node('a')), 'missing')).toEqual([])
  })

  it('walks a 3-deep chain newest → oldest', () => {
    // c ← b ← a  (c derived from b, b derived from a)
    const g = graph(node('a'), node('b', { from: 'a' }), node('c', { from: 'b' }))
    expect(nodeLineageOf(g, 'c').map(n => n.id)).toEqual(['c', 'b', 'a'])
  })

  it('stops when a parent id is absent from the graph (pruned/foreign parent)', () => {
    const g = graph(node('c', { from: 'ghost' }))
    expect(nodeLineageOf(g, 'c').map(n => n.id)).toEqual(['c'])
  })

  it('is cycle-guarded (a ← b ← a does not loop forever)', () => {
    const g = graph(node('a', { from: 'b' }), node('b', { from: 'a' }))
    expect(nodeLineageOf(g, 'a').map(n => n.id)).toEqual(['a', 'b'])
  })

  it('honours the depth cap', () => {
    // 5-long chain e←d←c←b←a, cap at 2 hops → 3 nodes
    const g = graph(
      node('a'),
      node('b', { from: 'a' }),
      node('c', { from: 'b' }),
      node('d', { from: 'c' }),
      node('e', { from: 'd' }),
    )
    expect(nodeLineageOf(g, 'e', 2).map(n => n.id)).toEqual(['e', 'd', 'c'])
  })
})

describe('childrenOf', () => {
  it('returns every node derived from the id, newest first', () => {
    const g = graph(
      node('p'),
      node('x', { from: 'p', updated: 10 }),
      node('y', { from: 'p', updated: 30 }),
      node('z', { from: 'other', updated: 20 }),
    )
    expect(childrenOf(g, 'p').map(n => n.id)).toEqual(['y', 'x'])
  })

  it('returns [] when nothing was derived from the id', () => {
    expect(childrenOf(graph(node('p')), 'p')).toEqual([])
  })
})
