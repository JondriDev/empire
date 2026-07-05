/**
 * UI Utility components — EmptyState, Skeleton, Section
 *
 * Used to give every app consistent empty/loading states and section headers.
 * These are the polish that separates "it works" from "it's crafted".
 */
import type { ReactNode } from 'react'
import { cssVar, tint } from '../../design-system/tokens'

/* ═══ EMPTY STATE ═══
   Empty-state design principle: befriend the user. Show what's missing,
   explain why, and offer the next action. Personality > pity. */
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  /** Optional accent for the icon chip (a CSS colour token, e.g. `var(--c-pembaca)`),
   *  so each app keeps its own identity while sharing the empty-state rhythm.
   *  Omit to use the default signal/cyan. */
  accent?: string
  className?: string
}

export function EmptyState({ icon, title, description, action, accent, className = '' }: EmptyStateProps) {
  const chip = accent
    ? {
        background: `color-mix(in srgb, ${accent} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accent} 22%, transparent)`,
        color: accent,
      }
    : {
        background: tint('signal', 8),
        border: `1px solid ${tint('signal', 18)}`,
        color: 'var(--color-cyan-3)',
      }
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        gap: '14px',
        minHeight: '200px',
      }}
    >
      {icon && (
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...chip,
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '320px' }}>
        <h3
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            color: 'var(--text)',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {title}
        </h3>
        {description && (
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text3)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div style={{ marginTop: '4px' }}>{action}</div>}
    </div>
  )
}

/* ═══ SKELETON ═══
   Loading skeleton with shimmer. Used in cards/lists while data loads.
   Matches the eventual layout dimensions to avoid CLS. */
interface SkeletonProps {
  width?: string | number
  height?: string | number
  radius?: string | number
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = '14px', radius = '6px', className = '', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  )
}

/* ═══ SECTION HEADER ═══
   Consistent kebab-style section header used by the dashboards. */
interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, action, icon, className = '' }: SectionHeaderProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '4px 2px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        {icon && (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: tint('signal', 8),
              border: `1px solid ${tint('signal', 18)}`,
              color: 'var(--color-cyan-3)',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              color: 'var(--text)',
              margin: 0,
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text3)',
                margin: 0,
                lineHeight: 1.4,
                marginTop: '2px',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}

/* ═══ STAT CARD ═══
   Compact metric display. Used for counts/quota in dashboards. */
interface StatCardProps {
  label: string
  value: ReactNode
  delta?: string
  deltaDirection?: 'up' | 'down' | 'neutral'
  color?: string
  icon?: ReactNode
}

export function StatCard({ label, value, delta, deltaDirection = 'neutral', color, icon }: StatCardProps) {
  const accent = color || 'var(--color-cyan-3)'
  const deltaColor =
    deltaDirection === 'up'    ? cssVar('c-success') :
    deltaDirection === 'down'  ? cssVar('c-danger') :
    'var(--text3)'
  return (
    <div
      className="gp"
      style={{
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--text3)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
        {icon && <span style={{ color: accent, display: 'flex' }}>{icon}</span>}
      </div>
      <div
        style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {delta && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              color: deltaColor,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {delta}
          </span>
        </div>
      )}
    </div>
  )
}
