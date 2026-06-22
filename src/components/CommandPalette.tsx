/**
 * CommandPalette — the global ⚡ "Send to…" surface (⌘/Ctrl-K).
 *
 * NodeActions surfaces a node's intents *per row*, buried inside each app. This
 * lifts the same rails to ONE keyboard-summoned surface: it targets the FOCUSED
 * node (the last node touched anywhere — see lib/core/focus), shows what The
 * Empire can DO with it (intentsFor), and runs the chosen action (runIntent),
 * mirroring NodeActions' run+toast pattern. Cross-app routing becomes reachable
 * from anywhere without hunting for a per-app ⚡ bar.
 *
 * Reuses the shell's `empire-search-*` glass so it feels native to the OS, and
 * never reinvents intents — it is a thin window onto the C-layer.
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Zap, CornerDownLeft, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import { useGraph } from '../lib/core/graph'
import { useFocus } from '../lib/core/focus'
import { intentsFor, runIntent } from '../lib/core/intents'
import { useWindowStore } from '../lib/windowStore'
import { apps } from '../lib/registry'
import { typeRgb, rgbCss } from '../apps/network/nodeColors'
import { useToast } from './ui/Toast'

interface PaletteAction {
  id: string
  label: string
  icon: string
  /** Run the action. Returns the toast description to confirm it. */
  run: () => string
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)
  const toast = useToast()
  const openApp = useWindowStore(s => s.openApp)

  const focusedId = useFocus(s => s.focusedId)
  const node = useGraph(s => (focusedId ? s.nodes[focusedId] : undefined))

  // The owner app of the focused node (for the header + "Open" action).
  const ownerApp = node ? apps.find(a => a.id === node.meta.app) : undefined

  // Every action available for the focused node: open its owner app, then each
  // intent the C-layer offers. Built from the rails — no invented commands.
  const actions = useMemo<PaletteAction[]>(() => {
    if (!node) return []
    const list: PaletteAction[] = []
    if (ownerApp) {
      list.push({
        id: `open:${ownerApp.id}`,
        label: `Open in ${ownerApp.name}`,
        icon: '⤢',
        run: () => {
          openApp(ownerApp.id, ownerApp.name, ownerApp.icon, ownerApp.color)
          return ownerApp.name
        },
      })
    }
    for (const intent of intentsFor(node)) {
      list.push({
        id: `intent:${intent.id}`,
        label: intent.label,
        icon: intent.icon ?? '↗',
        run: () => {
          void runIntent(intent.id, node)
          return intent.label
        },
      })
    }
    return list
  }, [node, ownerApp, openApp])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return actions
    return actions.filter(a => a.label.toLowerCase().includes(q))
  }, [actions, query])

  const close = useCallback(() => setOpen(false), [])

  const run = useCallback((action: PaletteAction) => {
    const desc = action.run()
    close()
    toast.success('Action run', desc)
  }, [close, toast])

  // Global ⌘/Ctrl-K toggles the palette. Esc closes it.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(v => {
          if (!v) prevFocusRef.current = document.activeElement as HTMLElement
          return !v
        })
        setQuery('')
        setSelected(0)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // Restore focus to whatever was focused before the palette opened (WCAG 2.4.3).
  useEffect(() => {
    if (!open && prevFocusRef.current) {
      prevFocusRef.current.focus?.()
      prevFocusRef.current = null
    }
  }, [open])

  // Keep the selection in range as the filter narrows.
  useEffect(() => { setSelected(0) }, [query, focusedId])

  if (!open) return null

  const accent = node ? rgbCss(typeRgb(node.type)) : 'var(--text3)'

  return (
    <div className="empire-search-overlay" onClick={close}>
      <div
        className="empire-search-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={e => e.stopPropagation()}
      >
        {/* Focused-node header — what the palette will act ON */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', borderBottom: `1px solid ${rgbCss('255,255,255', 0.05)}`,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: accent, boxShadow: `0 0 8px ${accent}`,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            {node ? (
              <>
                <div style={{
                  fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {node.title}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {node.type}{ownerApp ? ` · ${ownerApp.name}` : ''}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text3)' }}>
                No node in focus
              </div>
            )}
          </div>
          <span className="empire-search-kbd">ESC</span>
        </div>

        {/* Filter input */}
        <div className="empire-search-input-wrap">
          <Zap className="w-4 h-4" style={{ color: 'var(--text3)' }} />
          <input
            ref={inputRef}
            className="empire-search-input"
            type="text"
            placeholder="Run an action on this node…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelected(s => Math.min(s + 1, filtered.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelected(s => Math.max(s - 1, 0))
              } else if (e.key === 'Enter' && filtered[selected]) {
                e.preventDefault()
                run(filtered[selected])
              }
            }}
          />
        </div>

        {/* Action list */}
        <div className="empire-search-results">
          {!node ? (
            <div className="empire-search-empty">
              <div className="empire-search-empty-icon"><Zap className="w-4 h-4" /></div>
              <div>Nothing in focus yet</div>
              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                Touch a node — create a note, select one in The Network — then ⌘K acts on it.
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empire-search-empty">
              <div className="empire-search-empty-icon"><Zap className="w-4 h-4" /></div>
              <div>{query.trim() ? `No actions match "${query}"` : 'No actions for this node'}</div>
            </div>
          ) : (
            filtered.map((action, idx) => {
              const isSelected = idx === selected
              return (
                <button
                  key={action.id}
                  className="empire-search-result"
                  data-selected={isSelected || undefined}
                  onClick={() => run(action)}
                  onMouseEnter={() => setSelected(idx)}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 28, height: 28, borderRadius: 'var(--radius-md)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, color: 'var(--text2)',
                      background: rgbCss('255,255,255', 0.04), border: `1px solid ${rgbCss('255,255,255', 0.06)}`,
                    }}
                  >
                    {action.id.startsWith('open:') ? <ExternalLink className="w-3.5 h-3.5" /> : action.icon}
                  </span>
                  <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <div className="empire-search-result-name">{action.label}</div>
                  </div>
                  {isSelected && (
                    <span className="empire-search-kbd"><CornerDownLeft className="w-2.5 h-2.5" /></span>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer hints */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '8px 14px', borderTop: `1px solid ${rgbCss('255,255,255', 0.05)}`,
            background: rgbCss('0,0,0', 0.15), fontSize: '10px', color: 'var(--text3)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUp className="w-2.5 h-2.5" /><ArrowDown className="w-2.5 h-2.5" />navigate
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CornerDownLeft className="w-2.5 h-2.5" />run
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span className="empire-search-kbd" style={{ fontSize: '9px' }}>⌘K</span>toggle
          </span>
          <span style={{ marginLeft: 'auto' }}>
            {filtered.length} {filtered.length === 1 ? 'action' : 'actions'}
          </span>
        </div>
      </div>
    </div>
  )
}
