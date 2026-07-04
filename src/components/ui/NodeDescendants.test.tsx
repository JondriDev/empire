import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NodeDescendants } from './NodeDescendants'
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

describe('NodeDescendants', () => {
  it('renders nothing when the node has spawned nothing', () => {
    useGraph.setState({ nodes: { lonely: node({ id: 'lonely', title: 'A childless entity' }) } })
    const { container } = render(<NodeDescendants nodeId="lonely" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders each descendant as a clickable token (real title + owning app)', () => {
    useGraph.setState({
      nodes: {
        parent: node({ id: 'parent', title: 'Chart the anomaly' }),
        childA: node({ id: 'childA', title: 'Do: follow up', data: { from: 'parent' }, meta: { created: 2, updated: 2, app: 'notes' } }),
        childB: node({ id: 'childB', title: 'Note: field log', data: { from: 'parent' }, meta: { created: 3, updated: 3, app: 'reader' } }),
      },
    })
    render(<NodeDescendants nodeId="parent" />)
    // Both spawned entities surface as navigable hops (prefix-stripped titles).
    expect(screen.getByRole('button', { name: /follow up/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /field log/ })).toBeTruthy()
    // The container exposes the parent id for the QA guard.
    expect(screen.getByRole('note').getAttribute('data-node-descendants')).toBe('parent')
  })

  it('clicking a descendant token opens its app + sets the gaze on it', () => {
    useGraph.setState({
      nodes: {
        parent: node({ id: 'parent', title: 'Chart the anomaly', meta: { created: 1, updated: 1, app: 'goals' } }),
        child: node({ id: 'child', title: 'Do: follow up', data: { from: 'parent' }, meta: { created: 2, updated: 2, app: 'notes' } }),
      },
    })
    render(<NodeDescendants nodeId="parent" />)
    fireEvent.click(screen.getByRole('button', { name: /follow up/ }))
    // Navigation = open the child's OWNING app + focus the child node.
    expect(useWindowStore.getState().activeWindowId).toBe('notes')
    expect(useFocus.getState().focusedId).toBe('child')
  })

  it('keyboard Enter on a descendant token navigates the same way (mouse-free)', () => {
    useGraph.setState({
      nodes: {
        parent: node({ id: 'parent', title: 'Chart the anomaly', meta: { created: 1, updated: 1, app: 'goals' } }),
        child: node({ id: 'child', title: 'Do: follow up', data: { from: 'parent' }, meta: { created: 2, updated: 2, app: 'reader' } }),
      },
    })
    render(<NodeDescendants nodeId="parent" />)
    fireEvent.keyDown(screen.getByRole('button', { name: /follow up/ }), { key: 'Enter' })
    expect(useWindowStore.getState().activeWindowId).toBe('reader')
    expect(useFocus.getState().focusedId).toBe('child')
  })
})
