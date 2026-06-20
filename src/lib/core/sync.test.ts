import { describe, it, expect, beforeEach } from 'vitest'
import { useGraph, nodesOfType } from './graph'
import { mirrorCollection } from './sync'

// The graph store is a singleton; reset it before each test for isolation.
beforeEach(() => {
  useGraph.setState({ nodes: {} })
})

const g = () => useGraph.getState()

interface Item {
  id: string
  title: string
  body: string
}

/** Mirror a list of `widget` items keyed by id; title + a `body` data field. */
function mirror(items: Item[]): void {
  mirrorCollection<Item>('widget', 'widgets', items, {
    id: i => i.id,
    title: i => i.title,
    data: i => ({ body: i.body }),
  })
}

describe('mirrorCollection — add', () => {
  it('creates a node per item with type/app/title/data and sourceId', () => {
    mirror([{ id: 'a', title: 'Alpha', body: 'one' }])
    const nodes = nodesOfType('widget')
    expect(nodes).toHaveLength(1)
    const node = nodes[0]
    expect(node.title).toBe('Alpha')
    expect(node.meta.app).toBe('widgets')
    expect(node.data).toEqual({ body: 'one', sourceId: 'a' })
  })

  it('mirrors many items at once', () => {
    mirror([
      { id: 'a', title: 'Alpha', body: 'one' },
      { id: 'b', title: 'Beta', body: 'two' },
    ])
    expect(nodesOfType('widget')).toHaveLength(2)
  })

  it('is idempotent — re-mirroring unchanged items adds nothing and keeps ids', () => {
    mirror([{ id: 'a', title: 'Alpha', body: 'one' }])
    const firstId = nodesOfType('widget')[0].id
    mirror([{ id: 'a', title: 'Alpha', body: 'one' }])
    const nodes = nodesOfType('widget')
    expect(nodes).toHaveLength(1)
    expect(nodes[0].id).toBe(firstId)
  })
})

describe('mirrorCollection — edit', () => {
  it('updates the existing node in place when the title changes', () => {
    mirror([{ id: 'a', title: 'Alpha', body: 'one' }])
    const before = nodesOfType('widget')[0]
    mirror([{ id: 'a', title: 'Renamed', body: 'one' }])
    const after = nodesOfType('widget')[0]
    expect(after.id).toBe(before.id)
    expect(after.title).toBe('Renamed')
  })

  it('updates the node when only the data changes', () => {
    mirror([{ id: 'a', title: 'Alpha', body: 'one' }])
    const before = nodesOfType('widget')[0]
    mirror([{ id: 'a', title: 'Alpha', body: 'changed' }])
    const after = nodesOfType('widget')[0]
    expect(after.id).toBe(before.id)
    expect(after.data).toEqual({ body: 'changed', sourceId: 'a' })
  })
})

describe('mirrorCollection — delete', () => {
  it('removes a node whose item is gone from the collection', () => {
    mirror([
      { id: 'a', title: 'Alpha', body: 'one' },
      { id: 'b', title: 'Beta', body: 'two' },
    ])
    mirror([{ id: 'a', title: 'Alpha', body: 'one' }])
    const nodes = nodesOfType('widget')
    expect(nodes).toHaveLength(1)
    expect(nodes[0].data.sourceId).toBe('a')
  })

  it('drops edges pointing at a deleted node', () => {
    mirror([
      { id: 'a', title: 'Alpha', body: 'one' },
      { id: 'b', title: 'Beta', body: 'two' },
    ])
    const a = nodesOfType('widget').find(n => n.data.sourceId === 'a')!
    const b = nodesOfType('widget').find(n => n.data.sourceId === 'b')!
    g().link(a.id, b.id)
    expect(g().nodes[a.id].links).toEqual([b.id])

    // `b` leaves the collection — its node and the inbound edge both vanish.
    mirror([{ id: 'a', title: 'Alpha', body: 'one' }])
    expect(g().nodes[b.id]).toBeUndefined()
    expect(g().nodes[a.id].links).toEqual([])
  })

  it('clears every node when the collection empties', () => {
    mirror([{ id: 'a', title: 'Alpha', body: 'one' }])
    mirror([])
    expect(nodesOfType('widget')).toEqual([])
  })
})

describe('mirrorCollection — isolation across types', () => {
  it('only reconciles nodes of its own type', () => {
    mirror([{ id: 'a', title: 'Alpha', body: 'one' }])
    mirrorCollection<Item>('gadget', 'gadgets', [{ id: 'x', title: 'X', body: 'b' }], {
      id: i => i.id,
      title: i => i.title,
      data: i => ({ body: i.body }),
    })
    // Re-mirroring an empty `widget` list must not touch `gadget` nodes.
    mirror([])
    expect(nodesOfType('widget')).toEqual([])
    expect(nodesOfType('gadget')).toHaveLength(1)
  })
})
