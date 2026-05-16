import type { ReactNode } from 'react'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export default function GlassPanel({ children, className = '', onClick }: GlassPanelProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl shadow-2xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: 'var(--gl-bg)',
        backdropFilter: 'var(--gl-blur)',
        border: '1px solid var(--gl-border-b)',
        borderTopColor: 'var(--gl-border-t)',
        boxShadow: 'var(--gl-shadow)',
        transition: 'background var(--dur-mid), box-shadow var(--dur-mid), border-color var(--dur-mid)',
      } as React.CSSProperties}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.background = 'var(--gl-bg-h)' } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--gl-bg)' }}
    >
      {children}
    </div>
  )
}