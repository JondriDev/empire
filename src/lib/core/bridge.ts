/**
 * The Bridge — pure selectors behind the living home screen.
 *
 * The organism mirrors every real entity into ONE Core graph (notes, tasks,
 * events, goals, books, photos…), remembers movement (provenance) and is
 * queryable (search) — yet the home screen showed none of it: a mute app grid
 * floating in the void. These selectors distill a graph snapshot into the
 * home's live telemetry: what's happening today, what's still open, how the
 * organism is growing, and where you left off.
 *
 * Kept free of React and the store (takes `CoreNode[]` + a timestamp, returns
 * values) so every reading is unit-tested without a browser — exactly the
 * `tasks.ts` / `search.ts` discipline. The Bridge component just feeds it the
 * live `useGraph` nodes and renders.
 */

import type { CoreNode } from './graph'
import { partitionTasks } from './tasks'

/** Local-time day stamp (YYYY-MM-DD) — matches Calendar's `data.date` format. */
export function dayStamp(_ms: number): string {
  const d = new Date(_ms)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Content nodes are real user entities — shell mirrors (`app:*`) are not. */
export function isContentNode(_n: CoreNode): boolean {
  return !_n.type.startsWith('app:')
}

/** Today's `event` nodes, earliest time first (untimed events sink last). */
export function eventsOn(_nodes: CoreNode[], _day: string): CoreNode[] {
  return _nodes
    .filter(n => n.type === 'event' && n.data.date === _day)
    .sort((a, b) => {
      // Code-point compare ('~' > any digit) — localeCompare's collation
      // would sort the untimed sentinel before "08:00".
      const ta = typeof a.data.time === 'string' && a.data.time ? a.data.time : '~'
      const tb = typeof b.data.time === 'string' && b.data.time ? b.data.time : '~'
      return ta < tb ? -1 : ta > tb ? 1 : 0
    })
}

export interface GoalStats {
  /** Goals still in motion (not completed). */
  active: number
  done: number
  /** Mean numeric `data.progress` of the active goals, rounded (0 when none). */
  avgProgress: number
}

/** Aggregate the `goal` nodes into one readable pulse. */
export function goalStats(_nodes: CoreNode[]): GoalStats {
  const goals = _nodes.filter(n => n.type === 'goal')
  const active = goals.filter(n => n.data.completed !== true)
  const done = goals.length - active.length
  const progresses = active
    .map(n => (typeof n.data.progress === 'number' ? n.data.progress : null))
    .filter((p): p is number => p !== null)
  const avgProgress = progresses.length
    ? Math.round(progresses.reduce((s, p) => s + p, 0) / progresses.length)
    : 0
  return { active: active.length, done, avgProgress }
}

/**
 * Where you left off — the most recently touched content entities, newest
 * first. Done tasks are excluded (they're finished, not resumable).
 */
export function recentEntities(_nodes: CoreNode[], _limit = 5): CoreNode[] {
  return _nodes
    .filter(isContentNode)
    .filter(n => !(n.type === 'task' && n.data.done === true))
    .sort((a, b) => b.meta.updated - a.meta.updated)
    .slice(0, _limit)
}

export interface OrganismStats {
  /** Real user entities in the graph (shell `app:*` mirrors excluded). */
  entities: number
  /** Directed edges leaving any node — the mesh's connective tissue. */
  links: number
  /** Distinct apps that own at least one content entity. */
  apps: number
}

/** One glance at the mesh: how much the organism holds and how wired it is. */
export function organismStats(_nodes: CoreNode[]): OrganismStats {
  const content = _nodes.filter(isContentNode)
  return {
    entities: content.length,
    links: _nodes.reduce((sum, n) => sum + n.links.length, 0),
    apps: new Set(content.map(n => n.meta.app)).size,
  }
}

/**
 * Terse telemetry age — "now", "4m", "3h", "6d" — language-neutral on purpose
 * (mono readout voice, no EN/ID fork needed).
 */
export function agoLabel(_thenMs: number, _nowMs: number): string {
  const s = Math.max(0, Math.floor((_nowMs - _thenMs) / 1000))
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export type GreetingSlot = 'morning' | 'afternoon' | 'evening' | 'night'

/** Time-of-day slot for the greeting (maps to EN/ID strings in i18n). */
export function greetingSlot(_hour: number): GreetingSlot {
  if (_hour >= 5 && _hour < 12) return 'morning'
  if (_hour >= 12 && _hour < 16) return 'afternoon'
  if (_hour >= 16 && _hour < 19) return 'evening'
  return 'night'
}

export interface BridgeSnapshot {
  todayEvents: CoreNode[]
  openTasks: CoreNode[]
  goals: GoalStats
  recent: CoreNode[]
  organism: OrganismStats
  greeting: GreetingSlot
}

/** Everything the home screen shows, from one graph snapshot + one clock read. */
export function bridgeSnapshot(_nodes: CoreNode[], _now: number): BridgeSnapshot {
  return {
    todayEvents: eventsOn(_nodes, dayStamp(_now)),
    openTasks: partitionTasks(_nodes).open,
    goals: goalStats(_nodes),
    recent: recentEntities(_nodes),
    organism: organismStats(_nodes),
    greeting: greetingSlot(new Date(_now).getHours()),
  }
}
