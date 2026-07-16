/**
 * RelatedConstellation — the organism's 6th lens (ASSOCIATIVE), rendered.
 *
 * `NodeLineage` shows where an artifact CAME FROM (explicit ancestry). This
 * shows its *constellation*: the OTHER entities across every app that are
 * IMPLICITLY related to it — same topic, shared tag, born the same day, or an
 * explicit link — ranked and reason-labelled, each one tap away. The scoring is
 * the pure `relatedTo` spine (`src/lib/core/related.ts`); this component just
 * feeds it the live graph and paints the result.
 *
 * Self-hiding like `<NodeLineage>`: renders `null` when nothing is related, so
 * it can be mounted beside any per-entity surface (Network / Timeline / Search)
 * without adding empty chrome.
 *
 * NAVIGABLE: each related entity is a real control — activating it
 * `openEntity(app, id)`s the target (open its owning app + point the organism's
 * gaze at it), so you traverse the constellation mouse-free. Each row is a
 * `role="button"` span (NOT a `<button>`) with `stopPropagation`, so it stays
 * valid HTML even when this block is nested inside a larger clickable row — the
 * Timeline / Search entity rows wrap their content in a `<button>`, and a
 * `<button>` inside a `<button>` is invalid (same idiom as NodeLineage /
 * NodeDescendants).
 *
 * Colours are each app's registry accent + alien glyph (identity data, the same
 * Bridge-attention-row idiom NodeLineage uses); every inline style resolves a
 * `var(--*)` token — the `.related-*` chrome lives in `window-manager.css`.
 */
import { useMemo } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { useGraph } from '../../lib/core/graph'
import { relatedTo, type RelatedReason } from '../../lib/core/related'
import type { RelatedItem } from '../../lib/core/related'
import { openEntity } from '../../lib/windowStore'
import { apps, getAppIcon } from '../../lib/registry'
import { useLang } from '../../lib/i18n'

/** The i18n key for a reason label (its chip text). */
const REASON_KEY: Record<RelatedReason, string> = {
  linked: 'related.reason.linked',
  'shared-tag': 'related.reason.sharedTag',
  'shared-term': 'related.reason.sharedTerm',
  'same-day': 'related.reason.sameDay',
}

function RelatedRow({ item, reasonLabel }: { item: RelatedItem; reasonLabel: string }) {
  const { node } = item
  const app = apps.find(a => a.id === node.meta.app)
  const accent = app?.color ?? 'var(--text3)'
  const Icon = getAppIcon(app?.icon ?? '')
  // Jump to the related entity. stopPropagation so a row inside a larger
  // clickable row (Timeline / Search) navigates to the RELATIVE, not the row.
  const open = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation()
    e.preventDefault()
    openEntity(node.meta.app, node.id)
  }
  return (
    <span
      role="button"
      tabIndex={0}
      className="related-item"
      data-related-item={node.id}
      onClick={open}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') open(e) }}
      aria-label={`Open ${node.title} in ${app?.name ?? node.meta.app} — ${reasonLabel}`}
      title={`Open ${node.title}`}
    >
      <span
        className="related-item-chip"
        aria-hidden
        style={{ color: accent, background: `color-mix(in srgb, ${accent} 14%, transparent)` }}
      >
        <Icon className="w-3 h-3" />
      </span>
      <span className="related-item-title">{node.title}</span>
      <span className="related-item-reason">{reasonLabel}</span>
    </span>
  )
}

export function RelatedConstellation({ nodeId }: { nodeId: string }) {
  const nodes = useGraph(s => s.nodes)
  const { t } = useLang()
  // Memoize the scoring — it walks every node per candidate. Recomputes only
  // when the graph or the focused entity changes.
  const items = useMemo(() => relatedTo(Object.values(nodes), nodeId), [nodes, nodeId])
  if (items.length === 0) return null

  return (
    <div
      className="related-constellation"
      data-related={nodeId}
      role="group"
      aria-label={t('related.title', 'Related')}
    >
      {items.map(item => (
        <RelatedRow
          key={item.node.id}
          item={item}
          reasonLabel={t(REASON_KEY[item.reasons[0]], item.reasons[0])}
        />
      ))}
    </div>
  )
}
