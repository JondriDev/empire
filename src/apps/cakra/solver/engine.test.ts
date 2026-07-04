import { describe, expect, it } from 'vitest'
import {
  analyzeProblem,
  decomposeProblem,
  extractJson,
  solveProblem,
  critiqueSolution,
  EngineError,
  type ChatFn,
  type SolutionDraft,
} from './engine'
import type { Problem } from './types'

function makeProblem(patch: Partial<Problem> = {}): Problem {
  return {
    id: 'p1',
    title: 'Clean water access',
    blurb: 'Billions lack safely managed drinking water.',
    category: 'Food & Water',
    scale: 'world',
    status: 'open',
    severity: 4,
    tractability: 4,
    depth: 0,
    source: 'catalog',
    createdAt: 1,
    updatedAt: 1,
    ...patch,
  }
}

/** A fake model that returns each reply in order (last one repeats). */
function fakeChat(...replies: string[]): ChatFn {
  let i = 0
  return async () => replies[Math.min(i++, replies.length - 1)]
}

describe('extractJson', () => {
  it('pulls the outermost object out of chatty replies', () => {
    expect(extractJson('Sure! Here you go:\n```json\n{"a":1}\n```\nHope that helps.')).toEqual({ a: 1 })
    expect(extractJson('{"a":{"b":2}}')).toEqual({ a: { b: 2 } })
  })

  it('returns null for prose or broken JSON', () => {
    expect(extractJson('no json here')).toBeNull()
    expect(extractJson('{"a":')).toBeNull()
  })
})

describe('analyzeProblem', () => {
  const good = JSON.stringify({
    rootCauses: ['underinvestment', 'weak utilities'],
    stakeholders: ['rural households', 'governments'],
    severity: 5,
    tractability: 3,
    isAtomic: false,
  })

  it('parses a clean reply', async () => {
    const r = await analyzeProblem(makeProblem(), [], fakeChat(good))
    expect(r.analysis.rootCauses).toHaveLength(2)
    expect(r.analysis.isAtomic).toBe(false)
    expect(r.severity).toBe(5)
    expect(r.tractability).toBe(3)
  })

  it('retries once past a garbage reply', async () => {
    const r = await analyzeProblem(makeProblem(), [], fakeChat('I cannot answer in JSON, sorry.', good))
    expect(r.analysis.rootCauses[0]).toBe('underinvestment')
  })

  it('throws a staged EngineError after two bad replies', async () => {
    await expect(analyzeProblem(makeProblem(), [], fakeChat('nope', 'still nope')))
      .rejects.toMatchObject({ name: 'EngineError', stage: 'analyze' })
    await expect(analyzeProblem(makeProblem(), [], fakeChat('nope', 'nope')))
      .rejects.toBeInstanceOf(EngineError)
  })

  it('clamps out-of-range scores instead of trusting the model', async () => {
    const wild = JSON.stringify({ rootCauses: ['x'], stakeholders: [], severity: 99, tractability: -3, isAtomic: true })
    const r = await analyzeProblem(makeProblem(), [], fakeChat(wild))
    expect(r.severity).toBe(5)
    expect(r.tractability).toBe(1)
  })
})

describe('decomposeProblem', () => {
  it('keeps only well-formed sub-problems, capped at 6', async () => {
    const reply = JSON.stringify({
      subProblems: [
        { title: 'Rural infrastructure gap', blurb: 'Pipes never reach villages.', severity: 4, tractability: 4 },
        { title: '', blurb: 'invalid — no title' },
        { title: 'Utility financing', blurb: 'Tariffs don’t cover maintenance.', severity: 3, tractability: 3 },
        { title: 'A', blurb: '' }, { title: 'B', blurb: '' }, { title: 'C', blurb: '' },
        { title: 'D', blurb: '' }, { title: 'E', blurb: '' },
      ],
    })
    const drafts = await decomposeProblem(makeProblem(), [], fakeChat(reply))
    expect(drafts.length).toBeLessThanOrEqual(6)
    expect(drafts[0].title).toBe('Rural infrastructure gap')
    expect(drafts.some(d => d.title === '')).toBe(false)
  })

  it('rejects a decomposition with fewer than 2 usable children', async () => {
    const reply = JSON.stringify({ subProblems: [{ title: 'Only one', blurb: '' }] })
    await expect(decomposeProblem(makeProblem(), [], fakeChat(reply, reply)))
      .rejects.toMatchObject({ stage: 'decompose' })
  })
})

describe('solveProblem', () => {
  it('parses a full plan and clamps confidence to [0,1]', async () => {
    const reply = JSON.stringify({
      summary: 'Fund and maintain village-level water points.',
      rootCauses: ['underinvestment'],
      steps: [{ title: 'Map unserved villages', detail: 'Use census + satellite data.' }],
      firstActions: ['Contact the district water office'],
      actors: ['local government'],
      successMetrics: ['% households with safe water'],
      risks: ['maintenance funding dries up'],
      confidence: 7,
    })
    const draft = await solveProblem(makeProblem(), [], fakeChat(reply))
    expect(draft.steps).toHaveLength(1)
    expect(draft.confidence).toBe(1)
  })

  it('rejects plans without steps', async () => {
    const reply = JSON.stringify({ summary: 'Just believe.', steps: [] })
    await expect(solveProblem(makeProblem(), [], fakeChat(reply, reply)))
      .rejects.toMatchObject({ stage: 'solve' })
  })
})

describe('critiqueSolution', () => {
  const draft: SolutionDraft = {
    summary: 'Draft plan',
    rootCauses: [],
    steps: [{ title: 'Step', detail: '' }],
    firstActions: ['act'],
    actors: [],
    successMetrics: [],
    risks: ['r1'],
    confidence: 0.5,
  }

  it('passes an "ok" verdict through with the final confidence', async () => {
    const reply = JSON.stringify({ verdict: 'ok', confidence: 0.8, risks: ['funding'] })
    const r = await critiqueSolution(makeProblem(), draft, fakeChat(reply))
    expect(r.confidence).toBe(0.8)
    expect(r.improvedSteps).toBeUndefined()
  })

  it('carries improved fields on a "revise" verdict', async () => {
    const reply = JSON.stringify({
      verdict: 'revise',
      confidence: 0.6,
      risks: [],
      improvedSummary: 'Sharper plan',
      improvedSteps: [{ title: 'Better step', detail: 'now fundable' }],
    })
    const r = await critiqueSolution(makeProblem(), draft, fakeChat(reply))
    expect(r.improvedSummary).toBe('Sharper plan')
    expect(r.improvedSteps?.[0].title).toBe('Better step')
  })
})
