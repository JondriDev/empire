/**
 * NodeLineage — per-artifact ancestry surface (Organism · node-level lineage).
 *
 * `LineageTrail` shows APP-level provenance ("Goals ← Calculator"). NodeLineage
 * shows NODE-level provenance: the exact ENTITY chain an artifact descended from
 * — "↖ «Survey the anomaly» (Goals) ← «Field log» (Notes)". The core intents
 * stamp `data.from = sourceNode.id` on every node they create, so the Core graph
 * already holds this durable per-artifact ancestry; `nodeLineageOf` walks it and
 * resolves each hop to its live node's real title + owning-app accent/glyph.
 *
 * Reads the graph reactively, so a freshly-derived node's trail appears the
 * moment it lands. Renders nothing when the node has no resolvable ancestor
 * (a top-level entity, or one whose parent was pruned). Colours come from each
 * app's registry accent + icon (identity data — no raw hex literal, mirrors
 * LineageTrail / ProvenanceChip).
 *
 * NAVIGABLE (EPIC-9 S3): each ancestor hop is a real control — clicking it
 * `openEntity(app, nodeId)`s the source entity (open its owning app + point the
 * organism's gaze at it), so you climb the whole ancestry mouse-free. A hop is a
 * `role="button"` span (not a `<button>`) with `stopPropagation`, so it stays
 * valid HTML and self-contained even when the trail is nested inside a larger
 * clickable row (Search's ResultRow wraps it in a `<button>`).
 */
import type { KeyboardEvent, MouseEvent } from 'react'
import { useGraph } from '../../lib/core/graph'
import { nodeLineageOf } from '../../lib/core/nodeLineage'
import { openEntity } from '../../lib/windowStore'
import { apps, getAppIcon } from '../../lib/registry'
import type { CoreNode } from '../../lib/core/graph'

// Strip the intent-added prefixes so a derived node reads as the source entity.
const entityLabel = (n: CoreNode) => n.title.replace(/^(Do|Note):\s*/, '')

function EntityToken({ node }: { node: CoreNode }) {
  const app = apps.find(a => a.id === node.meta.app)
  const accent = app?.color ?? 'var(--text3)'
  const Icon = getAppIcon(app?.icon ?? '')
  const label = entityLabel(node)
  // Climb one hop up the ancestry. stopPropagation so a hop inside a larger
  // clickable row (Search result) navigates to the ANCESTOR, not the row entity.
  const climb = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation()
    e.preventDefault()
    openEntity(node.meta.app, node.id)
  }
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={climb}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') climb(e) }}
      aria-label={`Open ${label} in ${app?.name ?? node.meta.app}`}
      title={`Open ${label}`}
      className="gp-lineage-hop"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0 }}
    >
      <Icon className="w-3 h-3" aria-hidden style={{ color: accent, flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    </span>
  )
}

export function NodeLineage({ nodeId }: { nodeId: string }) {
  const nodes = useGraph(s => s.nodes)
  const chain = nodeLineageOf(nodes, nodeId)
  const ancestors = chain.slice(1) // drop the node itself — show what it came FROM
  if (ancestors.length === 0) return null

  return (
    <div
      role="note"
      data-node-lineage={ancestors[0].id}
      aria-label={`From ${ancestors.map(entityLabel).join(' via ')}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        minWidth: 0,
        maxWidth: '100%',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--mono)',
        color: 'var(--text3)',
      }}
    >
      <span aria-hidden style={{ color: 'var(--text3)', flexShrink: 0 }}>↖</span>
      {ancestors.map((n, i) => (
        <span key={n.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
          {i > 0 && <span aria-hidden style={{ color: 'var(--text3)', flexShrink: 0 }}>←</span>}
          <EntityToken node={n} />
        </span>
      ))}
    </div>
  )
}
