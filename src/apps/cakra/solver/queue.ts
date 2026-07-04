/**
 * Cakra Solver — the auto-solver queue ("solve as many as possible").
 *
 * A relentless but polite loop: pick the highest-leverage problem, run exactly
 * ONE pipeline stage on it, write the result, wait `pace` ms, repeat — until
 * the backlog is clear, the daily budget is spent, or the user hits Stop.
 * Selection and state transitions are pure functions (unit-tested); only
 * `runQueueTick`/`startQueue` touch the store and the model.
 */

import { useSolverStore } from './store'
import {
  MAX_DEPTH,
  analyzeProblem,
  critiqueSolution,
  decomposeProblem,
  solveProblem,
  EngineError,
  type ChatFn,
  type SolveStage,
} from './engine'
import type { Problem, Solution } from './types'

function newId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// ─── Pure selection logic ─────────────────────────────────────────────────────

/** Which pipeline stage this problem needs next; null = nothing to do. */
export function nextStageFor(p: Problem): SolveStage | null {
  if (p.status === 'open') {
    if (!p.analysis) return 'analyze'
    if (!p.analysis.isAtomic && p.depth < MAX_DEPTH) return 'decompose'
    return 'solve'
  }
  if (p.status === 'planned') return 'critique'
  return null // decomposed (children drive it), solved, blocked, analyzing
}

/** Leverage score: how much harm × how movable. Depth breaks ties so trees finish. */
export function scoreOf(p: Problem): number {
  return p.severity * p.tractability
}

/** The next problem the queue should work on, or null when the backlog is clear. */
export function pickNext(problems: Record<string, Problem>): Problem | null {
  let best: Problem | null = null
  for (const p of Object.values(problems)) {
    if (!nextStageFor(p)) continue
    if (
      !best ||
      scoreOf(p) > scoreOf(best) ||
      (scoreOf(p) === scoreOf(best) && (p.depth > best.depth ||
        (p.depth === best.depth && p.createdAt < best.createdAt)))
    ) {
      best = p
    }
  }
  return best
}

/** Decomposed parents whose children are ALL solved — they roll up for free. */
export function rollupIds(problems: Record<string, Problem>): string[] {
  const ids: string[] = []
  for (const p of Object.values(problems)) {
    if (p.status !== 'decomposed') continue
    const children = Object.values(problems).filter(c => c.parentId === p.id)
    if (children.length > 0 && children.every(c => c.status === 'solved')) ids.push(p.id)
  }
  return ids
}

/** Titles from root → direct parent, for prompt context. */
export function ancestryOf(p: Problem, problems: Record<string, Problem>): string[] {
  const chain: string[] = []
  let cur = p.parentId ? problems[p.parentId] : undefined
  let guard = 0
  while (cur && guard++ < 10) {
    chain.unshift(cur.title)
    cur = cur.parentId ? problems[cur.parentId] : undefined
  }
  return chain
}

// ─── The tick (one stage of work) ─────────────────────────────────────────────

export type TickOutcome = 'worked' | 'idle' | 'budget' | 'blocked' | 'error'

// Consecutive engine failures per problem; 2 strikes → blocked, move on.
const strikes = new Map<string, number>()

/** One stage of work. Pass `problemId` to pin it (the detail view's Run button). */
export async function runQueueTick(chatFn?: ChatFn, signal?: AbortSignal, problemId?: string): Promise<TickOutcome> {
  const store = useSolverStore.getState()

  // Free wins first: parents whose children all solved.
  for (const id of rollupIds(store.problems)) {
    store.setStatus(id, 'solved')
    store.pushLog(`🌳 ${store.problems[id]?.title ?? id} — solved via its sub-problems`)
  }

  const problem = problemId
    ? useSolverStore.getState().problems[problemId] ?? null
    : pickNext(useSolverStore.getState().problems)
  if (!problem) return 'idle'

  const stage = nextStageFor(problem)
  if (!stage) return 'idle'

  if (!store.consumeBudget()) {
    store.pushLog('⛔ Daily AI budget reached — solver stops until tomorrow (raise it in the header if you want more).')
    return 'budget'
  }

  const ancestry = ancestryOf(problem, useSolverStore.getState().problems)
  const prevStatus = problem.status
  store.setStatus(problem.id, 'analyzing')

  try {
    if (stage === 'analyze') {
      store.pushLog(`🔎 Analyzing: ${problem.title}`)
      const r = await analyzeProblem(problem, ancestry, chatFn, signal)
      store.setAnalysis(problem.id, r.analysis, r.severity, r.tractability)
      store.setStatus(problem.id, 'open')
      store.pushLog(`🔎 ${problem.title} — ${r.analysis.isAtomic ? 'atomic, ready to solve' : 'needs decomposition'} (${r.analysis.rootCauses.length} root causes)`)
    } else if (stage === 'decompose') {
      store.pushLog(`🧩 Decomposing: ${problem.title}`)
      const drafts = await decomposeProblem(problem, ancestry, chatFn, signal)
      store.setStatus(problem.id, 'open') // addChildren flips it to decomposed
      const children = store.addChildren(problem.id, drafts)
      store.pushLog(`🧩 ${problem.title} → ${children.length} sub-problems`)
    } else if (stage === 'solve') {
      store.pushLog(`🛠️ Solving: ${problem.title}`)
      const draft = await solveProblem(problem, ancestry, chatFn, signal)
      const now = Date.now()
      const solution: Solution = {
        id: problem.solutionId ?? newId(),
        problemId: problem.id,
        ...draft,
        critiqued: false,
        createdAt: now,
        updatedAt: now,
      }
      store.upsertSolution(solution)
      store.setStatus(problem.id, 'planned')
      store.pushLog(`🛠️ ${problem.title} — plan drafted (${solution.steps.length} steps)`)
    } else {
      const solution = problem.solutionId
        ? useSolverStore.getState().solutions[problem.solutionId]
        : undefined
      if (!solution) {
        // Planned but the solution vanished — send it back around.
        store.updateProblem(problem.id, { status: 'open', solutionId: undefined })
        return 'worked'
      }
      store.pushLog(`🔍 Critiquing plan: ${problem.title}`)
      const r = await critiqueSolution(problem, solution, chatFn, signal)
      store.upsertSolution({
        ...solution,
        summary: r.improvedSummary ?? solution.summary,
        steps: r.improvedSteps ?? solution.steps,
        firstActions: r.improvedFirstActions ?? solution.firstActions,
        risks: r.risks.length ? r.risks : solution.risks,
        confidence: r.confidence,
        critiqued: true,
        updatedAt: Date.now(),
      })
      store.setStatus(problem.id, 'solved')
      store.pushLog(`✅ SOLVED: ${problem.title} (confidence ${(r.confidence * 100).toFixed(0)}%)`)
    }
    strikes.delete(problem.id)
    return 'worked'
  } catch (err) {
    if (signal?.aborted) {
      store.setStatus(problem.id, prevStatus)
      return 'error'
    }
    const msg = err instanceof Error ? err.message : String(err)
    if (err instanceof EngineError) {
      const n = (strikes.get(problem.id) ?? 0) + 1
      strikes.set(problem.id, n)
      if (n >= 2) {
        store.setStatus(problem.id, 'blocked')
        store.pushLog(`🚫 ${problem.title} — blocked after repeated bad model output (${err.stage})`)
        return 'blocked'
      }
      store.setStatus(problem.id, prevStatus)
      store.pushLog(`⚠️ ${problem.title} — ${err.stage} returned no usable JSON, will retry`)
      return 'error'
    }
    // Transport/API failure: stop the whole queue, don't burn budget on a dead endpoint.
    store.setStatus(problem.id, prevStatus)
    store.setRunning(false)
    store.pushLog(`🛑 Solver stopped — AI call failed: ${msg.slice(0, 140)}`)
    return 'error'
  }
}

// ─── The loop ─────────────────────────────────────────────────────────────────

let controller: AbortController | null = null
let looping = false

const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms))

/** Start the auto-solver. Runs until Stop, empty backlog, or spent budget. */
export function startQueue(chatFn?: ChatFn): void {
  const store = useSolverStore.getState()
  if (looping) {
    store.setRunning(true)
    return
  }
  looping = true
  controller = new AbortController()
  store.setRunning(true)
  store.pushLog('▶️ Auto-solver started')

  void (async () => {
    try {
      while (useSolverStore.getState().running) {
        const outcome = await runQueueTick(chatFn, controller?.signal)
        if (outcome === 'idle') {
          useSolverStore.getState().setRunning(false)
          useSolverStore.getState().pushLog('🏁 Backlog clear — every problem is solved or waiting on you.')
          break
        }
        if (outcome === 'budget') {
          useSolverStore.getState().setRunning(false)
          break
        }
        if (!useSolverStore.getState().running) break
        await sleep(useSolverStore.getState().pace)
      }
    } finally {
      looping = false
      controller = null
    }
  })()
}

/** Stop the auto-solver and abort any in-flight model call. */
export function stopQueue(): void {
  useSolverStore.getState().setRunning(false)
  controller?.abort()
  useSolverStore.getState().pushLog('⏸️ Auto-solver stopped')
}
