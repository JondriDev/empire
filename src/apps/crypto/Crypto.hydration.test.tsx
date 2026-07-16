import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CryptoApp from './CryptoApp'
import { useGraph } from '../../lib/core/graph'

/**
 * Graph-mirror hydration invariant (see Goals.test.tsx). Crypto hydrated its
 * watched addresses in a mount effect, so the first `[addresses]` mirror ran
 * with `walletItems([])` === [] and pruned every persisted `wallet` node. The
 * lazy `useState` initializer hydrates synchronously. Locks: opening Crypto must
 * not churn/delete its own wallet nodes.
 */
vi.mock('../../components/ui/NodeActions', () => ({ NodeActions: () => null }))

describe('Crypto — mount does not prune its own persisted graph nodes', () => {
  beforeEach(() => {
    useGraph.setState({ nodes: {} })
    vi.clearAllMocks()
  })

  it('keeps a persisted wallet node id stable and its edge intact across a mount', () => {
    const g = useGraph.getState()
    const w = g.addNode({ type: 'wallet', app: 'crypto', title: 'BTC', data: { sourceId: 'wallet:btc', coin: 'btc' } })
    const task = g.addNode({ type: 'task', app: 'crypto', title: 'Do: watch BTC', data: { done: false, from: w.id } })
    g.link(w.id, task.id)

    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((k: string) =>
      k === 'crypto-watch-list' ? JSON.stringify({ btc: 'bc1qexampleaddress0000' }) : null,
    )

    render(<MemoryRouter><CryptoApp /></MemoryRouter>)

    const node = useGraph.getState().nodes[w.id]
    expect(node, 'wallet node was pruned / id churned on mount').toBeDefined()
    expect(node!.links).toContain(task.id)
  })
})
