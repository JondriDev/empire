/**
 * Cakra Solver — the Problem Solver surface (Cakra's "Solver" tab, and the
 * standalone /app/solver deep-link).
 *
 * Left: the backlog — world catalog + your own problems + the routine's world
 * feed, filterable by category. Right: the selected problem in full. Header:
 * the auto-solver ("solve as many as possible") with its pacing budget and a
 * very visible stop. Footer: the live engine log.
 */
import { useEffect, useMemo, useState } from 'react'
import { Globe2, Play, Plus, Square } from 'lucide-react'
import { Button, IconButton, Input } from '../../../components/ui'
import { getConfig } from '../../../lib/ai'
import { useSolverStore, todayKey } from './store'
import { registerSolverIntents } from './solverIntents'
import { startQueue, stopQueue, scoreOf } from './queue'
import { fetchWorldFeed } from './feed'
import { WORLD_CATALOG } from './catalog'
import ProblemDetail from './ProblemDetail'
import { STATUS_GLYPH } from './status'
import type { WorldFeed } from './types'

export default function SolverPanel() {
  const problems = useSolverStore(s => s.problems)
  const solutions = useSolverStore(s => s.solutions)
  const running = useSolverStore(s => s.running)
  const usedToday = useSolverStore(s => s.usedToday)
  const budgetDate = useSolverStore(s => s.budgetDate)
  const dailyBudget = useSolverStore(s => s.dailyBudget)
  const setDailyBudget = useSolverStore(s => s.setDailyBudget)
  const log = useSolverStore(s => s.log)
  const importCatalog = useSolverStore(s => s.importCatalog)
  const importFeedProblem = useSolverStore(s => s.importFeedProblem)
  const addProblem = useSolverStore(s => s.addProblem)
  const pushLog = useSolverStore(s => s.pushLog)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [category, setCategory] = useState('all')
  const [newTitle, setNewTitle] = useState('')
  const [feed, setFeed] = useState<WorldFeed | null>(null)

  useEffect(() => { registerSolverIntents() }, [])
  useEffect(() => { void fetchWorldFeed().then(setFeed) }, [])

  const all = useMemo(() => Object.values(problems), [problems])
  const categories = useMemo(
    () => ['all', ...Array.from(new Set(all.map(p => p.category))).sort()],
    [all],
  )
  const roots = useMemo(
    () => all
      .filter(p => !p.parentId)
      .sort((a, b) =>
        Number(a.status === 'solved') - Number(b.status === 'solved') ||
        scoreOf(b) - scoreOf(a) ||
        a.createdAt - b.createdAt),
    [all],
  )
  const shown = category === 'all' ? roots : roots.filter(p => p.category === category)

  const solvedCount = all.filter(p => p.status === 'solved').length
  const openCount = all.length - solvedCount
  const usedNow = budgetDate === todayKey(Date.now()) ? usedToday : 0
  const catalogRemaining = WORLD_CATALOG.filter(c => !all.some(p => p.catalogId === c.catalogId)).length
  const feedFresh = (feed?.problems ?? []).filter(fp => !all.some(p => p.catalogId === fp.catalogId))
  const noKey = !getConfig().apiKey

  const selected = selectedId ? problems[selectedId] : undefined

  const submitNew = (e?: React.FormEvent) => {
    e?.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    const p = addProblem({ title, scale: 'personal', source: 'user' })
    setNewTitle('')
    setSelectedId(p.id)
  }

  const doImportCatalog = () => {
    const n = importCatalog()
    if (n > 0) pushLog(`🌍 Imported ${n} world problems from the catalog`)
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header: identity + the auto-solver controls */}
      <div className="px-4 py-3 border-b flex flex-wrap items-center gap-x-4 gap-y-2" style={{ borderColor: 'var(--border)' }}>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-tight">Problem Solver</h1>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>
            {openCount} open · {solvedCount} solved · today {usedNow}/{dailyBudget} AI calls
          </p>
        </div>
        <div className="flex-1" />
        <label className="text-xs inline-flex items-center gap-1.5" style={{ color: 'var(--text3)' }}>
          daily budget
          <Input
            type="number"
            min={1}
            value={String(dailyBudget)}
            onChange={v => setDailyBudget(Number(v))}
            className="w-16"
            aria-label="Daily AI call budget"
          />
        </label>
        <Button
          onClick={() => (running ? stopQueue() : startQueue())}
          icon={running ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          aria-label={running ? 'Stop the auto-solver' : 'Start the auto-solver'}
          style={{
            background: `color-mix(in srgb, var(--c-cakra) ${running ? 30 : 18}%, transparent)`,
            color: 'var(--c-cakra)',
          }}
        >
          {running ? 'Stop solving' : 'Solve everything'}
        </Button>
      </div>

      {noKey && (
        <div className="px-4 py-2 text-xs border-b" style={{ borderColor: 'var(--border)', color: 'var(--text3)' }}>
          Solving thinks with your NVIDIA NIM key — add it in Cakra&apos;s Chat settings if calls fail.
        </div>
      )}

      {/* Body: list ⇄ detail */}
      <div className="flex-1 min-h-0 md:grid md:grid-cols-[minmax(280px,340px)_1fr]">
        {/* Backlog column */}
        <aside
          className={`${selected ? 'hidden md:flex' : 'flex'} h-full min-h-0 flex-col border-r`}
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="p-3 space-y-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex gap-2">
              <Input
                value={newTitle}
                onChange={setNewTitle}
                onKeyDown={e => { if (e.key === 'Enter') submitNew() }}
                placeholder="Add a problem to solve…"
                className="flex-1 min-w-0"
                aria-label="New problem title"
              />
              <IconButton
                onClick={() => submitNew()}
                icon={<Plus className="w-4 h-4" />}
                aria-label="Add problem"
                style={{ background: 'color-mix(in srgb, var(--c-cakra) 18%, transparent)', color: 'var(--c-cakra)' }}
              />
            </div>
            {catalogRemaining > 0 && (
              <Button
                onClick={doImportCatalog}
                variant="ghost"
                fullWidth
                icon={<Globe2 className="w-4 h-4" />}
                style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                Import world catalog ({catalogRemaining})
              </Button>
            )}
            {categories.length > 2 && (
              <div className="flex gap-1.5 flex-wrap">
                {categories.map(c => (
                  <Button
                    key={c}
                    variant="ghost"
                    size="sm"
                    onClick={() => setCategory(c)}
                    aria-pressed={category === c}
                    style={category === c
                      ? { background: 'color-mix(in srgb, var(--c-cakra) 20%, transparent)', color: 'var(--c-cakra)', borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: 'var(--text-xs)' }
                      : { color: 'var(--text3)', borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: 'var(--text-xs)' }}
                  >
                    {c === 'all' ? 'All' : c}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {shown.length === 0 && (
              <p className="p-4 text-sm" style={{ color: 'var(--text3)' }}>
                The backlog is empty. Import the world catalog, add your own problem, or send one here from Notes/Goals with ⚡.
              </p>
            )}
            <ul>
              {shown.map(p => (
                <li key={p.id}>
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => setSelectedId(p.id)}
                    aria-pressed={selectedId === p.id}
                    icon={
                      <span aria-hidden className={`shrink-0 ${p.status === 'analyzing' ? 'animate-pulse' : ''}`}>
                        {STATUS_GLYPH[p.status]}
                      </span>
                    }
                    style={{
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      whiteSpace: 'normal',
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border)',
                      background: selectedId === p.id ? 'color-mix(in srgb, var(--c-cakra) 10%, transparent)' : 'transparent',
                    }}
                  >
                    <span className="min-w-0 flex-1" style={{ textAlign: 'left' }}>
                      <span className="block text-sm leading-snug" style={{ color: 'var(--text)' }}>{p.title}</span>
                      <span className="block text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                        {p.category} · <span className="font-mono">S{p.severity}·T{p.tractability}</span>
                      </span>
                    </span>
                  </Button>
                </li>
              ))}
            </ul>

            {/* World feed — fresh discoveries from the cloud routine */}
            {feedFresh.length > 0 && (
              <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text)' }}>
                  🌍 World feed{feed?.generatedAt ? ` · ${feed.generatedAt.slice(0, 10)}` : ''}
                </p>
                <ul className="space-y-2">
                  {feedFresh.map(fp => (
                    <li key={fp.catalogId} className="gp rounded-lg p-2.5">
                      <p className="text-sm leading-snug" style={{ color: 'var(--text)' }}>{fp.title}</p>
                      {fp.blurb && <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{fp.blurb}</p>}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { const p = importFeedProblem(fp); if (p) setSelectedId(p.id) }}
                        className="mt-1.5"
                        style={{ background: 'color-mix(in srgb, var(--c-cakra) 18%, transparent)', color: 'var(--c-cakra)', padding: '2px 8px', fontSize: 'var(--text-xs)' }}
                      >
                        Import
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>

        {/* Detail column */}
        <main className={`${selected ? 'block' : 'hidden md:block'} h-full min-h-0`}>
          {selected ? (
            <ProblemDetail
              problem={selected}
              problems={problems}
              solutions={solutions}
              feedBrief={selected.catalogId ? feed?.briefs[selected.catalogId] : undefined}
              onSelect={setSelectedId}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <p className="text-3xl" aria-hidden>🧩</p>
                <h2 className="mt-2 text-base font-semibold" style={{ color: 'var(--text)' }}>
                  {all.length === 0 ? 'The world has problems.' : 'Pick a problem'}
                </h2>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text3)' }}>
                  {all.length === 0
                    ? `Import ${WORLD_CATALOG.length} of them, add your own, then press “Solve everything” and watch Cakra work through the backlog.`
                    : 'Select one from the backlog to see its tree and plan — or press “Solve everything” and let the queue choose by impact.'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Live engine log */}
      {log.length > 0 && (
        <div className="border-t px-4 py-1.5 text-xs font-mono space-y-0.5 max-h-20 overflow-y-auto" style={{ borderColor: 'var(--border)', color: 'var(--text3)' }} aria-live="polite">
          {log.slice(0, 3).map(line => (
            <p key={line.at + line.text} className="truncate">{line.text}</p>
          ))}
        </div>
      )}
    </div>
  )
}
