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
 *
 * S2 gives the lens controls, copying Search's faceted idiom verbatim: App +
 * Kind chip rows narrow the stream (facets derived from the UNFILTERED stream so
 * chips always widen back; the filtered stream is what renders), and ↑/↓/Enter
 * rove the flat filtered list mouse-free — Enter opens an entity row, a flow row
 * is a no-op. The scroll container is the focus target (no search field to host
 * the keydown, unlike Search).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock as TimelineIcon } from 'lucide-react'
import { emit } from '../../lib/eventBus'
import { useGraph } from '../../lib/core/graph'
import { useProvenance } from '../../lib/core/provenance'
import { buildTimeline, groupByDay, relativeDayLabel, filterTimeline, timelineFacets } from '../../lib/core/timeline'
import { toggleFacet } from '../../lib/core/search'
import { agoLabel } from '../../lib/core/bridge'
import { apps, getAppIcon } from '../../lib/registry'
import { openEntity } from '../../lib/windowStore'
import { Button } from '../../components/ui'
import { NodeActions } from '../../components/ui/NodeActions'
import { NodeLineage } from '../../components/ui/NodeLineage'
import { RelatedConstellation } from '../../components/ui/RelatedConstellation'
import { NodeDescendants } from '../../components/ui/NodeDescendants'
import type { AppDefinition } from '../../lib/registry'
import type { TimelineEntry } from '../../lib/core/timeline'

// One accent per view — the Timeline reads as signal-cyan, the organism's pulse.
const ACCENT = 'var(--signal)'

// Human labels for the two kinds — the chip surface reads gentler than the raw enum.
const KIND_LABEL: Record<string, string> = { entity: 'entities', flow: 'flows' }

export default function Timeline() {
  const nodes = useGraph(s => s.nodes)
  const edges = useProvenance(s => s.edges)
  const [appFilter, setAppFilter] = useState<string[]>([])
  const [kindFilter, setKindFilter] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const appById = useMemo(
    () => Object.fromEntries(apps.map(a => [a.id, a])) as Record<string, AppDefinition>,
    [],
  )

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'timeline' })
    // Focus the scroll container so ↑/↓/Enter drive the stream immediately.
    containerRef.current?.focus()
  }, [])

  // Facets from the UNFILTERED stream (so chips always widen back); render the FILTERED stream.
  const stream = useMemo(() => buildTimeline(nodes, edges), [nodes, edges])
  const facets = useMemo(() => timelineFacets(stream), [stream])
  const filtered = useMemo(
    () => filterTimeline(stream, { apps: appFilter, kinds: kindFilter as ('entity' | 'flow')[] }),
    [stream, appFilter, kindFilter],
  )
  const days = useMemo(() => groupByDay(filtered), [filtered])
  // Flat list in the SAME order the days render — the roving cursor indexes into this.
  const flat = useMemo(() => days.flatMap(d => d.entries), [days])
  const indexById = useMemo(() => new Map(flat.map((e, i) => [e.id, i])), [flat])
  // The ONLY place the wall clock is read — the pure spine stays timezone-stable.
  const now = Date.now()

  const hasStream = stream.length > 0
  const showChips = hasStream && (facets.apps.length > 1 || facets.kinds.length > 1)

  // Reset the cursor to the top whenever the filters narrow the list.
  useEffect(() => { setActiveIndex(0) }, [appFilter, kindFilter])

  // Bring the active row into view as the cursor moves.
  useEffect(() => {
    if (!flat.length) return
    const id = flat[Math.min(activeIndex, flat.length - 1)]?.id
    if (!id) return
    document
      .querySelector(`[data-timeline-id="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, flat])

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!flat.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const entry = flat[Math.min(activeIndex, flat.length - 1)]
      // Only entity rows open; a flow row is a moment, not a destination.
      if (entry && entry.kind === 'entity' && entry.nodeId) openEntity(entry.app, entry.nodeId)
    }
  }

  const chip = (
    dim: 'app' | 'kind',
    current: string[],
    setDim: (v: string[]) => void,
    value: string,
    label: string,
    count: number,
    color?: string,
  ) => {
    const on = current.includes(value)
    return (
      <Button
        key={`${dim}-${value}`}
        variant="ghost"
        size="sm"
        data-timeline-facet={`${dim}:${value}`}
        onClick={() => setDim(toggleFacet(current, value))}
        aria-pressed={on}
        className="rounded-full"
        style={{
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          fontFamily: 'var(--mono)',
          fontSize: 'var(--text-xs)',
          gap: '6px',
          transitionDuration: 'var(--dur-fast)',
          color: on ? 'var(--text)' : 'var(--text2)',
          background: on ? 'color-mix(in srgb, var(--signal) 22%, transparent)' : 'transparent',
          border: `1px solid ${on ? 'var(--signal)' : 'var(--hairline, color-mix(in srgb, var(--xenon) 12%, transparent))'}`,
        }}
      >
        {color && (
          <span aria-hidden="true" className="rounded-full" style={{ width: 6, height: 6, background: color }} />
        )}
        <span>{label}</span>
        <span style={{ color: 'var(--text3)' }}>{count}</span>
      </Button>
    )
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="p-6 max-w-2xl mx-auto"
      style={{ outline: 'none' }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <TimelineIcon className="w-6 h-6" style={{ color: ACCENT }} /> Timeline
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
          The organism’s history, one stream · {stream.length} moment{stream.length === 1 ? '' : 's'}
          {filtered.length !== stream.length && ` · ${filtered.length} shown`}
        </p>

        {/* Filter chips — derived from the current (unfiltered) stream */}
        {showChips && (
          <div className="mt-4 space-y-2">
            {facets.kinds.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="t-label" style={{ color: 'var(--text3)' }}>Kind</span>
                {facets.kinds.map(f =>
                  chip('kind', kindFilter, setKindFilter, f.value, KIND_LABEL[f.value] ?? f.value, f.count),
                )}
              </div>
            )}
            {facets.apps.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="t-label" style={{ color: 'var(--text3)' }}>App</span>
                {facets.apps.map(f =>
                  chip('app', appFilter, setAppFilter, f.value, appById[f.value]?.name ?? f.value, f.count, appById[f.value]?.color),
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Idle / empty */}
      {days.length === 0 && (
        <div className="gp rounded-2xl text-center" style={{ padding: 'var(--space-6, 28px)' }}>
          <TimelineIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text3)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text2)' }}>
            {hasStream ? 'No moments match these filters' : 'No history yet'}
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text3)' }}>
            {hasStream
              ? 'Clear a filter chip to widen the stream.'
              : 'Create or hand off anything and it lands here — every entity birth and every app→app transfer, newest-first, grouped by day.'}
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
                  active={indexById.get(entry.id) === activeIndex}
                />
              ) : (
                <FlowRow
                  key={entry.id}
                  entry={entry}
                  appById={appById}
                  now={now}
                  active={indexById.get(entry.id) === activeIndex}
                />
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

/** An entity BIRTH — the whole row opens its entity; ancestry + ⚡ inline. */
function EntityRow({
  entry, accent, now, active,
}: { entry: TimelineEntry; accent?: string; now: number; active: boolean }) {
  const nodeId = entry.nodeId!
  return (
    <div
      data-timeline-kind="entity"
      data-timeline-id={entry.id}
      aria-current={active ? 'true' : undefined}
      className="gp gp-interactive group relative rounded-2xl flex items-center gap-3"
      style={{
        padding: 'var(--space-3, 14px)',
        boxShadow: active ? 'inset 0 0 0 1px var(--ion)' : undefined,
      }}
    >
      <span
        aria-hidden="true"
        className="flex-shrink-0 rounded-full"
        style={{ width: 8, height: 8, background: accent ?? 'var(--text3)' }}
      />

      <Button
        variant="ghost"
        onClick={() => openEntity(entry.app, nodeId)}
        aria-label={`Open ${entry.title} in ${entry.app}`}
        style={{ flex: 1, minWidth: 0, justifyContent: 'flex-start', padding: 0, background: 'transparent' }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
          <div data-timeline-title className="text-sm font-medium truncate" style={{ color: 'var(--text)', maxWidth: '100%' }}>
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
            {/* …and forward: the entities this moment spawned (EPIC-10 S3). */}
            <NodeDescendants nodeId={nodeId} />
            {/* …and sideways: the associative constellation (EPIC-19 S3) —
                cross-app relatives, one tap away. Self-hides when empty. */}
            <RelatedConstellation nodeId={nodeId} />
          </div>
        </span>
      </Button>

      <div
        className={`flex items-center gap-1 transition-opacity ${active ? '' : 'opacity-0 group-hover:opacity-100'}`}
        style={{ transitionDuration: 'var(--dur-fast)' }}
      >
        <NodeActions nodeId={nodeId} />
      </div>
    </div>
  )
}

/** A durable HANDOFF moment — `from → to` — not a button (no single entity). */
function FlowRow({
  entry, appById, now, active,
}: { entry: TimelineEntry; appById: Record<string, AppDefinition>; now: number; active: boolean }) {
  const from = appById[entry.app]
  const to = entry.toApp ? appById[entry.toApp] : undefined
  const FromIcon = from ? getAppIcon(from.icon) : null
  const ToIcon = to ? getAppIcon(to.icon) : null
  return (
    <div
      data-timeline-kind="flow"
      data-timeline-id={entry.id}
      role="note"
      aria-label={`${from?.name ?? entry.app} fed ${to?.name ?? entry.toApp}`}
      className="gp rounded-2xl flex items-center gap-2 text-xs"
      style={{
        padding: 'var(--space-3, 14px)',
        color: 'var(--text2)',
        fontFamily: 'var(--mono)',
        boxShadow: active ? 'inset 0 0 0 1px var(--ion)' : undefined,
      }}
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
