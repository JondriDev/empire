import { describe, it, expect } from 'vitest'
import { walletItems, walletNodeData, type Coin } from './cryptoGraph'

const list = (over: Partial<Record<Coin, string>> = {}): Record<Coin, string> => ({
  btc: '', eth: '', sol: '', xrp: '', doge: '',
  ...over,
})

describe('walletItems', () => {
  it('derives one item per non-blank address, stably keyed by coin', () => {
    const items = walletItems(list({ btc: 'bc1qaddr', eth: '0xabc' }))
    expect(items).toEqual([
      { id: 'wallet:btc', coin: 'btc', address: 'bc1qaddr' },
      { id: 'wallet:eth', coin: 'eth', address: '0xabc' },
    ])
  })

  it('drops blank and whitespace-only addresses (un-watched coins own no node)', () => {
    const items = walletItems(list({ btc: 'bc1qaddr', eth: '', sol: '   ' }))
    expect(items.map(w => w.coin)).toEqual(['btc'])
  })

  it('trims surrounding whitespace off the surviving address', () => {
    const [w] = walletItems(list({ doge: '  Dcoin  ' }))
    expect(w).toEqual({ id: 'wallet:doge', coin: 'doge', address: 'Dcoin' })
  })

  it('returns an empty list when nothing is watched', () => {
    expect(walletItems(list())).toEqual([])
  })

  it('gives every coin a distinct stable id so re-watching is idempotent', () => {
    const items = walletItems(list({ btc: 'a', eth: 'b', sol: 'c', xrp: 'd', doge: 'e' }))
    expect(new Set(items.map(w => w.id)).size).toBe(5)
    expect(items.map(w => w.id)).toEqual([
      'wallet:btc', 'wallet:eth', 'wallet:sol', 'wallet:xrp', 'wallet:doge',
    ])
  })
})

describe('walletNodeData', () => {
  it('shapes the graph-node payload as durable coin+address only (no live balance)', () => {
    expect(walletNodeData({ id: 'wallet:btc', coin: 'btc', address: 'bc1qaddr' })).toEqual({
      coin: 'btc',
      address: 'bc1qaddr',
    })
  })
})
