/**
 * Search — the organism's lens: one field that queries EVERY app at once.
 *
 * Every collection-owning app mirrors its real entities into the Core graph
 * (`mirrorCollection` → `empire-core-graph`). Until now those nodes were only
 * legible one app at a time (open Notes to see notes, Inbox to see tasks…).
 * Search reads the whole graph reactively and ranks it against your query with
 * the pure `searchNodes` spine (lib/core/search.ts), grouping the hits by owning
 * app. Filter chips narrow by node type / owning app; ↑/↓/Enter drive the ranked
 * list mouse-free; each result opens its app or flows onward through the ⚡
 * NodeActions bar. No private store — the graph IS the corpus.
 *
 * Summon: the shell's ⌘/Ctrl+Shift+F opens this app and dispatches
 * `empire:summon-search`, which we catch to (re)focus + select the field even
 * when Search is already foregrounded (mount autofocus covers the first open).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search as SearchIcon, ArrowUpRight } from 'lucide-react'
import { emit } from '../../lib/eventBus'
import { useGraph } from '../../lib/core/graph'
import {
  searchNodes,
  groupHitsByApp,
  filterHits,
  hitFacets,
  toggleFacet,
  type SearchHit,
} from '../../lib/core/search'
import { apps, getAppIcon } from '../../lib/registry'
import { openEntity } from '../../lib/windowStore'
import { NodeActions } from '../../components/ui/NodeActions'
import { NodeLineage } from '../../components/ui/NodeLineage'

// One accent per view — Search reads as ion-blue, the calm scanning light.
const ACCENT = 'var(--ion)'

export default function Search() {
  const nodes = useGraph(s => s.nodes)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [appFilter, setAppFilter] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const appById = useMemo(
    () => Object.fromEntries(apps.map(a => [a.id, a])) as Record<string, typeof apps[number]>,
    [],
  )

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'search' })
    inputRef.current?.focus()
  }, [])

  // Re-focus + select on a global summon, even when already foregrounded.
  useEffect(() => {
    const onSummon = () => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    window.addEventListener('empire:summon-search', onSummon)
    return () => window.removeEventListener('empire:summon-search', onSummon)
  }, [])

  const nodeList = useMemo(() => Object.values(nodes), [nodes])
  const hits = useMemo(() => searchNodes(nodeList, query), [nodeList, query])
  const facets = useMemo(() => hitFacets(hits), [hits])
  const filtered = useMemo(
    () => filterHits(hits, { types: typeFilter, apps: appFilter }),
    [hits, typeFilter, appFilter],
  )
  const groups = useMemo(() => groupHitsByApp(filtered), [filtered])
  // Flat, rank-ordered list in the SAME order the groups render — the roving cursor.
  const flat = useMemo(() => groups.flatMap(g => g.hits), [groups])
  const indexByNode = useMemo(
    () => new Map(flat.map((h, i) => [h.node.id, i])),
    [flat],
  )

  const trimmed = query.trim()
  const corpusSize = nodeList.length

  // Keep the cursor in range as the query / filters narrow the list.
  useEffect(() => { setActiveIndex(0) }, [query, typeFilter, appFilter])

  // Bring the active row into view as the cursor moves.
  useEffect(() => {
    if (!flat.length) return
    const id = flat[Math.min(activeIndex, flat.length - 1)]?.node.id
    if (!id) return
    document
      .querySelector(`[data-result-id="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, flat])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!flat.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const hit = flat[Math.min(activeIndex, flat.length - 1)]
      if (hit) openEntity(hit.node.meta.app, hit.node.id)
    }
  }

  const chip = (
    dimension: string[],
    setDimension: (v: string[]) => void,
    value: string,
    label: string,
    count: number,
    color?: string,
  ) => {
    const on = dimension.includes(value)
    return (
      <button
        key={`${label}-${value}`}
        onClick={() => setDimension(toggleFacet(dimension, value))}
        aria-pressed={on}
        className="rounded-full text-xs flex items-center gap-1.5 transition-colors"
        style={{
          padding: '4px 10px',
          fontFamily: 'var(--mono)',
          transitionDuration: 'var(--dur-fast)',
          color: on ? 'var(--text)' : 'var(--text2)',
          background: on ? 'color-mix(in srgb, var(--ion) 22%, transparent)' : 'transparent',
          border: `1px solid ${on ? 'var(--ion)' : 'var(--hairline, color-mix(in srgb, var(--xenon) 12%, transparent))'}`,
        }}
      >
        {color && (
          <span aria-hidden="true" className="rounded-full" style={{ width: 6, height: 6, background: color }} />
        )}
        <span>{label}</span>
        <span style={{ color: 'var(--text3)' }}>{count}</span>
      </button>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header + field */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <SearchIcon className="w-6 h-6" style={{ color: ACCENT }} /> Search
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
          One lens across every app · {corpusSize} thing{corpusSize === 1 ? '' : 's'} in the graph
        </p>

        <div
          className="gp rounded-2xl flex items-center gap-3 mt-4"
          style={{ padding: 'var(--space-3, 14px)' }}
        >
          <SearchIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text3)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search notes, tasks, events, books, files…"
            aria-label="Search across every app"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}
            spellCheck={false}
            autoComplete="off"
          />
          {trimmed && (
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
              {filtered.length} hit{filtered.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* Filter chips — derived from the current (unfiltered) hits */}
        {trimmed && hits.length > 0 && (facets.types.length > 1 || facets.apps.length > 1) && (
          <div className="mt-3 space-y-2">
            {facets.types.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="t-label" style={{ color: 'var(--text3)' }}>Type</span>
                {facets.types.map(f => chip(typeFilter, setTypeFilter, f.value, f.value, f.count))}
              </div>
            )}
            {facets.apps.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="t-label" style={{ color: 'var(--text3)' }}>App</span>
                {facets.apps.map(f =>
                  chip(appFilter, setAppFilter, f.value, appById[f.value]?.name ?? f.value, f.count, appById[f.value]?.color),
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Idle — no query yet */}
      {!trimmed && (
        <div className="gp rounded-2xl text-center" style={{ padding: 'var(--space-6, 28px)' }}>
          <SearchIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text3)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text2)' }}>Find anything, anywhere</p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text3)' }}>
            Type to search across every app’s real entities at once — the whole organism, one field.
            <br />↑ ↓ to move · Enter to open · ⌘⇧F to summon from anywhere.
          </p>
        </div>
      )}

      {/* Query, no matches (after filters) */}
      {trimmed && filtered.length === 0 && (
        <div className="gp rounded-2xl text-center" style={{ padding: 'var(--space-6, 28px)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--text2)' }}>
            {hits.length === 0 ? `Nothing matches “${trimmed}”` : 'No hits match these filters'}
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text3)' }}>
            {hits.length === 0
              ? 'Try fewer or shorter words. Only things mirrored into the graph are searchable.'
              : 'Clear a filter chip to widen the results.'}
          </p>
        </div>
      )}

      {/* Results, grouped by owning app */}
      {trimmed && groups.map(group => {
        const app = appById[group.app]
        const GlyphIcon = app ? getAppIcon(app.icon) : null
        return (
          <section key={group.app} className="mb-6" data-search-group={group.app}>
            <div className="t-label mb-2 flex items-center gap-2" style={{ color: 'var(--text3)' }}>
              {GlyphIcon && <GlyphIcon className="w-3.5 h-3.5" style={{ color: app?.color }} />}
              <span>{app?.name ?? group.app}</span>
              <span style={{ color: 'var(--text3)' }}>· {group.hits.length}</span>
            </div>
            <div className="space-y-2">
              {group.hits.map(hit => (
                <ResultRow
                  key={hit.node.id}
                  hit={hit}
                  accent={app?.color}
                  appId={group.app}
                  active={indexByNode.get(hit.node.id) === activeIndex}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function ResultRow({
  hit, accent, appId, active,
}: { hit: SearchHit; accent?: string; appId: string; active: boolean }) {
  const { node } = hit
  return (
    <div
      data-result-id={node.id}
      aria-current={active ? 'true' : undefined}
      className="gp gp-interactive group relative rounded-2xl flex items-center gap-3"
      style={{
        padding: 'var(--space-3, 14px)',
        boxShadow: active ? 'inset 0 0 0 1px var(--ion)' : undefined,
      }}
    >
      {/* Type dot in the app accent */}
      <span
        aria-hidden="true"
        className="flex-shrink-0 rounded-full"
        style={{ width: 8, height: 8, background: accent ?? 'var(--text3)' }}
      />

      <button
        onClick={() => openEntity(appId, node.id)}
        className="flex-1 min-w-0 text-left"
        aria-label={`Open ${node.title} in ${appId}`}
      >
        <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
          {node.title || '(untitled)'}
        </div>
        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs" style={{ color: 'var(--text3)' }}>
          <span style={{ fontFamily: 'var(--mono)' }}>{node.type}</span>
          {hit.snippet && <span className="truncate">— {hit.snippet}</span>}
          {/* Node-level lineage — the exact entity this hit descended from. */}
          <NodeLineage nodeId={node.id} />
        </div>
      </button>

      <div
        className={`flex items-center gap-1 transition-opacity ${active ? '' : 'opacity-0 group-hover:opacity-100'}`}
        style={{ transitionDuration: 'var(--dur-fast)' }}
      >
        <NodeActions nodeId={node.id} />
        <button
          onClick={() => openEntity(appId, node.id)}
          aria-label={`Open in ${appId}`}
          className="p-1.5 rounded-lg"
          style={{ color: 'var(--text3)' }}
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
