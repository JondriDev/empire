/**
 * Cakra Solver — the solving engine (pure pipeline stages).
 *
 * Four stages over one problem node:
 *   analyze   → root causes, stakeholders, honest re-scores, is it atomic?
 *   decompose → 3–6 more-tractable sub-problems (until MAX_DEPTH)
 *   solve     → a concrete action plan for an atomic leaf
 *   critique  → adversarial self-review that refines the plan + sets confidence
 *
 * Every stage is a pure async function over an injected `ChatFn` (defaults to
 * `chat()` from lib/ai — Supabase proxy on the live PWA, server.js locally),
 * so tests run with a fake model and no network. JSON extraction follows the
 * orchestrator's proven pattern: grab the outermost {...}, validate hard, and
 * retry once with a stricter instruction before giving up.
 */

import { chat, type ChatMessage, type ChatOptions } from '../../../lib/ai'
import type { Problem, ProblemAnalysis, SolutionStep } from './types'

export type ChatFn = (_messages: ChatMessage[], _options?: ChatOptions) => Promise<string>

export type SolveStage = 'analyze' | 'decompose' | 'solve' | 'critique'

export class EngineError extends Error {
  stage: SolveStage
  constructor(stage: SolveStage, message: string) {
    super(message)
    this.name = 'EngineError'
    this.stage = stage
  }
}

/** Deepest a decomposition tree can go (root = 0). */
export const MAX_DEPTH = 2

const PERSONA =
  'You are Cakra Solver — the problem-solving mind of The Empire. ' +
  'You are precise, practical and honest about uncertainty: never invent facts, ' +
  'and surface thin evidence as a risk instead of hiding it.'

/**
 * Every solver stage runs on a frontier reasoning model — not the everyday chat
 * default — so decomposition and adversarial critique get genuine reasoning.
 * minimax-m3 is fast (~seconds), has a 1M context, and reliably returns real
 * `content` (some Nemotron reasoners return only reasoning and an empty answer).
 * Token caps below leave headroom for the model's hidden reasoning before the JSON.
 */
const SOLVER_MODEL = 'minimaxai/minimax-m3'

// ─── JSON plumbing ────────────────────────────────────────────────────────────

/** Pull the outermost JSON object out of a possibly chatty model reply. */
export function extractJson(raw: string): unknown | null {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

interface JsonCallOpts {
  system: string
  user: string
  maxTokens: number
  temperature: number
  signal?: AbortSignal
  /** Pin a specific model for this stage (defaults to the frontier reasoner). */
  model?: string
}

/** One stage call: ask → extract → validate; on failure retry once, stricter. */
async function callJson<T>(
  stage: SolveStage,
  chatFn: ChatFn,
  opts: JsonCallOpts,
  validate: (_v: unknown) => T | null,
): Promise<T> {
  const ask = async (extra: string): Promise<T | null> => {
    const raw = await chatFn(
      [
        { role: 'system', content: `${PERSONA}\n\n${opts.system}${extra}` },
        { role: 'user', content: opts.user },
      ],
      { temperature: opts.temperature, maxTokens: opts.maxTokens, signal: opts.signal, model: opts.model ?? SOLVER_MODEL },
    )
    return validate(extractJson(raw))
  }
  const first = await ask('')
  if (first) return first
  const second = await ask('\n\nIMPORTANT: reply with ONLY the JSON object — no prose, no markdown fences.')
  if (second) return second
  throw new EngineError(stage, `model returned no valid ${stage} JSON after retry`)
}

// ─── Shared validation helpers ────────────────────────────────────────────────

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null

function strings(v: unknown, cap: number): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map(x => x.trim())
    .slice(0, cap)
}

function score(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.min(5, Math.max(1, Math.round(n))) : fallback
}

function confidence01(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback
}

/** Compact problem context block shared by every stage prompt. */
function problemBlock(p: Problem, ancestry: string[]): string {
  const chain = ancestry.length ? `\nPart of: ${ancestry.join(' → ')}` : ''
  return `PROBLEM: ${p.title}\nScale: ${p.scale} · Category: ${p.category} · Severity ${p.severity}/5 · Tractability ${p.tractability}/5${chain}\n${p.blurb ? `Context: ${p.blurb}` : ''}`
}

// ─── Stage 1: analyze ─────────────────────────────────────────────────────────

export interface AnalyzeResult {
  analysis: ProblemAnalysis
  severity: number
  tractability: number
}

export async function analyzeProblem(
  p: Problem,
  ancestry: string[],
  chatFn: ChatFn = chat,
  signal?: AbortSignal,
): Promise<AnalyzeResult> {
  return callJson<AnalyzeResult>('analyze', chatFn, {
    system:
      'Analyze the given problem. Reply with ONLY this JSON shape:\n' +
      '{"rootCauses":["..."],"stakeholders":["..."],"severity":1-5,"tractability":1-5,"isAtomic":true|false}\n' +
      '- rootCauses: the 2–6 deepest drivers, not symptoms.\n' +
      '- stakeholders: who suffers and who can act (2–6).\n' +
      '- severity: harm caused. tractability: how realistically it can be moved.\n' +
      '- isAtomic: true only if ONE concrete action plan could address it without splitting it further.',
    user: problemBlock(p, ancestry),
    maxTokens: 2000,
    temperature: 0.3,
    signal,
  }, (v) => {
    const r = asRecord(v)
    if (!r) return null
    const rootCauses = strings(r.rootCauses, 8)
    const stakeholders = strings(r.stakeholders, 8)
    if (rootCauses.length === 0) return null
    return {
      analysis: { rootCauses, stakeholders, isAtomic: !!r.isAtomic },
      severity: score(r.severity, p.severity),
      tractability: score(r.tractability, p.tractability),
    }
  })
}

// ─── Stage 2: decompose ───────────────────────────────────────────────────────

export interface SubProblemDraft {
  title: string
  blurb: string
  severity: number
  tractability: number
}

export async function decomposeProblem(
  p: Problem,
  ancestry: string[],
  chatFn: ChatFn = chat,
  signal?: AbortSignal,
): Promise<SubProblemDraft[]> {
  const causes = p.analysis?.rootCauses.length
    ? `\nKnown root causes: ${p.analysis.rootCauses.join('; ')}`
    : ''
  return callJson<SubProblemDraft[]>('decompose', chatFn, {
    system:
      'Split the problem into 3–6 sub-problems. Reply with ONLY this JSON shape:\n' +
      '{"subProblems":[{"title":"...","blurb":"one-sentence framing","severity":1-5,"tractability":1-5}]}\n' +
      '- Together the sub-problems should cover the parent with minimal overlap.\n' +
      '- Each must be MORE tractable than the parent — closer to something a real plan can move.\n' +
      '- Titles short and concrete; blurbs one sentence.',
    user: problemBlock(p, ancestry) + causes,
    maxTokens: 2800,
    temperature: 0.4,
    signal,
  }, (v) => {
    const r = asRecord(v)
    if (!r || !Array.isArray(r.subProblems)) return null
    const drafts: SubProblemDraft[] = []
    for (const item of r.subProblems.slice(0, 6)) {
      const s = asRecord(item)
      if (!s || typeof s.title !== 'string' || !s.title.trim()) continue
      drafts.push({
        title: s.title.trim(),
        blurb: typeof s.blurb === 'string' ? s.blurb.trim() : '',
        severity: score(s.severity, p.severity),
        tractability: score(s.tractability, Math.min(5, p.tractability + 1)),
      })
    }
    return drafts.length >= 2 ? drafts : null
  })
}

// ─── Stage 3: solve ───────────────────────────────────────────────────────────

export interface SolutionDraft {
  summary: string
  rootCauses: string[]
  steps: SolutionStep[]
  firstActions: string[]
  actors: string[]
  successMetrics: string[]
  risks: string[]
  confidence: number
}

const SCALE_HINT: Record<Problem['scale'], string> = {
  personal: 'Plan for one determined person: concrete daily/weekly actions, tools, habits.',
  local: 'Plan for a community/city actor: organising, partners, funding, quick pilots.',
  world: 'Plan across levels — what individuals, communities, organisations and policy each do; name proven intervention types.',
}

export async function solveProblem(
  p: Problem,
  ancestry: string[],
  chatFn: ChatFn = chat,
  signal?: AbortSignal,
): Promise<SolutionDraft> {
  const causes = p.analysis?.rootCauses.length
    ? `\nRoot causes to address: ${p.analysis.rootCauses.join('; ')}`
    : ''
  return callJson<SolutionDraft>('solve', chatFn, {
    system:
      'Produce a concrete action plan for the problem. Reply with ONLY this JSON shape:\n' +
      '{"summary":"2-3 sentences","rootCauses":["..."],"steps":[{"title":"...","detail":"how, concretely"}],' +
      '"firstActions":["do within 72h"],"actors":["who acts"],"successMetrics":["measurable"],' +
      '"risks":["honest risks/unknowns"],"confidence":0-1}\n' +
      `- ${SCALE_HINT[p.scale]}\n` +
      '- 3–7 steps, each genuinely actionable — no platitudes ("raise awareness" alone is banned).\n' +
      '- confidence: your honest belief this plan moves the problem if executed.',
    user: problemBlock(p, ancestry) + causes,
    maxTokens: 4096,
    temperature: 0.5,
    signal,
  }, (v) => {
    const r = asRecord(v)
    if (!r || typeof r.summary !== 'string' || !r.summary.trim()) return null
    const steps: SolutionStep[] = []
    if (Array.isArray(r.steps)) {
      for (const item of r.steps.slice(0, 8)) {
        const s = asRecord(item)
        if (!s || typeof s.title !== 'string' || !s.title.trim()) continue
        steps.push({ title: s.title.trim(), detail: typeof s.detail === 'string' ? s.detail.trim() : '' })
      }
    }
    if (steps.length === 0) return null
    return {
      summary: r.summary.trim(),
      rootCauses: strings(r.rootCauses, 8),
      steps,
      firstActions: strings(r.firstActions, 6),
      actors: strings(r.actors, 8),
      successMetrics: strings(r.successMetrics, 6),
      risks: strings(r.risks, 8),
      confidence: confidence01(r.confidence, 0.5),
    }
  })
}

// ─── Stage 4: critique ────────────────────────────────────────────────────────

export interface CritiqueResult {
  confidence: number
  risks: string[]
  /** Present only when the critic decided the draft needed fixing. */
  improvedSummary?: string
  improvedSteps?: SolutionStep[]
  improvedFirstActions?: string[]
}

export async function critiqueSolution(
  p: Problem,
  draft: SolutionDraft,
  chatFn: ChatFn = chat,
  signal?: AbortSignal,
): Promise<CritiqueResult> {
  const plan = draft.steps.map((s, i) => `${i + 1}. ${s.title} — ${s.detail}`).join('\n')
  return callJson<CritiqueResult>('critique', chatFn, {
    system:
      'You are now the adversarial reviewer of the draft plan. Find what would actually make it fail: ' +
      'wrong assumptions, missing actors, steps that are vague or unfunded. Reply with ONLY this JSON shape:\n' +
      '{"verdict":"ok"|"revise","confidence":0-1,"risks":["..."],' +
      '"improvedSummary":"...","improvedSteps":[{"title":"...","detail":"..."}],"improvedFirstActions":["..."]}\n' +
      '- verdict "ok": the plan stands; omit the improved* fields.\n' +
      '- verdict "revise": include improved* fields with the FULL corrected version.\n' +
      '- confidence: honest final belief in the (possibly improved) plan.',
    user: `${problemBlock(p, [])}\n\nDRAFT SUMMARY: ${draft.summary}\n\nDRAFT PLAN:\n${plan}\n\nSTATED RISKS: ${draft.risks.join('; ') || 'none'}`,
    maxTokens: 3000,
    temperature: 0.3,
    signal,
  }, (v) => {
    const r = asRecord(v)
    if (!r) return null
    const verdict = r.verdict === 'revise' ? 'revise' : r.verdict === 'ok' ? 'ok' : null
    if (!verdict) return null
    const out: CritiqueResult = {
      confidence: confidence01(r.confidence, draft.confidence),
      risks: strings(r.risks, 8),
    }
    if (verdict === 'revise') {
      if (typeof r.improvedSummary === 'string' && r.improvedSummary.trim()) {
        out.improvedSummary = r.improvedSummary.trim()
      }
      if (Array.isArray(r.improvedSteps)) {
        const steps: SolutionStep[] = []
        for (const item of r.improvedSteps.slice(0, 8)) {
          const s = asRecord(item)
          if (!s || typeof s.title !== 'string' || !s.title.trim()) continue
          steps.push({ title: s.title.trim(), detail: typeof s.detail === 'string' ? s.detail.trim() : '' })
        }
        if (steps.length > 0) out.improvedSteps = steps
      }
      const fa = strings(r.improvedFirstActions, 6)
      if (fa.length > 0) out.improvedFirstActions = fa
    }
    return out
  })
}
