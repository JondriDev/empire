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
import { onAny, type EmpireEvent } from '../../lib/eventBus'

// Map a hex accent (the registry `color`) to an "r,g,b" string for canvas fills.
function rgbOf(hex: string): string {
  const h = hex.replace('#', '')
  const n = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h
  const int = parseInt(n, 16)
  return `${(int >> 16) & 255},${(int >> 8) & 255},${int & 255}`
}

// Resolve which app a live event belongs to, so the mesh can light its node.
// Most events map to a fixed instrument; APP_* carry the id directly.
function appIdForEvent(e: EmpireEvent): string | null {
  switch (e.type) {
    case 'APP_OPENED':
    case 'APP_CLOSED': return e.appId
    case 'NOTE_CREATED':
    case 'NOTE_UPDATED':
    case 'NOTE_DELETED': return 'notes'
    case 'CALCULATION_RESULT': return 'calculator'
    case 'EVENT_CREATED':
    case 'EVENT_UPDATED':
    case 'EVENT_DELETED': return 'calendar'
    case 'MESSAGE_SENT': return 'messages'
    case 'CODE_RUN': return 'editor'
    case 'LEARNING_LOGGED':
    case 'LEARNING_CHALLENGE': return 'learning-tracker'
    case 'TOKEN_COUNTED': return 'token-counter'
    case 'PROMPT_GENERATED': return 'prompt-generator'
    case 'FILE_OPENED': return 'files'
    case 'DATA_TABLE_UPDATED': return 'datacenter'
    case 'WEATHER_UPDATED': return 'weather'
    case 'AI_QUERY':
    case 'AI_RESPONSE': return e.app || 'ai-chat'
    case 'HERMES_STATUS_REFRESHED':
    case 'HERMES_APP_LAUNCHED':
    case 'HERMES_TOOL_EXECUTED':
    case 'HERMES_SKILL_LOADED':
    case 'HERMES_MCP_CONNECTED': return 'hermes-cc'
    default: return null
  }
}

export default function Network() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const openApp = useWindowStore(s => s.openApp)
  const { t } = useLang()
  const [hoverName, setHoverName] = useState<string | null>(null)
  const [lastActive, setLastActive] = useState<string | null>(null)

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
    // Live-activity flares: flares[i] is the 0..1 glow of node i, set to 1 when
    // that app emits an event and decaying each frame. idIndex maps app id → i.
    const flares = new Array(apps.length).fill(0)
    const idIndex = new Map(apps.map((a, i) => [a.id, i]))
    let activeTimer: ReturnType<typeof setTimeout> | undefined

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
      // decay live-activity flares toward rest (~1.4s to fade from full)
      for (let i = 0; i < flares.length; i++) {
        if (flares[i] > 0) flares[i] = Math.max(0, flares[i] - 0.012)
      }
      // links from core
      layout.forEach((n, i) => {
        const f = flares[i]
        const pulse = 0.10 + 0.10 * (0.5 + 0.5 * Math.sin(tk + n.ang * 2)) + f * 0.45
        const g = ctx!.createLinearGradient(core.x, core.y, n.x, n.y)
        g.addColorStop(0, `rgba(52,245,214,${pulse + 0.05 + f * 0.4})`)
        g.addColorStop(1, `rgba(${n.c},${pulse})`)
        ctx!.beginPath(); ctx!.moveTo(core.x, core.y); ctx!.lineTo(n.x, n.y)
        ctx!.strokeStyle = g; ctx!.lineWidth = dpr * (1 + f * 1.8); ctx!.stroke()
        // ambient travelling packet
        const tp = (tk * 0.4 + n.ang) % 1
        const px = core.x + (n.x - core.x) * tp, py = core.y + (n.y - core.y) * tp
        ctx!.beginPath(); ctx!.arc(px, py, 1.6 * dpr, 0, 7); ctx!.fillStyle = `rgba(${n.c},0.9)`; ctx!.fill()
        // bright surge packet — fires outward from CORE while this link is active
        if (f > 0.01) {
          const sp = (tk * 1.8 + n.ang) % 1
          const sx = core.x + (n.x - core.x) * sp, sy = core.y + (n.y - core.y) * sp
          ctx!.beginPath(); ctx!.arc(sx, sy, (2.2 + 2.4 * f) * dpr, 0, 7)
          ctx!.fillStyle = `rgba(52,245,214,${0.45 + 0.5 * f})`
          ctx!.shadowColor = 'rgba(52,245,214,0.9)'; ctx!.shadowBlur = 12 * dpr * f
          ctx!.fill(); ctx!.shadowBlur = 0
        }
      })
      // app nodes
      layout.forEach((n, i) => {
        const f = flares[i]
        const r = (i === hover ? 8 : 5.5 + f * 5) * dpr
        ctx!.beginPath(); ctx!.arc(n.x, n.y, r, 0, 7)
        ctx!.fillStyle = `rgba(${n.c},${Math.min(1, (i === hover ? 1 : 0.85) + f * 0.15)})`
        ctx!.shadowColor = `rgba(${n.c},0.8)`; ctx!.shadowBlur = ((i === hover ? 22 : 12) + f * 22) * dpr
        ctx!.fill(); ctx!.shadowBlur = 0
      })
      // CORE — breathes a little harder when the mesh is busy
      const activity = Math.min(1, flares.reduce((a, b) => a + b, 0))
      const cr = (16 + activity * 3) * dpr + Math.sin(tk * 2) * 1.4 * dpr
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

    // The nervous system: every cross-app event lights up its instrument.
    const unsubBus = onAny((e) => {
      const id = appIdForEvent(e)
      if (!id) return
      const i = idIndex.get(id)
      if (i === undefined) return
      flares[i] = 1
      const name = t(`app.${apps[i].id}.name`, apps[i].name)
      setLastActive(name)
      clearTimeout(activeTimer)
      activeTimer = setTimeout(() => setLastActive(null), 2600)
      if (reduceMotion) frame()
    })

    size()
    if (reduceMotion) frame(); else raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(activeTimer)
      unsubBus()
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
        <div style={{ fontSize: 'var(--text-xs)', color: hoverName ? 'var(--text2)' : (lastActive ? 'var(--signal, #34f5d6)' : 'var(--text2)'), marginTop: 2 }}>
          {hoverName
            ?? (lastActive
              ? `▸ ${t('network.signal', 'signal')} · ${lastActive}`
              : t('network.hint', `CORE wired to ${apps.length} instruments`))}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}
