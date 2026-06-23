/**
 * SendResultMenu — the ⚡ "Send to…" affordance for *sink* apps (Organism S6b).
 *
 * The receiver apps (Editor, Token Counter, AI Chat) take a HANDOFF in but the
 * signal used to die there. Drop <SendResultMenu source="editor" text={code} />
 * into a sink's toolbar and its output can flow onward: each menu item runs an
 * existing `CROSS_APP_ACTIONS` executor with `{ text, title, source }`, which
 * already `handoff(...)`s — lighting a real source→target arc in the Network and
 * closing the loop. No new collections, no new colours: reuse the rails.
 *
 * Styling mirrors NodeActions.tsx (glass `gp` dropdown, roving-focus keyboard
 * nav, tokens only). Disabled when there's nothing to send.
 */
import { useState, useEffect, useRef, type KeyboardEvent } from 'react'
import { Zap } from 'lucide-react'
import { CROSS_APP_ACTIONS, type AppActionKey } from '../../lib/appActions'
import { getAppIcon } from '../../lib/registry'
import { useToast } from './Toast'

// Where each action sends — so a sink never offers to send to itself.
const ACTION_TARGET: Record<AppActionKey, string> = {
  SEND_TO_NOTES: 'notes',
  SEND_TO_EDITOR: 'editor',
  SEND_TO_TOKEN_COUNTER: 'token-counter',
  SEND_TO_PROMPT_GEN: 'prompt-generator',
  SEND_TO_AI_CHAT: 'ai-chat',
  SEND_TO_LEARNING: 'learning-tracker',
  SEND_TO_CALENDAR: 'calendar',
  SEND_TO_GOALS: 'goals',
  SEND_TO_MESSAGES: 'messages',
  ASK_HERMES_TO_ANALYZE: 'ai-chat',
}

const DEFAULT_ACTIONS: AppActionKey[] = [
  'SEND_TO_NOTES',
  'SEND_TO_PROMPT_GEN',
  'SEND_TO_AI_CHAT',
  'SEND_TO_TOKEN_COUNTER',
  'SEND_TO_EDITOR',
  'SEND_TO_CALENDAR',
  'SEND_TO_GOALS',
  'SEND_TO_MESSAGES',
]

export function SendResultMenu({
  source,
  text,
  title,
  actions = DEFAULT_ACTIONS,
  label = 'Send to…',
}: {
  source: string
  text: string
  title?: string
  actions?: AppActionKey[]
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const toast = useToast()

  // Drop any action that would route back to the source app (no self-handoffs).
  const keys = actions.filter(k => ACTION_TARGET[k] !== source)
  const disabled = !text.trim() || keys.length === 0

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Move focus into the menu when it opens so arrow-key nav works immediately.
  useEffect(() => {
    if (open) itemRefs.current[0]?.focus()
  }, [open])

  const close = (returnFocus = true) => {
    setOpen(false)
    if (returnFocus) btnRef.current?.focus()
  }

  // Roving-focus keyboard nav within the menu (mirrors NodeActions).
  const onMenuKeyDown = (e: KeyboardEvent) => {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[]
    const current = items.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(current + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(current - 1 + items.length) % items.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      items[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      items[items.length - 1]?.focus()
    } else if (e.key === 'Tab') {
      close()
    }
  }

  const run = (key: AppActionKey) => {
    const action = CROSS_APP_ACTIONS[key]
    // Executors return a string or a Promise<string>; navigation ones replace
    // the page, so the toast is mainly for in-place sinks (Notes/Learning).
    const res = action.execute({ text, title, source })
    if (typeof res === 'string') toast.success('Sent', res)
    close(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={btnRef}
        type="button"
        title={label}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        onKeyDown={(e) => {
          if ((e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') && !open) {
            e.preventDefault()
            setOpen(true)
          }
        }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', borderRadius: 'var(--radius-md)',
          background: 'transparent', border: '1px solid var(--border)',
          color: disabled ? 'var(--text3)' : 'var(--text2)',
          fontSize: 'var(--text-xs)', cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: 'all var(--dur-fast) var(--ease-spring)',
        }}
        onMouseEnter={(e) => {
          if (disabled) return
          e.currentTarget.style.color = 'var(--signal)'
          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--signal) 40%, transparent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = disabled ? 'var(--text3)' : 'var(--text2)'
          e.currentTarget.style.borderColor = 'var(--border)'
        }}
      >
        <Zap className="w-3.5 h-3.5" aria-hidden />
        {label}
      </button>
      {open && !disabled && (
        <div
          className="gp"
          role="menu"
          aria-orientation="vertical"
          onKeyDown={onMenuKeyDown}
          style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6,
            zIndex: 'var(--z-context)', minWidth: 200, padding: 6,
            display: 'flex', flexDirection: 'column', gap: 2,
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text3)', padding: '4px 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {label}
          </div>
          {keys.map((key, idx) => {
            const action = CROSS_APP_ACTIONS[key]
            const Icon = getAppIcon(action.icon)
            return (
              <button
                key={key}
                ref={el => { itemRefs.current[idx] = el }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => run(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '8px 10px', background: 'transparent', border: 'none',
                  borderRadius: 'var(--radius-md)', color: 'var(--text)',
                  fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left',
                  transition: 'background var(--dur-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--signal) 10%, transparent)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden style={{ width: 16 }} />
                {action.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
