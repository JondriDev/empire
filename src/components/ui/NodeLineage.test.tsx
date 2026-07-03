import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NodeLineage } from './NodeLineage'
import { useGraph } from '../../lib/core/graph'
import { useWindowStore } from '../../lib/windowStore'
import { useFocus } from '../../lib/core/focus'
import type { CoreNode } from '../../lib/core/graph'

const node = (over: Partial<CoreNode> & Pick<CoreNode, 'id'>): CoreNode => ({
  type: 'task',
  title: over.id,
  data: {},
  links: [],
  meta: { created: 1, updated: 1, app: 'goals' },
  ...over,
})

beforeEach(() => {
  // Fresh graph + shell + gaze before every case.
  useGraph.setState({ nodes: {} })
  useWindowStore.setState({ windows: [], activeWindowId: null })
  useFocus.setState({ focusedId: null })
})

describe('NodeLineage', () => {
  it('renders nothing when the node has no resolvable ancestor', () => {
    useGraph.setState({ nodes: { orphan: node({ id: 'orphan', title: 'Top-level task' }) } })
    const { container } = render(<NodeLineage nodeId="orphan" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the ancestor entity as a clickable hop (real title + owning app)', () => {
    useGraph.setState({
      nodes: {
        parent: node({ id: 'parent', title: 'Chart the anomaly', meta: { created: 1, updated: 1, app: 'goals' } }),
        child: node({ id: 'child', title: 'Do: follow up', data: { from: 'parent' } }),
      },
    })
    render(<NodeLineage nodeId="child" />)
    const hop = screen.getByRole('button', { name: /Chart the anomaly/ })
    expect(hop).toBeTruthy()
    // The ancestry container still exposes the parent id for the QA guard.
    expect(screen.getByRole('note').getAttribute('data-node-lineage')).toBe('parent')
  })

  it('clicking a hop climbs to the source entity — opens its app + sets the gaze', () => {
    useGraph.setState({
      nodes: {
        parent: node({ id: 'parent', title: 'Chart the anomaly', meta: { created: 1, updated: 1, app: 'notes' } }),
        child: node({ id: 'child', title: 'Do: follow up', data: { from: 'parent' }, meta: { created: 1, updated: 1, app: 'goals' } }),
      },
    })
    render(<NodeLineage nodeId="child" />)
    fireEvent.click(screen.getByRole('button', { name: /Chart the anomaly/ }))
    // Navigation = open the ancestor's OWNING app + focus the ancestor node.
    expect(useWindowStore.getState().activeWindowId).toBe('notes')
    expect(useFocus.getState().focusedId).toBe('parent')
  })

  it('keyboard Enter on a hop navigates the same way (mouse-free ancestry climb)', () => {
    useGraph.setState({
      nodes: {
        parent: node({ id: 'parent', title: 'Chart the anomaly', meta: { created: 1, updated: 1, app: 'reader' } }),
        child: node({ id: 'child', title: 'Do: follow up', data: { from: 'parent' } }),
      },
    })
    render(<NodeLineage nodeId="child" />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Chart the anomaly/ }), { key: 'Enter' })
    expect(useWindowStore.getState().activeWindowId).toBe('reader')
    expect(useFocus.getState().focusedId).toBe('parent')
  })
})
