/**
 * The Bridge — the living home screen.
 *
 * The launcher used to be a mute grid: 23 icons floating in the void while the
 * organism underneath mirrored every note, task, event, goal and book into one
 * Core graph. The Bridge turns the home into the organism's face: a greeting,
 * a direct line to Cakra, four live telemetry widgets (each a portal into its
 * owning app) and a "jump back in" strip that lands on the exact entity via
 * the same focus rail Search uses. Everything renders from ONE reactive
 * `useGraph` read through the pure selectors in lib/core/bridge.ts — no
 * private stores, no fetches, fully offline.
 */
import { useEffect, useMemo, useState } from 'react'
import { CornerDownLeft } from 'lucide-react'
import { useGraph } from '../lib/core/graph'
import { bridgeSnapshot, agoLabel } from '../lib/core/bridge'
import { computeAttention } from '../lib/core/attention'
import { openAppById, openEntity } from '../lib/windowStore'
import { apps, getAppIcon } from '../lib/registry'
import { useLang } from '../lib/i18n'
import { Button, Card, IconButton, Input } from './ui'
import { EmptyState } from './ui/Utility'
import type { CoreNode } from '../lib/core/graph'
import type { AttentionItem } from '../lib/core/attention'

const appById = Object.fromEntries(apps.map(a => [a.id, a]))

/** Resolve the owning app's registry entry (icon + accent) for a node. */
function ownerOf(n: CoreNode) {
  return appById[n.meta.app] ?? appById['network']
}

export default function Bridge() {
  const { t, lang } = useLang()
  const nodes = useGraph(s => s.nodes)

  // Minute-granularity clock: enough for "today"/greeting/ages, and keeps the
  // snapshot memo from re-running every second alongside the homebar clock.
  const [minute, setMinute] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setMinute(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const snap = useMemo(() => bridgeSnapshot(Object.values(nodes), minute), [nodes, minute])
  // The proactive layer: one ranked, reasoned feed of what actually needs you
  // now — synthesised from the same live graph the telemetry reads.
  const attention = useMemo(() => computeAttention(Object.values(nodes), minute), [nodes, minute])

  const [ask, setAsk] = useState('')

  // The right-side badge per item: an event's time, a book's %, else the
  // language-neutral age of the last touch.
  const badgeFor = (item: AttentionItem): string => {
    const d = item.node.data
    if (item.kind === 'event-today') {
      return typeof d.time === 'string' && d.time ? d.time : t('home.today', 'Today')
    }
    if (item.kind === 'reading') {
      const p = typeof d.progress === 'number' ? Math.round(d.progress * 100) : 0
      return `${p}%`
    }
    return agoLabel(item.node.meta.updated, minute)
  }

  // Hand the question to Cakra over the same clipboard rail every app uses.
  // No `from` field: the home shell is not a registry app, and provenance
  // stays honest (no invented app→app edge).
  const submitAsk = (e?: React.SyntheticEvent) => {
    e?.preventDefault()
    const text = ask.trim()
    if (!text) return
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({ text }))
    setAsk('')
    openAppById('ai-chat')
  }

  const dateLine = new Date(minute).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const cakra = appById['ai-chat']
  const CakraIcon = getAppIcon(cakra.icon)
  const nextEvent = snap.todayEvents[0]
  const topTask = snap.openTasks[0]

  return (
    <div className="bridge" data-bridge>
      {/* ── Hero: eyebrow + greeting + the Cakra line ── */}
      <header className="bridge-hero">
        <div className="bridge-eyebrow">The Empire · {dateLine}</div>
        <h1 className="bridge-greeting">{t(`home.greet.${snap.greeting}`, 'Welcome')}</h1>
      </header>

      <div className="bridge-ask">
        <span className="bridge-ask-glyph" aria-hidden="true">
          <CakraIcon className="w-5 h-5" />
        </span>
        <Input
          seamless
          className="flex-1"
          value={ask}
          onChange={setAsk}
          placeholder={t('home.ask', 'Ask Cakra anything…')}
          aria-label={t('home.ask.label', 'Ask Cakra')}
          onKeyDown={e => { if (e.key === 'Enter') submitAsk(e) }}
        />
        {ask.trim() && (
          <IconButton
            className="bridge-ask-go"
            onClick={submitAsk}
            aria-label={t('home.ask.label', 'Ask Cakra')}
            style={{ background: 'color-mix(in srgb, var(--c-cakra) 20%, transparent)', color: 'var(--c-cakra)', borderRadius: 'var(--r-full)', border: 'none' }}
            icon={<CornerDownLeft className="w-4 h-4" />}
          />
        )}
      </div>

      {/* ── Telemetry: four live widgets, each a portal into its app ── */}
      <div className="bridge-widgets">
        <Widget
          appId="calendar"
          dataId="today"
          label={t('home.today', 'Today')}
          value={snap.todayEvents.length}
          sub={nextEvent
            ? `${typeof nextEvent.data.time === 'string' && nextEvent.data.time ? nextEvent.data.time + ' · ' : ''}${nextEvent.title}`
            : t('home.today.free', 'no events — clear sky')}
        />
        <Widget
          appId="inbox"
          dataId="tasks"
          label={t('home.tasks', 'Open Tasks')}
          value={snap.openTasks.length}
          sub={topTask ? topTask.title.replace(/^Do:\s*/, '') : t('home.tasks.clear', 'all clear')}
        />
        <Widget
          appId="goals"
          dataId="goals"
          label={t('home.goals', 'Goals')}
          value={snap.goals.active}
          sub={snap.goals.active > 0
            ? `${snap.goals.avgProgress}% ${t('home.goals.avg', 'avg progress')}`
            : t('home.goals.none', 'none set yet')}
          progress={snap.goals.active > 0 ? snap.goals.avgProgress : undefined}
        />
        <Widget
          appId="network"
          dataId="organism"
          label={t('home.organism', 'Organism')}
          value={snap.organism.entities}
          sub={`${snap.organism.links} ${t('home.links', 'links')} · ${snap.organism.apps} ${t('shell.apps', 'apps')}`}
        />
      </div>

      {/* ── Needs you: the ranked, reasoned Attention feed — one tap resolves ── */}
      <div className="bridge-attention">
        <div className="bridge-attention-label">{t('home.attention', 'Needs you')}</div>
        {attention.length > 0 ? (
          <div className="bridge-attention-rows">
            {attention.map(item => {
              const owner = ownerOf(item.node)
              const Icon = getAppIcon(owner.icon)
              const title = item.node.type === 'task'
                ? item.node.title.replace(/^Do:\s*/, '')
                : item.node.title
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  fullWidth
                  className="bridge-attention-row"
                  data-attention={item.id}
                  style={{ ['--app-color' as string]: owner.color, padding: '9px 12px', borderRadius: 'var(--r-md)', border: '1px solid transparent', justifyContent: 'space-between', gap: '10px' }}
                  onClick={() => openEntity(owner.id, item.node.id)}
                  title={item.node.title}
                  iconRight={<span className="bridge-attention-badge">{badgeFor(item)}</span>}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <span className="bridge-attention-chip" aria-hidden="true">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="bridge-attention-text">
                      <span className="bridge-attention-title">{title}</span>
                      <span className="bridge-attention-reason">{t(item.reasonKey, item.kind)}</span>
                    </span>
                  </span>
                </Button>
              )
            })}
          </div>
        ) : (
          <EmptyState size="sm" title={t('home.attention.clear', 'All clear — nothing needs you')} />
        )}
      </div>

      {/* ── Jump back in: the newest touched entities, exact-landing ── */}
      {snap.recent.length > 0 && (
        <div className="bridge-continue">
          <div className="bridge-continue-label">{t('home.continue', 'Jump back in')}</div>
          <div className="bridge-continue-rows">
            {snap.recent.map(n => {
              const owner = ownerOf(n)
              const Icon = getAppIcon(owner.icon)
              return (
                <Button
                  key={n.id}
                  variant="ghost"
                  fullWidth
                  className="bridge-continue-row"
                  data-bridge-recent={n.id}
                  style={{ ['--app-color' as string]: owner.color, padding: '8px 12px', borderRadius: 'var(--r-md)', border: '1px solid transparent', justifyContent: 'space-between', gap: '10px' }}
                  onClick={() => openEntity(owner.id, n.id)}
                  title={n.title}
                  iconRight={
                    <span className="bridge-continue-meta">
                      {n.type} · {agoLabel(n.meta.updated, minute)}
                    </span>
                  }
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <span className="bridge-continue-chip" aria-hidden="true">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="bridge-continue-title">
                      {n.type === 'task' ? n.title.replace(/^Do:\s*/, '') : n.title}
                    </span>
                  </span>
                </Button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/** One glass telemetry tile — eyebrow, mono value, one live sub-line. */
function Widget(props: {
  appId: string
  dataId: string
  label: string
  value: number
  sub: string
  progress?: number
}) {
  const app = appById[props.appId]
  const Icon = getAppIcon(app.icon)
  return (
    <Card
      interactive
      padding="none"
      className="bridge-widget"
      data-widget={props.dataId}
      style={{ padding: '14px 16px 13px', ['--app-color' as string]: app.color }}
      onClick={() => openAppById(props.appId)}
      aria-label={`${props.label}: ${props.value}`}
    >
      <div className="bridge-widget-head">
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{props.label}</span>
      </div>
      <div className="bridge-widget-value">{props.value}</div>
      <div className="bridge-widget-sub">{props.sub}</div>
      {props.progress !== undefined && (
        <div className="bridge-widget-track" aria-hidden="true">
          <div className="bridge-widget-fill" style={{ width: `${Math.min(100, Math.max(0, props.progress))}%` }} />
        </div>
      )}
    </Card>
  )
}
