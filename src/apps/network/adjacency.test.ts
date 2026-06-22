import { describe, it, expect } from 'vitest'
import { appAdjacency, entitiesByApp } from './adjacency'
import type { CoreNode } from '../../lib/core/graph'

// Minimal CoreNode factory for fixtures.
function node(id: string, app: string, type: string, links: string[] = []): CoreNode {
  return { id, type, title: id, data: {}, links, meta: { created: 0, updated: 0, app } }
}

describe('appAdjacency', () => {
  it('projects node links into directed app→app edges', () => {
    // A note owned by calculator links a task owned by goals.
    const nodes = [
      node('a', 'calculator', 'note', ['b']),
      node('b', 'goals', 'task'),
    ]
    const adj = appAdjacency(nodes)
    expect(adj.calculator.out).toContain('goals')
    expect(adj.goals.in).toContain('calculator')
    // No spurious reverse edge.
    expect(adj.calculator.in).toEqual([])
    expect(adj.goals.out).toEqual([])
  })

  it('drops self-edges (a node linking another node it owns)', () => {
    const nodes = [
      node('a', 'notes', 'note', ['b']),
      node('b', 'notes', 'task'),
    ]
    expect(appAdjacency(nodes)).toEqual({})
  })

  it('drops edges touching an unknown owner or a dangling link', () => {
    const nodes = [
      node('a', 'mystery-app', 'note', ['b']), // unknown source owner
      node('b', 'goals', 'task', ['gone']),    // dangling link target
      node('c', 'calculator', 'note', ['x']),  // links an unknown owner
      node('x', 'another-mystery', 'task'),
    ]
    expect(appAdjacency(nodes)).toEqual({})
  })

  it('de-dupes and sorts neighbour lists', () => {
    const nodes = [
      node('a', 'editor', 'note', ['b', 'c']),
      node('b', 'notes', 'task'),
      node('c', 'notes', 'task'),       // second editor→notes edge collapses
      node('d', 'editor', 'note', ['e']),
      node('e', 'calendar', 'event'),
    ]
    const adj = appAdjacency(nodes)
    expect(adj.editor.out).toEqual(['calendar', 'notes'])
  })
})

describe('entitiesByApp', () => {
  it('groups nodes by owning app, newest first', () => {
    const nodes = [
      { ...node('a', 'notes', 'note'), meta: { created: 0, updated: 1, app: 'notes' } },
      { ...node('b', 'notes', 'note'), meta: { created: 0, updated: 3, app: 'notes' } },
      node('c', 'goals', 'task'),
    ]
    const grouped = entitiesByApp(nodes)
    expect(grouped.notes.map(n => n.id)).toEqual(['b', 'a'])
    expect(grouped.goals).toHaveLength(1)
  })
})
