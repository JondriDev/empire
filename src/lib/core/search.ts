/**
 * Global cross-app search — the organism becomes queryable.
 *
 * Every collection-owning app mirrors its real entities into the Core graph
 * (`mirrorCollection` → `empire-core-graph`): notes, tasks, events, goals,
 * messages, learning, files, photos, books, prompts, datasets… Until now those
 * nodes were only legible one app at a time. This is the pure, storage-agnostic
 * ranking spine behind one search surface that queries them ALL at once.
 *
 * Kept free of React and the store (takes `CoreNode[]`, returns values) so the
 * ranking is unit-tested without a browser — the Search app just feeds it the
 * live `useGraph` nodes and renders the hits.
 */
import type { CoreNode } from './graph'

export interface SearchHit {
  node: CoreNode
  /** Higher = better match. */
  score: number
  /** Where the strongest signal came from, for the UI to hint the match. */
  field: 'title' | 'body' | 'type'
  /** A short context window around the first body match (empty for title/type hits). */
  snippet: string
}

/** A group of hits owned by one app, ordered by the group's best hit. */
export interface AppHitGroup {
  app: string
  hits: SearchHit[]
  topScore: number
}

/** Split a query into lowercased search terms (whitespace-delimited, non-empty). */
export function queryTerms(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean)
}

/**
 * Flatten a node's searchable text: its `data`'s shallow string/number values.
 * Nested objects/arrays are skipped (kept cheap + predictable); the volatile
 * blob-url fields apps never store here anyway. Returned lowercased.
 */
export function nodeBodyText(node: CoreNode): string {
  const parts: string[] = []
  for (const v of Object.values(node.data ?? {})) {
    if (typeof v === 'string') parts.push(v)
    else if (typeof v === 'number' || typeof v === 'boolean') parts.push(String(v))
  }
  return parts.join(' ').toLowerCase()
}

/** Extract a short window around the first occurrence of any term in `body`. */
function snippetFor(body: string, terms: string[], width = 64): string {
  let idx = -1
  for (const t of terms) {
    const i = body.indexOf(t)
    if (i >= 0 && (idx < 0 || i < idx)) idx = i
  }
  if (idx < 0) return ''
  const start = Math.max(0, idx - Math.floor(width / 3))
  const raw = body.slice(start, start + width).trim()
  return (start > 0 ? '…' : '') + raw + (start + width < body.length ? '…' : '')
}

/**
 * Score one node against the query terms. Returns null when the node does NOT
 * match ALL terms (every term must appear in the title, body, or type) — so a
 * multi-word query narrows rather than widens.
 */
export function scoreNode(node: CoreNode, terms: string[]): Omit<SearchHit, 'node'> | null {
  if (terms.length === 0) return null
  const title = node.title.toLowerCase()
  const body = nodeBodyText(node)
  const type = node.type.toLowerCase()
  const fullQuery = terms.join(' ')

  let score = 0
  let titleMatched = false
  let bodyMatched = false

  for (const term of terms) {
    let hit = false
    // Title matches — strongest, with a prefix/word-boundary gradient.
    if (title.startsWith(term)) { score += 12; titleMatched = true; hit = true }
    else if (new RegExp(`\\b${escapeRe(term)}`).test(title)) { score += 9; titleMatched = true; hit = true }
    else if (title.includes(term)) { score += 6; titleMatched = true; hit = true }
    // Type match (e.g. querying "task" surfaces every task node) — modest.
    if (type === term) { score += 4; hit = true }
    else if (type.includes(term)) { score += 2; hit = true }
    // Body match — the long tail.
    if (body.includes(term)) { score += 2; bodyMatched = true; hit = true }
    if (!hit) return null // this term matched nowhere → node is not a hit
  }

  // Whole-query bonuses so an exact/prefix title floats to the top.
  if (title === fullQuery) score += 20
  else if (title.startsWith(fullQuery)) score += 10

  const field: SearchHit['field'] = titleMatched ? 'title' : bodyMatched ? 'body' : 'type'
  const snippet = field === 'body' ? snippetFor(body, terms) : ''
  return { score, field, snippet }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Rank every node against `query`. Empty/whitespace query → []. Results are
 * sorted by score desc, then most-recently-updated first, capped at `limit`.
 */
export function searchNodes(nodes: CoreNode[], query: string, limit = 50): SearchHit[] {
  const terms = queryTerms(query)
  if (terms.length === 0) return []
  const hits: SearchHit[] = []
  for (const node of nodes) {
    const scored = scoreNode(node, terms)
    if (scored) hits.push({ node, ...scored })
  }
  hits.sort((a, b) => b.score - a.score || b.node.meta.updated - a.node.meta.updated)
  return hits.slice(0, limit)
}

/**
 * Group ranked hits by owning app (`node.meta.app`), preserving each group's
 * internal rank and ordering the groups by their best hit — the shape the
 * Search surface renders (one section per app).
 */
export function groupHitsByApp(hits: SearchHit[]): AppHitGroup[] {
  const byApp = new Map<string, SearchHit[]>()
  for (const hit of hits) {
    const app = hit.node.meta.app
    const bucket = byApp.get(app)
    if (bucket) bucket.push(hit)
    else byApp.set(app, [hit])
  }
  const groups: AppHitGroup[] = [...byApp.entries()].map(([app, appHits]) => ({
    app,
    hits: appHits,
    topScore: appHits.reduce((m, h) => Math.max(m, h.score), 0),
  }))
  groups.sort((a, b) => b.topScore - a.topScore || a.app.localeCompare(b.app))
  return groups
}
