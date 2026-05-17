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
      className={`rounded-2xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: 'var(--card-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid var(--card-border-b)',
        borderTopColor: 'var(--card-border-t)',
        boxShadow: 'var(--card-shadow)',
        transition: 'background var(--dur-base) var(--ease-out), ' +
                    'box-shadow var(--dur-base) var(--ease-out), ' +
                    'border-color var(--dur-base) var(--ease-out), ' +
                    'transform var(--dur-base) var(--ease-spring)',
        cursor: onClick ? 'pointer' : 'default',
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        if (!onClick) return
        e.currentTarget.style.background = 'var(--card-bg-h)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--card-bg)'
        e.currentTarget.style.boxShadow = 'var(--card-shadow)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {children}
    </div>
  )
}