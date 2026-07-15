/**
 * Associative relatedness — the organism's 6th lens (EPIC-19).
 *
 * The graph already knows EXPLICIT edges: an edge exists only when an app fired
 * a handoff (a `ProvEdge`) or an intent stamped `data.from`. It has never
 * revealed an IMPLICIT relationship — two notes about the same topic, a task and
 * an event that share a tag, entities born the same day. This module is the pure,
 * storage-agnostic spine that, given any entity, ranks the OTHER entities across
 * every app that are genuinely related to it and labels WHY.
 *
 * Kept free of React and the store (takes `CoreNode[]`, returns values) so the
 * scoring is unit-tested without a browser — the constellation surfaces just feed
 * it the live `useGraph` nodes and render the result.
 */
import type { CoreNode } from './graph'
import { nodeBodyText } from './search'

/** Why one entity is related to another — one label per signal that fired. */
export type RelatedReason = 'linked' | 'shared-term' | 'shared-tag' | 'same-day'

/** One related entity, its total score, and the reasons that scored. */
export interface RelatedItem {
  node: CoreNode
  /** Higher = more related. */
  score: number
  /** The signals that fired, deterministic order: linked · shared-tag · shared-term · same-day. */
  reasons: RelatedReason[]
}

/** Terms too common to signal a topical relationship. */
const STOP = new Set([
  'this', 'that', 'with', 'from', 'have', 'about', 'your', 'will', 'into',
  'they', 'them', 'then', 'when', 'what', 'which', 'were', 'been',
])

/**
 * The distinctive terms of a node: the union of its title tokens and the search
 * spine's `nodeBodyText` tokens (so `data` values + tags count), split on
 * non-word runs, kept to length ≥ 4, minus the STOP set, deduped. Reuses
 * `nodeBodyText` from `./search` — the ONE definition of a node's body text.
 */
export function significantTerms(node: CoreNode): string[] {
  const raw = `${node.title.toLowerCase()} ${nodeBodyText(node)}`.split(/\W+/)
  const out = new Set<string>()
  for (const t of raw) {
    if (t.length >= 4 && !STOP.has(t)) out.add(t)
  }
  return [...out]
}

/** Local-calendar day bucket for a timestamp (pure, no import cycle). */
function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** The string elements of a node's `data.tags` array (empty when absent/not an array). */
function tagsOf(node: CoreNode): string[] {
  const raw = (node.data as { tags?: unknown }).tags
  return Array.isArray(raw) ? raw.filter((t): t is string => typeof t === 'string') : []
}

/** True iff `T` and `N` carry an explicit edge in either direction (graph link or `data.from`). */
function areLinked(T: CoreNode, N: CoreNode): boolean {
  return (
    T.links.includes(N.id) ||
    N.links.includes(T.id) ||
    T.data.from === N.id ||
    N.data.from === T.id
  )
}

/** Count of common members between two string lists (order-independent). */
function intersectCount(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0
  const set = new Set(a)
  let n = 0
  for (const x of b) if (set.has(x)) n++
  return n
}

/**
 * Rank the entities related to node `id`. Resolves the target `T` (returns `[]`
 * if `id` is absent); for every OTHER node `N` sums a score from the signals that
 * fire — **linked +8**, **shared-tag +4/tag (cap +12)**, **shared-term +3/term
 * (cap +9)**, **same-day +2** — dropping any node that scored 0. Sorted by score
 * desc then `meta.updated` desc, capped to `limit`, each item carrying the reasons
 * that scored (linked · shared-tag · shared-term · same-day).
 */
export function relatedTo(nodes: CoreNode[], id: string, limit = 6): RelatedItem[] {
  const T = nodes.find(n => n.id === id)
  if (!T) return []
  const tTerms = significantTerms(T)
  const tTags = tagsOf(T)

  const items: RelatedItem[] = []
  for (const N of nodes) {
    if (N.id === id) continue
    let score = 0
    const reasons: RelatedReason[] = []

    if (areLinked(T, N)) {
      score += 8
      reasons.push('linked')
    }
    const sharedTags = intersectCount(tTags, tagsOf(N))
    if (sharedTags > 0) {
      score += Math.min(sharedTags * 4, 12)
      reasons.push('shared-tag')
    }
    const sharedTerms = intersectCount(tTerms, significantTerms(N))
    if (sharedTerms > 0) {
      score += Math.min(sharedTerms * 3, 9)
      reasons.push('shared-term')
    }
    if (dayKey(T.meta.created) === dayKey(N.meta.created)) {
      score += 2
      reasons.push('same-day')
    }

    if (score > 0) items.push({ node: N, score, reasons })
  }

  items.sort((a, b) => b.score - a.score || b.node.meta.updated - a.node.meta.updated)
  return items.slice(0, limit)
}
