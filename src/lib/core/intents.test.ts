import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { CoreNode } from './graph'
import { registerIntent, intentsFor, runIntent, allIntents } from './intents'
import { getRecent, clearHistory } from '../eventBus'

// The intent registry is a module-level singleton. There's no public reset,
// so each test cleans up via the unregister fns `registerIntent` returns.
let cleanups: Array<() => void> = []

function register(...intents: Parameters<typeof registerIntent>[0][]): void {
  for (const i of intents) cleanups.push(registerIntent(i))
}

beforeEach(() => {
  clearHistory()
})

afterEach(() => {
  cleanups.forEach(off => off())
  cleanups = []
})

let nodeSeq = 0
function node(type: string, overrides: Partial<CoreNode> = {}): CoreNode {
  const now = Date.now()
  return {
    id: `node-${nodeSeq++}`,
    type,
    title: `${type} node`,
    data: {},
    links: [],
    meta: { created: now, updated: now, app: type },
    ...overrides,
  }
}

describe('registerIntent', () => {
  it('adds the intent so it shows up in allIntents', () => {
    register({ id: 'x.do', label: 'Do', accepts: () => true, run: () => {} })
    expect(allIntents().map(i => i.id)).toContain('x.do')
  })

  it('returns an unregister fn that removes the intent', () => {
    const off = registerIntent({ id: 'x.temp', label: 'Temp', accepts: () => true, run: () => {} })
    expect(allIntents().map(i => i.id)).toContain('x.temp')
    off()
    expect(allIntents().map(i => i.id)).not.toContain('x.temp')
  })

  it('replaces an intent registered under the same id', () => {
    register({ id: 'x.dup', label: 'First', accepts: () => true, run: () => {} })
    register({ id: 'x.dup', label: 'Second', accepts: () => true, run: () => {} })
    const matches = allIntents().filter(i => i.id === 'x.dup')
    expect(matches).toHaveLength(1)
    expect(matches[0].label).toBe('Second')
  })
})

describe('intentsFor', () => {
  it('returns only intents whose accepts() passes for the node', () => {
    register(
      { id: 'note.only', label: 'Note', accepts: n => n.type === 'note', run: () => {} },
      { id: 'task.only', label: 'Task', accepts: n => n.type === 'task', run: () => {} },
    )
    const ids = intentsFor(node('note')).map(i => i.id)
    expect(ids).toContain('note.only')
    expect(ids).not.toContain('task.only')
  })

  it('returns an empty array when no intent accepts the node', () => {
    register({ id: 'task.only', label: 'Task', accepts: n => n.type === 'task', run: () => {} })
    expect(intentsFor(node('photo'))).toEqual([])
  })

  it('preserves registration order', () => {
    register(
      { id: 'a', label: 'A', accepts: () => true, run: () => {} },
      { id: 'b', label: 'B', accepts: () => true, run: () => {} },
      { id: 'c', label: 'C', accepts: () => true, run: () => {} },
    )
    expect(intentsFor(node('any')).map(i => i.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('runIntent', () => {
  it('runs the matching intent with the node and emits INTENT_RUN', async () => {
    let ran: CoreNode | undefined
    register({ id: 'x.run', label: 'Run', accepts: () => true, run: n => { ran = n } })
    const n = node('note')
    await runIntent('x.run', n)
    expect(ran).toBe(n)
    const events = getRecent('INTENT_RUN')
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ intentId: 'x.run', nodeId: n.id })
  })

  it('awaits async run() implementations', async () => {
    let done = false
    register({
      id: 'x.async', label: 'Async', accepts: () => true,
      run: () => new Promise<void>(resolve => { done = true; resolve() }),
    })
    await runIntent('x.async', node('note'))
    expect(done).toBe(true)
  })

  it('is a no-op for an unknown intent id — no run, no event', async () => {
    await runIntent('does.not.exist', node('note'))
    expect(getRecent('INTENT_RUN')).toEqual([])
  })

  it('does not run an intent that rejects the node, and emits nothing', async () => {
    let ran = false
    register({ id: 'task.only', label: 'Task', accepts: n => n.type === 'task', run: () => { ran = true } })
    await runIntent('task.only', node('note'))
    expect(ran).toBe(false)
    expect(getRecent('INTENT_RUN')).toEqual([])
  })
})
