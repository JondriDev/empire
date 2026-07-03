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
 */
import { useGraph } from '../../lib/core/graph'
import { nodeLineageOf } from '../../lib/core/nodeLineage'
import { apps, getAppIcon } from '../../lib/registry'
import type { CoreNode } from '../../lib/core/graph'

// Strip the intent-added prefixes so a derived node reads as the source entity.
const entityLabel = (n: CoreNode) => n.title.replace(/^(Do|Note):\s*/, '')

function EntityToken({ node }: { node: CoreNode }) {
  const app = apps.find(a => a.id === node.meta.app)
  const accent = app?.color ?? 'var(--text3)'
  const Icon = getAppIcon(app?.icon ?? '')
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
      <Icon className="w-3 h-3" aria-hidden style={{ color: accent, flexShrink: 0 }} />
      <span style={{ color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {entityLabel(node)}
      </span>
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
