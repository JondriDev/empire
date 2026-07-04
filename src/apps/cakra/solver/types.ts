/**
 * Cakra Solver — domain types.
 *
 * A Problem is one node of the solving tree: world-scale roots decompose into
 * ever more tractable sub-problems until a leaf is atomic enough for a concrete
 * Solution (an action plan, not an essay). Problems/solutions live in the
 * solver store (source of truth) and are mirrored into the Core graph as
 * `problem` / `solution` nodes, so the Network, Search, Inbox and Timeline
 * lenses see the solving organism at work.
 */

export type ProblemScale = 'world' | 'local' | 'personal'

/**
 * open       → not yet analyzed, or an analyzed leaf awaiting a solution
 * analyzing  → an engine stage is running on it right now
 * decomposed → split into children; rolls up to solved when all children solve
 * planned    → has a solution draft awaiting the critique pass
 * solved     → solution critiqued & accepted (or all children solved)
 * blocked    → engine gave up (repeated failures); manual attention needed
 */
export type ProblemStatus = 'open' | 'analyzing' | 'decomposed' | 'planned' | 'solved' | 'blocked'

export type ProblemSource = 'catalog' | 'user' | 'intent' | 'discovery'

export interface ProblemAnalysis {
  rootCauses: string[]
  stakeholders: string[]
  /** Atomic = a single concrete plan can address it without further splitting. */
  isAtomic: boolean
}

export interface Problem {
  id: string
  title: string
  blurb: string
  category: string
  scale: ProblemScale
  status: ProblemStatus
  /** How much harm it causes, 1–5. */
  severity: number
  /** How realistically it can be moved, 1–5. */
  tractability: number
  /** 0 for roots; children are parent.depth + 1 (capped by the engine). */
  depth: number
  parentId?: string
  source: ProblemSource
  /** Stable id linking back to the world catalog / feed entry, if any. */
  catalogId?: string
  analysis?: ProblemAnalysis
  solutionId?: string
  createdAt: number
  updatedAt: number
}

export interface SolutionStep {
  title: string
  detail: string
}

export interface Solution {
  id: string
  problemId: string
  summary: string
  rootCauses: string[]
  steps: SolutionStep[]
  /** Concrete things to start within ~72h — these can be sent to Tasks. */
  firstActions: string[]
  /** Who acts: individual / community / org / policy level actors. */
  actors: string[]
  successMetrics: string[]
  risks: string[]
  /** 0–1, set by the critique pass (draft confidence before that). */
  confidence: number
  /** True once the self-critique pass reviewed & refined the draft. */
  critiqued: boolean
  createdAt: number
  updatedAt: number
}

// ─── World feed (maintained by the World-Solver cloud routine) ────────────────

export interface WorldIntervention {
  title: string
  evidence: string
  actor: string
}

export interface WorldBrief {
  summary: string
  interventions: WorldIntervention[]
  sources: string[]
  updatedAt: string
}

export interface FeedProblem {
  catalogId: string
  title: string
  blurb: string
  category: string
  severity: number
  tractability: number
  /** For `discovery` items: the news context it was found in. */
  discoveredFrom?: string
}

export interface WorldFeed {
  generatedAt: string
  /** Fresh problems the routine discovered from current events. */
  problems: FeedProblem[]
  /** Deep researched, cited solution briefs, keyed by catalogId. */
  briefs: Record<string, WorldBrief>
}
