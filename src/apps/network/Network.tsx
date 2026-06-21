/**
 * Network — the ecosystem as one literal node-graph.
 *
 * Ported from the-empire (XENO) `backdrop.js → startNetwork`, rebuilt as a
 * self-contained React canvas. A central CORE identity is wired to every app
 * in the registry, with packets travelling the links. Hovering reveals a
 * label; clicking a node opens that app.
 */
import { useEffect, useRef, useState } from 'react'
import { apps } from '../../lib/registry'
import { useWindowStore } from '../../lib/windowStore'
import { useLang } from '../../lib/i18n'
import { useGraph } from '../../lib/core/graph'
import type { CoreNode } from '../../lib/core/graph'

// Map a hex accent (the registry `color`) to an "r,g,b" string for canvas fills.
function rgbOf(hex: string): string {
  const h = hex.replace('#', '')
  const n = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h
  const int = parseInt(n, 16)
  return `${(int >> 16) & 255},${(int >> 8) & 255},${int & 255}`
}

// Node colour by *type*, drawn from the Deep-Field design tokens
// (--signal/--aurora/--plasma/--ion/--ember/pale-signal). Known types get a
// meaningful accent; anything new gets a stable colour by hashing its name.
const TYPE_RGB: Record<string, string> = {
  note: '77,155,255',      // --ion     electric blue
  task: '92,240,168',      // --aurora  alien green
  message: '52,245,214',   // --signal  teal
  learning: '176,107,255', // --plasma  violet
  goal: '255,155,107',     // --ember   warm signal
  prompt: '155,247,230',   // pale signal
}
const TYPE_CYCLE = ['52,245,214', '92,240,168', '176,107,255', '77,155,255', '255,155,107', '155,247,230']
function typeRgb(type: string): string {
  if (TYPE_RGB[type]) return TYPE_RGB[type]
  let hsh = 0
  for (let i = 0; i < type.length; i++) hsh = (hsh * 31 + type.charCodeAt(i)) >>> 0
  return TYPE_CYCLE[hsh % TYPE_CYCLE.length]
}

export default function Network() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const openApp = useWindowStore(s => s.openApp)
  const { t } = useLang()
  const [hoverName, setHoverName] = useState<string | null>(null)
  const [nodeCount, setNodeCount] = useState(0)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, dpr = 1
    let raf = 0, tk = 0, hover = -1
    const core = { x: 0, y: 0 }
    type Node = { app: typeof apps[number]; x: number; y: number; ang: number; c: string }
    let layout: Node[] = []

    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2)
      const rect = cv!.getBoundingClientRect()
      w = cv!.width = Math.max(1, rect.width * dpr)
      h = cv!.height = Math.max(1, rect.height * dpr)
      core.x = w / 2
      core.y = h / 2
      const R = Math.min(w, h) * 0.40
      layout = apps.map((app, i) => {
        const ang = (i / apps.length) * Math.PI * 2 - Math.PI / 2
        const rr = R * (0.62 + (i % 3) * 0.19)
        return { app, x: core.x + Math.cos(ang) * rr, y: core.y + Math.sin(ang) * rr, ang, c: rgbOf(app.color) }
      })
    }

    function frame() {
      ctx!.clearRect(0, 0, w, h)
      tk += 0.02
      // links from core
      for (const n of layout) {
        const pulse = 0.10 + 0.10 * (0.5 + 0.5 * Math.sin(tk + n.ang * 2))
        const g = ctx!.createLinearGradient(core.x, core.y, n.x, n.y)
        g.addColorStop(0, `rgba(52,245,214,${pulse + 0.05})`)
        g.addColorStop(1, `rgba(${n.c},${pulse})`)
        ctx!.beginPath(); ctx!.moveTo(core.x, core.y); ctx!.lineTo(n.x, n.y)
        ctx!.strokeStyle = g; ctx!.lineWidth = dpr; ctx!.stroke()
        // travelling packet
        const tp = (tk * 0.4 + n.ang) % 1
        const px = core.x + (n.x - core.x) * tp, py = core.y + (n.y - core.y) * tp
        ctx!.beginPath(); ctx!.arc(px, py, 1.6 * dpr, 0, 7); ctx!.fillStyle = `rgba(${n.c},0.9)`; ctx!.fill()
      }
      // app nodes
      layout.forEach((n, i) => {
        const r = (i === hover ? 8 : 5.5) * dpr
        ctx!.beginPath(); ctx!.arc(n.x, n.y, r, 0, 7)
        ctx!.fillStyle = `rgba(${n.c},${i === hover ? 1 : 0.85})`
        ctx!.shadowColor = `rgba(${n.c},0.8)`; ctx!.shadowBlur = (i === hover ? 22 : 12) * dpr
        ctx!.fill(); ctx!.shadowBlur = 0
      })
      // ── Core graph (B-backbone): real CoreNodes orbiting their owning app ──
      const gnodes = Object.values(useGraph.getState().nodes)
      if (gnodes.length) {
        const ownerPos = new Map<string, { x: number; y: number; c: string }>()
        layout.forEach(n => ownerPos.set(n.app.id, { x: n.x, y: n.y, c: n.c }))
        const byOwner = new Map<string, CoreNode[]>()
        for (const gn of gnodes) {
          const owner = ownerPos.has(gn.meta.app) ? gn.meta.app : '__core'
          const arr = byOwner.get(owner) ?? []
          arr.push(gn)
          byOwner.set(owner, arr)
        }
        const pos = new Map<string, { x: number; y: number; c: string }>()
        byOwner.forEach((list, owner) => {
          const base = ownerPos.get(owner) ?? { x: core.x, y: core.y, c: '52,245,214' }
          list.forEach((gn, i) => {
            const a = (i / Math.max(list.length, 1)) * Math.PI * 2 + tk * 0.3
            const rr = (24 + (i % 2) * 9) * dpr
            const p = { x: base.x + Math.cos(a) * rr, y: base.y + Math.sin(a) * rr, c: base.c }
            pos.set(gn.id, p)
            // faint tether from the owning app to its node
            ctx!.beginPath(); ctx!.moveTo(base.x, base.y); ctx!.lineTo(p.x, p.y)
            ctx!.strokeStyle = `rgba(${base.c},0.18)`; ctx!.lineWidth = dpr; ctx!.stroke()
          })
        })
        // real graph edges (e.g. note -> task) in plasma violet
        for (const gn of gnodes) {
          const from = pos.get(gn.id); if (!from) continue
          for (const l of gn.links) {
            const to = pos.get(l); if (!to) continue
            ctx!.beginPath(); ctx!.moveTo(from.x, from.y); ctx!.lineTo(to.x, to.y)
            ctx!.strokeStyle = 'rgba(176,107,255,0.55)'; ctx!.lineWidth = 1.4 * dpr; ctx!.stroke()
          }
        }
        // node dots
        pos.forEach(p => {
          ctx!.beginPath(); ctx!.arc(p.x, p.y, 3 * dpr, 0, 7)
          ctx!.fillStyle = `rgba(${p.c},0.95)`
          ctx!.shadowColor = `rgba(${p.c},0.9)`; ctx!.shadowBlur = 8 * dpr
          ctx!.fill(); ctx!.shadowBlur = 0
        })
      }
      // CORE
      const cr = 16 * dpr + Math.sin(tk * 2) * 1.4 * dpr
      const cg = ctx!.createRadialGradient(core.x, core.y, 0, core.x, core.y, cr * 2.4)
      cg.addColorStop(0, 'rgba(52,245,214,0.95)'); cg.addColorStop(0.5, 'rgba(77,155,255,0.5)'); cg.addColorStop(1, 'rgba(176,107,255,0)')
      ctx!.beginPath(); ctx!.arc(core.x, core.y, cr * 2.4, 0, 7); ctx!.fillStyle = cg; ctx!.fill()
      ctx!.beginPath(); ctx!.arc(core.x, core.y, cr, 0, 7); ctx!.fillStyle = 'rgba(3,6,14,0.9)'
      ctx!.fill(); ctx!.strokeStyle = 'rgba(52,245,214,0.9)'; ctx!.lineWidth = 1.5 * dpr; ctx!.stroke()
      ctx!.font = `800 ${10 * dpr}px ui-monospace, monospace`; ctx!.fillStyle = '#34f5d6'
      ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle'; ctx!.fillText('CORE', core.x, core.y)
      if (!reduceMotion) raf = requestAnimationFrame(frame)
    }

    function pick(ev: MouseEvent): number {
      const rect = cv!.getBoundingClientRect()
      const x = (ev.clientX - rect.left) * dpr, y = (ev.clientY - rect.top) * dpr
      let best = -1, bd = 18 * dpr
      layout.forEach((n, i) => { const d = Math.hypot(n.x - x, n.y - y); if (d < bd) { bd = d; best = i } })
      return best
    }

    const onMove = (e: MouseEvent) => {
      hover = pick(e)
      cv!.style.cursor = hover >= 0 ? 'pointer' : 'default'
      setHoverName(hover >= 0 ? t(`app.${layout[hover].app.id}.name`, layout[hover].app.name) : null)
      if (reduceMotion) frame()
    }
    const onLeave = () => { hover = -1; setHoverName(null); if (reduceMotion) frame() }
    const onClick = (e: MouseEvent) => {
      const i = pick(e)
      if (i >= 0) { const a = layout[i].app; openApp(a.id, a.name, a.icon, a.color) }
    }
    const onResize = () => { size(); if (reduceMotion) frame() }

    cv.addEventListener('mousemove', onMove)
    cv.addEventListener('mouseleave', onLeave)
    cv.addEventListener('click', onClick)
    addEventListener('resize', onResize)

    // React to the Core graph: keep the live count, and repaint when motion is off.
    const updateCount = () => setNodeCount(Object.keys(useGraph.getState().nodes).length)
    updateCount()
    const unsubGraph = useGraph.subscribe(() => { updateCount(); if (reduceMotion) frame() })

    size()
    if (reduceMotion) frame(); else raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      unsubGraph()
      cv.removeEventListener('mousemove', onMove)
      cv.removeEventListener('mouseleave', onLeave)
      cv.removeEventListener('click', onClick)
      removeEventListener('resize', onResize)
    }
  }, [openApp, t])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 320, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 14, left: 16, zIndex: 2, pointerEvents: 'none' }}>
        <div className="t-label" style={{ color: 'var(--text3)' }}>ECOSYSTEM · MESH</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text)' }}>
          {t('network.title', 'The Network')}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text2)', marginTop: 2 }}>
          {hoverName ?? `${t('network.hint', `CORE · ${apps.length} instruments`)} · ${nodeCount} nodes`}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}
