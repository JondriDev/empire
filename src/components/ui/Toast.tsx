/**
 * Toast Engine — subtle in-app notifications
 *
 * Single bottom-right stack, 4s default, glass morphism with status color stripe.
 * Use via the `useToast()` hook for ergonomic one-shot notifications.
 */
import { create } from 'zustand'
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react'
import { cssVar, tint, type TokenName } from '../../design-system/tokens'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  description?: string
  variant: ToastVariant
  duration: number
}

interface ToastStore {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => string
  dismiss: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: ({ message, description, variant, duration = 4000 }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    set((s) => ({ toasts: [...s.toasts, { id, message, description, variant, duration }] }))
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, duration)
    }
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Hook to call from any component */
// eslint-disable-next-line react-refresh/only-export-components -- hook intentionally co-located with its Toast components
export function useToast() {
  const push = useToastStore((s) => s.push)
  return {
    success: (message: string, description?: string) => push({ message, description, variant: 'success' }),
    error:   (message: string, description?: string) => push({ message, description, variant: 'error' }),
    info:    (message: string, description?: string) => push({ message, description, variant: 'info' }),
    warning: (message: string, description?: string) => push({ message, description, variant: 'warning' }),
  }
}

/** Per-variant: one XENO accent token + icon. The stripe/fg/bg are derived from
 *  the accent so a theme change carries through (stripe = solid `cssVar`, fg =
 *  the accent lightened toward `--text`, bg = a 12% tint). */
const variantAccent: Record<ToastVariant, { accent: TokenName; icon: typeof Info }> = {
  success: { accent: 'c-success', icon: CheckCircle2 },
  error:   { accent: 'c-danger',  icon: AlertCircle },
  info:    { accent: 'signal',    icon: Info },
  warning: { accent: 'c-warn',    icon: AlertTriangle },
}

/** Mount once at the app root */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80, /* clear of taskbar (56px) + breathing room */
        right: 16,
        zIndex: 'var(--z-toast)' as unknown as number,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '8px',
        pointerEvents: 'none',
        maxWidth: '380px',
        width: 'calc(100vw - 32px)',
      }}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  )
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const { accent, icon: Icon } = variantAccent[toast.variant]
  const stripe = cssVar(accent)
  const fg = `color-mix(in srgb, ${cssVar(accent)} 70%, var(--text))`

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'relative',
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px 12px 16px',
        background: tint('void', 85),
        backdropFilter: 'blur(var(--blur-xl)) saturate(1.6)',
        WebkitBackdropFilter: 'blur(var(--blur-xl)) saturate(1.6)',
        border: `1px solid ${tint('xenon', 8)}`,
        borderLeft: `3px solid ${stripe}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: `0 12px 36px ${tint('void', 50)}, 0 0 0 1px ${tint('xenon', 4)} inset`,
        animation: 'toast-in 320ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <Icon
        className="w-4 h-4 flex-shrink-0 mt-0.5"
        style={{ color: fg }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--text)',
            lineHeight: 1.4,
          }}
        >
          {toast.message}
        </div>
        {toast.description && (
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text3)',
              marginTop: '2px',
              lineHeight: 1.45,
            }}
          >
            {toast.description}
          </div>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: 'transparent',
          border: 'none',
          padding: '2px',
          borderRadius: '4px',
          color: 'var(--text3)',
          cursor: 'pointer',
          display: 'flex',
          transition: 'background var(--dur-fast), color var(--dur-fast)',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = tint('xenon', 6)
          e.currentTarget.style.color = 'var(--text)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text3)'
        }}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
