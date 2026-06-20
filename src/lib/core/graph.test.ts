import { describe, it, expect, beforeEach } from 'vitest'
import { useGraph, nodesOfType, neighbors } from './graph'

// The store is a singleton; reset it before each test for isolation.
beforeEach(() => {
  useGraph.setState({ nodes: {} })
})

const g = () => useGraph.getState()

describe('addNode', () => {
  it('creates a node with defaults and returns it', () => {
    const node = g().addNode({ type: 'note', title: 'Hello', app: 'notes' })
    expect(node.id).toBeTruthy()
    expect(node.type).toBe('note')
    expect(node.title).toBe('Hello')
    expect(node.data).toEqual({})
    expect(node.links).toEqual([])
    expect(node.meta.app).toBe('notes')
    expect(node.meta.created).toBe(node.meta.updated)
    expect(g().nodes[node.id]).toEqual(node)
  })

  it('keeps supplied data and links', () => {
    const node = g().addNode({
      type: 'task', title: 'Do', app: 'tasks',
      data: { done: false }, links: ['x'],
    })
    expect(node.data).toEqual({ done: false })
    expect(node.links).toEqual(['x'])
  })

  it('gives each node a distinct id', () => {
    const a = g().addNode({ type: 'note', title: 'a', app: 'notes' })
    const b = g().addNode({ type: 'note', title: 'b', app: 'notes' })
    expect(a.id).not.toBe(b.id)
    expect(Object.keys(g().nodes)).toHaveLength(2)
  })
})

describe('updateNode', () => {
  it('patches title and data, bumps updated', () => {
    const node = g().addNode({ type: 'note', title: 'old', app: 'notes' })
    g().updateNode(node.id, { title: 'new', data: { k: 1 } })
    const after = g().nodes[node.id]
    expect(after.title).toBe('new')
    expect(after.data).toEqual({ k: 1 })
    expect(after.meta.updated).toBeGreaterThanOrEqual(node.meta.created)
    expect(after.meta.created).toBe(node.meta.created)
  })

  it('is a no-op for an unknown id', () => {
    expect(() => g().updateNode('missing', { title: 'x' })).not.toThrow()
    expect(g().nodes.missing).toBeUndefined()
  })
})

describe('deleteNode', () => {
  it('removes the node', () => {
    const node = g().addNode({ type: 'note', title: 'a', app: 'notes' })
    g().deleteNode(node.id)
    expect(g().nodes[node.id]).toBeUndefined()
  })

  it('scrubs inbound edges pointing at the deleted node', () => {
    const a = g().addNode({ type: 'note', title: 'a', app: 'notes' })
    const b = g().addNode({ type: 'note', title: 'b', app: 'notes' })
    g().link(a.id, b.id)
    g().deleteNode(b.id)
    expect(g().nodes[a.id].links).toEqual([])
  })

  it('is a no-op for an unknown id', () => {
    const a = g().addNode({ type: 'note', title: 'a', app: 'notes' })
    g().deleteNode('missing')
    expect(Object.keys(g().nodes)).toEqual([a.id])
  })
})

describe('link / unlink', () => {
  it('adds a directed edge', () => {
    const a = g().addNode({ type: 'note', title: 'a', app: 'notes' })
    const b = g().addNode({ type: 'note', title: 'b', app: 'notes' })
    g().link(a.id, b.id)
    expect(g().nodes[a.id].links).toEqual([b.id])
    expect(g().nodes[b.id].links).toEqual([])
  })

  it('is idempotent', () => {
    const a = g().addNode({ type: 'note', title: 'a', app: 'notes' })
    const b = g().addNode({ type: 'note', title: 'b', app: 'notes' })
    g().link(a.id, b.id)
    g().link(a.id, b.id)
    expect(g().nodes[a.id].links).toEqual([b.id])
  })

  it('refuses self-links and links to missing targets', () => {
    const a = g().addNode({ type: 'note', title: 'a', app: 'notes' })
    g().link(a.id, a.id)
    g().link(a.id, 'missing')
    expect(g().nodes[a.id].links).toEqual([])
  })

  it('unlink removes an existing edge', () => {
    const a = g().addNode({ type: 'note', title: 'a', app: 'notes' })
    const b = g().addNode({ type: 'note', title: 'b', app: 'notes' })
    g().link(a.id, b.id)
    g().unlink(a.id, b.id)
    expect(g().nodes[a.id].links).toEqual([])
  })

  it('unlink is a no-op when no such edge exists', () => {
    const a = g().addNode({ type: 'note', title: 'a', app: 'notes' })
    const b = g().addNode({ type: 'note', title: 'b', app: 'notes' })
    expect(() => g().unlink(a.id, b.id)).not.toThrow()
    expect(g().nodes[a.id].links).toEqual([])
  })
})

describe('nodesOfType', () => {
  it('returns only matching types, newest-updated first', () => {
    const a = g().addNode({ type: 'note', title: 'a', app: 'notes' })
    g().addNode({ type: 'task', title: 't', app: 'tasks' })
    const b = g().addNode({ type: 'note', title: 'b', app: 'notes' })
    // Make `a` the most recently updated.
    g().updateNode(a.id, { title: 'a2' })
    const notes = nodesOfType('note')
    expect(notes.map(n => n.id)).toEqual([a.id, b.id])
  })

  it('returns an empty array for an unused type', () => {
    expect(nodesOfType('ghost')).toEqual([])
  })
})

describe('neighbors', () => {
  it('returns the nodes a node links out to', () => {
    const a = g().addNode({ type: 'note', title: 'a', app: 'notes' })
    const b = g().addNode({ type: 'note', title: 'b', app: 'notes' })
    g().link(a.id, b.id)
    expect(neighbors(a.id).map(n => n.id)).toEqual([b.id])
  })

  it('returns an empty array for an unknown node', () => {
    expect(neighbors('missing')).toEqual([])
  })
})
