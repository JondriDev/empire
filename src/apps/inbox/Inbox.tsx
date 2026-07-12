/**
 * Inbox — the organism's "Today" surface: one home for every open task.
 *
 * `task` CoreNodes are spawned by the ⚡ make-task intent from ANY app (Notes,
 * Goals, Messages…) and were, until now, invisible — graph-only, with no view.
 * The Inbox aggregates them: it reads the Core graph reactively, partitions
 * tasks into open / done (pure logic in lib/core/tasks.ts), and lets you flip a
 * task's `data.done` straight on the graph node. Each row carries the source app
 * that created it and a ⚡ NodeActions bar, so a task can flow on into the rest
 * of the organism (e.g. spin a note off it). No private store — the graph IS the
 * source of truth for tasks.
 */

import { useEffect, useMemo } from 'react'
import { Inbox as InboxIcon, Check, CheckCircle2, Circle } from 'lucide-react'
import { emit } from '../../lib/eventBus'
import { useGraph } from '../../lib/core/graph'
import { partitionTasks, isTaskDone } from '../../lib/core/tasks'
import { apps, getAppIcon } from '../../lib/registry'
import { NodeActions } from '../../components/ui/NodeActions'
import { NodeLineage } from '../../components/ui/NodeLineage'
import { EmptyState } from '../../components/ui/Utility'
import { IconButton } from '../../components/ui'
import type { CoreNode } from '../../lib/core/graph'

// One accent per view — the Inbox reads as the CORE teal "signal", since a task
// is the organism's outstanding nerve impulse. All colour routes through tokens.
const ACCENT = 'var(--signal)'

export default function Inbox() {
  const nodes = useGraph(s => s.nodes)
  const updateNode = useGraph(s => s.updateNode)
  const { open, done } = useMemo(() => partitionTasks(Object.values(nodes)), [nodes])

  // Resolve a task's owning app (the app whose item spawned it) for its chip.
  const appById = useMemo(
    () => Object.fromEntries(apps.map(a => [a.id, a])) as Record<string, typeof apps[number]>,
    [],
  )

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'inbox' })
  }, [])

  const toggle = (n: CoreNode) => {
    updateNode(n.id, { data: { ...n.data, done: !isTaskDone(n) } })
  }

  // Strip the "Do: " prefix make-task adds, so the row reads as the task itself.
  const taskLabel = (n: CoreNode) => n.title.replace(/^Do:\s*/, '')

  const empty = open.length === 0 && done.length === 0

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <InboxIcon className="w-6 h-6" style={{ color: ACCENT }} /> Inbox
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
            {open.length} open · {done.length} done
          </p>
        </div>
      </div>

      {empty && (
        <EmptyState
          icon={<InboxIcon className="w-6 h-6" />}
          title="No tasks yet"
          description="Use the ⚡ menu on any item — or ⌘K — and pick “Make Task”. It lands here."
          accent={ACCENT}
        />
      )}

      {/* Open tasks */}
      {open.length > 0 && (
        <div className="mb-8">
          <div className="t-label mb-2" style={{ color: 'var(--text3)' }}>OPEN · {open.length}</div>
          <div className="space-y-2">
            {open.map(n => (
              <TaskRow key={n.id} node={n} app={appById[n.meta.app]} onToggle={toggle} label={taskLabel(n)} />
            ))}
          </div>
        </div>
      )}

      {/* Done tasks — kept visible but quietened, toggleable back to open. */}
      {done.length > 0 && (
        <div>
          <div className="t-label mb-2 flex items-center gap-1.5" style={{ color: 'var(--text3)' }}>
            <CheckCircle2 className="w-3 h-3" /> DONE · {done.length}
          </div>
          <div className="space-y-2">
            {done.map(n => (
              <TaskRow key={n.id} node={n} app={appById[n.meta.app]} onToggle={toggle} label={taskLabel(n)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TaskRow({
  node, app, onToggle, label,
}: {
  node: CoreNode
  app: typeof apps[number] | undefined
  onToggle: (_n: CoreNode) => void
  label: string
}) {
  const done = isTaskDone(node)
  const SourceIcon = app ? getAppIcon(app.icon) : null

  return (
    <div className="gp gp-interactive group relative rounded-2xl flex items-center gap-3"
      style={{ padding: 'var(--space-3, 14px)' }}>
      <IconButton
        onClick={() => onToggle(node)}
        aria-label={done ? 'Mark task open' : 'Mark task done'}
        aria-pressed={done}
        icon={done ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3 opacity-0" />}
        style={{
          width: 26, height: 26,
          borderRadius: 'var(--radius-md)',
          color: done ? 'var(--void)' : 'var(--text3)',
          background: done ? ACCENT : 'transparent',
          border: done ? 'none' : '1px solid var(--hair)',
        }}
      />

      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium truncate"
          style={{
            color: done ? 'var(--text3)' : 'var(--text)',
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {label}
        </div>
        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs" style={{ color: 'var(--text3)' }}>
          {app && (
            <span className="flex items-center gap-1.5">
              {SourceIcon && <SourceIcon className="w-3 h-3" style={{ color: app.color }} />}
              <span style={{ fontFamily: 'var(--mono)' }}>{app.name}</span>
            </span>
          )}
          {/* Node-level lineage — the exact entity this task was made from. */}
          <NodeLineage nodeId={node.id} />
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ transitionDuration: 'var(--dur-fast)' }}>
        <NodeActions nodeId={node.id} />
      </div>
    </div>
  )
}
