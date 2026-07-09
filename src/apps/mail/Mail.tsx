import React, { useEffect, useState } from 'react';

type InboxMessage = { id: string; from: string; subject: string; date: string };
type Status = { providers: Record<string, { configured: boolean }> };

// Local helpers for token + base URL (mirrors what other apps do inline).
function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token') || '';
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}
async function jget(path: string) { const r = await fetch(path, { headers: getHeaders() }); return r.json(); }
async function jpost(path: string, body: unknown) {
  const r = await fetch(path, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
  return r.json();
}

export default function MailApp() {
  const [status, setStatus] = useState<Status | null>(null);
  const [provider, setProvider] = useState<'himalaya' | 'agentmail'>('himalaya');
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose] = useState({ to: '', subject: '', body: '' });
  const [sendStatus, setSendStatus] = useState<string>('');

  useEffect(() => {
    jget('/api/integrations/status').then(setStatus).catch(e => setErr(String(e)));
  }, []);

  const refresh = async () => {
    setLoading(true); setErr('');
    try {
      const resp = await jget(`/api/integrations/email/inbox?provider=${provider}&limit=25`);
      if (resp.ok) setMessages(resp.messages || []);
      else setErr(resp.error || 'unknown error');
    } catch (e) { setErr(String(e)); }
    setLoading(false);
  };

  const send = async () => {
    setSendStatus('sending…');
    try {
      const r = await jpost('/api/integrations/email/send', { ...compose, provider });
      setSendStatus(r.ok ? 'sent ✓' : `failed: ${r.error || ''}`);
      if (r.ok) setCompose({ to: '', subject: '', body: '' });
    } catch (e) { setSendStatus(`error: ${String(e)}`); }
  };

  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateRows: 'auto auto 1fr', height: '100%', gap: 12 }}>
      <header style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={provider} onChange={e => setProvider(e.target.value as 'himalaya' | 'agentmail')}>
          <option value="himalaya">Himalaya</option>
          <option value="agentmail">AgentMail</option>
        </select>
        <button onClick={refresh} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
        <button onClick={() => setComposeOpen(o => !o)}>{composeOpen ? 'Close' : 'Compose'}</button>
        {status?.providers && (
          <span style={{ marginLeft: 'auto', opacity: 0.7, fontSize: 'var(--text-sm)' }}>
            {Object.entries(status.providers).map(([k, v]) => `${k}=${v.configured ? '✓' : '·'}`).join('  ')}
          </span>
        )}
      </header>
      {composeOpen && (
        <section style={{ display: 'grid', gap: 6 }}>
          <input placeholder="to" value={compose.to} onChange={e => setCompose(c => ({ ...c, to: e.target.value }))} />
          <input placeholder="subject" value={compose.subject} onChange={e => setCompose(c => ({ ...c, subject: e.target.value }))} />
          <textarea placeholder="body" rows={6} value={compose.body} onChange={e => setCompose(c => ({ ...c, body: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={send} disabled={!compose.to || !compose.subject || !compose.body}>Send</button>
            <span style={{ opacity: 0.7, fontSize: 'var(--text-sm)' }}>{sendStatus}</span>
          </div>
        </section>
      )}
      {err && <p style={{ color: 'var(--c-danger)', margin: 0 }}>{err}</p>}
      <ul style={{ overflow: 'auto', margin: 0, padding: 0, listStyle: 'none' }}>
        {messages.length === 0 && !loading && !err && (
          <li style={{ opacity: 0.7, padding: 12 }}>
            {status?.providers?.[provider]?.configured ? 'No messages yet.' : `Provider ${provider} not configured.`}
          </li>
        )}
        {messages.map(m => (
          <li key={`${m.id}-${m.from}`} style={{ borderBottom: '1px solid var(--border)', padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{m.from}</strong><span style={{ opacity: 0.6, fontSize: 'var(--text-sm)' }}>{m.date}</span>
            </div>
            <div style={{ opacity: 0.9 }}>{m.subject}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
