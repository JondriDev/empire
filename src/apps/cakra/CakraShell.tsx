/**
 * CakraShell — the unified Cakra super-app.
 *
 * Cakra absorbed three former apps as tabs: Prompt Generator, Token Counter, and
 * Code Editor — alongside its core Chat (the Agent/AIChat surface). Their legacy
 * ids live on as registry aliases that deep-link straight to the matching tab
 * (see lib/cakraTab + windowStore.openAppById), so handoffs/automations keep
 * working. Visited tabs stay mounted so each tool keeps its state when you
 * switch; the heavy tools lazy-load on first open.
 */
import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react'
import { Sparkles, Puzzle, Wand2, Hash, Code2 } from 'lucide-react'
import { useCakraTab, type CakraTab } from '../../lib/cakraTab'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import Cakra from './Cakra'

const SolverPanel = lazy(() => import('./solver/SolverPanel'))
const PromptGenerator = lazy(() => import('./tabs/PromptGenerator'))
const TokenCounter = lazy(() => import('./tabs/TokenCounter'))
const Editor = lazy(() => import('./tabs/Editor'))

const TABS: { id: CakraTab; label: string; Icon: typeof Sparkles }[] = [
  { id: 'chat', label: 'Chat', Icon: Sparkles },
  { id: 'solver', label: 'Solver', Icon: Puzzle },
  { id: 'prompt', label: 'Prompt', Icon: Wand2 },
  { id: 'tokens', label: 'Tokens', Icon: Hash },
  { id: 'code', label: 'Code', Icon: Code2 },
]

/** A tab panel: mounted once visited, shown/hidden without losing state. */
function Panel({ visited, active, children }: { visited: boolean; active: boolean; children: ReactNode }) {
  if (!visited) return null
  return (
    <div style={{ position: 'absolute', inset: 0, display: active ? 'block' : 'none' }}>
      <Suspense fallback={<LoadingSpinner />}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </Suspense>
    </div>
  )
}

export default function CakraShell() {
  const tab = useCakraTab(s => s.tab)
  const setTab = useCakraTab(s => s.setTab)
  const [visited, setVisited] = useState<Set<CakraTab>>(() => new Set<CakraTab>([tab]))

  useEffect(() => {
    setVisited(prev => (prev.has(tab) ? prev : new Set(prev).add(tab)))
  }, [tab])

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Segmented tab bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }} role="tablist">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              role="tab"
              aria-selected={active}
              className="press relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0"
              style={active
                ? { background: 'color-mix(in srgb, var(--c-cakra) 20%, transparent)', color: 'var(--c-cakra)' }
                : { color: 'var(--text3)' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text3)' }}
            >
              <Icon className="w-4 h-4" />
              {label}
              {active && (
                <span
                  aria-hidden
                  className="absolute left-3 right-3 -bottom-[7px] h-0.5 rounded-full animate-fade-in"
                  style={{ background: 'var(--c-cakra)' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab panels */}
      <div className="flex-1 min-h-0 relative">
        <Panel visited={visited.has('chat')} active={tab === 'chat'}><Cakra /></Panel>
        <Panel visited={visited.has('solver')} active={tab === 'solver'}><SolverPanel /></Panel>
        <Panel visited={visited.has('prompt')} active={tab === 'prompt'}><PromptGenerator /></Panel>
        <Panel visited={visited.has('tokens')} active={tab === 'tokens'}><TokenCounter /></Panel>
        <Panel visited={visited.has('code')} active={tab === 'code'}><Editor /></Panel>
      </div>
    </div>
  )
}
