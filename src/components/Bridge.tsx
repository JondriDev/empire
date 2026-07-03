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
import { openAppById, openEntity } from '../lib/windowStore'
import { apps, getAppIcon } from '../lib/registry'
import { useLang } from '../lib/i18n'
import type { CoreNode } from '../lib/core/graph'

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

  const [ask, setAsk] = useState('')

  // Hand the question to Cakra over the same clipboard rail every app uses.
  // No `from` field: the home shell is not a registry app, and provenance
  // stays honest (no invented app→app edge).
  const submitAsk = (e: React.FormEvent) => {
    e.preventDefault()
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

      <form className="bridge-ask" onSubmit={submitAsk}>
        <span className="bridge-ask-glyph" aria-hidden="true">
          <CakraIcon className="w-5 h-5" />
        </span>
        <input
          className="bridge-ask-input"
          type="text"
          value={ask}
          onChange={e => setAsk(e.target.value)}
          placeholder={t('home.ask', 'Ask Cakra anything…')}
          aria-label={t('home.ask.label', 'Ask Cakra')}
        />
        {ask.trim() && (
          <button type="submit" className="bridge-ask-go" aria-label={t('home.ask.label', 'Ask Cakra')}>
            <CornerDownLeft className="w-4 h-4" />
          </button>
        )}
      </form>

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

      {/* ── Jump back in: the newest touched entities, exact-landing ── */}
      {snap.recent.length > 0 && (
        <div className="bridge-continue">
          <div className="bridge-continue-label">{t('home.continue', 'Jump back in')}</div>
          <div className="bridge-continue-rows">
            {snap.recent.map(n => {
              const owner = ownerOf(n)
              const Icon = getAppIcon(owner.icon)
              return (
                <button
                  key={n.id}
                  className="bridge-continue-row"
                  data-bridge-recent={n.id}
                  style={{ ['--app-color' as string]: owner.color }}
                  onClick={() => openEntity(owner.id, n.id)}
                  title={n.title}
                >
                  <span className="bridge-continue-chip" aria-hidden="true">
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="bridge-continue-title">
                    {n.type === 'task' ? n.title.replace(/^Do:\s*/, '') : n.title}
                  </span>
                  <span className="bridge-continue-meta">
                    {n.type} · {agoLabel(n.meta.updated, minute)}
                  </span>
                </button>
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
    <button
      className="bridge-widget"
      data-widget={props.dataId}
      style={{ ['--app-color' as string]: app.color }}
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
    </button>
  )
}
