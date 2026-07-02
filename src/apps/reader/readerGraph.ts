/**
 * Reader → Core graph: the book-library mirror shape (pure, testable).
 *
 * Reader owns a real collection — the imported books — but it never joined the
 * organism's shared graph, so it was invisible in The Network: the last
 * collection-owning app that wasn't graph-legible. This module holds the pure
 * mapping from a `BookMeta` to its `book` CoreNode `data` payload, so the mirror
 * is unit-pinned and `Reader.tsx` just wires the tested `mirrorCollection` rail.
 *
 * Unlike Files (which surfaces one directory at a time and must accumulate a
 * session union before mirroring, or `mirrorCollection`'s prune-unseen semantics
 * delete every other directory's nodes), Reader's `books` state is ALWAYS the
 * whole library, so the component mirrors it directly — no accumulation needed.
 *
 * Reader is an honest EMIT-ONLY source (like Files/Photos): a book can emit a
 * note/task onward via <NodeActions>, but there is deliberately no text→book
 * inbound (a text→book transfer is unnatural).
 */
import type { BookMeta } from './lib/types'

/**
 * The graph-node `data` payload for one book — durable metadata only (the file
 * blob lives in IndexedDB, never in the graph). `progress` is clamped to a plain
 * number and `highlights` is reduced to a count so the node stays small and its
 * JSON diff is stable across reconciles.
 */
export function bookNodeData(b: BookMeta): Record<string, unknown> {
  return {
    format: b.format,
    author: b.author,
    progress: b.progress || 0,
    highlights: (b.highlights || []).length,
  }
}
