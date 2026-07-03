import { describe, it, expect } from 'vitest'
import {
  queryTerms,
  nodeBodyText,
  scoreNode,
  searchNodes,
  groupHitsByApp,
} from './search'
import type { CoreNode } from './graph'

let seq = 0
const node = (
  partial: Partial<CoreNode> & { title: string; app: string },
): CoreNode => ({
  id: `n${seq++}`,
  type: partial.type ?? 'note',
  title: partial.title,
  data: partial.data ?? {},
  links: partial.links ?? [],
  meta: {
    created: partial.meta?.created ?? 0,
    updated: partial.meta?.updated ?? 0,
    app: partial.app,
  },
})

describe('queryTerms', () => {
  it('lowercases and splits on whitespace, dropping empties', () => {
    expect(queryTerms('  Alien   Signal ')).toEqual(['alien', 'signal'])
  })
  it('returns [] for an empty / whitespace query', () => {
    expect(queryTerms('')).toEqual([])
    expect(queryTerms('   ')).toEqual([])
  })
})

describe('nodeBodyText', () => {
  it('flattens shallow string/number/boolean data values, skips nested objects', () => {
    const n = node({
      title: 'T',
      app: 'notes',
      data: { body: 'Hello World', count: 3, done: true, nested: { x: 'skip' } },
    })
    const text = nodeBodyText(n)
    expect(text).toContain('hello world')
    expect(text).toContain('3')
    expect(text).toContain('true')
    expect(text).not.toContain('skip') // nested objects stay skipped
  })

  it('flattens the scalar elements of array values (so tags become searchable)', () => {
    const n = node({ title: 'T', app: 'notes', data: { tags: ['Xenon', 'signal', 7], nope: [{ deep: 'skip' }] } })
    const text = nodeBodyText(n)
    expect(text).toContain('xenon')
    expect(text).toContain('signal')
    expect(text).toContain('7')
    expect(text).not.toContain('skip') // nested objects inside arrays stay skipped
  })
})

describe('scoreNode', () => {
  it('returns null for no terms', () => {
    expect(scoreNode(node({ title: 'x', app: 'notes' }), [])).toBeNull()
  })

  it('scores a title prefix higher than a substring, and a body-only match lowest', () => {
    const prefix = scoreNode(node({ title: 'Alien signal', app: 'notes' }), ['alien'])!
    const substr = scoreNode(node({ title: 'The alien', app: 'notes' }), ['alien'])!
    const bodyOnly = scoreNode(node({ title: 'Unrelated', app: 'notes', data: { body: 'an alien note' } }), ['alien'])!
    expect(prefix.score).toBeGreaterThan(substr.score)
    expect(substr.score).toBeGreaterThan(bodyOnly.score)
    expect(prefix.field).toBe('title')
    expect(bodyOnly.field).toBe('body')
    expect(bodyOnly.snippet).toContain('alien')
  })

  it('requires ALL terms to match somewhere (AND semantics)', () => {
    const n = node({ title: 'Alien signal', app: 'notes', data: { body: 'from deep space' } })
    expect(scoreNode(n, ['alien', 'space'])).not.toBeNull() // one in title, one in body
    expect(scoreNode(n, ['alien', 'banana'])).toBeNull()    // banana matches nothing
  })

  it('matches on node type (querying a type surfaces its nodes)', () => {
    const hit = scoreNode(node({ title: 'Do laundry', type: 'task', app: 'goals' }), ['task'])
    expect(hit).not.toBeNull()
    expect(hit!.field).toBe('type')
  })
})

describe('searchNodes', () => {
  const corpus = () => [
    node({ title: 'Alien signal', app: 'notes', meta: { created: 0, updated: 100, app: 'notes' } }),
    node({ title: 'Decode the alien signal', app: 'goals', type: 'goal', meta: { created: 0, updated: 200, app: 'goals' } }),
    node({ title: 'Grocery list', app: 'notes', data: { body: 'milk, eggs' } }),
    node({ title: 'Alien contact log', app: 'messages', type: 'message' }),
  ]

  it('returns [] for an empty query', () => {
    expect(searchNodes(corpus(), '')).toEqual([])
    expect(searchNodes(corpus(), '   ')).toEqual([])
  })

  it('finds matches across multiple apps and ranks title-prefix first', () => {
    const hits = searchNodes(corpus(), 'alien')
    const apps = new Set(hits.map(h => h.node.meta.app))
    expect(apps.size).toBeGreaterThanOrEqual(2)
    expect(hits[0].node.title).toBe('Alien signal') // prefix beats mid-title
    expect(hits.every(h => h.node.title.toLowerCase().includes('alien'))).toBe(true)
  })

  it('breaks score ties by most-recently-updated', () => {
    const a = node({ title: 'ping', app: 'notes', meta: { created: 0, updated: 10, app: 'notes' } })
    const b = node({ title: 'ping', app: 'notes', meta: { created: 0, updated: 99, app: 'notes' } })
    const hits = searchNodes([a, b], 'ping')
    expect(hits[0].node.meta.updated).toBe(99)
  })

  it('respects the limit', () => {
    const many = Array.from({ length: 10 }, (_, i) => node({ title: `alien ${i}`, app: 'notes' }))
    expect(searchNodes(many, 'alien', 3)).toHaveLength(3)
  })

  it('finds a node whose term lives ONLY in a tag (array body)', () => {
    const tagged = node({ title: 'Untitled', app: 'notes', data: { content: '', tags: ['xenon'] } })
    const other = node({ title: 'Unrelated', app: 'notes', data: { content: 'nothing here', tags: [] } })
    const hits = searchNodes([tagged, other], 'xenon')
    expect(hits).toHaveLength(1)
    expect(hits[0].node).toBe(tagged)
    expect(hits[0].field).toBe('body')
  })
})

describe('groupHitsByApp', () => {
  it('groups hits by owning app and orders groups by best hit', () => {
    const hits = searchNodes([
      node({ title: 'zeta note about alien', app: 'notes', data: {} }),        // body/substr-ish
      node({ title: 'Alien plan', app: 'goals', type: 'goal' }),               // title prefix — best
    ], 'alien')
    const groups = groupHitsByApp(hits)
    expect(groups[0].app).toBe('goals') // higher topScore group first
    expect(groups.map(g => g.app).sort()).toEqual(['goals', 'notes'])
    expect(groups.reduce((n, g) => n + g.hits.length, 0)).toBe(hits.length)
  })

  it('returns [] for no hits', () => {
    expect(groupHitsByApp([])).toEqual([])
  })
})
