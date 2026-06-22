import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInboundHandoff } from './useInboundHandoff'

const KEY = 'empire-token-clipboard'

// The global test setup stubs sessionStorage with inert vi.fn()s. Swap in a
// real in-memory implementation so the round-trip (read → consume) is exercised.
beforeEach(() => {
  const store = new Map<string, string>()
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => { store.set(k, String(v)) },
      removeItem: (k: string) => { store.delete(k) },
      clear: () => { store.clear() },
    },
  })
})

describe('useInboundHandoff', () => {
  it('reads the payload + source on mount and consumes the key', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ text: 'hi', from: 'calculator' }))

    const { result } = renderHook(() => useInboundHandoff<{ text?: string; from?: string }>(KEY))

    expect(result.current.payload?.text).toBe('hi')
    expect(result.current.source).toBe('calculator')
    // Consumed: a later reload won't re-inject stale data.
    expect(sessionStorage.getItem(KEY)).toBeNull()
  })

  it('returns null payload/source when the key is empty', () => {
    const { result } = renderHook(() => useInboundHandoff(KEY))
    expect(result.current.payload).toBeNull()
    expect(result.current.source).toBeNull()
  })

  it('dismiss() hides the chip (clears source) but leaves the payload intact', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ text: 'hi', from: 'notes' }))
    const { result } = renderHook(() => useInboundHandoff<{ text?: string; from?: string }>(KEY))

    expect(result.current.source).toBe('notes')
    act(() => result.current.dismiss())

    expect(result.current.source).toBeNull()
    expect(result.current.payload?.text).toBe('hi')
  })

  it('ignores a malformed payload without throwing', () => {
    sessionStorage.setItem(KEY, '{not json')
    const { result } = renderHook(() => useInboundHandoff(KEY))
    expect(result.current.payload).toBeNull()
    expect(result.current.source).toBeNull()
  })
})
