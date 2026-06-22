import { describe, it, expect } from 'vitest'
import { partitionTasks, taskNodes, isTaskDone } from './tasks'
import type { CoreNode } from './graph'

// Minimal CoreNode fixture — only the fields the selectors read.
function node(id: string, over: Partial<CoreNode> = {}): CoreNode {
  return {
    id,
    type: 'task',
    title: `Do: ${id}`,
    data: { done: false },
    links: [],
    meta: { created: 0, updated: 0, app: 'notes' },
    ...over,
  }
}

describe('taskNodes', () => {
  it('keeps only task-typed nodes, newest (by created) first', () => {
    const nodes = [
      node('a', { meta: { created: 1, updated: 1, app: 'notes' } }),
      node('b', { type: 'note', meta: { created: 2, updated: 2, app: 'notes' } }),
      node('c', { meta: { created: 3, updated: 3, app: 'goals' } }),
    ]
    const ids = taskNodes(nodes).map(n => n.id)
    expect(ids).toEqual(['c', 'a']) // note 'b' dropped, newest-first order
  })
})

describe('isTaskDone', () => {
  it('is true only when data.done === true', () => {
    expect(isTaskDone(node('a', { data: { done: true } }))).toBe(true)
    expect(isTaskDone(node('a', { data: { done: false } }))).toBe(false)
    expect(isTaskDone(node('a', { data: {} }))).toBe(false)
  })
})

describe('partitionTasks', () => {
  it('splits tasks into open and done, each newest-first, excluding non-tasks', () => {
    const nodes = [
      node('open-old', { data: { done: false }, meta: { created: 1, updated: 1, app: 'notes' } }),
      node('done-mid', { data: { done: true }, meta: { created: 2, updated: 9, app: 'notes' } }),
      node('open-new', { data: { done: false }, meta: { created: 3, updated: 3, app: 'goals' } }),
      node('a-note', { type: 'note', meta: { created: 4, updated: 4, app: 'notes' } }),
    ]
    const { open, done } = partitionTasks(nodes)
    expect(open.map(n => n.id)).toEqual(['open-new', 'open-old'])
    expect(done.map(n => n.id)).toEqual(['done-mid'])
  })

  it('returns empty buckets for a graph with no tasks', () => {
    expect(partitionTasks([node('n', { type: 'note' })])).toEqual({ open: [], done: [] })
  })
})
