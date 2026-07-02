/**
 * LineageTrail — durable "where this came from" trail (Organism · EPIC-6 S3).
 *
 * `ProvenanceChip` shows the *session* source: it reads the `empire-*-clipboard`
 * payload consumed on mount, so once the page reloads that hint is gone and the
 * entity has forgotten its origin. LineageTrail closes that gap — it reads the
 * DURABLE provenance ledger (`empire-provenance`) *or* a concrete `from` stamped
 * onto the persisted entity, so an event / goal / draft still shows
 * "`<app>` ← `<source>`" after a reload.
 *
 * Two modes:
 *  - a concrete `from` (the entity's stored source) → the direct pair `app ← from`.
 *  - no `from` → walk `lineageOf(ledger, app)` (the app's newest inbound chain).
 * Renders nothing when there is no ancestry to show. Colours come from each app's
 * registry accent + icon (identity data — no raw hex literal, mirrors ProvenanceChip).
 */
import { apps, getAppIcon } from '../../lib/registry'
import { useProvenance, lineageOf } from '../../lib/core/provenance'

const appName = (id: string) => apps.find(a => a.id === id)?.name ?? id

function AppToken({ id }: { id: string }) {
  const app = apps.find(a => a.id === id)
  const name = app?.name ?? id
  const accent = app?.color ?? 'var(--text3)'
  const Icon = getAppIcon(app?.icon ?? '')
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Icon className="w-3 h-3" aria-hidden style={{ color: accent }} />
      <span style={{ color: accent, fontWeight: 600 }}>{name}</span>
    </span>
  )
}

export function LineageTrail({ app, from }: { app: string; from?: string }) {
  // Reactive so a later handoff into `app` refreshes the walk-the-ledger mode.
  const edges = useProvenance(s => s.edges)
  // Explicit stored `from` wins (the durable per-entity source); otherwise walk
  // the ledger for the app's ancestry. Chain reads target → source(s).
  const chain = from ? [app, from] : lineageOf(edges, app)
  if (chain.length < 2) return null // nothing durable to show

  return (
    <div
      className="gp"
      role="note"
      aria-label={`From ${chain.slice(1).map(appName).join(' via ')}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--mono)',
        color: 'var(--text3)',
        border: '1px solid var(--border)',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      {chain.map((id, i) => (
        <span key={`${id}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span aria-hidden style={{ color: 'var(--text3)' }}>←</span>}
          <AppToken id={id} />
        </span>
      ))}
    </div>
  )
}
