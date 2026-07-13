import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, CSSProperties, HTMLAttributes } from 'react'
import { cssVar, tint } from '../../design-system/tokens'

/* ═══════════════════════════════════════════════
   EMPIRE UI PRIMITIVES — refined glass + hierarchy
   - Strong default state (subtle elevation)
   - Hover lifts with cyan glow + translation
   - Active press (tactile feedback)
   - Focus ring with cyan halo
   - Disabled = opacity + cursor not-allowed

   ★ SHELL-CONFORMANCE INVARIANT (EPIC-14, locked in CI):
   App code renders EVERY interactive control through these primitives —
   Button / IconButton / Input / TextArea / Select / Segmented / Slider.
   A bare <button>, <select>, <textarea>, or text-<input> in an app file
   fails CI: `node scripts/metrics.mjs --assert-zero` gates
   offShellControls=0 (checkbox/radio/file inputs are exempt — no text-field
   home). Need a control the shell lacks? ADD a primitive here, don't drop to
   bare HTML. This file is excluded from the app-code audit set because it
   legitimately wraps the bare elements (Button→<button>, Input→<input>, …).
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

/* ★ KEYBOARD-OPERABILITY INVARIANT (EPIC-15 · WCAG 2.1.1, locked in CI):
   A clickable region must be keyboard-driveable. `Card interactive` (or with an
   onClick) is the shell home for a click-to-select tile/row/card — it wires
   role="button" + tabIndex={0} + Enter/Space → onClick for free. When an element
   must stay a bare <div>/<span> for layout, add role="button" + tabIndex={0} +
   onKeyDown={onActivate(fn)} (src/lib/a11y.ts). A bare onClick on a
   non-interactive host with no key handler fails CI:
   `node scripts/metrics.mjs --assert-zero` gates keyboardA11y=0. */

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
  style,
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
        // Per-instance overrides (e.g. an app accent) compose on top of the
        // variant/size base rather than replacing the whole style object.
        ...style,
      }}
      {...rest}
    >
      {icon && <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span>}
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{children}</span>
      {iconRight && <span style={{ display: 'inline-flex', flexShrink: 0 }}>{iconRight}</span>}
    </button>
  )
}

/* ── INPUT ── polish: hover state, focused cyan halo, monospace option.
   `seamless` renders a borderless/transparent field for inline-edit contexts
   (spreadsheet cells, in-place rename) that would drown under the full glass
   chrome — it still routes through the primitive, so it keeps the shared focus
   affordance + a11y and never counts as a bare off-shell control. */
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: ReactNode
  className?: string
  mono?: boolean
  seamless?: boolean
}

export function Input({ value, onChange, placeholder, icon, className = '', mono, seamless, ...rest }: InputProps) {
  const wrapStyle: CSSProperties = seamless
    ? {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 8px',
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: 'var(--radius-sm)',
        minHeight: '30px',
        transition: 'background var(--dur-fast), border-color var(--dur-fast)',
      }
    : {
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
      }
  return (
    <div className={`empire-input-wrap ${className}`} style={wrapStyle}>
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
          const p = e.currentTarget.parentElement as HTMLElement
          p.style.background = 'var(--input-bg-focus)'
          if (!seamless) {
            p.style.borderColor = tint('signal', 50)
            p.style.boxShadow = 'var(--input-shadow-focus)'
          }
          rest.onFocus?.(e)
        }}
        onBlur={(e) => {
          const p = e.currentTarget.parentElement as HTMLElement
          p.style.background = seamless ? 'transparent' : 'var(--input-bg)'
          if (!seamless) {
            p.style.borderColor = 'var(--input-border-b)'
            p.style.boxShadow = 'none'
          }
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

/* ── SLIDER ── the `ui` home for a range control (seek bars, volume, numeric
   ranges). App code should never render a bare `<input type="range">`: the
   thumb/track accent is tokenised to `signal` (accent as LIGHT), and — like
   `IconButton` — the TS type REQUIRES `aria-label`, so a slider can never ship
   unnamed to assistive tech. Native keyboard + a11y (arrow keys, Home/End,
   implicit role="slider") come free from the element it wraps. */
interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  'aria-label': string
  className?: string
}

export function Slider({ value, onChange, min = 0, max = 100, step, className = '', style, ...rest }: SliderProps) {
  return (
    <input
      {...rest}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      className={`empire-slider ${className}`}
      style={{
        width: '100%',
        height: '4px',
        accentColor: cssVar('signal'),
        background: 'transparent',
        cursor: 'pointer',
        // Per-instance overrides (e.g. a fixed volume-slider width) compose last.
        ...style,
      }}
    />
  )
}

/* ── ICON BUTTON ── icon-only button; the TS type REQUIRES `aria-label` so an
   icon-only control can never ship unlabelled (folds a11y into the primitive). */
interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  icon: ReactNode
  'aria-label': string
  variant?: ButtonVariant
  size?: ButtonSize
}

const iconSizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { width: '28px', height: '28px', borderRadius: 'var(--radius-md)' },
  md: { width: '34px', height: '34px', borderRadius: 'var(--radius-md)' },
  lg: { width: '42px', height: '42px', borderRadius: 'var(--radius-lg)' },
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled,
  style,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`empire-icon-btn ${className}`}
      disabled={disabled}
      style={{
        ...variantStyles[variant],
        ...iconSizeStyles[size],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'all var(--dur-fast) var(--ease-spring)',
        flexShrink: 0,
        padding: 0,
        // Per-instance overrides compose on top of the variant/size base.
        ...style,
      }}
      {...rest}
    >
      <span aria-hidden="true" style={{ display: 'inline-flex' }}>{icon}</span>
    </button>
  )
}

/* ── SELECT ── native <select> on the Empire glass surface (token-clean), with a
   custom chevron. The native element keeps keyboard + platform a11y for free. */
interface SelectOption { value: string; label: string; disabled?: boolean }

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  ariaLabel?: string
  className?: string
}

export function Select({ value, onChange, options, ariaLabel, className = '', ...rest }: SelectProps) {
  return (
    <div
      className={`empire-select-wrap ${className}`}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: '100%' }}
    >
      <select
        {...rest}
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="empire-select-field"
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          width: '100%',
          height: '38px',
          padding: '0 32px 0 12px',
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border-b)',
          borderTopColor: 'var(--input-border-t)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          cursor: 'pointer',
          outline: 'none',
          transition: 'background var(--dur-fast), border-color var(--dur-fast), box-shadow var(--dur-fast)',
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
      >
        {options.map(o => (
          <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
        ))}
      </select>
      <span
        aria-hidden="true"
        style={{ position: 'absolute', right: '10px', display: 'inline-flex', color: 'var(--text3)', pointerEvents: 'none' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </span>
    </div>
  )
}

/* ── SEGMENTED ── a segmented toggle / tab row. Proper radiogroup semantics:
   container role="radiogroup", each item role="radio" + aria-checked reflects the
   selection (the accessible equivalent of the aria-pressed idiom, correct for a
   single-select group) — so a tab row can never ship without a selected-state cue
   for AT. Active segment is a light signal wash, not a fill (alien-tech restraint). */
interface SegmentedItem {
  value: string
  label?: string
  icon?: ReactNode
  ariaLabel?: string
}

interface SegmentedProps {
  value: string
  onChange: (value: string) => void
  items: SegmentedItem[]
  className?: string
  ariaLabel?: string
}

export function Segmented({ value, onChange, items, className = '', ariaLabel }: SegmentedProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`empire-segmented ${className}`}
      style={{
        display: 'inline-flex',
        gap: '2px',
        padding: '2px',
        background: 'var(--gl-bg)',
        border: '1px solid var(--gl-border-b)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {items.map((it) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={it.ariaLabel ?? it.label}
            onClick={() => onChange(it.value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: it.label ? '5px 12px' : '5px 8px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: active ? tint('signal', 18) : 'transparent',
              color: active ? cssVar('signal') : 'var(--text2)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--dur-fast) var(--ease-spring)',
              whiteSpace: 'nowrap',
            }}
          >
            {it.icon && <span aria-hidden="true" style={{ display: 'inline-flex' }}>{it.icon}</span>}
            {it.label && <span>{it.label}</span>}
          </button>
        )
      })}
    </div>
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
        fontSize: 'var(--text-xs)',
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
