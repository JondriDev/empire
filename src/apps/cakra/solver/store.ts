/**
 * Cakra Solver — store (source of truth).
 *
 * Problems + solutions persist here (`empire-solver`), and a module-scope
 * subscription mirrors both collections into the Core graph as `problem` /
 * `solution` nodes (Calendar-style self-mirroring — the central sync.ts list
 * must NOT know about us, its reconcile would otherwise own our node types).
 * The auto-queue's pacing budget also lives here so it survives reloads;
 * `running` intentionally does not — the solver never auto-resumes without
 * the user pressing Start.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mirrorCollection } from '../../../lib/core/sync'
import { WORLD_CATALOG } from './catalog'
import type { FeedProblem, Problem, ProblemAnalysis, ProblemScale, ProblemSource, ProblemStatus, Solution } from './types'

function newId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** UTC day key — the boundary for the daily AI-call budget. */
export function todayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

export interface NewProblemInput {
  title: string
  blurb?: string
  category?: string
  scale?: ProblemScale
  severity?: number
  tractability?: number
  parentId?: string
  source?: ProblemSource
  catalogId?: string
}

export interface SolverLogLine {
  at: number
  text: string
}

const LOG_CAP = 200

interface SolverState {
  problems: Record<string, Problem>
  solutions: Record<string, Solution>
  /** Auto-queue engine state (running is session-only, never persisted). */
  running: boolean
  /** Delay between AI calls, ms. */
  pace: number
  /** Max AI calls per UTC day — protects the NIM key. */
  dailyBudget: number
  usedToday: number
  budgetDate: string
  log: SolverLogLine[]

  addProblem: (_input: NewProblemInput) => Problem
  updateProblem: (_id: string, _patch: Partial<Omit<Problem, 'id' | 'createdAt'>>) => void
  setStatus: (_id: string, _status: ProblemStatus) => void
  setAnalysis: (_id: string, _analysis: ProblemAnalysis, _severity?: number, _tractability?: number) => void
  addChildren: (_parentId: string, _drafts: Array<{ title: string; blurb: string; severity: number; tractability: number }>) => Problem[]
  upsertSolution: (_solution: Solution) => void
  removeProblem: (_id: string) => void
  /** Seed every catalog problem not already imported. Returns how many landed. */
  importCatalog: () => number
  importFeedProblem: (_fp: FeedProblem) => Problem | null
  setRunning: (_running: boolean) => void
  setPace: (_pace: number) => void
  setDailyBudget: (_budget: number) => void
  /** Reserve one AI call from today's budget. False = budget exhausted. */
  consumeBudget: () => boolean
  pushLog: (_text: string) => void
}

export const useSolverStore = create<SolverState>()(
  persist(
    (set, get) => ({
      problems: {},
      solutions: {},
      running: false,
      pace: 4000,
      dailyBudget: 100,
      usedToday: 0,
      budgetDate: '',
      log: [],

      addProblem: (_input) => {
        const now = Date.now()
        const parent = _input.parentId ? get().problems[_input.parentId] : undefined
        const problem: Problem = {
          id: newId(),
          title: _input.title.trim(),
          blurb: (_input.blurb ?? '').trim(),
          category: _input.category ?? parent?.category ?? 'General',
          scale: _input.scale ?? parent?.scale ?? 'personal',
          status: 'open',
          severity: clampScore(_input.severity ?? parent?.severity ?? 3),
          tractability: clampScore(_input.tractability ?? 3),
          depth: parent ? parent.depth + 1 : 0,
          parentId: _input.parentId,
          source: _input.source ?? parent?.source ?? 'user',
          catalogId: _input.catalogId,
          createdAt: now,
          updatedAt: now,
        }
        set(s => ({ problems: { ...s.problems, [problem.id]: problem } }))
        return problem
      },

      updateProblem: (_id, _patch) => {
        const existing = get().problems[_id]
        if (!existing) return
        set(s => ({
          problems: { ...s.problems, [_id]: { ...existing, ..._patch, updatedAt: Date.now() } },
        }))
      },

      setStatus: (_id, _status) => get().updateProblem(_id, { status: _status }),

      setAnalysis: (_id, _analysis, _severity, _tractability) => {
        get().updateProblem(_id, {
          analysis: _analysis,
          ...(_severity !== undefined ? { severity: clampScore(_severity) } : {}),
          ...(_tractability !== undefined ? { tractability: clampScore(_tractability) } : {}),
        })
      },

      addChildren: (_parentId, _drafts) => {
        const parent = get().problems[_parentId]
        if (!parent) return []
        const children = _drafts.map(d => get().addProblem({
          title: d.title,
          blurb: d.blurb,
          severity: d.severity,
          tractability: d.tractability,
          parentId: _parentId,
        }))
        get().updateProblem(_parentId, { status: 'decomposed' })
        return children
      },

      upsertSolution: (_solution) => {
        set(s => ({ solutions: { ...s.solutions, [_solution.id]: _solution } }))
        const problem = get().problems[_solution.problemId]
        if (problem && problem.solutionId !== _solution.id) {
          get().updateProblem(problem.id, { solutionId: _solution.id })
        }
      },

      removeProblem: (_id) => {
        const { problems, solutions } = get()
        // Collect the whole subtree so no orphans linger.
        const doomed = new Set<string>()
        const walk = (id: string) => {
          doomed.add(id)
          for (const p of Object.values(problems)) {
            if (p.parentId === id && !doomed.has(p.id)) walk(p.id)
          }
        }
        if (!problems[_id]) return
        walk(_id)
        const nextProblems: Record<string, Problem> = {}
        for (const p of Object.values(problems)) {
          if (!doomed.has(p.id)) nextProblems[p.id] = p
        }
        const nextSolutions: Record<string, Solution> = {}
        for (const sol of Object.values(solutions)) {
          if (!doomed.has(sol.problemId)) nextSolutions[sol.id] = sol
        }
        set({ problems: nextProblems, solutions: nextSolutions })
      },

      importCatalog: () => {
        const have = new Set(Object.values(get().problems).map(p => p.catalogId).filter(Boolean))
        let imported = 0
        for (const c of WORLD_CATALOG) {
          if (have.has(c.catalogId)) continue
          get().addProblem({
            title: c.title,
            blurb: c.blurb,
            category: c.category,
            scale: 'world',
            severity: c.severity,
            tractability: c.tractability,
            source: 'catalog',
            catalogId: c.catalogId,
          })
          imported++
        }
        return imported
      },

      importFeedProblem: (_fp) => {
        const exists = Object.values(get().problems).some(p => p.catalogId === _fp.catalogId)
        if (exists) return null
        return get().addProblem({
          title: _fp.title,
          blurb: _fp.blurb,
          category: _fp.category,
          scale: 'world',
          severity: _fp.severity,
          tractability: _fp.tractability,
          source: 'discovery',
          catalogId: _fp.catalogId,
        })
      },

      setRunning: (_running) => set({ running: _running }),
      setPace: (_pace) => set({ pace: Math.max(1000, Math.round(_pace)) }),
      setDailyBudget: (_budget) => set({ dailyBudget: Math.max(1, Math.round(_budget)) }),

      consumeBudget: () => {
        const today = todayKey(Date.now())
        const { budgetDate, usedToday, dailyBudget } = get()
        const used = budgetDate === today ? usedToday : 0
        if (used >= dailyBudget) {
          set({ budgetDate: today, usedToday: used })
          return false
        }
        set({ budgetDate: today, usedToday: used + 1 })
        return true
      },

      pushLog: (_text) => {
        set(s => ({ log: [{ at: Date.now(), text: _text }, ...s.log].slice(0, LOG_CAP) }))
      },
    }),
    {
      name: 'empire-solver',
      partialize: (s) => ({
        problems: s.problems,
        solutions: s.solutions,
        pace: s.pace,
        dailyBudget: s.dailyBudget,
        usedToday: s.usedToday,
        budgetDate: s.budgetDate,
        log: s.log,
      }),
    }
  )
)

function clampScore(n: number): number {
  return Math.min(5, Math.max(1, Math.round(Number.isFinite(n) ? n : 3)))
}

// ─── Selectors ────────────────────────────────────────────────────────────────

export function childrenOf(_parentId: string): Problem[] {
  return Object.values(useSolverStore.getState().problems)
    .filter(p => p.parentId === _parentId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export function solutionFor(_problemId: string): Solution | undefined {
  const { problems, solutions } = useSolverStore.getState()
  const sid = problems[_problemId]?.solutionId
  return sid ? solutions[sid] : undefined
}

// ─── Core-graph mirror (self-mirroring, Calendar pattern) ─────────────────────

function mirrorSolver(): void {
  const { problems, solutions } = useSolverStore.getState()
  mirrorCollection('problem', 'ai-chat', Object.values(problems), {
    id: p => p.id,
    title: p => p.title,
    data: p => ({
      status: p.status,
      category: p.category,
      scale: p.scale,
      severity: p.severity,
      tractability: p.tractability,
      depth: p.depth,
      parentId: p.parentId ?? null,
      source: p.source,
      content: p.blurb,
    }),
  })
  mirrorCollection('solution', 'ai-chat', Object.values(solutions), {
    id: s => s.id,
    title: s => `Solution: ${s.summary.slice(0, 60)}`,
    data: s => ({
      problemId: s.problemId,
      confidence: s.confidence,
      critiqued: s.critiqued,
      content: s.summary,
    }),
  })
}

let mirrorStarted = false
/** Idempotent: mirror now and on every store change. Called on module load. */
export function startSolverMirror(): void {
  if (mirrorStarted) return
  mirrorStarted = true
  mirrorSolver()
  useSolverStore.subscribe(mirrorSolver)
}

startSolverMirror()
