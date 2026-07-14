import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Bridge from './Bridge'
import { useGraph, type CoreNode } from '../lib/core/graph'
import { dayStamp } from '../lib/core/bridge'
import { computeAttention } from '../lib/core/attention'

/**
 * The Bridge · Attention feed (EPIC-17 S2). S1 shipped the pure engine
 * (`computeAttention`); this holds the contract that the home actually RENDERS
 * that feed: rows in score order, one reason string per kind, and the
 * "all clear" empty-state fallback when nothing needs you. The engine's own
 * ranking is unit-pinned in `attention.test.ts` — here we assert the wiring.
 */

const NOW = Date.now()
const DAY = 86_400_000

/** Build a fully-formed CoreNode with controllable timestamps. */
function node(partial: Partial<CoreNode> & Pick<CoreNode, 'id' | 'type' | 'title'>): CoreNode {
  const { meta, data, links, ...rest } = partial
  return {
    data: data ?? {},
    links: links ?? [],
    ...rest,
    meta: { created: NOW, updated: NOW, app: 'network', ...(meta ?? {}) },
  }
}

function seed(nodes: CoreNode[]) {
  useGraph.setState({ nodes: Object.fromEntries(nodes.map(n => [n.id, n])) })
}

describe('Bridge — Attention feed (S2)', () => {
  beforeEach(() => {
    useGraph.setState({ nodes: {} })
  })

  it('renders the ranked feed in computeAttention (score) order with per-kind reasons', () => {
    const today = dayStamp(NOW)
    const yesterday = dayStamp(NOW - DAY)
    seed([
      // score 85+ — overdue task
      node({ id: 'a', type: 'task', title: 'Do: File the report', data: { done: false, due: yesterday }, meta: { created: NOW, updated: NOW, app: 'inbox' } }),
      // score 75 — event today
      node({ id: 'b', type: 'event', title: 'Standup', data: { date: today, time: '09:00' }, meta: { created: NOW, updated: NOW, app: 'calendar' } }),
      // score 70 — fresh inbound handoff (content node w/ data.from, updated ≤1h)
      node({ id: 'c', type: 'note', title: 'Handed clip', data: { from: 'editor' }, meta: { created: NOW, updated: NOW, app: 'notes' } }),
      // score 50 — plain open task
      node({ id: 'd', type: 'task', title: 'Do: Water the plants', data: { done: false }, meta: { created: NOW, updated: NOW, app: 'inbox' } }),
    ])

    const { container } = render(<Bridge />)

    const rows = Array.from(container.querySelectorAll('[data-attention]'))
    expect(rows.map(r => r.getAttribute('data-attention'))).toEqual(['a', 'b', 'c', 'd'])

    const reasons = rows.map(r => r.querySelector('.bridge-attention-reason')?.textContent)
    expect(reasons).toEqual(['Overdue', 'Today', 'Handed to you', 'To do'])

    // Titles render inside the feed (tasks strip the "Do: " prefix).
    const titles = rows.map(r => r.querySelector('.bridge-attention-title')?.textContent)
    expect(titles).toEqual(['File the report', 'Standup', 'Handed clip', 'Water the plants'])
  })

  it('falls back to the "all clear" empty state when nothing needs you', () => {
    // A finished task and a shell mirror never surface in the feed.
    seed([
      node({ id: 'done', type: 'task', title: 'Do: already done', data: { done: true }, meta: { created: NOW, updated: NOW, app: 'inbox' } }),
      node({ id: 'app', type: 'app:network', title: 'Network', meta: { created: NOW, updated: NOW, app: 'network' } }),
    ])

    const { container } = render(<Bridge />)

    expect(container.querySelectorAll('[data-attention]').length).toBe(0)
    expect(screen.getByText('All clear — nothing needs you')).toBeTruthy()
  })
})

describe('Bridge — inline quick-resolve (S3)', () => {
  beforeEach(() => {
    useGraph.setState({ nodes: {} })
  })

  it('a task row exposes an accessible done control that resolves the task out of the feed', () => {
    const yesterday = dayStamp(NOW - DAY)
    seed([
      node({ id: 'a', type: 'task', title: 'Do: File the report', data: { done: false, due: yesterday }, meta: { created: NOW, updated: NOW, app: 'inbox' } }),
    ])

    const { container } = render(<Bridge />)

    // The control carries an accessible name (IconButton forces aria-label).
    const doneBtn = screen.getByLabelText('Mark done')
    expect(doneBtn).toBeTruthy()
    // …and it is a SIBLING of the open row, not nested inside its <button>.
    expect(container.querySelector('[data-attention="a"]')!.contains(doneBtn)).toBe(false)

    fireEvent.click(doneBtn)

    // The graph node flips done…
    expect(useGraph.getState().nodes['a'].data.done).toBe(true)
    // …the pure engine no longer surfaces it…
    expect(computeAttention(Object.values(useGraph.getState().nodes), NOW)).toHaveLength(0)
    // …and the live feed drops the row (falls back to the empty state).
    expect(container.querySelectorAll('[data-attention]').length).toBe(0)
    expect(screen.getByText('All clear — nothing needs you')).toBeTruthy()
  })

  it('a fresh handoff row exposes a dismiss control that clears data.from and drops it', () => {
    seed([
      node({ id: 'c', type: 'draft', title: 'Handed clip', data: { from: 'editor' }, meta: { created: NOW, updated: NOW, app: 'notes' } }),
    ])

    const { container } = render(<Bridge />)

    const dismissBtn = screen.getByLabelText('Dismiss')
    fireEvent.click(dismissBtn)

    expect(useGraph.getState().nodes['c'].data.from).toBeUndefined()
    expect(container.querySelectorAll('[data-attention]').length).toBe(0)
  })
})
