import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Mail from './Mail'
import { useGraph } from '../../lib/core/graph'

/**
 * Graph-mirror hydration invariant (see Goals.test.tsx). Mail loaded its drafts
 * with `setDrafts(listDrafts())` in a mount effect, so the first `[drafts]`
 * mirror ran with `[]` and pruned every persisted `draft` node. The lazy
 * `useState(() => listDrafts())` initializer hydrates synchronously. Locks:
 * opening Mail must not churn/delete its own draft nodes.
 */
vi.mock('../../components/ui/NodeActions', () => ({ NodeActions: () => null }))

describe('Mail — mount does not prune its own persisted graph nodes', () => {
  beforeEach(() => {
    useGraph.setState({ nodes: {} })
    vi.clearAllMocks()
    // The mount status fetch is irrelevant here; keep it from hitting the network.
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
  })
  afterEach(() => { vi.unstubAllGlobals() })

  it('keeps a persisted draft node id stable and its edge intact across a mount', async () => {
    const g = useGraph.getState()
    const d = g.addNode({ type: 'draft', app: 'mail', title: 'Q3 report', data: { sourceId: 'd1' } })
    const task = g.addNode({ type: 'task', app: 'mail', title: 'Do: Q3 report', data: { done: false, from: d.id } })
    g.link(d.id, task.id)

    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((k: string) =>
      k === 'empire-mail-drafts'
        ? JSON.stringify([{ id: 'd1', to: 'a@b.c', subject: 'Q3 report', body: 'x', updatedAt: 1 }])
        : null,
    )

    render(<MemoryRouter><Mail /></MemoryRouter>)
    // Absorb the mount status-fetch rejection (setErr) so it doesn't warn post-test.
    await act(async () => { await Promise.resolve() })

    const node = useGraph.getState().nodes[d.id]
    expect(node, 'draft node was pruned / id churned on mount').toBeDefined()
    expect(node!.links).toContain(task.id)
  })
})
