/**
 * Network — the ecosystem as one literal node-graph.
 *
 * Ported from the-empire (XENO) `backdrop.js → startNetwork`, rebuilt as a
 * self-contained React canvas. A central CORE identity is wired to every app
 * in the registry, with packets travelling the links. Hovering reveals a
 * label; clicking a node opens that app.
 */
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { X, Zap } from 'lucide-react'
import { apps, getAppIcon } from '../../lib/registry'
import { useWindowStore } from '../../lib/windowStore'
import { useLang } from '../../lib/i18n'
import { onAny, type EmpireEvent } from '../../lib/eventBus'
import { useGraph } from '../../lib/core/graph'
import { useFocus } from '../../lib/core/focus'
import type { CoreNode } from '../../lib/core/graph'
import { flowForEvent } from '../../lib/core/flow'
import { appAdjacency, entitiesByApp } from './adjacency'
import { TYPE_RGB, typeRgb, rgbCss } from './nodeColors'

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
    case 'HANDOFF': return e.toId // the receiving instrument lights as the target
    case 'HERMES_STATUS_REFRESHED':
    case 'HERMES_APP_LAUNCHED':
    case 'HERMES_TOOL_EXECUTED':
    case 'HERMES_SKILL_LOADED':
    case 'HERMES_MCP_CONNECTED': return 'hermes-cc'
    default: return null
  }
}

// A terse, instrument-style verb for each signal in the live ticker.
function labelForEvent(e: EmpireEvent): string {
  switch (e.type) {
    case 'NOTE_CREATED': return 'note saved'
    case 'NOTE_UPDATED': return 'note edited'
    case 'NOTE_DELETED': return 'note removed'
    case 'CALCULATION_RESULT': return 'calculated'
    case 'EVENT_CREATED': return 'event added'
    case 'EVENT_UPDATED': return 'event edited'
    case 'EVENT_DELETED': return 'event removed'
    case 'MESSAGE_SENT': return 'message sent'
    case 'CODE_RUN': return 'code run'
    case 'LEARNING_LOGGED': return 'learning logged'
    case 'LEARNING_CHALLENGE': return 'challenge'
    case 'TOKEN_COUNTED': return 'tokens counted'
    case 'PROMPT_GENERATED': return 'prompt built'
    case 'FILE_OPENED': return 'file opened'
    case 'AI_QUERY': return 'query'
    case 'AI_RESPONSE': return 'response'
    case 'APP_OPENED': return 'opened'
    case 'APP_CLOSED': return 'closed'
    case 'DATA_TABLE_UPDATED': return 'table updated'
    case 'WEATHER_UPDATED': return 'weather synced'
    case 'HERMES_STATUS_REFRESHED': return 'status refreshed'
    case 'HERMES_APP_LAUNCHED': return 'app launched'
    case 'HERMES_TOOL_EXECUTED': return 'tool run'
    case 'HERMES_SKILL_LOADED': return 'skill loaded'
    case 'HERMES_MCP_CONNECTED': return 'mcp connected'
    case 'HANDOFF': return e.label || 'handoff'
    default: return 'signal'
  }
}

// `flowForEvent` (the honest app→app arc predicate) lives in lib/core/flow.ts so
// the mesh, tests, and future observers share ONE definition.

// Compact relative age for the ticker, e.g. "now", "12s", "3m", "1h".
function ago(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 2) return 'now'
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h`
}

// One row in the live signal ticker. `to`/`toRgb` are set only for an app→app
// handoff, rendered as `source → target`.
type Signal = { key: number; name: string; rgb: string; to?: string; label: string; at: number }
const MAX_SIGNALS = 6

// Node colour by *type* lives in ./nodeColors so the canvas, legend and
// inspector share ONE source and can never drift.

export default function Network() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const openApp = useWindowStore(s => s.openApp)
  const { t } = useLang()
  const [hoverName, setHoverName] = useState<string | null>(null)
  const [lastActive, setLastActive] = useState<string | null>(null)
  const [signals, setSignals] = useState<Signal[]>([])
  const sigKey = useRef(0)
  // Re-render once a second (only while signals exist) to age the ticker.
  const [, tickClock] = useReducer((x: number) => x + 1, 0)
  const reduceMotion = typeof matchMedia !== 'undefined'
    && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [nodeCount, setNodeCount] = useState(0)
  // The inspector's focused app (set by a single click on a node). The render
  // loop still reads the graph imperatively for the canvas; this reactive
  // subscription only feeds the inspector/legend panels so they stay live.
  const [selected, setSelected] = useState<typeof apps[number] | null>(null)
  const graphNodes = useGraph(s => s.nodes)
  const allNodes = useMemo(() => Object.values(graphNodes), [graphNodes])
  const adjacency = useMemo(() => appAdjacency(allNodes), [allNodes])
  const entities = useMemo(() => entitiesByApp(allNodes), [allNodes])

  useEffect(() => {
    if (signals.length === 0) return
    const id = setInterval(tickClock, 1000)
    return () => clearInterval(id)
  }, [signals.length])

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
    // Transient app→app synapse arcs: a real handoff (e.g. a calc result saved
    // into Notes) draws a curved link directly between the two instruments,
    // decaying to rest. Capped so a burst of handoffs can't pile up.
    type Arc = { from: number; to: number; life: number; rgb: string }
    const arcs: Arc[] = []
    const MAX_ARCS = 5
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
      // app→app synapse arcs — a real handoff lights a curved link between the
      // two instruments, bowed toward CORE so it reads as routing through the
      // organism. A packet sweeps source→target as the arc settles (life 1→0).
      for (let k = arcs.length - 1; k >= 0; k--) {
        const arc = arcs[k]
        arc.life -= 0.011
        const a = layout[arc.from], b = layout[arc.to]
        if (arc.life <= 0 || !a || !b) { arcs.splice(k, 1); continue }
        const lf = arc.life
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
        const cx = mx + (core.x - mx) * 0.5, cy = my + (core.y - my) * 0.5
        ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.quadraticCurveTo(cx, cy, b.x, b.y)
        ctx!.strokeStyle = `rgba(${arc.rgb},${0.12 + 0.5 * lf})`
        ctx!.lineWidth = dpr * (1 + 1.6 * lf)
        ctx!.shadowColor = `rgba(${arc.rgb},0.8)`; ctx!.shadowBlur = 10 * dpr * lf
        ctx!.stroke(); ctx!.shadowBlur = 0
        const p = 1 - lf
        const px = (1 - p) * (1 - p) * a.x + 2 * (1 - p) * p * cx + p * p * b.x
        const py = (1 - p) * (1 - p) * a.y + 2 * (1 - p) * p * cy + p * p * b.y
        ctx!.beginPath(); ctx!.arc(px, py, (2.4 + 2.2 * lf) * dpr, 0, 7)
        ctx!.fillStyle = `rgba(${arc.rgb},${0.6 + 0.4 * lf})`
        ctx!.shadowColor = `rgba(${arc.rgb},0.9)`; ctx!.shadowBlur = 12 * dpr * lf
        ctx!.fill(); ctx!.shadowBlur = 0
      }
      // app nodes
      layout.forEach((n, i) => {
        const f = flares[i]
        const r = (i === hover ? 8 : 5.5 + f * 5) * dpr
        ctx!.beginPath(); ctx!.arc(n.x, n.y, r, 0, 7)
        ctx!.fillStyle = `rgba(${n.c},${Math.min(1, (i === hover ? 1 : 0.85) + f * 0.15)})`
        ctx!.shadowColor = `rgba(${n.c},0.8)`; ctx!.shadowBlur = ((i === hover ? 22 : 12) + f * 22) * dpr
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
            // node dot coloured by *type* (Deep-Field token); tether keeps the owner accent
            const p = { x: base.x + Math.cos(a) * rr, y: base.y + Math.sin(a) * rr, c: typeRgb(gn.type) }
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
    // A single click SELECTS a node (opens the inspector); empty space clears
    // the selection. The inspector's "⚡ Open" button is what actually launches
    // an app — so the mesh becomes explorable without windows flying open.
    const onClick = (e: MouseEvent) => {
      const i = pick(e)
      setSelected(i >= 0 ? layout[i].app : null)
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

      // A genuine app→app handoff (e.g. a note saved *from* another app) also
      // lights the source node and fires a synapse arc between the two.
      const flow = flowForEvent(e)
      const fromIdx = flow ? idIndex.get(flow.fromId) : undefined
      const isFlow = fromIdx !== undefined && fromIdx !== i
      if (isFlow) {
        flares[fromIdx] = 1
        arcs.push({ from: fromIdx, to: i, life: 1, rgb: rgbOf(apps[fromIdx].color) })
        if (arcs.length > MAX_ARCS) arcs.shift()
      }

      const targetName = t(`app.${apps[i].id}.name`, apps[i].name)
      const name = isFlow ? t(`app.${apps[fromIdx].id}.name`, apps[fromIdx].name) : targetName
      setLastActive(isFlow ? `${name} → ${targetName}` : targetName)
      clearTimeout(activeTimer)
      activeTimer = setTimeout(() => setLastActive(null), 2600)
      // Prepend to the live ticker, newest first, capped at MAX_SIGNALS.
      setSignals(prev => [
        {
          key: sigKey.current++,
          name,
          rgb: isFlow ? rgbOf(apps[fromIdx].color) : rgbOf(apps[i].color),
          to: isFlow ? targetName : undefined,
          label: labelForEvent(e),
          at: Date.now(),
        },
        ...prev,
      ].slice(0, MAX_SIGNALS))
      if (reduceMotion) frame()
    })

    // React to the Core graph: keep the live count, and repaint when motion is off.
    const updateCount = () => setNodeCount(Object.keys(useGraph.getState().nodes).length)
    updateCount()
    const unsubGraph = useGraph.subscribe(() => { updateCount(); if (reduceMotion) frame() })

    size()
    if (reduceMotion) frame(); else raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(activeTimer)
      unsubBus()
      unsubGraph()
      cv.removeEventListener('mousemove', onMove)
      cv.removeEventListener('mouseleave', onLeave)
      cv.removeEventListener('click', onClick)
      removeEventListener('resize', onResize)
    }
  }, [openApp, t])

  // ── Inspector data for the focused app (cheap; only when a node is selected) ──
  const selEntities = selected ? entities[selected.id] ?? [] : []
  const selTypeCounts = selEntities.reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] ?? 0) + 1
    return acc
  }, {})
  const selEdges = selected ? adjacency[selected.id] : undefined
  // Selecting an app points global focus at its newest node, so ⌘K opens the
  // command palette already aimed at something real in that app.
  useEffect(() => {
    if (selEntities[0]) useFocus.getState().setFocus(selEntities[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])
  const appName = (id: string) => {
    const a = apps.find(x => x.id === id)
    return a ? t(`app.${a.id}.name`, a.name) : id
  }
  const openById = (id: string) => {
    const a = apps.find(x => x.id === id)
    if (a) openApp(a.id, a.name, a.icon, a.color)
  }
  // Legend rows: the named entity types (in canvas order) + an "other" bucket.
  const legendTypes = Object.keys(TYPE_RGB)

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
              : `${t('network.hint', `CORE · ${apps.length} instruments`)} · ${nodeCount} nodes`)}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Live signal ticker — a glanceable readout of recent nerve traffic. */}
      <div
        className="gp"
        style={{
          position: 'absolute', left: 16, bottom: 16, zIndex: 2, pointerEvents: 'none',
          width: 'min(248px, calc(100% - 32px))',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
        }}
      >
        <div className="t-label" style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            style={{
              width: 6, height: 6, borderRadius: 'var(--radius-full)',
              background: signals.length ? 'var(--signal, #34f5d6)' : 'var(--text3)',
              boxShadow: signals.length ? '0 0 8px var(--signal, #34f5d6)' : 'none',
              transition: 'background var(--dur-mid), box-shadow var(--dur-mid)',
            }}
          />
          {t('network.live', 'Live Signal')}
        </div>
        {signals.length === 0 ? (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
            {t('network.awaiting', 'awaiting signal…')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {signals.map((s, idx) => (
              <div
                key={s.key}
                className={!reduceMotion && idx === 0 ? 'animate-fade-in-up' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  fontSize: 'var(--text-xs)',
                  opacity: 1 - idx * 0.11,
                }}
              >
                <span style={{
                  flex: '0 0 auto', width: 7, height: 7, borderRadius: 'var(--radius-full)',
                  background: rgbCss(s.rgb), boxShadow: `0 0 6px ${rgbCss(s.rgb)}`,
                }} />
                <span style={{ color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.name}</span>
                {s.to ? (
                  <>
                    <span style={{ color: 'var(--text3)', flex: '0 0 auto' }}>→</span>
                    <span style={{
                      color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
                    }}>{s.to}</span>
                  </>
                ) : (
                  <span style={{
                    color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                  }}>{s.label}</span>
                )}
                <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', flex: '0 0 auto' }}>{ago(Date.now() - s.at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend — node-type → accent, always visible so the coloured dots and
          arcs are readable. Sourced from TYPE_RGB so it can never drift. */}
      <div
        className="gp"
        style={{
          position: 'absolute', right: 16, bottom: 16, zIndex: 2, pointerEvents: 'none',
          padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}
      >
        <div className="t-label" style={{ color: 'var(--text3)' }}>{t('network.legend', 'Node types')}</div>
        {legendTypes.map(type => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
            <span style={{
              flex: '0 0 auto', width: 8, height: 8, borderRadius: 'var(--radius-full)',
              background: rgbCss(TYPE_RGB[type]), boxShadow: `0 0 6px ${rgbCss(TYPE_RGB[type])}`,
            }} />
            <span style={{ color: 'var(--text2)', fontFamily: 'var(--mono)' }}>{type}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
          <span style={{
            flex: '0 0 auto', width: 8, height: 8, borderRadius: 'var(--radius-full)',
            background: 'var(--text3)',
          }} />
          <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)' }}>other</span>
        </div>
      </div>

      {/* Inspector — a single click on a node opens this; lists the app's real
          graph entities and its true cross-app neighbours. */}
      {selected && (() => {
        const Icon = getAppIcon(selected.icon)
        return (
          <div
            className="gp animate-fade-in-up"
            role="dialog"
            aria-label={`${selected.name} details`}
            style={{
              position: 'absolute', right: 16, top: 14, zIndex: 3,
              width: 'min(280px, calc(100% - 32px))', maxHeight: 'calc(100% - 28px)',
              overflowY: 'auto', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)',
              display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{
                flex: '0 0 auto', width: 30, height: 30, borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: selected.color, background: rgbCss('255,255,255', 0.05),
              }}>
                <Icon className="w-4 h-4" />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {appName(selected.id)}
                </div>
                <div className="t-label" style={{ color: 'var(--text3)' }}>{selected.id}</div>
              </div>
              <button
                aria-label="Close inspector"
                onClick={() => setSelected(null)}
                style={{
                  flex: '0 0 auto', padding: 5, borderRadius: 'var(--radius-md)', background: 'transparent',
                  border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex',
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Entities owned by this app, grouped + counted by type. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="t-label" style={{ color: 'var(--text3)' }}>
                {t('network.entities', 'Entities')} · {selEntities.length}
              </div>
              {selEntities.length === 0 ? (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                  {t('network.noEntities', 'no nodes in the graph yet')}
                </div>
              ) : (
                Object.entries(selTypeCounts).map(([type, count]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                    <span style={{
                      flex: '0 0 auto', width: 7, height: 7, borderRadius: 'var(--radius-full)',
                      background: rgbCss(typeRgb(type)), boxShadow: `0 0 6px ${rgbCss(typeRgb(type))}`,
                    }} />
                    <span style={{ color: 'var(--text2)', fontFamily: 'var(--mono)', flex: 1 }}>{type}</span>
                    <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{count}</span>
                  </div>
                ))
              )}
            </div>

            {/* True cross-app neighbours (from real graph edges). */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="t-label" style={{ color: 'var(--text3)' }}>{t('network.neighbors', 'Connected apps')}</div>
              {(!selEdges || (selEdges.out.length === 0 && selEdges.in.length === 0)) ? (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                  {t('network.noNeighbors', 'no cross-app links yet')}
                </div>
              ) : (
                [...new Set([...(selEdges?.out ?? []), ...(selEdges?.in ?? [])])].sort().map(id => {
                  const dir = selEdges!.out.includes(id) && selEdges!.in.includes(id) ? '↔'
                    : selEdges!.out.includes(id) ? '→' : '←'
                  return (
                    <button
                      key={id}
                      onClick={() => openById(id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%',
                        padding: '6px 8px', background: 'transparent', border: 'none',
                        borderRadius: 'var(--radius-md)', color: 'var(--text)', textAlign: 'left',
                        fontSize: 'var(--text-xs)', cursor: 'pointer',
                        transition: 'background var(--dur-fast)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = rgbCss('52,245,214', 0.10) }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', flex: '0 0 auto', width: 12 }}>{dir}</span>
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appName(id)}</span>
                    </button>
                  )
                })
              )}
            </div>

            <button
              onClick={() => openById(selected.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
                padding: '8px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                border: `1px solid ${rgbCss('255,255,255', 0.12)}`, background: 'transparent',
                color: rgbCss('52,245,214'), fontSize: 'var(--text-sm)', fontWeight: 600,
                transition: 'background var(--dur-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = rgbCss('52,245,214', 0.10) }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <Zap className="w-3.5 h-3.5" /> {t('network.open', 'Open')} {appName(selected.id)}
            </button>
          </div>
        )
      })()}
    </div>
  )
}
