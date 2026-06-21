/**
 * NodeActions — the reusable ⚡ "Send to…" menu (C-layer UI).
 *
 * Drop <NodeActions type="note" sourceId={note.id} /> into any app's item row.
 * It finds that item's CoreNode in the graph, lists intentsFor(node), and runs
 * the chosen one. This is how every app inherits cross-app routing for free —
 * renders nothing if the node has no applicable intents.
 */
import { useState, useEffect, useRef, type KeyboardEvent } from 'react'
import { Zap } from 'lucide-react'
import { useGraph } from '../../lib/core/graph'
import { intentsFor, runIntent } from '../../lib/core/intents'
import { useToast } from './Toast'

export function NodeActions({ type, sourceId }: { type: string; sourceId: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const toast = useToast()
  const node = useGraph(s =>
    Object.values(s.nodes).find(n => n.type === type && n.data.sourceId === sourceId)
  )
  const intents = node ? intentsFor(node) : []

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

  // Roving-focus keyboard nav within the menu.
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
      // Keep focus trapped — close on Tab-out, matching native menu behavior.
      close()
    }
  }

  if (!node || intents.length === 0) return null

  const run = (id: string, label: string) => {
    void runIntent(id, node)
    close()
    toast.success('Action run', label)
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={btnRef}
        title="Actions"
        aria-label="Node actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        onKeyDown={(e) => {
          if ((e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') && !open) {
            e.preventDefault()
            setOpen(true)
          }
        }}
        style={{
          padding: 6, borderRadius: 'var(--radius-md)', background: 'transparent',
          border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--dur-fast) var(--ease-spring)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#34f5d6'; e.currentTarget.style.background = 'rgba(52,245,214,0.12)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
      >
        <Zap className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          className="gp"
          role="menu"
          aria-orientation="vertical"
          onKeyDown={onMenuKeyDown}
          style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6,
            zIndex: 'var(--z-context)', minWidth: 190, padding: 6,
            display: 'flex', flexDirection: 'column', gap: 2,
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text3)', padding: '4px 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Send to…
          </div>
          {intents.map((i, idx) => (
            <button
              key={i.id}
              ref={el => { itemRefs.current[idx] = el }}
              role="menuitem"
              tabIndex={-1}
              onClick={() => run(i.id, i.label)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '8px 10px', background: 'transparent', border: 'none',
                borderRadius: 'var(--radius-md)', color: 'var(--text)',
                fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left',
                transition: 'background var(--dur-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(52,245,214,0.10)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <span aria-hidden style={{ width: 16, textAlign: 'center' }}>{i.icon ?? '↗'}</span>
              {i.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
