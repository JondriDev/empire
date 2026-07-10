/**
 * Crypto → Core graph: the wallet watch-list mirror shape (pure, testable).
 *
 * Crypto owns a real collection — the addresses you watch — but it landed as a
 * raw-HTML island that never joined the organism's shared graph, so its wallets
 * were invisible in The Network / Search / Timeline. This module holds the pure
 * mapping from the coin→address watch-list to `wallet` CoreNode payloads, so the
 * mirror is unit-pinned and `CryptoApp.tsx` just wires the tested
 * `mirrorCollection` rail (mirroring `reader/readerGraph.ts`).
 *
 * The watch-list is ALWAYS the whole set of five coins (some may be blank), so
 * the component mirrors the derived items directly — no accumulation needed;
 * blank/whitespace addresses are dropped so an un-watched coin has no node, and
 * clearing an address prunes its node on the next reconcile.
 *
 * Crypto is an EMIT-ONLY source (like Reader/Files): a watched wallet can emit a
 * task/note onward via <NodeActions>, but there is deliberately no inbound (a
 * text→wallet transfer is unnatural). Live balances stay on-device (the
 * `/api/wallet/check` call is backend-gated); the graph carries only the address.
 */

export type Coin = 'btc' | 'eth' | 'sol' | 'xrp' | 'doge'

/** One watched wallet, keyed stably by coin so re-watching an address is idempotent. */
export interface WalletItem {
  id: string
  coin: Coin
  address: string
}

/**
 * Derive the watched-wallet items from the coin→address map. Blank / whitespace
 * addresses are dropped (an un-watched coin owns no node); the surviving address
 * is trimmed so leading/trailing whitespace never leaks into the node title.
 */
export function walletItems(addresses: Record<Coin, string>): WalletItem[] {
  return (Object.entries(addresses) as [Coin, string][])
    .filter(([, addr]) => typeof addr === 'string' && addr.trim().length > 0)
    .map(([coin, addr]) => ({ id: `wallet:${coin}`, coin, address: addr.trim() }))
}

/**
 * The graph-node `data` payload for one watched wallet — durable metadata only
 * (never a live balance; those stay on-device). Kept small so the node's JSON
 * diff is stable across reconciles.
 */
export function walletNodeData(w: WalletItem): Record<string, unknown> {
  return { coin: w.coin, address: w.address }
}
