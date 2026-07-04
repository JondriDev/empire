/**
 * Timeline — the organism's TEMPORAL lens (EPIC-10 · The Timeline, S1).
 *
 * The Empire had three lenses over its one Core graph — Network (STRUCTURAL),
 * Search (QUERY), Inbox (TASK) — but no way to see *when* it did things. This is
 * the 4th lens: one stream that merges every entity BIRTH (`meta.created`) and
 * every app→app HANDOFF (`ProvEdge.at`) into the organism's living history,
 * newest-first, grouped by UTC calendar day. Search is the organism's WHERE;
 * the Timeline is its WHEN.
 *
 * No private store — the graph + the provenance ledger ARE the corpus, read
 * reactively (mirrors Search's idiom). All the ordering/bucketing is the pure
 * `buildTimeline`/`groupByDay`/`dayKey` spine (lib/core/timeline.ts, unit-pinned);
 * this component only renders it and calls `Date.now()` for the relative labels.
 *
 * An entity row opens its entity (`openEntity`) with its ancestry inline
 * (`<NodeLineage>`) and the ⚡ actions bar; a flow row is a durable handoff
 * moment (`from → to`) — not a button, matching the Network memory panel idiom.
 */

import { useEffect, useMemo } from 'react'
import { Clock as TimelineIcon } from 'lucide-react'
import { emit } from '../../lib/eventBus'
import { useGraph } from '../../lib/core/graph'
import { useProvenance } from '../../lib/core/provenance'
import { buildTimeline, groupByDay, relativeDayLabel } from '../../lib/core/timeline'
import { agoLabel } from '../../lib/core/bridge'
import { apps, getAppIcon } from '../../lib/registry'
import { openEntity } from '../../lib/windowStore'
import { NodeActions } from '../../components/ui/NodeActions'
import { NodeLineage } from '../../components/ui/NodeLineage'
import type { AppDefinition } from '../../lib/registry'
import type { TimelineEntry } from '../../lib/core/timeline'

// One accent per view — the Timeline reads as signal-cyan, the organism's pulse.
const ACCENT = 'var(--signal)'

export default function Timeline() {
  const nodes = useGraph(s => s.nodes)
  const edges = useProvenance(s => s.edges)

  const appById = useMemo(
    () => Object.fromEntries(apps.map(a => [a.id, a])) as Record<string, AppDefinition>,
    [],
  )

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'timeline' })
  }, [])

  const stream = useMemo(() => buildTimeline(nodes, edges), [nodes, edges])
  const days = useMemo(() => groupByDay(stream), [stream])
  // The ONLY place the wall clock is read — the pure spine stays timezone-stable.
  const now = Date.now()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <TimelineIcon className="w-6 h-6" style={{ color: ACCENT }} /> Timeline
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
          The organism’s history, one stream · {stream.length} moment{stream.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Idle / empty */}
      {days.length === 0 && (
        <div className="gp rounded-2xl text-center" style={{ padding: 'var(--space-6, 28px)' }}>
          <TimelineIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text3)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text2)' }}>No history yet</p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text3)' }}>
            Create or hand off anything and it lands here — every entity birth and
            every app→app transfer, newest-first, grouped by day.
          </p>
        </div>
      )}

      {/* The stream, grouped by day */}
      {days.map(({ day, entries }) => (
        <section key={day} data-timeline-day={day} className="mb-6">
          <div
            className="t-label sticky top-0 z-10 py-2 -mx-1 px-1"
            style={{
              color: 'var(--text3)',
              background: 'linear-gradient(to bottom, var(--bg) 65%, transparent)',
            }}
          >
            {relativeDayLabel(day, now)}
          </div>
          <div className="space-y-2">
            {entries.map(entry =>
              entry.kind === 'entity' ? (
                <EntityRow
                  key={entry.id}
                  entry={entry}
                  accent={appById[entry.app]?.color}
                  now={now}
                />
              ) : (
                <FlowRow key={entry.id} entry={entry} appById={appById} now={now} />
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

/** An entity BIRTH — the whole row opens its entity; ancestry + ⚡ inline. */
function EntityRow({ entry, accent, now }: { entry: TimelineEntry; accent?: string; now: number }) {
  const nodeId = entry.nodeId!
  return (
    <div
      data-timeline-kind="entity"
      className="gp gp-interactive group relative rounded-2xl flex items-center gap-3"
      style={{ padding: 'var(--space-3, 14px)' }}
    >
      <span
        aria-hidden="true"
        className="flex-shrink-0 rounded-full"
        style={{ width: 8, height: 8, background: accent ?? 'var(--text3)' }}
      />

      <button
        onClick={() => openEntity(entry.app, nodeId)}
        className="flex-1 min-w-0 text-left"
        aria-label={`Open ${entry.title} in ${entry.app}`}
      >
        <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
          {entry.title || '(untitled)'}
        </div>
        <div
          className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs"
          style={{ color: 'var(--text3)' }}
        >
          {entry.type && <span style={{ fontFamily: 'var(--mono)' }}>{entry.type}</span>}
          <span style={{ fontFamily: 'var(--mono)' }}>{agoLabel(entry.at, now)}</span>
          {/* Node-level ancestry — the exact entity this one descended from. */}
          <NodeLineage nodeId={nodeId} />
        </div>
      </button>

      <div
        className="flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100"
        style={{ transitionDuration: 'var(--dur-fast)' }}
      >
        <NodeActions nodeId={nodeId} />
      </div>
    </div>
  )
}

/** A durable HANDOFF moment — `from → to` — not a button (no single entity). */
function FlowRow({
  entry, appById, now,
}: { entry: TimelineEntry; appById: Record<string, AppDefinition>; now: number }) {
  const from = appById[entry.app]
  const to = entry.toApp ? appById[entry.toApp] : undefined
  const FromIcon = from ? getAppIcon(from.icon) : null
  const ToIcon = to ? getAppIcon(to.icon) : null
  return (
    <div
      data-timeline-kind="flow"
      role="note"
      aria-label={`${from?.name ?? entry.app} fed ${to?.name ?? entry.toApp}`}
      className="gp rounded-2xl flex items-center gap-2 text-xs"
      style={{ padding: 'var(--space-3, 14px)', color: 'var(--text2)', fontFamily: 'var(--mono)' }}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        {FromIcon && <FromIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: from?.color }} />}
        <span className="truncate">{from?.name ?? entry.app}</span>
      </span>
      <span aria-hidden="true" style={{ color: 'var(--text3)' }}>→</span>
      <span className="flex items-center gap-1.5 min-w-0">
        {ToIcon && <ToIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: to?.color }} />}
        <span className="truncate">{to?.name ?? entry.toApp}</span>
      </span>
      {entry.label && <span className="truncate" style={{ color: 'var(--text3)' }}>· {entry.label}</span>}
      <span className="ml-auto flex-shrink-0" style={{ color: 'var(--text3)' }}>{agoLabel(entry.at, now)}</span>
    </div>
  )
}
