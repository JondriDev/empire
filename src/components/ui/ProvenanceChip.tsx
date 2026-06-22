/**
 * ProvenanceChip — "From <source>" provenance badge (Organism S1).
 *
 * When an app receives a cross-app HANDOFF (via `useInboundHandoff`), it renders
 * this chip so the transfer is honest and visible: a glass token pill carrying
 * the source app's own accent and icon, dismissible with ✕. It is the receiver-
 * side mirror of the directed arc the Network lights for the same HANDOFF.
 *
 * Accents are read from the app registry (no new hardcoded colors); a 2-digit
 * hex alpha suffix turns the 6-digit registry color into a faint glow/border.
 */
import { X } from 'lucide-react'
import { apps, getAppIcon } from '../../lib/registry'

export function ProvenanceChip({
  from,
  onDismiss,
}: {
  from: string
  onDismiss: () => void
}) {
  const app = apps.find(a => a.id === from)
  const name = app?.name ?? from
  const accent = app?.color ?? 'var(--text3)'
  const Icon = getAppIcon(app?.icon ?? '')
  // Faint tints derived from the source accent (only when it's a real hex).
  const isHex = accent.startsWith('#')
  const ring = isHex ? `${accent}33` : 'var(--border)'
  const glow = isHex ? `${accent}1f` : 'transparent'

  return (
    <div
      role="status"
      aria-label={`Received from ${name}`}
      className="gp"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 6px 4px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text2)',
        border: `1px solid ${ring}`,
        boxShadow: `0 0 14px ${glow}`,
        animation: 'scale-in var(--dur-mid) var(--ease-spring)',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden style={{ color: accent }} />
      <span>
        From{' '}
        <strong style={{ color: accent, fontWeight: 600 }}>{name}</strong>
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss source"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
          marginLeft: 2,
          borderRadius: 'var(--radius-full)',
          background: 'transparent',
          border: 'none',
          color: 'var(--text3)',
          cursor: 'pointer',
          transition: 'color var(--dur-fast) var(--ease-out)',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)' }}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
