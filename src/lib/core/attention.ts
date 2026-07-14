/**
 * The Attention engine — the pure spine behind the Bridge's cockpit feed.
 *
 * The organism is fully legible (Network · Search · Inbox · Timeline) yet
 * passive: it mirrors, remembers and displays, but never says *what needs you
 * now*. This module distils one graph snapshot into a single ranked, reasoned
 * stream — the overdue task, today's event, the stalled goal, the book you left
 * mid-chapter, the thing another app just handed you — each scored by urgency so
 * the home can surface the few that matter and let you resolve them in one tap.
 *
 * Kept free of React and the store (takes `CoreNode[]` + a `now` timestamp,
 * returns values) so every reading is unit-tested without a browser — the same
 * `bridge.ts` / `tasks.ts` / `search.ts` discipline. S2 feeds it the live
 * `useGraph` nodes and renders; S1 (this file) is measure-only.
 */

import type { CoreNode } from './graph'
import { isTaskDone } from './tasks'
import { dayStamp, isContentNode } from './bridge'

export type AttentionKind =
  | 'task-overdue'
  | 'event-today'
  | 'task-open'
  | 'goal-stalled'
  | 'reading'
  | 'handoff'

export interface AttentionItem {
  /** The owning node's id — one item per node (see de-dupe below). */
  id: string
  node: CoreNode
  kind: AttentionKind
  /** Urgency 0..100; the feed sorts by this, then by `meta.updated` desc. */
  score: number
  /** i18n key (one per `AttentionKind`) the Bridge maps to an EN/ID reason. */
  reasonKey: string
  /** Owning app id (`meta.app`) — drives the row accent + open target. */
  app: string
}

const DAY_MS = 86_400_000
/** A goal counts as stalled only once it has sat untouched this long. */
const STALE_GOAL_MS = 14 * DAY_MS
/** Below this percent, an aged goal is "stalled" not merely "in progress". */
const GOAL_STALLED_PROGRESS = 34
/** An inbound handoff is "fresh" (worth a nudge) for this window after landing. */
const HANDOFF_FRESH_MS = 60 * 60 * 1000

/** Local midnight (ms) for the day containing `now`. */
function startOfDayMs(_now: number): number {
  const d = new Date(_now)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * A task's due date, tolerant of shape: a `YYYY-MM-DD` string or an ms number.
 * Returns the local day stamp + the midnight ms, or null when there's no due.
 */
function parseDue(_data: Record<string, unknown>): { day: string; ms: number } | null {
  const due = _data.due
  if (typeof due === 'number' && Number.isFinite(due)) {
    return { day: dayStamp(due), ms: due }
  }
  if (typeof due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(due)) {
    const ms = new Date(`${due}T00:00:00`).getTime()
    return Number.isNaN(ms) ? null : { day: due, ms }
  }
  return null
}

/** What a scorer yields for one node before it's wrapped into an AttentionItem. */
interface Candidate {
  kind: AttentionKind
  score: number
  reasonKey: string
}

/** Open tasks: overdue (aged-weighted) ranks above a plain open task. */
function scoreTask(_n: CoreNode, _now: number): Candidate | null {
  if (_n.type !== 'task' || isTaskDone(_n)) return null
  const due = parseDue(_n.data)
  const today = dayStamp(_now)
  if (due && due.day < today) {
    const daysLate = Math.floor((startOfDayMs(_now) - due.ms) / DAY_MS)
    const score = Math.min(100, 85 + Math.min(Math.max(daysLate, 0), 7) * 2)
    return { kind: 'task-overdue', score, reasonKey: 'attention.task-overdue' }
  }
  // Due today edges out a truly open-ended task, but stays below a today event.
  const score = due && due.day === today ? 55 : 50
  return { kind: 'task-open', score, reasonKey: 'attention.task-open' }
}

/** Calendar events landing on today. */
function scoreEvent(_n: CoreNode, _now: number): Candidate | null {
  if (_n.type !== 'event' || _n.data.date !== dayStamp(_now)) return null
  return { kind: 'event-today', score: 75, reasonKey: 'attention.event-today' }
}

/** Goals that are both low-progress AND untouched for a while. */
function scoreGoal(_n: CoreNode, _now: number): Candidate | null {
  if (_n.type !== 'goal' || _n.data.completed === true) return null
  const progress = typeof _n.data.progress === 'number' ? _n.data.progress : 0
  const aged = _now - _n.meta.updated >= STALE_GOAL_MS
  if (progress < GOAL_STALLED_PROGRESS && aged) {
    return { kind: 'goal-stalled', score: 60, reasonKey: 'attention.goal-stalled' }
  }
  return null
}

/** Books started but not finished — where you left off (progress is a 0..1 fraction). */
function scoreReading(_n: CoreNode, _now: number): Candidate | null {
  if (_n.type !== 'book') return null
  const progress = typeof _n.data.progress === 'number' ? _n.data.progress : 0
  if (progress > 0 && progress < 1) {
    return { kind: 'reading', score: 35, reasonKey: 'attention.reading' }
  }
  return null
}

/** A content node another app just handed over (`data.from`), still fresh. */
function scoreHandoff(_n: CoreNode, _now: number): Candidate | null {
  if (!isContentNode(_n)) return null
  const from = _n.data.from
  if (typeof from !== 'string' || !from) return null
  if (_now - _n.meta.updated > HANDOFF_FRESH_MS) return null
  return { kind: 'handoff', score: 70, reasonKey: 'attention.handoff' }
}

const SCORERS = [scoreTask, scoreEvent, scoreGoal, scoreReading, scoreHandoff]

/**
 * Rank a graph snapshot into the Attention feed: score every candidate 0..100
 * by urgency, keep the single highest-scoring reason per node (a node that
 * qualifies as both a fresh handoff and an open task surfaces once), sort by
 * score desc then `meta.updated` desc, and cap to `limit`.
 */
export function computeAttention(_nodes: CoreNode[], _now: number, _limit = 8): AttentionItem[] {
  const best = new Map<string, AttentionItem>()
  for (const n of _nodes) {
    for (const scorer of SCORERS) {
      const c = scorer(n, _now)
      if (!c) continue
      const prev = best.get(n.id)
      if (!prev || c.score > prev.score) {
        best.set(n.id, { id: n.id, node: n, kind: c.kind, score: c.score, reasonKey: c.reasonKey, app: n.meta.app })
      }
    }
  }
  return [...best.values()]
    .sort((a, b) => b.score - a.score || b.node.meta.updated - a.node.meta.updated)
    .slice(0, _limit)
}

/** A one-glance summary of the Attention feed — the spine behind the shell badge. */
export interface AttentionSummary {
  /** How many items currently need you (capped by `limit`). */
  count: number
  /** The single most-urgent item, or null when nothing needs you. */
  top: AttentionItem | null
  /** True when the top item is an overdue task — the shell tints the badge red. */
  urgent: boolean
}

/**
 * Distil the ranked feed to what a persistent surface (the HomeBar Home button)
 * needs: how many things need you and whether the most-urgent is overdue. Lets
 * the shell nudge you from *inside* any app — the cockpit reaches beyond the
 * home — without re-implementing the ranking. Pure, so it unit-tests browserless.
 */
export function attentionSummary(_nodes: CoreNode[], _now: number, _limit = 8): AttentionSummary {
  const items = computeAttention(_nodes, _now, _limit)
  const top = items[0] ?? null
  return { count: items.length, top, urgent: top?.kind === 'task-overdue' }
}
