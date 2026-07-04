import { beforeEach, describe, expect, it } from 'vitest'
import { ancestryOf, nextStageFor, pickNext, rollupIds, runQueueTick, scoreOf } from './queue'
import { useSolverStore, todayKey } from './store'
import type { Problem } from './types'

let seq = 0
function makeProblem(patch: Partial<Problem> = {}): Problem {
  seq++
  return {
    id: `p${seq}`,
    title: `Problem ${seq}`,
    blurb: '',
    category: 'General',
    scale: 'world',
    status: 'open',
    severity: 3,
    tractability: 3,
    depth: 0,
    source: 'user',
    createdAt: seq,
    updatedAt: seq,
    ...patch,
  }
}

const byId = (...ps: Problem[]): Record<string, Problem> =>
  Object.fromEntries(ps.map(p => [p.id, p]))

function resetStore(): void {
  useSolverStore.setState({
    problems: {},
    solutions: {},
    running: false,
    dailyBudget: 100,
    usedToday: 0,
    budgetDate: '',
    log: [],
  })
}

describe('nextStageFor (the pipeline state machine)', () => {
  it('walks open → analyze → decompose/solve → critique → done', () => {
    expect(nextStageFor(makeProblem())).toBe('analyze')
    const analyzed = makeProblem({ analysis: { rootCauses: ['x'], stakeholders: [], isAtomic: false } })
    expect(nextStageFor(analyzed)).toBe('decompose')
    const atomic = makeProblem({ analysis: { rootCauses: ['x'], stakeholders: [], isAtomic: true } })
    expect(nextStageFor(atomic)).toBe('solve')
    const deep = makeProblem({ depth: 2, analysis: { rootCauses: ['x'], stakeholders: [], isAtomic: false } })
    expect(nextStageFor(deep)).toBe('solve') // depth cap forces solving
    expect(nextStageFor(makeProblem({ status: 'planned' }))).toBe('critique')
    expect(nextStageFor(makeProblem({ status: 'decomposed' }))).toBeNull()
    expect(nextStageFor(makeProblem({ status: 'solved' }))).toBeNull()
    expect(nextStageFor(makeProblem({ status: 'blocked' }))).toBeNull()
  })
})

describe('pickNext', () => {
  it('prefers the highest severity × tractability', () => {
    const small = makeProblem({ severity: 2, tractability: 2 })
    const big = makeProblem({ severity: 5, tractability: 4 })
    expect(scoreOf(big)).toBe(20)
    expect(pickNext(byId(small, big))?.id).toBe(big.id)
  })

  it('breaks ties toward deeper problems (finish the tree)', () => {
    const root = makeProblem({ severity: 4, tractability: 3 })
    const leaf = makeProblem({ severity: 4, tractability: 3, depth: 2 })
    expect(pickNext(byId(root, leaf))?.id).toBe(leaf.id)
  })

  it('skips problems with nothing to do', () => {
    const done = makeProblem({ status: 'solved', severity: 5, tractability: 5 })
    const open = makeProblem({ severity: 1, tractability: 1 })
    expect(pickNext(byId(done, open))?.id).toBe(open.id)
    expect(pickNext(byId(done))).toBeNull()
  })
})

describe('rollupIds & ancestryOf', () => {
  it('rolls a decomposed parent up once every child is solved', () => {
    const parent = makeProblem({ status: 'decomposed' })
    const c1 = makeProblem({ parentId: parent.id, status: 'solved', depth: 1 })
    const c2 = makeProblem({ parentId: parent.id, status: 'solved', depth: 1 })
    expect(rollupIds(byId(parent, c1, c2))).toEqual([parent.id])
    const c3 = makeProblem({ parentId: parent.id, status: 'open', depth: 1 })
    expect(rollupIds(byId(parent, c1, c2, c3))).toEqual([])
  })

  it('walks ancestry root → parent', () => {
    const root = makeProblem({ title: 'Root' })
    const mid = makeProblem({ title: 'Mid', parentId: root.id, depth: 1 })
    const leaf = makeProblem({ title: 'Leaf', parentId: mid.id, depth: 2 })
    expect(ancestryOf(leaf, byId(root, mid, leaf))).toEqual(['Root', 'Mid'])
  })
})

describe('runQueueTick (against the real store)', () => {
  beforeEach(resetStore)

  const analyzeReply = JSON.stringify({
    rootCauses: ['cause'],
    stakeholders: ['people'],
    severity: 4,
    tractability: 4,
    isAtomic: true,
  })

  it('analyzes the picked problem and spends one budget call', async () => {
    const p = useSolverStore.getState().addProblem({ title: 'Test problem' })
    const outcome = await runQueueTick(async () => analyzeReply)
    expect(outcome).toBe('worked')
    const after = useSolverStore.getState().problems[p.id]
    expect(after.analysis?.isAtomic).toBe(true)
    expect(after.status).toBe('open')
    expect(useSolverStore.getState().usedToday).toBe(1)
  })

  it('stops at the daily budget without calling the model', async () => {
    useSolverStore.getState().addProblem({ title: 'Starved problem' })
    useSolverStore.setState({ dailyBudget: 1, usedToday: 1, budgetDate: todayKey(Date.now()) })
    let called = false
    const outcome = await runQueueTick(async () => { called = true; return analyzeReply })
    expect(outcome).toBe('budget')
    expect(called).toBe(false)
  })

  it('reports idle on an empty backlog, after rolling up finished parents', async () => {
    const store = useSolverStore.getState()
    const parent = store.addProblem({ title: 'Parent' })
    const kid = store.addProblem({ title: 'Kid', parentId: parent.id })
    store.setStatus(parent.id, 'decomposed')
    store.setStatus(kid.id, 'solved')
    const outcome = await runQueueTick(async () => analyzeReply)
    expect(outcome).toBe('idle')
    expect(useSolverStore.getState().problems[parent.id].status).toBe('solved')
  })

  it('blocks a problem after two straight engine failures, restoring status in between', async () => {
    const p = useSolverStore.getState().addProblem({ title: 'Gibberish magnet' })
    const garbage = async () => 'I refuse to emit JSON.'
    expect(await runQueueTick(garbage, undefined, p.id)).toBe('error')
    expect(useSolverStore.getState().problems[p.id].status).toBe('open')
    expect(await runQueueTick(garbage, undefined, p.id)).toBe('blocked')
    expect(useSolverStore.getState().problems[p.id].status).toBe('blocked')
  })

  it('stops the whole queue on a transport failure', async () => {
    useSolverStore.getState().addProblem({ title: 'Unreachable' })
    useSolverStore.getState().setRunning(true)
    const outcome = await runQueueTick(async () => { throw new Error('AI API error (503): down') })
    expect(outcome).toBe('error')
    expect(useSolverStore.getState().running).toBe(false)
  })
})
