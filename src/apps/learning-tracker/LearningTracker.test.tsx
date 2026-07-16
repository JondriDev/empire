import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LearningTracker from './LearningTracker'
import { useStore } from '../../lib/store'

/**
 * Learning Tracker touch-reachability (mirrors Music/Video/Files/DataCenter).
 * The per-item action controls — the ⚡ NodeActions container and the "Ask
 * Cakra about this topic" button — were `opacity-0 group-hover:opacity-100`,
 * i.e. invisible AND unreachable on a phone (no hover), so on touch you could
 * neither open NodeActions nor hand the topic to Cakra. They are now
 * `opacity-60` at rest (base-visible) + hover/focus-within emphasis. This
 * locks the base-visible contract so a future edit can't silently re-hide them.
 *
 * NodeActions is stubbed to a sentinel so we can assert on its wrapper without
 * pulling the graph mirror; emit is silenced.
 */

vi.mock('../../lib/eventBus', () => ({ emit: vi.fn() }))
vi.mock('../../components/ui/NodeActions', () => ({
  NodeActions: () => <span data-testid="node-actions">⚡</span>,
}))

function renderLT() {
  return render(
    <MemoryRouter>
      <LearningTracker />
    </MemoryRouter>,
  )
}

function addTopic(topic: string) {
  fireEvent.change(screen.getByPlaceholderText('Topic (e.g. Rust ownership)'), {
    target: { value: topic },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Add Topic' }))
}

describe('Learning Tracker — touch reachability', () => {
  beforeEach(() => {
    localStorage.clear()
    // Zustand store is a module singleton — reset the collection so items
    // don't accumulate across tests.
    useStore.setState({ learningItems: [] })
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the empty-state prompt when there are no topics', () => {
    renderLT()
    expect(screen.getByText('No topics yet')).toBeTruthy()
  })

  it('exposes the per-topic Ask-Cakra control base-visible (not opacity-0)', () => {
    renderLT()
    addTopic('Rust ownership')
    const ask = screen.getByRole('button', { name: 'Ask Cakra about this topic' })
    const wrapper = ask.closest('span.transition-opacity')
    expect(wrapper).toBeTruthy()
    expect(wrapper!.className).toContain('opacity-60')
    expect(wrapper!.className).not.toContain('opacity-0')
  })

  it('exposes the per-topic NodeActions base-visible (not opacity-0)', () => {
    renderLT()
    addTopic('Rust ownership')
    const wrapper = screen.getByTestId('node-actions').closest('span.transition-opacity')
    expect(wrapper).toBeTruthy()
    expect(wrapper!.className).toContain('opacity-60')
    expect(wrapper!.className).not.toContain('opacity-0')
  })

  it('reveals the controls on keyboard focus (focus-within), not hover only', () => {
    renderLT()
    addTopic('Rust ownership')
    const ask = screen.getByRole('button', { name: 'Ask Cakra about this topic' })
    const wrapper = ask.closest('span.transition-opacity')
    expect(wrapper!.className).toContain('focus-within:opacity-100')
  })
})
