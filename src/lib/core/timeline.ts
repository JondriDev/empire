/**
 * Empire Timeline — the organism's TEMPORAL lens (EPIC-10 · The Timeline, S1).
 *
 * The Empire has three lenses over its one Core graph — Network (STRUCTURAL),
 * Search (QUERY), Inbox (TASK) — but no way to see *when* the organism did
 * things, even though it has carried the data all along: every `CoreNode`
 * stamps `meta.created` (`graph.ts`) and every `ProvEdge` stamps `at`
 * (`provenance.ts`). This module is the missing 4th lens's spine: it merges
 * every entity-birth and every app→app handoff into one time-ordered stream,
 * newest-first, bucketed by UTC calendar day.
 *
 * Everything here is pure — `(nodes, edges, …) → value`, no store access, no
 * `Date.now()` (the component passes `now` into `relativeDayLabel`) — so the
 * whole temporal ordering is unit-tested in isolation and the guard/tests never
 * flake across the runner's timezone or wall clock.
 *
 * I am the connector — the graph is my memory, the ledger my recollection; this
 * is how the organism finally remembers *when*.
 */

import type { CoreNode } from './graph'
import type { ProvEdge } from './provenance'
import type { Facet } from './search'

/** One time-ordered moment in the organism's life. */
export interface TimelineEntry {
  /** Stable id — `n:<nodeId>` for a birth, `e:<from>:<to>:<at>` for a handoff. */
  id: string
  /** An entity BIRTH (a CoreNode) or a FLOW (an app→app handoff). */
  kind: 'entity' | 'flow'
  /** When it happened (ms epoch) — the honest ordering key. */
  at: number
  /** The entity's node id (entity entries only). */
  nodeId?: string
  /** Owning app for an entity; source app for a flow. */
  app: string
  /** The entity title, or a synthesized "<from> → <to>" for a flow. */
  title: string
  /** The entity's node type (entity entries only). */
  type?: string
  /** Target app (flow entries only). */
  toApp?: string
  /** The terse verb carried by a handoff, if any (flow entries only). */
  label?: string
}

/**
 * Pure: merge every node (→ an entity birth keyed on `meta.created`) and every
 * edge (→ a flow keyed on `at`) into one stream, sorted STRICTLY newest-first by
 * `at` with a deterministic `id` tie-break (descending), capped to `limit`. No
 * store access, so it unit-tests without React.
 */
export function buildTimeline(
  _nodes: Record<string, CoreNode>,
  _edges: ProvEdge[],
  _limit = 200,
): TimelineEntry[] {
  const entries: TimelineEntry[] = []

  for (const node of Object.values(_nodes)) {
    entries.push({
      id: `n:${node.id}`,
      kind: 'entity',
      at: node.meta.created,
      nodeId: node.id,
      app: node.meta.app,
      title: node.title,
      type: node.type,
    })
  }

  for (const edge of _edges) {
    entries.push({
      id: `e:${edge.fromApp}:${edge.toApp}:${edge.at}`,
      kind: 'flow',
      at: edge.at,
      app: edge.fromApp,
      toApp: edge.toApp,
      title: `${edge.fromApp} → ${edge.toApp}`,
      ...(edge.label !== undefined ? { label: edge.label } : {}),
    })
  }

  // Strictly newest-first by `at`; ties broken by `id` DESCENDING so the order
  // is total + deterministic for the guard and the tests.
  entries.sort((a, b) => (b.at - a.at) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))

  return entries.slice(0, _limit)
}

/** Zero-pad a positive integer to two digits. */
function pad2(_n: number): string {
  return _n < 10 ? `0${_n}` : `${_n}`
}

/**
 * Pure: the UTC calendar-day bucket `YYYY-MM-DD` for a timestamp. UTC + zero-pad
 * so the bucket is deterministic regardless of the runner's timezone or locale
 * (never uses `Date.now()`), which keeps the tests + the guard stable.
 */
export function dayKey(_at: number): string {
  const d = new Date(_at)
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

/** A day bucket: its `YYYY-MM-DD` key + the entries born that day, newest-first. */
export interface TimelineDay {
  day: string
  entries: TimelineEntry[]
}

/**
 * Pure: bucket a (newest-first) entry stream by UTC day. Days are returned
 * newest-first and entries within each day preserve their input order (already
 * newest-first). Returns an ordered array (NOT a map) so render order is fixed.
 */
export function groupByDay(_entries: TimelineEntry[]): TimelineDay[] {
  const days: TimelineDay[] = []
  const byKey = new Map<string, TimelineDay>()
  for (const entry of _entries) {
    const key = dayKey(entry.at)
    let bucket = byKey.get(key)
    if (!bucket) {
      bucket = { day: key, entries: [] }
      byKey.set(key, bucket)
      days.push(bucket)
    }
    bucket.entries.push(entry)
  }
  return days
}

/**
 * Pure: a human label for a day bucket, given `now` explicitly (NEVER calls
 * `Date.now()` — only the component passes the clock in, keeping this testable).
 * The current UTC day → "Today", the prior UTC day → "Yesterday", else the raw
 * `YYYY-MM-DD` key.
 */
export function relativeDayLabel(_day: string, _now: number): string {
  if (_day === dayKey(_now)) return 'Today'
  // One UTC day earlier. 86_400_000 ms = 24 h; UTC has no DST discontinuities.
  if (_day === dayKey(_now - 86_400_000)) return 'Yesterday'
  return _day
}

/**
 * Which dimensions of the stream the user has narrowed to (empty dim = no
 * narrowing). Mirrors Search's `HitFilter` so the Timeline gets the same faceted
 * controls the query lens already has (EPIC-10 S2).
 */
export interface TimelineFilter {
  /** Keep only entries owned by one of these apps (ignored when empty/absent). */
  apps?: string[]
  /** Keep only entries of these kinds — `entity` and/or `flow` (ignored when empty). */
  kinds?: TimelineEntry['kind'][]
  /** Keep only ENTITY entries of these node types (ignored when empty/absent). */
  types?: string[]
}

/**
 * Pure: narrow the stream to the chosen apps / kinds / entity-types. AND across
 * dimensions (an app AND a kind filter must both pass), OR within a dimension
 * (any of the chosen apps). An empty/absent dimension does not filter, so
 * `filterTimeline(entries, {})` returns the input untouched (order preserved).
 * A `types` filter matches only entity entries — flows carry no `type`.
 */
export function filterTimeline(_entries: TimelineEntry[], _filter: TimelineFilter): TimelineEntry[] {
  const apps = _filter.apps && _filter.apps.length ? new Set(_filter.apps) : null
  const kinds = _filter.kinds && _filter.kinds.length ? new Set<string>(_filter.kinds) : null
  const types = _filter.types && _filter.types.length ? new Set(_filter.types) : null
  if (!apps && !kinds && !types) return _entries
  return _entries.filter(e =>
    (!apps || apps.has(e.app)) &&
    (!kinds || kinds.has(e.kind)) &&
    (!types || (e.type !== undefined && types.has(e.type))),
  )
}

/**
 * Pure: the available filter facets — the distinct owning `apps` and `kinds`
 * present, each with its entry count. Sorted count-desc then value-asc so the
 * busiest chips lead and the order is deterministic. Computed over the UNFILTERED
 * stream so the chips always show every way to widen back.
 */
export function timelineFacets(_entries: TimelineEntry[]): { apps: Facet[]; kinds: Facet[] } {
  const byApp = new Map<string, number>()
  const byKind = new Map<string, number>()
  for (const e of _entries) {
    byApp.set(e.app, (byApp.get(e.app) ?? 0) + 1)
    byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1)
  }
  const toFacets = (m: Map<string, number>): Facet[] =>
    [...m.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
  return { apps: toFacets(byApp), kinds: toFacets(byKind) }
}
