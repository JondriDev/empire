/**
 * Empire Provenance — durable app→app lineage (EPIC-6 · Organism Memory, S1).
 *
 * The organism fires HANDOFFs and forgets them: the Network mesh lights an arc
 * for a heartbeat, then the transfer is gone. This store is the organism's
 * long-term memory of movement — a persistent ledger of every *real* app→app
 * transfer the user caused, so "fed by / feeds" survives a reload and each
 * entity can later show where it truly came from.
 *
 * Honesty rule (inherited from `flow.ts`): the ONLY source of an edge is
 * `flowForEvent(e)`. We never invent a link the user didn't cause. This module
 * is the spine; the Network memory panel (S2), durable per-entity source (S3)
 * and the Reader island (S4) build on it.
 *
 * I am the connector — the event bus is my nerves, the graph is my working
 * memory, and this ledger is my recollection.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { onAny } from '../eventBus'
import { flowForEvent } from './flow'

/** A durable record of one directed app→app transfer. */
export interface ProvEdge {
  /** Source app id (registry id). */
  fromApp: string
  /** Target app id (registry id). */
  toApp: string
  /** Optional terse verb carried by the HANDOFF (e.g. "use as prompt"). */
  label?: string
  /** When it last fired (ms epoch). Bumped when a burst coalesces. */
  at: number
}

/** Keep the ledger bounded — the newest transfers matter most. */
export const MAX_EDGES = 500
/** A repeated same-pair transfer inside this window bumps `at`, not appends. */
export const DEDUP_MS = 1500

/**
 * Pure: fold a new edge into the ledger. A same-pair edge (`fromApp`+`toApp`)
 * that last fired within `DEDUP_MS` of `now` coalesces — its `at` is bumped and
 * its label refreshed (a rapid burst is one relationship, not fifty rows).
 * Otherwise the edge is appended and the ledger capped to the newest MAX_EDGES.
 * Exported (no store access) so the fold logic is unit-tested in isolation.
 */
export function recordEdges(_edges: ProvEdge[], _edge: ProvEdge, _now: number): ProvEdge[] {
  // Find the most recent edge of the same directed pair.
  let lastIdx = -1
  for (let i = _edges.length - 1; i >= 0; i--) {
    if (_edges[i].fromApp === _edge.fromApp && _edges[i].toApp === _edge.toApp) {
      lastIdx = i
      break
    }
  }
  if (lastIdx !== -1 && _now - _edges[lastIdx].at <= DEDUP_MS) {
    const next = _edges.slice()
    next[lastIdx] = { ...next[lastIdx], at: _now, label: _edge.label ?? next[lastIdx].label }
    return next
  }
  const appended = [..._edges, { ..._edge, at: _now }]
  return appended.length > MAX_EDGES ? appended.slice(appended.length - MAX_EDGES) : appended
}

/** Pure: every edge feeding INTO `appId`, newest first. */
export function edgesInto(_edges: ProvEdge[], _appId: string): ProvEdge[] {
  return _edges.filter(e => e.toApp === _appId).sort((a, b) => b.at - a.at)
}

/** Pure: every edge flowing OUT OF `appId`, newest first. */
export function edgesFrom(_edges: ProvEdge[], _appId: string): ProvEdge[] {
  return _edges.filter(e => e.fromApp === _appId).sort((a, b) => b.at - a.at)
}

/** A de-duped neighbour on the provenance ledger: an app + its newest edge. */
export interface ProvNeighbor {
  /** The other app id (source for `fedBy`, target for `feeds`). */
  app: string
  /** When the newest edge to/from this app fired (ms epoch). */
  at: number
  /** The label carried by that newest edge, if any. */
  label?: string
}

/** Pure: collapse a newest-first edge list into unique neighbours (first wins). */
function uniqueNeighbours(_edges: ProvEdge[], _pick: (_e: ProvEdge) => string): ProvNeighbor[] {
  const seen = new Set<string>()
  const out: ProvNeighbor[] = []
  for (const e of _edges) {
    const app = _pick(e)
    if (seen.has(app)) continue
    seen.add(app)
    out.push({ app, at: e.at, ...(e.label !== undefined ? { label: e.label } : {}) })
  }
  return out
}

/**
 * Pure: the distinct apps that have ever fed INTO `appId`, newest first, each
 * carrying its newest edge's `at`/`label`. The all-time "Fed by" list — the
 * durable analogue of the live structural adjacency.
 */
export function fedBy(_edges: ProvEdge[], _appId: string): ProvNeighbor[] {
  return uniqueNeighbours(edgesInto(_edges, _appId), e => e.fromApp)
}

/** Pure: the distinct apps `appId` has ever fed, newest first. The "Feeds" list. */
export function feeds(_edges: ProvEdge[], _appId: string): ProvNeighbor[] {
  return uniqueNeighbours(edgesFrom(_edges, _appId), e => e.toApp)
}

/**
 * Pure: the `n` most recent transfers, newest first — the durable memory panel's
 * feed. The store keeps edges oldest-first, so we take the tail and reverse.
 */
export function recentEdges(_edges: ProvEdge[], _n = 12): ProvEdge[] {
  return _edges.slice(Math.max(0, _edges.length - _n)).reverse()
}

/**
 * Pure: the ancestry chain of `appId` — walk the newest inbound edge backwards,
 * cycle-guarded, up to `maxDepth` hops. Returns `[app, parent, grandparent, …]`
 * (always at least `[appId]`; `[appId]` alone when nothing ever fed it).
 */
export function lineageOf(_edges: ProvEdge[], _appId: string, _maxDepth = 6): string[] {
  const chain: string[] = [_appId]
  const seen = new Set<string>([_appId])
  let current = _appId
  while (chain.length - 1 < _maxDepth) {
    const inbound = edgesInto(_edges, current)[0]
    if (!inbound) break
    const parent = inbound.fromApp
    if (seen.has(parent)) break
    seen.add(parent)
    chain.push(parent)
    current = parent
  }
  return chain
}

interface ProvState {
  /** The durable ledger of app→app transfers, in fire order (oldest first). */
  edges: ProvEdge[]
  /** Record one transfer (coalescing a same-pair burst within DEDUP_MS). */
  record: (_edge: ProvEdge) => void
  /** Wipe the ledger. */
  clear: () => void
}

export const useProvenance = create<ProvState>()(
  persist(
    (set) => ({
      edges: [],
      record: (_edge) => set(s => ({ edges: recordEdges(s.edges, _edge, _edge.at) })),
      clear: () => set({ edges: [] }),
    }),
    {
      name: 'empire-provenance',
      partialize: (s) => ({ edges: s.edges }),
    }
  )
)

let started = false
/**
 * Call once at startup: mirror every honest app→app transfer into the durable
 * ledger. The ONLY edge source is `flowForEvent` — so the ledger records
 * exactly the arcs the Network mesh draws, and nothing the user didn't cause.
 */
export function startProvenanceTracking(): void {
  if (started) return
  started = true
  onAny((event) => {
    const flow = flowForEvent(event)
    if (!flow) return
    useProvenance.getState().record({
      fromApp: flow.fromId,
      toApp: flow.toId,
      label: 'label' in event ? event.label : undefined,
      at: Date.now(),
    })
  })
}
