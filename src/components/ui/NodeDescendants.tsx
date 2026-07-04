/**
 * NodeDescendants — the "→ spawned" surface (Organism · node-level lineage, EPIC-10 S3).
 *
 * `NodeLineage` reads a node's ancestry BACKWARD ("↖ where did this come from?").
 * NodeDescendants reads the SAME per-artifact graph FORWARD: "→ what did this
 * spawn?" — every node whose `data.from` points at this one. The core intents
 * stamp `data.from = sourceNode.id` on every node they create, so the Core graph
 * already holds the descendant edges; `childrenOf` (built EPIC-9 S1, unit-pinned)
 * is the walker — this is its first surface. Read together on one Timeline moment,
 * an entity now reads BOTH ways: `↖ ancestry` and `→ spawned`.
 *
 * Reads the graph reactively, so a freshly-derived child appears the moment it
 * lands. Renders nothing when the node has spawned nothing. Colours come from
 * each descendant's owning-app registry accent + icon (identity data — no raw hex
 * literal, mirrors NodeLineage / LineageTrail).
 *
 * NAVIGABLE: each descendant is a real control — clicking it `openEntity(app,
 * nodeId)`s the spawned entity (open its owning app + point the organism's gaze
 * at it). A token is a `role="button"` span (not a `<button>`) with
 * `stopPropagation`/`preventDefault`, so it stays valid HTML and self-contained
 * even nested inside the Timeline row's clickable `<button>` (the exact pattern
 * `EntityToken` established in NodeLineage).
 */
import type { KeyboardEvent, MouseEvent } from 'react'
import { useGraph } from '../../lib/core/graph'
import { childrenOf } from '../../lib/core/nodeLineage'
import { openEntity } from '../../lib/windowStore'
import { apps, getAppIcon } from '../../lib/registry'
import type { CoreNode } from '../../lib/core/graph'

// Strip the intent-added prefixes so a derived node reads as the source entity.
const entityLabel = (n: CoreNode) => n.title.replace(/^(Do|Note):\s*/, '')

function DescendantToken({ node }: { node: CoreNode }) {
  const app = apps.find(a => a.id === node.meta.app)
  const accent = app?.color ?? 'var(--text3)'
  const Icon = getAppIcon(app?.icon ?? '')
  const label = entityLabel(node)
  // Jump to the spawned entity. stopPropagation so a token inside a larger
  // clickable row (the Timeline entity row) navigates to the CHILD, not the row.
  const open = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation()
    e.preventDefault()
    openEntity(node.meta.app, node.id)
  }
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') open(e) }}
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

export function NodeDescendants({ nodeId }: { nodeId: string }) {
  const nodes = useGraph(s => s.nodes)
  const children = childrenOf(nodes, nodeId)
  if (children.length === 0) return null

  return (
    <div
      role="note"
      data-node-descendants={nodeId}
      aria-label={`Spawned ${children.map(entityLabel).join(', ')}`}
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
      <span aria-hidden style={{ color: 'var(--text3)', flexShrink: 0 }}>→ spawned</span>
      {children.map((n, i) => (
        <span key={n.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
          {i > 0 && <span aria-hidden style={{ color: 'var(--text3)', flexShrink: 0 }}>·</span>}
          <DescendantToken node={n} />
        </span>
      ))}
    </div>
  )
}
