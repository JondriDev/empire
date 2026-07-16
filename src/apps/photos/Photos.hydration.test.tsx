import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Photos from './Photos'
import { useGraph } from '../../lib/core/graph'

/**
 * Graph-mirror hydration invariant (see Goals.test.tsx). Photos rehydrates its
 * library from IndexedDB asynchronously, so `photos` is empty on the first
 * render. The `[photos]` mirror effect was NOT gated (unlike the sibling persist
 * effect), so it pruned every persisted `photo` node on mount and re-added them
 * with churned ids once the async load landed. The fix gates the mirror behind
 * the same `hydratedRef`. Locks: opening Photos must not churn/delete its own
 * photo nodes across the async rehydrate.
 *
 * Only the IDB glue (`loadMediaUrls`) is stubbed so blobs "recover"; the pure
 * transforms (`rehydrateMedia`, `toStorableMeta`) stay real.
 */
vi.mock('../../components/ui/NodeActions', () => ({ NodeActions: () => null }))
vi.mock('../../lib/mediaStore', async (importActual) => {
  const actual = await importActual<typeof import('../../lib/mediaStore')>()
  return {
    ...actual,
    loadMediaUrls: vi.fn(async (ids: string[]) => new Map(ids.map(id => [id, `blob:fake/${id}`]))),
    putMedia: vi.fn(async () => true),
    deleteMedia: vi.fn(async () => {}),
  }
})

describe('Photos — mount does not prune its own persisted graph nodes', () => {
  beforeEach(() => {
    useGraph.setState({ nodes: {} })
    vi.clearAllMocks()
  })

  it('keeps a persisted photo node id stable and its edge intact across the async rehydrate', async () => {
    const g = useGraph.getState()
    const ph = g.addNode({ type: 'photo', app: 'photos', title: 'sunset.jpg', data: { sourceId: 'ph1', size: 1000, tags: [], favorite: false, date: '2026-07-16' } })
    const task = g.addNode({ type: 'task', app: 'photos', title: 'Do: sunset.jpg', data: { done: false, from: ph.id } })
    g.link(ph.id, task.id)
    const phId = ph.id

    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((k: string) =>
      k === 'empire-photos'
        ? JSON.stringify([{ id: 'ph1', name: 'sunset.jpg', size: 1000, date: '2026-07-16', tags: [], favorite: false }])
        : null,
    )

    render(<MemoryRouter><Photos /></MemoryRouter>)

    // After the async rehydrate settles, the node must be the SAME node (id stable)
    // with its edge intact. Before the fix the empty first-render mirror deleted it,
    // so this id would never reappear (a fresh id is minted instead).
    await waitFor(() => {
      expect(useGraph.getState().nodes[phId], 'photo node was pruned / id churned on mount').toBeDefined()
    })
    expect(useGraph.getState().nodes[phId]!.links).toContain(task.id)
  })
})
