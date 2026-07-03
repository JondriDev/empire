/**
 * Empire Node Lineage — per-artifact ancestry (Organism · node-level lineage).
 *
 * `provenance.ts`/`lineageOf` answer "which APP fed which app?" — app-level
 * memory. This module answers the finer question: "which ENTITY did this exact
 * artifact descend from?" The three core intents (make-task / make-note-from /
 * add-to-learning, see `sync.ts`) already stamp `data.from = sourceNode.id` onto
 * every node they create AND `link()` the pair, so the Core graph ALREADY holds
 * a durable per-artifact ancestry edge. What was missing was a way to *read* it.
 *
 * These pure walkers resolve that stamped `from` id back to its live CoreNode and
 * follow it backwards, so any surface (the Inbox row, a future entity trail) can
 * show "this task ← that note ← that message" with the real entity titles, not
 * just app names. Honesty rule (inherited): we never invent an edge — `data.from`
 * is only ever set by an intent the user ran.
 *
 * I am the connector — the graph is my memory; this is how a single artifact
 * remembers exactly where it came from.
 */

import type { CoreNode } from './graph'

/**
 * Pure: the parent NODE id this node was derived from, or `undefined`.
 * The core intents stamp `data.from = sourceNode.id` on every node they create,
 * so `from` is the honest per-artifact ancestry link. A non-string or empty
 * value (an unrelated `from` flag, e.g. a boolean) is treated as no ancestry.
 */
export function parentIdOf(_node: CoreNode): string | undefined {
  const from = _node.data.from
  return typeof from === 'string' && from.length > 0 ? from : undefined
}

/**
 * Pure: walk a node's ancestry backwards through `data.from`, resolving each
 * parent id to its live CoreNode. Cycle-guarded and depth-capped. Returns the
 * actual nodes `[node, parent, grandparent, …]` (always at least `[node]` when
 * the node exists; `[]` when `_nodeId` isn't in the graph). Stops when a `from`
 * id is absent from the graph — a pruned or foreign parent ends the chain
 * honestly rather than dangling.
 */
export function nodeLineageOf(
  _nodes: Record<string, CoreNode>,
  _nodeId: string,
  _maxDepth = 6,
): CoreNode[] {
  const start = _nodes[_nodeId]
  if (!start) return []
  const chain: CoreNode[] = [start]
  const seen = new Set<string>([start.id])
  let current = start
  while (chain.length - 1 < _maxDepth) {
    const parentId = parentIdOf(current)
    if (!parentId || seen.has(parentId)) break
    const parent = _nodes[parentId]
    if (!parent) break
    seen.add(parentId)
    chain.push(parent)
    current = parent
  }
  return chain
}

/**
 * Pure: the direct descendants of a node — every node whose `data.from` points
 * at `_nodeId`. The "what did this spawn?" direction, newest first by
 * `meta.updated` (so a freshly-derived artifact leads).
 */
export function childrenOf(_nodes: Record<string, CoreNode>, _nodeId: string): CoreNode[] {
  return Object.values(_nodes)
    .filter(n => parentIdOf(n) === _nodeId)
    .sort((a, b) => b.meta.updated - a.meta.updated)
}
