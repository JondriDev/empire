/**
 * useViewport — the shell's single source of truth for viewport breakpoints.
 *
 * The Empire uses stock Tailwind v4 cutoffs (sm 640 / md 768 / lg 1024) with
 * one convention: `md:` is THE master-detail collapse boundary. Below 768px
 * the UI is "compact" — this covers phone portrait (~360px) AND phone
 * landscape (~740px) — and multi-pane apps show one pane at a time (see
 * `components/ui/TwoPane.tsx`). Prefer CSS responsive prefixes when both
 * layouts can coexist in the DOM; reach for this hook only when the compact
 * layout needs different *behavior* (pane switching, hiding heavy panels).
 */
import { useCallback, useSyncExternalStore } from 'react'

/** Mirrors Tailwind's `md:` boundary — keep the two in sync. */
export const COMPACT_QUERY = '(max-width: 767px)'

/** True while the viewport matches the given CSS media query string. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** True on compact viewports (< 768px): phones, portrait and landscape. */
export function useIsCompact(): boolean {
  return useMediaQuery(COMPACT_QUERY)
}
