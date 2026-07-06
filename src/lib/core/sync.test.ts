import { describe, it, expect, beforeEach } from 'vitest'
import { useGraph, nodesOfType } from './graph'
import { useStore } from '../store'
import { mirrorCollection, startCoreSync } from './sync'
import { runIntent } from './intents'

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

// EPIC-12 S1: make-note-from must produce a REAL, un-prunable note — routed
// through the store (useStore.addNote) so subscribe→reconcile materializes a
// sourceId-keyed mirror — not a phantom graph-only node reconcile() would prune.
describe('make-note-from — real store round-trip (EPIC-12 S1)', () => {
  beforeEach(() => {
    // startCoreSync registers the real C-layer intents + subscribes syncAll to the
    // store (idempotent — the subscription persists across tests). Reset both stores.
    startCoreSync()
    useGraph.setState({ nodes: {} })
    useStore.setState({ notes: [], learningItems: [], messages: [] })
  })

  /** Seed a graph-survivable `task` source owned by `app` and return its CoreNode. */
  function seedSource(app = 'goals', data: Record<string, unknown> = { done: false, content: 'source body' }) {
    return g().addNode({ type: 'task', title: 'Chart the anomaly', data, app })
  }

  it('adds exactly one real note to the store with from=source id, copied content and Note: title', async () => {
    const src = seedSource()
    await runIntent('make-note-from', src)
    const notes = useStore.getState().notes
    expect(notes).toHaveLength(1)
    expect(notes[0].from).toBe(src.id)
    expect(notes[0].content).toBe('source body')
    expect(notes[0].title).toBe('Note: Chart the anomaly')
  })

  it('falls back to the source title as content when the source has no string data.content', async () => {
    const src = seedSource('goals', { done: false })
    await runIntent('make-note-from', src)
    expect(useStore.getState().notes[0].content).toBe('Chart the anomaly')
  })

  it('materializes an un-prunable mirror node owned by notes, carrying data.from + sourceId', async () => {
    const src = seedSource()
    await runIntent('make-note-from', src)
    const noteNodes = nodesOfType('note')
    expect(noteNodes).toHaveLength(1)
    const node = noteNodes[0]
    expect(node.meta.app).toBe('notes')
    expect(node.data.from).toBe(src.id)
    expect(node.data.sourceId).toBe(useStore.getState().notes[0].id)
  })

  it('the store-backed mirror survives a reconcile while a phantom (no sourceId) is pruned', () => {
    // A phantom: a graph-only `note` node with NO sourceId — the exact shape the
    // pre-S1 intent produced. reconcile() (fired by any store set) must delete it.
    g().addNode({ type: 'note', title: 'Phantom', data: { content: 'x' }, app: 'notes' })
    expect(nodesOfType('note')).toHaveLength(1)
    // A real store write fires subscribe→syncAll→reconcile.
    useStore.getState().addNote({ id: 'real-1', title: 'Real', content: 'y', tags: [], updatedAt: 1 })
    const notes = nodesOfType('note')
    // The phantom is gone; only the store-backed (sourceId-keyed) node remains.
    expect(notes).toHaveLength(1)
    expect(notes[0].data.sourceId).toBe('real-1')
  })
})

// EPIC-12 S2: add-to-learning must produce a REAL, un-prunable Learning item —
// routed through the store (useStore.addLearningItem) so subscribe→reconcile
// materializes a sourceId-keyed mirror owned by learning-tracker — not a phantom
// graph-only node reconcile() would prune. `add-to-learning` accepts note/message,
// so seed a REAL note first (which itself survives), then learn from its mirror.
describe('add-to-learning — real store round-trip (EPIC-12 S2)', () => {
  beforeEach(() => {
    startCoreSync()
    useGraph.setState({ nodes: {} })
    useStore.setState({ notes: [], learningItems: [], messages: [] })
  })

  /** Seed a REAL note via the store and return its synchronously-mirrored `note` CoreNode. */
  function seedNoteSource(id = 'src-note') {
    useStore.getState().addNote({ id, title: 'Resonance lattice', content: 'lattice harmonics', tags: [], updatedAt: 1 })
    return nodesOfType('note').find(n => n.data.sourceId === id)!
  }

  it('adds exactly one real learning item to the store with from=source id and topic=source title', async () => {
    const src = seedNoteSource()
    await runIntent('add-to-learning', src)
    const items = useStore.getState().learningItems
    expect(items).toHaveLength(1)
    expect(items[0].from).toBe(src.id)
    expect(items[0].topic).toBe('Resonance lattice')
    expect(items[0].learned).toBe('')
    expect(items[0].mastered).toBe(false)
    // date + nextReview are ISO day strings (YYYY-MM-DD).
    expect(items[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(items[0].nextReview).toBe(items[0].date)
  })

  it('materializes an un-prunable learning mirror owned by learning-tracker, carrying data.from + sourceId', async () => {
    const src = seedNoteSource()
    await runIntent('add-to-learning', src)
    const learnNodes = nodesOfType('learning')
    expect(learnNodes).toHaveLength(1)
    const node = learnNodes[0]
    expect(node.meta.app).toBe('learning-tracker')
    expect(node.data.from).toBe(src.id)
    expect(node.data.sourceId).toBe(useStore.getState().learningItems[0].id)
  })

  it('the store-backed learning mirror survives a reconcile while a phantom (no sourceId) is pruned', () => {
    // A phantom: a graph-only `learning` node with NO sourceId — the exact shape the
    // pre-S2 intent produced. reconcile() (fired by any store set) must delete it.
    g().addNode({ type: 'learning', title: 'Phantom', data: { learned: false }, app: 'learning-tracker' })
    expect(nodesOfType('learning')).toHaveLength(1)
    // A real store write fires subscribe→syncAll→reconcile.
    useStore.getState().addLearningItem({ id: 'real-l1', topic: 'Real', learned: '', date: '2026-07-06', nextReview: '2026-07-06', mastered: false })
    const learn = nodesOfType('learning')
    // The phantom is gone; only the store-backed (sourceId-keyed) node remains.
    expect(learn).toHaveLength(1)
    expect(learn[0].data.sourceId).toBe('real-l1')
  })

  it('links the source node to the mirrored learning item (mesh edge)', async () => {
    const src = seedNoteSource()
    await runIntent('add-to-learning', src)
    const learnNode = nodesOfType('learning')[0]
    expect(g().nodes[src.id].links).toContain(learnNode.id)
  })
})
