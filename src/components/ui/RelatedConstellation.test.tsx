import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RelatedConstellation } from './RelatedConstellation'
import { useGraph } from '../../lib/core/graph'
import { useWindowStore } from '../../lib/windowStore'
import { useFocus } from '../../lib/core/focus'
import type { CoreNode } from '../../lib/core/graph'

const DAY = 24 * 60 * 60 * 1000

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

describe('RelatedConstellation', () => {
  it('renders nothing when no other entity is related (self-hiding)', () => {
    useGraph.setState({
      nodes: {
        // Distinct title tokens AND a distinct calendar day → zero shared signal.
        target: node({ id: 'target', title: 'alpha beta', meta: { created: 1, updated: 1, app: 'goals' } }),
        stranger: node({ id: 'stranger', title: 'gamma delta', meta: { created: 1 + 40 * DAY, updated: 1, app: 'notes' } }),
      },
    })
    const { container } = render(<RelatedConstellation nodeId="target" />)
    expect(container.firstChild).toBeNull()
  })

  it('surfaces each related entity with its title + a reason chip, and exposes the target id', () => {
    useGraph.setState({
      nodes: {
        // Target shares the significant term "resonance" with two other apps' entities.
        target: node({ id: 'target', title: 'quantum resonance array', meta: { created: 1, updated: 1, app: 'goals' } }),
        a: node({ id: 'a', title: 'resonance field log', meta: { created: 1 + 40 * DAY, updated: 5, app: 'notes' } }),
        b: node({ id: 'b', title: 'resonance chamber', meta: { created: 1 + 80 * DAY, updated: 9, app: 'reader' } }),
        // No shared term, no tag, no link, different day → excluded entirely.
        noise: node({ id: 'noise', title: 'grocery list', meta: { created: 1 + 120 * DAY, updated: 1, app: 'notes' } }),
      },
    })
    render(<RelatedConstellation nodeId="target" />)
    expect(screen.getByRole('button', { name: /resonance field log/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /resonance chamber/ })).toBeTruthy()
    // The unrelated node is absent.
    expect(screen.queryByRole('button', { name: /grocery list/ })).toBeNull()
    // Reason chip text surfaces (shared term is the only signal for these).
    expect(screen.getAllByText('shared term').length).toBe(2)
    // The container exposes the target id for the QA guard.
    expect(screen.getByRole('group').getAttribute('data-related')).toBe('target')
  })

  it('clicking a related row opens its owning app + sets the gaze on it', () => {
    useGraph.setState({
      nodes: {
        target: node({ id: 'target', title: 'quantum resonance', meta: { created: 1, updated: 1, app: 'goals' } }),
        rel: node({ id: 'rel', title: 'resonance notes', meta: { created: 1 + 40 * DAY, updated: 2, app: 'notes' } }),
      },
    })
    render(<RelatedConstellation nodeId="target" />)
    fireEvent.click(screen.getByRole('button', { name: /resonance notes/ }))
    expect(useWindowStore.getState().activeWindowId).toBe('notes')
    expect(useFocus.getState().focusedId).toBe('rel')
  })

  it('keyboard Enter on a related row navigates the same way (mouse-free)', () => {
    useGraph.setState({
      nodes: {
        target: node({ id: 'target', title: 'quantum resonance', meta: { created: 1, updated: 1, app: 'goals' } }),
        rel: node({ id: 'rel', title: 'resonance reader', meta: { created: 1 + 40 * DAY, updated: 2, app: 'reader' } }),
      },
    })
    render(<RelatedConstellation nodeId="target" />)
    fireEvent.keyDown(screen.getByRole('button', { name: /resonance reader/ }), { key: 'Enter' })
    expect(useWindowStore.getState().activeWindowId).toBe('reader')
    expect(useFocus.getState().focusedId).toBe('rel')
  })

  // EPIC-19 S3: mounted INSIDE the Timeline/Search entity rows (a clickable
  // ghost `<Button>`). Activating a related item must jump to the RELATIVE and
  // NOT also fire the enclosing row's handler — the span's stopPropagation is
  // what makes the nested mount safe.
  it('activating a related row does not bubble to the enclosing clickable row (S3 nesting)', () => {
    useGraph.setState({
      nodes: {
        target: node({ id: 'target', title: 'quantum resonance', meta: { created: 1, updated: 1, app: 'goals' } }),
        rel: node({ id: 'rel', title: 'resonance notes', meta: { created: 1 + 40 * DAY, updated: 2, app: 'notes' } }),
      },
    })
    let rowFired = 0
    render(
      <div data-testid="row" onClick={() => { rowFired += 1 }}>
        <RelatedConstellation nodeId="target" />
      </div>,
    )
    fireEvent.click(screen.getByRole('button', { name: /resonance notes/ }))
    // The relative opened…
    expect(useWindowStore.getState().activeWindowId).toBe('notes')
    expect(useFocus.getState().focusedId).toBe('rel')
    // …and the enclosing row never saw the click.
    expect(rowFired).toBe(0)
  })

  it('keyboard Space on a related row navigates too (mouse-free, parity with Enter)', () => {
    useGraph.setState({
      nodes: {
        target: node({ id: 'target', title: 'quantum resonance', meta: { created: 1, updated: 1, app: 'goals' } }),
        rel: node({ id: 'rel', title: 'resonance chamber', meta: { created: 1 + 40 * DAY, updated: 2, app: 'reader' } }),
      },
    })
    render(<RelatedConstellation nodeId="target" />)
    fireEvent.keyDown(screen.getByRole('button', { name: /resonance chamber/ }), { key: ' ' })
    expect(useWindowStore.getState().activeWindowId).toBe('reader')
    expect(useFocus.getState().focusedId).toBe('rel')
  })
})
