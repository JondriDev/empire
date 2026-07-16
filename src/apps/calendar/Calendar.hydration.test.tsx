import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Calendar from './Calendar'
import { useGraph } from '../../lib/core/graph'

/**
 * Graph-mirror hydration invariant (see Goals.test.tsx for the class writeup).
 * Calendar loaded its events in a mount effect, so the first `[events]` mirror
 * ran with `[]` and pruned every persisted `event` node before the load landed.
 * The lazy `useState` initializer hydrates synchronously so the first mirror is
 * a no-op. Locks: opening Calendar must not churn/delete its own event nodes.
 *
 * The seeded event is a LEGACY shape (no `tags`/`color` — the store's persisted
 * `CalendarEvent` predates those fields), so this ALSO locks migrate-in-place
 * tolerance: rendering it must not crash on `e.tags.length` (the initializer
 * defaults `tags: []` / `color: 'bg-signal'`).
 */
vi.mock('../../components/ui/NodeActions', () => ({ NodeActions: () => null }))

describe('Calendar — mount does not prune its own persisted graph nodes', () => {
  beforeEach(() => {
    useGraph.setState({ nodes: {} })
    vi.clearAllMocks()
  })

  it('keeps a persisted event node id stable and its edge intact across a mount', () => {
    const g = useGraph.getState()
    const ev = g.addNode({ type: 'event', app: 'calendar', title: 'Standup', data: { sourceId: 'e1', date: '2026-07-16', time: '09:00' } })
    const task = g.addNode({ type: 'task', app: 'calendar', title: 'Do: Standup', data: { done: false, from: ev.id } })
    g.link(ev.id, task.id)

    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((k: string) =>
      k === 'empire-calendar-events'
        ? JSON.stringify([{ id: 'e1', title: 'Standup', date: '2026-07-16', time: '09:00', description: '' }])
        : null,
    )

    render(<MemoryRouter><Calendar /></MemoryRouter>)

    const node = useGraph.getState().nodes[ev.id]
    expect(node, 'event node was pruned / id churned on mount').toBeDefined()
    expect(node!.links).toContain(task.id)
  })
})
