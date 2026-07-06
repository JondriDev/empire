import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery, useIsCompact, COMPACT_QUERY } from './useViewport'

// The global test setup stubs matchMedia with inert vi.fn()s. Swap in a
// controllable fake so match state and change events can be driven per-test.
type Listener = () => void
let state: Map<string, boolean>
let listeners: Map<string, Set<Listener>>

function setMatches(query: string, matches: boolean) {
  state.set(query, matches)
  listeners.get(query)?.forEach(cb => cb())
}

beforeEach(() => {
  state = new Map()
  listeners = new Map()
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      get matches() {
        return state.get(query) ?? false
      },
      media: query,
      addEventListener: (_type: 'change', cb: Listener) => {
        if (!listeners.has(query)) listeners.set(query, new Set())
        listeners.get(query)!.add(cb)
      },
      removeEventListener: (_type: 'change', cb: Listener) => {
        listeners.get(query)?.delete(cb)
      },
    }),
  })
})

describe('useMediaQuery', () => {
  it('returns the initial match state', () => {
    state.set('(max-width: 500px)', true)
    const { result } = renderHook(() => useMediaQuery('(max-width: 500px)'))
    expect(result.current).toBe(true)

    const { result: result2 } = renderHook(() => useMediaQuery('(max-width: 100px)'))
    expect(result2.current).toBe(false)
  })

  it('re-renders when the media query flips', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(result.current).toBe(false)

    act(() => setMatches('(max-width: 767px)', true))
    expect(result.current).toBe(true)

    act(() => setMatches('(max-width: 767px)', false))
    expect(result.current).toBe(false)
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(listeners.get('(max-width: 767px)')?.size).toBe(1)
    unmount()
    expect(listeners.get('(max-width: 767px)')?.size).toBe(0)
  })

  it('resubscribes when the query string changes', () => {
    const { result, rerender } = renderHook(({ q }) => useMediaQuery(q), {
      initialProps: { q: '(max-width: 767px)' },
    })
    state.set('(min-width: 1024px)', true)
    rerender({ q: '(min-width: 1024px)' })
    expect(result.current).toBe(true)
    expect(listeners.get('(max-width: 767px)')?.size).toBe(0)
  })
})

describe('useIsCompact', () => {
  it('tracks the shared compact boundary query', () => {
    const { result } = renderHook(() => useIsCompact())
    expect(result.current).toBe(false)
    act(() => setMatches(COMPACT_QUERY, true))
    expect(result.current).toBe(true)
  })
})
