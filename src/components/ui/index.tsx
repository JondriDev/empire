import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl shadow-2xl ${className}`} style={{
      background: 'var(--gl-bg)',
      backdropFilter: 'var(--gl-blur)',
      border: '1px solid var(--gl-border-b)',
      borderTopColor: 'var(--gl-border-t)',
      boxShadow: 'var(--gl-shadow)',
    }}>
      {children}
    </div>
  )
}

interface ButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function Button({ children, className = '', onClick, disabled }: ButtonProps) {
  return (
    <button 
      className={`px-4 py-2 rounded-lg transition-colors ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'var(--gl-bg)',
        border: '1px solid var(--gl-border-b)',
      }}
    >
      {children}
    </button>
  )
}

interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function Input({ value, onChange, placeholder, className = '' }: InputProps) {
  return (
    <input
      type="text"
      className={`p-2 rounded-lg ${className}`}
      style={{
        background: 'var(--gl-bg)',
        border: '1px solid var(--gl-border-b)',
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

interface TextAreaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TextArea({ value, onChange, placeholder, className = '' }: TextAreaProps) {
  return (
    <textarea
      className={`p-2 rounded-lg ${className}`}
      style={{
        background: 'var(--gl-bg)',
        border: '1px solid var(--gl-border-b)',
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}