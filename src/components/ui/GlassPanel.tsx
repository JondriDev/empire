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
      className={`gp ${onClick ? 'gp-interactive' : ''} ${className}`}
    >
      {children}
    </div>
  )
}