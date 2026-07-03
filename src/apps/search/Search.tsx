/**
 * Search — the organism's lens: one field that queries EVERY app at once.
 *
 * Every collection-owning app mirrors its real entities into the Core graph
 * (`mirrorCollection` → `empire-core-graph`). Until now those nodes were only
 * legible one app at a time (open Notes to see notes, Inbox to see tasks…).
 * Search reads the whole graph reactively and ranks it against your query with
 * the pure `searchNodes` spine (lib/core/search.ts), grouping the hits by owning
 * app. Each result opens its app or flows onward through the ⚡ NodeActions bar,
 * so the graph stops being 26 silos you navigate one at a time. No private
 * store — the graph IS the corpus.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search as SearchIcon, ArrowUpRight } from 'lucide-react'
import { emit } from '../../lib/eventBus'
import { useGraph } from '../../lib/core/graph'
import { searchNodes, groupHitsByApp, type SearchHit } from '../../lib/core/search'
import { apps, getAppIcon } from '../../lib/registry'
import { openEntity } from '../../lib/windowStore'
import { NodeActions } from '../../components/ui/NodeActions'

// One accent per view — Search reads as ion-blue, the calm scanning light.
const ACCENT = 'var(--ion)'

export default function Search() {
  const nodes = useGraph(s => s.nodes)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const appById = useMemo(
    () => Object.fromEntries(apps.map(a => [a.id, a])) as Record<string, typeof apps[number]>,
    [],
  )

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'search' })
    inputRef.current?.focus()
  }, [])

  const nodeList = useMemo(() => Object.values(nodes), [nodes])
  const hits = useMemo(() => searchNodes(nodeList, query), [nodeList, query])
  const groups = useMemo(() => groupHitsByApp(hits), [hits])

  const trimmed = query.trim()
  const corpusSize = nodeList.length

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
            placeholder="Search notes, tasks, events, books, files…"
            aria-label="Search across every app"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}
            spellCheck={false}
            autoComplete="off"
          />
          {trimmed && (
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
              {hits.length} hit{hits.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>

      {/* Idle — no query yet */}
      {!trimmed && (
        <div className="gp rounded-2xl text-center" style={{ padding: 'var(--space-6, 28px)' }}>
          <SearchIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text3)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text2)' }}>Find anything, anywhere</p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text3)' }}>
            Type to search across every app’s real entities at once — the whole organism, one field.
          </p>
        </div>
      )}

      {/* Query, no matches */}
      {trimmed && hits.length === 0 && (
        <div className="gp rounded-2xl text-center" style={{ padding: 'var(--space-6, 28px)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--text2)' }}>Nothing matches “{trimmed}”</p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text3)' }}>
            Try fewer or shorter words. Only things mirrored into the graph are searchable.
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
                <ResultRow key={hit.node.id} hit={hit} accent={app?.color} appId={group.app} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function ResultRow({ hit, accent, appId }: { hit: SearchHit; accent?: string; appId: string }) {
  const { node } = hit
  return (
    <div
      className="gp gp-interactive group relative rounded-2xl flex items-center gap-3"
      style={{ padding: 'var(--space-3, 14px)' }}
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
        <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: 'var(--text3)' }}>
          <span style={{ fontFamily: 'var(--mono)' }}>{node.type}</span>
          {hit.snippet && <span className="truncate">— {hit.snippet}</span>}
        </div>
      </button>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ transitionDuration: 'var(--dur-fast)' }}>
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
