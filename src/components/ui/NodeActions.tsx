/**
 * NodeActions — the reusable ⚡ "Send to…" menu (C-layer UI).
 *
 * Drop <NodeActions type="note" sourceId={note.id} /> into any app's item row.
 * It finds that item's CoreNode in the graph, lists intentsFor(node), and runs
 * the chosen one. This is how every app inherits cross-app routing for free —
 * renders nothing if the node has no applicable intents.
 */
import { useState, useEffect, useRef } from 'react'
import { Zap } from 'lucide-react'
import { useGraph } from '../../lib/core/graph'
import { intentsFor, runIntent } from '../../lib/core/intents'
import { useToast } from './Toast'

export function NodeActions({ type, sourceId }: { type: string; sourceId: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
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

  if (!node || intents.length === 0) return null

  const run = (id: string, label: string) => {
    void runIntent(id, node)
    setOpen(false)
    toast.success('Action run', label)
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        title="Actions"
        aria-label="Node actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
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
          style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6,
            zIndex: 'var(--z-context)', minWidth: 190, padding: 6,
            display: 'flex', flexDirection: 'column', gap: 2,
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text3)', padding: '4px 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Send to…
          </div>
          {intents.map(i => (
            <button
              key={i.id}
              role="menuitem"
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
