/**
 * useInboundHandoff — the receiver half of a cross-app HANDOFF (Organism S1).
 *
 * Senders in `appActions.ts` drop a payload into a `sessionStorage` key
 * (`empire-*-clipboard`) and emit a `HANDOFF` event before navigating. The
 * receiving app calls this hook with that key: on mount it reads the payload
 * exactly once, clears the key (so a manual reload doesn't re-inject stale
 * data), and exposes the parsed payload plus its `source` app id so the app can
 * preload itself and render a dismissible `<ProvenanceChip>`.
 *
 * The payload shape varies per app, so it's returned generically; every sender
 * includes a `from` string, which becomes `source`.
 */
import { useEffect, useState } from 'react'

export interface InboundHandoff<T> {
  /** The parsed payload (null until read, or if the key was empty). */
  payload: T | null
  /** The source app id (the sender's `from` field), or null. */
  source: string | null
  /** Hide the provenance chip (does not touch the already-applied payload). */
  dismiss: () => void
}

export function useInboundHandoff<T extends { from?: string }>(
  sessionKey: string,
): InboundHandoff<T> {
  const [payload, setPayload] = useState<T | null>(null)
  const [source, setSource] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(sessionKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as T
      setPayload(parsed)
      if (typeof parsed.from === 'string') setSource(parsed.from)
      // Consume the handoff so a later reload starts clean.
      sessionStorage.removeItem(sessionKey)
    } catch {
      /* malformed payload — ignore */
    }
    // Read once on mount; sessionKey is stable per receiver.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { payload, source, dismiss: () => setSource(null) }
}
