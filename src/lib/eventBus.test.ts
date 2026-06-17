import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  on, once, emit, getRecent, getAllRecent, clearHistory, getStats,
} from './eventBus'

beforeEach(() => {
  clearHistory()
})

describe('on / emit', () => {
  it('delivers an emitted event to a subscriber', () => {
    const fn = vi.fn()
    const off = on('APP_OPENED', fn)
    emit({ type: 'APP_OPENED', appId: 'notes' })
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({ type: 'APP_OPENED', appId: 'notes' })
    off()
  })

  it('stops delivering after unsubscribe', () => {
    const fn = vi.fn()
    const off = on('APP_OPENED', fn)
    off()
    emit({ type: 'APP_OPENED', appId: 'notes' })
    expect(fn).not.toHaveBeenCalled()
  })

  it('only notifies handlers for the matching type', () => {
    const fn = vi.fn()
    const off = on('APP_OPENED', fn)
    emit({ type: 'APP_CLOSED', appId: 'notes' })
    expect(fn).not.toHaveBeenCalled()
    off()
  })
})

describe('once', () => {
  it('fires only on the first matching emit', () => {
    const fn = vi.fn()
    once('APP_OPENED', fn)
    emit({ type: 'APP_OPENED', appId: 'a' })
    emit({ type: 'APP_OPENED', appId: 'b' })
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({ type: 'APP_OPENED', appId: 'a' })
  })
})

describe('history', () => {
  it('getRecent filters by type and respects count', () => {
    emit({ type: 'APP_OPENED', appId: 'a' })
    emit({ type: 'APP_CLOSED', appId: 'a' })
    emit({ type: 'APP_OPENED', appId: 'b' })
    emit({ type: 'APP_OPENED', appId: 'c' })
    const recent = getRecent('APP_OPENED', 2)
    expect(recent.map(e => e.appId)).toEqual(['b', 'c'])
  })

  it('getAllRecent returns events in order, newest last', () => {
    emit({ type: 'APP_OPENED', appId: 'a' })
    emit({ type: 'APP_CLOSED', appId: 'a' })
    expect(getAllRecent().map(e => e.type)).toEqual(['APP_OPENED', 'APP_CLOSED'])
  })

  it('getStats counts events by type', () => {
    emit({ type: 'APP_OPENED', appId: 'a' })
    emit({ type: 'APP_OPENED', appId: 'b' })
    emit({ type: 'APP_CLOSED', appId: 'a' })
    expect(getStats()).toEqual({ APP_OPENED: 2, APP_CLOSED: 1 })
  })

  it('caps history at 100 events, dropping the oldest', () => {
    for (let i = 0; i < 150; i++) emit({ type: 'APP_OPENED', appId: String(i) })
    const all = getAllRecent(1000) as { type: 'APP_OPENED'; appId: string }[]
    expect(all).toHaveLength(100)
    expect(all[0].appId).toBe('50') // events 0–49 were shifted out
  })

  it('clearHistory empties the log and stats', () => {
    emit({ type: 'APP_OPENED', appId: 'a' })
    clearHistory()
    expect(getAllRecent()).toHaveLength(0)
    expect(getStats()).toEqual({})
  })
})
