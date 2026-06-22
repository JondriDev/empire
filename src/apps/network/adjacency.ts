/**
 * Network adjacency — derive the organism's app→app wiring from the real graph.
 *
 * The Network canvas draws CoreNodes and their edges; this pure seam turns those
 * edges into legible, per-app structure for the inspector panel:
 *   • `appAdjacency` — directed app→app neighbours implied by node links.
 *   • `entitiesByApp` — every app's own nodes, grouped.
 * Kept dependency-light and side-effect free so it is trivially unit-testable.
 */
import type { CoreNode } from '../../lib/core/graph'
import { apps } from '../../lib/registry'

const KNOWN_APPS = new Set(apps.map(a => a.id))

export interface AppEdges {
  /** apps this app links OUT to (it owns a node that links a node they own). */
  out: string[]
  /** apps that link IN to this app. */
  in: string[]
}

/**
 * Walk every node's links and project owner(node) → owner(target) into directed
 * app→app adjacency. Self-edges (same owning app) and edges touching an unknown
 * owner (an app id not in the registry, or a dangling link) are dropped, so the
 * result reflects only honest, cross-app structure. Lists are sorted & de-duped.
 */
export function appAdjacency(nodes: CoreNode[]): Record<string, AppEdges> {
  const byId = new Map(nodes.map(n => [n.id, n]))
  const acc: Record<string, { out: Set<string>; in: Set<string> }> = {}
  const slot = (app: string) => (acc[app] ??= { out: new Set(), in: new Set() })

  for (const n of nodes) {
    const from = n.meta.app
    if (!KNOWN_APPS.has(from)) continue
    for (const linkId of n.links) {
      const target = byId.get(linkId)
      if (!target) continue
      const to = target.meta.app
      if (!KNOWN_APPS.has(to) || to === from) continue
      slot(from).out.add(to)
      slot(to).in.add(from)
    }
  }

  const out: Record<string, AppEdges> = {}
  for (const [app, edges] of Object.entries(acc)) {
    out[app] = { out: [...edges.out].sort(), in: [...edges.in].sort() }
  }
  return out
}

/** Group nodes by their owning app id (newest first within each app). */
export function entitiesByApp(nodes: CoreNode[]): Record<string, CoreNode[]> {
  const out: Record<string, CoreNode[]> = {}
  for (const n of nodes) {
    const app = n.meta.app
    if (!app) continue
    ;(out[app] ??= []).push(n)
  }
  for (const list of Object.values(out)) {
    list.sort((a, b) => b.meta.updated - a.meta.updated)
  }
  return out
}
