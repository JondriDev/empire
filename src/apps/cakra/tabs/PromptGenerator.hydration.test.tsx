import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PromptGenerator from './PromptGenerator'
import { useGraph } from '../../../lib/core/graph'

/**
 * Graph-mirror hydration invariant (see Goals.test.tsx). PromptGenerator loaded
 * its saved prompts in a mount effect, so the first `[saved]` mirror ran with
 * `[]` and pruned every persisted `prompt` node. The lazy `useState` initializer
 * hydrates synchronously. Locks: opening the generator must not churn/delete its
 * own prompt nodes.
 */
vi.mock('../../../components/ui/NodeActions', () => ({ NodeActions: () => null }))

describe('PromptGenerator — mount does not prune its own persisted graph nodes', () => {
  beforeEach(() => {
    useGraph.setState({ nodes: {} })
    vi.clearAllMocks()
  })

  it('keeps a persisted prompt node id stable and its edge intact across a mount', () => {
    const g = useGraph.getState()
    const p = g.addNode({ type: 'prompt', app: 'prompt-generator', title: 'Explain code', data: { sourceId: 'p1' } })
    const task = g.addNode({ type: 'task', app: 'prompt-generator', title: 'Do: Explain code', data: { done: false, from: p.id } })
    g.link(p.id, task.id)

    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((k: string) =>
      k === 'empire-prompt-generator-saved'
        ? JSON.stringify([{ id: 'p1', title: 'Explain code', content: 'Explain: {code}', category: 'coding', createdAt: '2026-07-16' }])
        : null,
    )

    render(<MemoryRouter><PromptGenerator /></MemoryRouter>)

    const node = useGraph.getState().nodes[p.id]
    expect(node, 'prompt node was pruned / id churned on mount').toBeDefined()
    expect(node!.links).toContain(task.id)
  })
})
