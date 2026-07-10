/**
 * Crypto · Wallet Watch — a first-class Empire citizen.
 *
 * Watch a wallet address per coin; each non-blank address mirrors into the Core
 * graph as a `wallet` node (see `cryptoGraph.ts`), so watched wallets are legible
 * in The Network / Search / Timeline like every other collection-owning app.
 * Live balances stay on-device — the `/api/wallet/check` call is backend-gated
 * (401 in the tokenless cloud build); the graph carries only the address.
 */
import { useEffect, useState } from 'react'
import { getAppIcon } from '../../design-system/icons'
import { Button, Input, Card } from '../../components/ui'
import { mirrorCollection } from '../../lib/core/sync'
import { walletItems, walletNodeData, type Coin } from './cryptoGraph'

const COINS: Coin[] = ['btc', 'eth', 'sol', 'xrp', 'doge']

// One accent per view — Crypto reads as ember gold (var(--ember), the desert-sand
// warm signal that is also the registry crypto accent), used as light, never fill.
const ACCENT = 'var(--ember)'
const WalletIcon = getAppIcon('Wallet')

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token') || ''
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

export default function CryptoApp() {
  const [addresses, setAddresses] = useState<Record<Coin, string>>({
    btc: '', eth: '', sol: '', xrp: '', doge: '',
  })
  const [results, setResults] = useState<Record<string, unknown>>({})
  const [err, setErr] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // hydrate from localStorage
    const raw = localStorage.getItem('crypto-watch-list')
    if (raw) {
      try { setAddresses(a => ({ ...a, ...JSON.parse(raw) })) } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => { localStorage.setItem('crypto-watch-list', JSON.stringify(addresses)) }, [addresses])

  // Mirror the watched wallets into the Core graph so Crypto joins the organism —
  // one of the last two raw-HTML islands. Blank addresses own no node (see
  // walletItems); clearing an address prunes its node on the next reconcile.
  useEffect(() => {
    mirrorCollection('wallet', 'crypto', walletItems(addresses), {
      id: w => w.id,
      title: w => `${w.coin.toUpperCase()} · ${w.address.slice(0, 6)}…${w.address.slice(-4)}`,
      data: walletNodeData,
    })
  }, [addresses])

  const refresh = async () => {
    setLoading(true); setErr('')
    try {
      const r = await fetch(`/api/wallet/check`, { headers: getHeaders(), method: 'POST', body: JSON.stringify({ addresses }) })
      const j = await r.json()
      if (j.ok) setResults(j.results || {})
      else setErr(j.error || 'unknown error')
    } catch (e) { setErr(String(e)) }
    setLoading(false)
  }

  const entries = Object.entries(results)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <WalletIcon className="w-6 h-6" style={{ color: ACCENT }} /> Crypto
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
            Watch wallets across BTC, ETH, SOL, XRP, DOGE · balances stay on-device
          </p>
        </div>
        <Button onClick={refresh} disabled={loading} style={{ borderColor: ACCENT }}>
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {err && (
        <p className="text-sm mb-4" style={{ color: 'var(--c-danger)' }}>{err}</p>
      )}

      {/* Watch-list */}
      <div className="grid gap-3">
        {COINS.map(c => (
          <label key={c} className="grid items-center gap-3" style={{ gridTemplateColumns: '52px 1fr' }}>
            <span
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: addresses[c].trim() ? ACCENT : 'var(--text3)' }}
            >
              {c}
            </span>
            <Input
              mono
              value={addresses[c]}
              onChange={v => setAddresses(a => ({ ...a, [c]: v }))}
              placeholder={`${c} address (optional)`}
            />
          </label>
        ))}
      </div>

      {/* Balances (backend-gated) */}
      {entries.length > 0 && (
        <section className="mt-6 grid gap-3">
          {entries.map(([k, v]) => (
            <Card key={k} padding="md">
              <div className="text-sm font-semibold uppercase" style={{ color: ACCENT }}>{k}</div>
              <pre
                className="mt-2"
                style={{ whiteSpace: 'pre-wrap', fontSize: 'var(--text-sm)', color: 'var(--text2)', margin: 0 }}
              >
                {JSON.stringify(v, null, 2)}
              </pre>
            </Card>
          ))}
        </section>
      )}
    </div>
  )
}
