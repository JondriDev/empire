/**
 * Mail · Email Bridge — a first-class Empire citizen.
 *
 * Bridges Himalaya & AgentMail (backend-gated; the /api/integrations/* calls
 * answer 401 in the tokenless cloud build). Beyond the bridge, Mail is a handoff
 * RECEIVER: a cross-app "Send to Mail" drops a subject/body payload into
 * `empire-mail-clipboard`; on mount the composer opens prefilled and a
 * dismissible <ProvenanceChip> shows where it came from — the receiver-side
 * mirror of the arc the Network lights for the same HANDOFF.
 */
import { useEffect, useState } from 'react'
import { getAppIcon } from '../../design-system/icons'
import { Button, Input, TextArea, Card } from '../../components/ui'
import { useInboundHandoff } from '../../lib/useInboundHandoff'
import { ProvenanceChip } from '../../components/ui/ProvenanceChip'
import { NodeActions } from '../../components/ui/NodeActions'
import { mirrorCollection } from '../../lib/core/sync'
import { listDrafts, saveDraft, deleteDraft, newDraftId, type Draft } from './lib/draftStore'
import { draftNodeData } from './mailGraph'

type InboxMessage = { id: string; from: string; subject: string; date: string }
type Status = { providers: Record<string, { configured: boolean }> }
type Provider = 'himalaya' | 'agentmail'

// One accent per view — Mail reads as signal cyan (var(--signal), the registry
// mail accent), used as light, never fill.
const ACCENT = 'var(--signal)'
const MailIcon = getAppIcon('Mail')
const PROVIDERS: Provider[] = ['himalaya', 'agentmail']

// Local helpers for token + base URL (mirrors what other apps do inline).
function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token') || ''
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}
async function jget(path: string) { const r = await fetch(path, { headers: getHeaders() }); return r.json() }
async function jpost(path: string, body: unknown) {
  const r = await fetch(path, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) })
  return r.json()
}

export default function MailApp() {
  const [status, setStatus] = useState<Status | null>(null)
  const [provider, setProvider] = useState<Provider>('himalaya')
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string>('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [compose, setCompose] = useState({ to: '', subject: '', body: '' })
  const [sendStatus, setSendStatus] = useState<string>('')
  // Durable drafts (localStorage `empire-mail-drafts`). `draftId` tracks which draft
  // the composer is editing — null means a brand-new draft (saved gets a fresh id).
  // Hydrate synchronously so the first render already holds the saved drafts —
  // otherwise the `[drafts]` mirror effect below runs with `[]` on mount and
  // prunes every persisted `draft` node before `listDrafts()` lands.
  const [drafts, setDrafts] = useState<Draft[]>(() => listDrafts())
  const [draftId, setDraftId] = useState<string | null>(null)
  const [draftStatus, setDraftStatus] = useState<string>('')

  useEffect(() => {
    jget('/api/integrations/status').then(setStatus).catch(e => setErr(String(e)))
  }, [])

  // Mirror the durable drafts into the Core graph so Mail joins the organism — the
  // last of the two raw-HTML islands. Each draft becomes a `draft` node owned by
  // `mail`, legible in The Network / Search / Timeline; deleting a draft prunes its
  // node on the next reconcile.
  useEffect(() => {
    mirrorCollection('draft', 'mail', drafts, {
      id: d => d.id,
      title: d => d.subject || '(no subject)',
      data: draftNodeData,
    })
  }, [drafts])

  // Inbound: a cross-app HANDOFF ("Send to Mail") drops a subject/body payload
  // into empire-mail-clipboard. Open the composer prefilled + show provenance.
  const inbound = useInboundHandoff<{ to?: string; subject?: string; body?: string; from?: string }>('empire-mail-clipboard')
  useEffect(() => {
    if (!inbound.payload) return
    const p = inbound.payload
    setCompose({ to: p.to || '', subject: p.subject || '', body: p.body || '' })
    setComposeOpen(true)
  }, [inbound.payload])

  const refresh = async () => {
    setLoading(true); setErr('')
    try {
      const resp = await jget(`/api/integrations/email/inbox?provider=${provider}&limit=25`)
      if (resp.ok) setMessages(resp.messages || [])
      else setErr(resp.error || 'unknown error')
    } catch (e) { setErr(String(e)) }
    setLoading(false)
  }

  const send = async () => {
    setSendStatus('sending…')
    try {
      const r = await jpost('/api/integrations/email/send', { ...compose, provider })
      setSendStatus(r.ok ? 'sent ✓' : `failed: ${r.error || ''}`)
      if (r.ok) setCompose({ to: '', subject: '', body: '' })
    } catch (e) { setSendStatus(`error: ${String(e)}`) }
  }

  // Persist the current composer as a draft (fresh id if new, upsert if editing),
  // then refresh the list so the graph mirror re-runs.
  const persistDraft = () => {
    const id = draftId ?? newDraftId()
    saveDraft({ id, ...compose })
    setDraftId(id)
    setDrafts(listDrafts())
    setDraftStatus('saved ✓')
  }

  // Reopen a saved draft back into the composer for editing.
  const openDraft = (d: Draft) => {
    setCompose({ to: d.to, subject: d.subject, body: d.body })
    setDraftId(d.id)
    setComposeOpen(true)
    setDraftStatus('')
    setSendStatus('')
  }

  const removeDraft = (id: string) => {
    deleteDraft(id)
    setDrafts(listDrafts())
    if (draftId === id) setDraftId(null)
  }

  const providerConfigured = status?.providers?.[provider]?.configured

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <MailIcon className="w-6 h-6" style={{ color: ACCENT }} /> Mail
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
            Email bridge · Himalaya &amp; AgentMail · sending stays on the backend
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refresh} disabled={loading} style={{ borderColor: ACCENT }}>
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
          <Button onClick={() => setComposeOpen(o => !o)}>{composeOpen ? 'Close' : 'Compose'}</Button>
        </div>
      </div>

      {/* Provider selector — a segmented toggle (aria-pressed carries the active
          state for AT, since it is otherwise shown by accent alone). */}
      <div role="group" aria-label="Mail provider" className="flex items-center gap-2 mb-4">
        {PROVIDERS.map(p => {
          const active = provider === p
          const configured = status?.providers?.[p]?.configured
          return (
            <Button
              key={p}
              size="sm"
              aria-pressed={active}
              onClick={() => setProvider(p)}
              style={active ? { borderColor: ACCENT, color: ACCENT } : undefined}
            >
              {p === 'himalaya' ? 'Himalaya' : 'AgentMail'}
              {status?.providers && (
                <span style={{ marginLeft: 6, opacity: 0.7 }}>{configured ? '✓' : '·'}</span>
              )}
            </Button>
          )
        })}
      </div>

      {/* Provenance — where an inbound draft came from. */}
      {inbound.source && (
        <div className="mb-4">
          <ProvenanceChip from={inbound.source} onDismiss={inbound.dismiss} />
        </div>
      )}

      {/* Compose */}
      {composeOpen && (
        <Card padding="md" className="mb-4">
          <div className="grid gap-3">
            <Input value={compose.to} onChange={v => setCompose(c => ({ ...c, to: v }))} placeholder="to" />
            <Input value={compose.subject} onChange={v => setCompose(c => ({ ...c, subject: v }))} placeholder="subject" />
            <TextArea value={compose.body} onChange={v => setCompose(c => ({ ...c, body: v }))} placeholder="body" rows={6} />
            <div className="flex items-center gap-3">
              <Button
                onClick={send}
                disabled={!compose.to || !compose.subject || !compose.body}
                style={{ borderColor: ACCENT }}
              >
                Send
              </Button>
              <Button
                onClick={persistDraft}
                disabled={!compose.to && !compose.subject && !compose.body}
              >
                Save draft
              </Button>
              <span className="text-sm" style={{ color: 'var(--text3)' }} aria-live="polite">
                {sendStatus || draftStatus}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Drafts — durable, graph-legible, and an ⚡ emit source (a draft can spawn
          a task/note). Reopen a row into the composer; delete removes it. */}
      {drafts.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text2)' }}>
            Drafts <span style={{ color: 'var(--text3)' }}>· {drafts.length}</span>
          </h2>
          <div className="gp" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {drafts.map((d, i) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3"
                style={{ padding: 12, borderTop: i ? '1px solid var(--border)' : undefined }}
              >
                <Button
                  onClick={() => openDraft(d)}
                  variant="ghost"
                  className="flex-1"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', minWidth: 0, padding: '0' }}
                  aria-label={`Open draft ${d.subject || '(no subject)'}`}
                >
                  <span style={{ display: 'block', minWidth: 0 }}>
                    <div className="truncate" style={{ color: 'var(--text)', fontWeight: 600 }}>
                      {d.subject || '(no subject)'}
                    </div>
                    <div className="text-sm truncate" style={{ color: 'var(--text3)' }}>
                      {d.to || 'no recipient'}
                    </div>
                  </span>
                </Button>
                <div className="flex items-center gap-1 shrink-0">
                  <NodeActions type="draft" sourceId={d.id} />
                  <Button size="sm" onClick={() => removeDraft(d.id)} aria-label={`Delete draft ${d.subject || '(no subject)'}`}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {err && <p className="text-sm mb-4" style={{ color: 'var(--c-danger)' }} role="alert">{err}</p>}

      {/* Inbox */}
      {messages.length === 0 && !loading && !err ? (
        <p className="text-sm" style={{ color: 'var(--text3)' }}>
          {providerConfigured ? 'No messages yet.' : `Provider ${provider} not configured.`}
        </p>
      ) : (
        <div className="gp" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {messages.map((m, i) => (
            <div
              key={`${m.id}-${m.from}`}
              style={{ padding: 12, borderTop: i ? '1px solid var(--border)' : undefined }}
            >
              <div className="flex items-center justify-between gap-3">
                <strong style={{ color: 'var(--text)' }}>{m.from}</strong>
                <span className="text-sm" style={{ color: 'var(--text3)' }}>{m.date}</span>
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text2)' }}>{m.subject}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
