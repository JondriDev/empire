import React, { useEffect, useState } from 'react';

type Coin = 'btc' | 'eth' | 'sol' | 'xrp' | 'doge';
const COINS: Coin[] = ['btc', 'eth', 'sol', 'xrp', 'doge'];

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token') || '';
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export default function CryptoApp() {
  const [addresses, setAddresses] = useState<Record<Coin, string>>({
    btc: '', eth: '', sol: '', xrp: '', doge: '',
  });
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [err, setErr] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // hydrate from localStorage
    const raw = localStorage.getItem('crypto-watch-list');
    if (raw) {
      try { setAddresses(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => { localStorage.setItem('crypto-watch-list', JSON.stringify(addresses)); }, [addresses]);

  const refresh = async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch(`/api/wallet/check`, { headers: getHeaders(), method: 'POST', body: JSON.stringify({ addresses }) });
      const j = await r.json();
      if (j.ok) setResults(j.results || {});
      else setErr(j.error || 'unknown error');
    } catch (e) { setErr(String(e)); }
    setLoading(false);
  };

  return (
    <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Crypto · Wallet Watch</h2>
        <button onClick={refresh} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </header>
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      <div style={{ display: 'grid', gap: 8 }}>
        {COINS.map(c => (
          <label key={c} style={{ display: 'grid', gridTemplateColumns: '60px 1fr', alignItems: 'center', gap: 8 }}>
            <strong style={{ textTransform: 'uppercase' }}>{c}</strong>
            <input
              placeholder={`${c} address (optional)`}
              value={addresses[c]}
              onChange={e => setAddresses(a => ({ ...a, [c]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <section style={{ marginTop: 16 }}>
        {Object.entries(results).map(([k, v]) => (
          <div key={k} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 0' }}>
            <strong>{k}</strong>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, opacity: 0.85 }}>{JSON.stringify(v, null, 2)}</pre>
          </div>
        ))}
      </section>
    </div>
  );
}
