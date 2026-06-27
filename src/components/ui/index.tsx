import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, CSSProperties, HTMLAttributes } from 'react'
import { cssVar, tint } from '../../design-system/tokens'

/* ═══════════════════════════════════════════════
   EMPIRE UI PRIMITIVES — refined glass + hierarchy
   - Strong default state (subtle elevation)
   - Hover lifts with cyan glow + translation
   - Active press (tactile feedback)
   - Focus ring with cyan halo
   - Disabled = opacity + cursor not-allowed
   ═══════════════════════════════════════════════ */

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  children: ReactNode
  className?: string
  onClick?: () => void
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  style?: CSSProperties
}

const padMap = { none: '0', sm: '12px', md: '16px', lg: '24px' }

export function Card({ children, className = '', onClick, interactive, padding = 'md', style, onKeyDown, ...rest }: CardProps) {
  const clickable = onClick || interactive
  return (
    <div
      {...rest}
      onClick={onClick}
      onKeyDown={clickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      } : onKeyDown}
      role={rest.role ?? (clickable ? 'button' : undefined)}
      tabIndex={rest.tabIndex ?? (clickable ? 0 : undefined)}
      className={`gp ${clickable ? 'gp-interactive' : ''} ${className}`}
      style={{ padding: padMap[padding], ...style }}
    >
      {children}
    </div>
  )
}

/* ── BUTTON ── polish: cubic-spring transition, distinct primary/secondary/ghost */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, var(--color-cyan-5) 0%, var(--color-teal-5) 100%)',
    color: cssVar('xenon'),
    border: `1px solid ${tint('signal', 40)}`,
    boxShadow: `0 2px 8px ${tint('signal', 25)}, inset 0 1px 0 ${tint('xenon', 15)}`,
  },
  secondary: {
    background: 'var(--gl-bg)',
    backdropFilter: 'var(--gl-blur)',
    WebkitBackdropFilter: 'var(--gl-blur)',
    color: 'var(--text)',
    border: '1px solid var(--gl-border-b)',
    borderTopColor: 'var(--gl-border-t)',
    boxShadow: 'var(--gl-shadow)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text2)',
    border: '1px solid transparent',
  },
  danger: {
    background: `linear-gradient(135deg, ${tint('c-danger', 85)} 0%, color-mix(in srgb, var(--c-danger) 72%, var(--void)) 100%)`,
    color: cssVar('xenon'),
    border: `1px solid ${tint('c-danger', 50)}`,
    boxShadow: `0 2px 8px ${tint('c-danger', 25)}`,
  },
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-md)', gap: '6px' },
  md: { padding: '8px 16px', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-md)', gap: '8px' },
  lg: { padding: '12px 22px', fontSize: 'var(--text-base)', borderRadius: 'var(--radius-lg)', gap: '10px' },
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  fullWidth,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`empire-btn ${className}`}
      disabled={disabled}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.45 : 1,
        transition: 'all var(--dur-fast) var(--ease-spring)',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
      {...rest}
    >
      {icon && <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span>}
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{children}</span>
      {iconRight && <span style={{ display: 'inline-flex', flexShrink: 0 }}>{iconRight}</span>}
    </button>
  )
}

/* ── INPUT ── polish: hover state, focused cyan halo, monospace option */
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: ReactNode
  className?: string
  mono?: boolean
}

export function Input({ value, onChange, placeholder, icon, className = '', mono, ...rest }: InputProps) {
  return (
    <div
      className={`empire-input-wrap ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 12px',
        background: 'var(--input-bg)',
        border: '1px solid var(--input-border-b)',
        borderTopColor: 'var(--input-border-t)',
        borderRadius: 'var(--radius-md)',
        height: '38px',
        transition: 'background var(--dur-fast), border-color var(--dur-fast), box-shadow var(--dur-fast)',
      }}
    >
      {icon && <span style={{ display: 'inline-flex', color: 'var(--text3)', flexShrink: 0 }}>{icon}</span>}
      <input
        {...rest}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="empire-input-field"
        style={{
          flex: 1,
          border: 'none',
          background: 'transparent',
          color: 'var(--text)',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          outline: 'none',
          minWidth: 0,
          padding: '0',
        }}
        onFocus={(e) => {
          e.currentTarget.parentElement!.style.background = 'var(--input-bg-focus)'
          ;(e.currentTarget.parentElement! as HTMLElement).style.borderColor = tint('signal', 50)
          ;(e.currentTarget.parentElement! as HTMLElement).style.boxShadow = 'var(--input-shadow-focus)'
          rest.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.parentElement!.style.background = 'var(--input-bg)'
          ;(e.currentTarget.parentElement! as HTMLElement).style.borderColor = 'var(--input-border-b)'
          ;(e.currentTarget.parentElement! as HTMLElement).style.boxShadow = 'none'
          rest.onBlur?.(e)
        }}
      />
    </div>
  )
}

/* ── TEXTAREA ── with same polish as Input */
interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  mono?: boolean
}

export function TextArea({ value, onChange, placeholder, className = '', mono, ...rest }: TextAreaProps) {
  return (
    <textarea
      {...rest}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`empire-textarea ${className}`}
      style={{
        width: '100%',
        padding: '10px 12px',
        background: 'var(--input-bg)',
        border: '1px solid var(--input-border-b)',
        borderTopColor: 'var(--input-border-t)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text)',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        lineHeight: 1.5,
        outline: 'none',
        resize: 'vertical',
        minHeight: '80px',
        transition: 'background var(--dur-fast), border-color var(--dur-fast), box-shadow var(--dur-fast)',
        ...(rest.style || {}),
      }}
      onFocus={(e) => {
        e.currentTarget.style.background = 'var(--input-bg-focus)'
        e.currentTarget.style.borderColor = tint('signal', 50)
        e.currentTarget.style.boxShadow = 'var(--input-shadow-focus)'
        rest.onFocus?.(e)
      }}
      onBlur={(e) => {
        e.currentTarget.style.background = 'var(--input-bg)'
        e.currentTarget.style.borderColor = 'var(--input-border-b)'
        e.currentTarget.style.boxShadow = 'none'
        rest.onBlur?.(e)
      }}
    />
  )
}

/* ── BADGE — small chip for status/meta info */
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  color?: string
  className?: string
}

const badgeColors: Record<BadgeVariant, { bg: string; fg: string; border: string }> = {
  default: { bg: tint('xenon', 6), fg: 'var(--text2)', border: tint('xenon', 8) },
  success: { bg: tint('c-success', 12), fg: cssVar('c-success'), border: tint('c-success', 25) },
  warning: { bg: tint('c-warn', 12), fg: cssVar('c-warn'), border: tint('c-warn', 25) },
  danger:  { bg: tint('c-danger', 12), fg: cssVar('c-danger'), border: tint('c-danger', 25) },
  info:    { bg: tint('signal', 12), fg: cssVar('signal'), border: tint('signal', 25) },
}

export function Badge({ children, variant = 'default', color, className = '' }: BadgeProps) {
  const palette = color
    ? {
        bg: `color-mix(in srgb, ${color} 9%, transparent)`,
        fg: color,
        border: `color-mix(in srgb, ${color} 19%, transparent)`,
      }
    : badgeColors[variant]
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        background: palette.bg,
        color: palette.fg,
        border: `1px solid ${palette.border}`,
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

/* ── DIVIDER — subtle horizontal rule */
export function Divider({ className = '' }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${tint('xenon', 8)} 20%, ${tint('xenon', 8)} 80%, transparent)`,
        margin: '8px 0',
      }}
    />
  )
}
