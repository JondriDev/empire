import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './Utility'

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No notes yet" />)
    expect(screen.getByText('No notes yet')).toBeTruthy()
  })

  it('renders the optional description and action', () => {
    render(
      <EmptyState
        title="No tables yet"
        description="Create a table to store rows locally."
        action={<button>Create your first table</button>}
      />,
    )
    expect(screen.getByText('Create a table to store rows locally.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Create your first table' })).toBeTruthy()
  })

  it('omits the description block when none is given', () => {
    render(<EmptyState title="Only a title" />)
    // Title present, but no stray paragraph rendered.
    expect(screen.getByText('Only a title')).toBeTruthy()
    expect(screen.queryByText(/./, { selector: 'p' })).toBeNull()
  })

  it('renders the icon chip on the default (signal) accent path', () => {
    render(<EmptyState title="Default accent" icon={<svg data-testid="glyph" />} />)
    expect(screen.getByTestId('glyph')).toBeTruthy()
  })

  it('renders the icon chip on the provided-accent path', () => {
    // Exercises the accent branch (per-app identity colour, e.g. var(--c-pembaca)).
    // jsdom can't parse color-mix() so the serialized style isn't asserted here;
    // the token-only guarantee is enforced by the tokenViolations/offSystemStyle metrics.
    render(<EmptyState title="App accent" accent="var(--c-pembaca)" icon={<svg data-testid="glyph2" />} />)
    expect(screen.getByTestId('glyph2')).toBeTruthy()
  })

  it('renders the compact sm variant (narrow sub-lists / player no-selection)', () => {
    const { container } = render(
      <EmptyState
        size="sm"
        title="No track playing"
        description="Add audio files to get started"
        icon={<svg data-testid="glyph3" />}
      />,
    )
    // Title + description + icon still render; the size only re-tunes the rhythm.
    expect(screen.getByText('No track playing')).toBeTruthy()
    expect(screen.getByText('Add audio files to get started')).toBeTruthy()
    expect(screen.getByTestId('glyph3')).toBeTruthy()
    // sm halves the block's min-height (120px vs the default 200px) so it fits a
    // sidebar sub-list without dominating it.
    const root = container.firstChild as HTMLElement
    expect(root.style.minHeight).toBe('120px')
  })

  it('keeps the default (md) min-height when size is omitted', () => {
    const { container } = render(<EmptyState title="No goals yet" />)
    const root = container.firstChild as HTMLElement
    expect(root.style.minHeight).toBe('200px')
  })
})
