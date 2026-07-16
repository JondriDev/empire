import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Goals from './Goals'
import { useGraph } from '../../lib/core/graph'

/**
 * Graph-mirror hydration invariant (regression for the empty-first-render prune).
 *
 * Goals loaded its saved goals in a mount effect (`useState([])` + a later
 * `setGoals`), so on the FIRST commit the `[goals]` mirror effect ran with `[]`.
 * `mirrorCollection` → `reconcile` treats an empty batch as "delete every node of
 * this type", so it PRUNED the app's own persisted `goal` nodes — scrubbing their
 * cross-app edges + lineage — then re-added them with fresh ids once the load
 * landed. Every open of Goals silently churned node ids and destroyed goal→task
 * links. The fix hydrates `goals` synchronously (lazy `useState` initializer) so
 * the first mirror already sees the real data and reconcile is a no-op.
 *
 * This locks the invariant: mounting the owning app must NOT delete/recreate its
 * already-correct persisted nodes.
 */
vi.mock('../../components/ui/NodeActions', () => ({ NodeActions: () => null }))

describe('Goals — mount does not prune its own persisted graph nodes', () => {
  beforeEach(() => {
    useGraph.setState({ nodes: {} })
    vi.clearAllMocks()
  })

  it('keeps a persisted goal node id stable and its outbound edge intact across a mount', () => {
    // Seed the graph as a prior session left it: a `goal` node owned by goals
    // (sourceId = store id) with an outbound edge to a task it spawned.
    const g = useGraph.getState()
    const goal = g.addNode({
      type: 'goal', app: 'goals', title: 'Ship v1',
      data: { sourceId: 'g1', description: '', deadline: '', progress: 0, completed: false },
    })
    const task = g.addNode({ type: 'task', app: 'goals', title: 'Do: Ship v1', data: { done: false, from: goal.id } })
    g.link(goal.id, task.id)
    const goalId = goal.id

    // The persisted store holds that same goal.
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((k: string) =>
      k === 'empire-goals'
        ? JSON.stringify([{ id: 'g1', title: 'Ship v1', description: '', deadline: '', createdAt: '', completed: false, progress: 0 }])
        : null,
    )

    render(<MemoryRouter><Goals /></MemoryRouter>)

    // Same node (id stable) and its edge to the task survives. Before the fix the
    // empty first-render mirror deleted the goal and re-added it with a churned id.
    const goalNode = useGraph.getState().nodes[goalId]
    expect(goalNode, 'goal node was pruned / id churned on mount').toBeDefined()
    expect(goalNode!.links).toContain(task.id)
  })
})
