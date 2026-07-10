/**
 * Mail → Core graph: the drafts mirror shape (pure, testable).
 *
 * Mail owns a real collection — its durable drafts (see `lib/draftStore.ts`) — so,
 * like Crypto/Reader, it mirrors them into the shared graph and becomes legible in
 * The Network / Search / Timeline. This module holds the pure mapping from a Draft
 * to its `draft` CoreNode `data` payload, so the mirror is unit-pinned and
 * `Mail.tsx` just wires the tested `mirrorCollection` rail (mirroring
 * `crypto/cryptoGraph.ts` and `reader/readerGraph.ts`).
 *
 * Mail is BOTH an inbound receiver (a "Send to Mail" handoff prefills compose) and
 * an emit source: a draft can spawn a task/note onward via <NodeActions>. The node
 * carries only durable metadata (subject + recipient); the body rides the title/store.
 */
import type { Draft } from './lib/draftStore'

/**
 * The graph-node `data` payload for one draft — durable metadata only, kept small
 * so the node's JSON diff is stable across reconciles (the title carries the subject).
 */
export function draftNodeData(d: Draft): Record<string, unknown> {
  return { subject: d.subject, to: d.to }
}
