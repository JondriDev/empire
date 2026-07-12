/**
 * Cakra Solver — one problem, in full: ancestry, analysis, decomposition tree,
 * the solution brief, and (for world problems) the World-Solver routine's
 * cited research. All colors ride the token system.
 */
import { useState } from 'react'
import { ChevronLeft, ListChecks, Play, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui'
import { useSolverStore } from './store'
import { nextStageFor, runQueueTick } from './queue'
import { nodesOfType } from '../../../lib/core/graph'
import { runIntent } from '../../../lib/core/intents'
import { registerSolverIntents } from './solverIntents'
import { STATUS_GLYPH } from './status'
import type { Problem, Solution, WorldBrief } from './types'

const STAGE_LABEL: Record<string, string> = {
  analyze: 'Analyze',
  decompose: 'Split it',
  solve: 'Draft the plan',
  critique: 'Critique & finish',
}

interface Props {
  problem: Problem
  problems: Record<string, Problem>
  solutions: Record<string, Solution>
  feedBrief?: WorldBrief
  onSelect: (_id: string) => void
  onBack: () => void
}

export default function ProblemDetail({ problem, problems, solutions, feedBrief, onSelect, onBack }: Props) {
  const removeProblem = useSolverStore(s => s.removeProblem)
  const [busy, setBusy] = useState(false)

  const solution = problem.solutionId ? solutions[problem.solutionId] : undefined
  const stage = nextStageFor(problem)

  const ancestry: Problem[] = []
  let cur = problem.parentId ? problems[problem.parentId] : undefined
  let guard = 0
  while (cur && guard++ < 10) {
    ancestry.unshift(cur)
    cur = cur.parentId ? problems[cur.parentId] : undefined
  }
  const children = Object.values(problems)
    .filter(p => p.parentId === problem.id)
    .sort((a, b) => a.createdAt - b.createdAt)

  const runNext = async () => {
    setBusy(true)
    try {
      await runQueueTick(undefined, undefined, problem.id)
    } finally {
      setBusy(false)
    }
  }

  const sendToTasks = () => {
    if (!solution) return
    registerSolverIntents()
    const node = nodesOfType('solution').find(n => n.data.sourceId === solution.id)
    if (node) void runIntent('solver-plan-to-tasks', node)
  }

  const del = () => {
    if (window.confirm(`Delete "${problem.title}"${children.length ? ' and its whole subtree' : ''}?`)) {
      removeProblem(problem.id)
      onBack()
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-1 flex-wrap text-xs mb-3" style={{ color: 'var(--text3)' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          icon={<ChevronLeft className="w-4 h-4" />}
          aria-label="Back to problem list"
          className="md:hidden"
          style={{ padding: '2px 6px', fontSize: 'var(--text-xs)', color: 'var(--text3)' }}
        >
          All problems
        </Button>
        {ancestry.map(a => (
          <span key={a.id} className="inline-flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(a.id)}
              className="underline-offset-2 hover:underline"
              style={{ padding: '2px 4px', fontSize: 'var(--text-xs)', color: 'var(--text3)' }}
            >
              {a.title}
            </Button>
            <span aria-hidden>→</span>
          </span>
        ))}
      </div>

      <h2 className="text-xl font-semibold leading-snug" style={{ color: 'var(--text)' }}>
        <span aria-hidden className="mr-2">{STATUS_GLYPH[problem.status]}</span>{problem.title}
      </h2>
      <div className="mt-1 text-xs flex flex-wrap gap-x-3 gap-y-1" style={{ color: 'var(--text3)' }}>
        <span>{problem.category}</span>
        <span>{problem.scale}</span>
        <span className="font-mono">S{problem.severity}·T{problem.tractability}</span>
        <span>{problem.status}</span>
        {problem.source !== 'user' && <span>via {problem.source}</span>}
      </div>
      {problem.blurb && <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text3)' }}>{problem.blurb}</p>}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {stage && (
          <Button
            onClick={runNext}
            disabled={busy}
            icon={<Play className="w-4 h-4" />}
            style={{ background: 'color-mix(in srgb, var(--c-cakra) 20%, transparent)', color: 'var(--c-cakra)' }}
          >
            {busy ? 'Thinking…' : STAGE_LABEL[stage]}
          </Button>
        )}
        {solution && solution.firstActions.length > 0 && (
          <Button
            variant="ghost"
            onClick={sendToTasks}
            icon={<ListChecks className="w-4 h-4" />}
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            Plan → Tasks
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={del}
          icon={<Trash2 className="w-4 h-4" />}
          aria-label="Delete problem"
          style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
        >
          Delete
        </Button>
      </div>

      {/* Analysis */}
      {problem.analysis && (
        <section className="gp mt-5 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Analysis</h3>
          <div className="text-sm" style={{ color: 'var(--text3)' }}>
            <p className="font-medium" style={{ color: 'var(--text)' }}>Root causes</p>
            <ul className="list-disc ml-5 mt-1 space-y-0.5">
              {problem.analysis.rootCauses.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
            {problem.analysis.stakeholders.length > 0 && (
              <p className="mt-2"><span className="font-medium" style={{ color: 'var(--text)' }}>Stakeholders:</span> {problem.analysis.stakeholders.join(' · ')}</p>
            )}
          </div>
        </section>
      )}

      {/* Decomposition tree */}
      {children.length > 0 && (
        <section className="mt-5">
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Sub-problems</h3>
          <SubTree parentId={problem.id} problems={problems} onSelect={onSelect} />
        </section>
      )}

      {/* Solution */}
      {solution && (
        <section className="gp mt-5 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Solution {solution.critiqued ? '· critiqued ✓' : '· draft'}
            </h3>
            <span className="text-xs font-mono" style={{ color: 'var(--text3)' }}>{Math.round(solution.confidence * 100)}% confidence</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--c-cakra) 15%, transparent)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.round(solution.confidence * 100)}%`, background: 'var(--c-cakra)' }} />
          </div>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{solution.summary}</p>

          <ol className="mt-3 space-y-2">
            {solution.steps.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium" style={{ color: 'var(--text)' }}>{i + 1}. {s.title}</span>
                {s.detail && <span style={{ color: 'var(--text3)' }}> — {s.detail}</span>}
              </li>
            ))}
          </ol>

          {solution.firstActions.length > 0 && (
            <div className="mt-3 text-sm">
              <p className="font-medium" style={{ color: 'var(--text)' }}>Start within 72h</p>
              <ul className="mt-1 space-y-0.5" style={{ color: 'var(--text3)' }}>
                {solution.firstActions.map((a, i) => <li key={i}>⚡ {a}</li>)}
              </ul>
            </div>
          )}

          <div className="mt-3 grid gap-2 md:grid-cols-2 text-xs" style={{ color: 'var(--text3)' }}>
            {solution.actors.length > 0 && <p><span className="font-medium" style={{ color: 'var(--text)' }}>Who acts:</span> {solution.actors.join(' · ')}</p>}
            {solution.successMetrics.length > 0 && <p><span className="font-medium" style={{ color: 'var(--text)' }}>Success looks like:</span> {solution.successMetrics.join(' · ')}</p>}
          </div>
          {solution.risks.length > 0 && (
            <p className="mt-2 text-xs" style={{ color: 'var(--text3)' }}><span className="font-medium">Risks:</span> {solution.risks.join(' · ')}</p>
          )}
        </section>
      )}

      {/* World research (from the cloud routine) */}
      {feedBrief && (
        <section className="gp mt-5 rounded-xl p-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>🌍 World research</h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text3)' }}>{feedBrief.summary}</p>
          {feedBrief.interventions.length > 0 && (
            <ul className="mt-2 space-y-1.5 text-sm">
              {feedBrief.interventions.map((iv, i) => (
                <li key={i}>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>{iv.title}</span>
                  {iv.evidence && <span style={{ color: 'var(--text3)' }}> — {iv.evidence}</span>}
                  {iv.actor && <span className="text-xs" style={{ color: 'var(--text3)' }}> [{iv.actor}]</span>}
                </li>
              ))}
            </ul>
          )}
          {feedBrief.sources.length > 0 && (
            <p className="mt-2 text-xs break-all" style={{ color: 'var(--text3)' }}>
              {feedBrief.sources.map((s, i) => (
                <a key={i} href={s} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 mr-2">{shortUrl(s)}</a>
              ))}
            </p>
          )}
          {feedBrief.updatedAt && <p className="mt-1 text-xs" style={{ color: 'var(--text3)' }}>researched {feedBrief.updatedAt}</p>}
        </section>
      )}
    </div>
  )
}

function SubTree({ parentId, problems, onSelect }: {
  parentId: string
  problems: Record<string, Problem>
  onSelect: (_id: string) => void
}) {
  const children = Object.values(problems)
    .filter(p => p.parentId === parentId)
    .sort((a, b) => a.createdAt - b.createdAt)
  if (children.length === 0) return null
  return (
    <ul className="space-y-1 ml-1 pl-3 border-l" style={{ borderColor: 'var(--border)' }}>
      {children.map(c => (
        <li key={c.id}>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => onSelect(c.id)}
            icon={<span aria-hidden className="shrink-0">{STATUS_GLYPH[c.status]}</span>}
            style={{ justifyContent: 'flex-start', alignItems: 'flex-start', whiteSpace: 'normal', padding: '4px 0', color: 'var(--text)' }}
          >
            <span className="min-w-0 text-sm" style={{ textAlign: 'left' }}>
              {c.title}
              <span className="ml-2 text-xs font-mono" style={{ color: 'var(--text3)' }}>S{c.severity}·T{c.tractability}</span>
            </span>
          </Button>
          <SubTree parentId={c.id} problems={problems} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  )
}

function shortUrl(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return u.slice(0, 40)
  }
}
