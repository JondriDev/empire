import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Reader from './Reader'
import type { BookMeta } from './lib/types'

/**
 * EPIC-14 S2 — Reader migrated onto the `ui` shell primitives (Button /
 * IconButton / TextArea / Card): no bare interactive control remains (the
 * `<input type="file">` importer is the sole, exempt bare element). These tests
 * lock the Library view's migrated controls — every icon-only action carries an
 * accessible name (the IconButton a11y dividend) and the primary CTAs stay
 * clickable — so a regression back to a bare `<button>` or a nameless icon
 * control is caught here, not just by the off-shell-control metric.
 *
 * bookStore is mocked so the library content is deterministic; the render
 * module (epub/pdf renderers) and the graph mirror are stubbed since the
 * Library view neither mounts a book nor needs the organism wiring.
 */

let mockBooks: BookMeta[] = []
const deleteBook = vi.fn(async () => {})

vi.mock('../../lib/eventBus', () => ({ emit: vi.fn() }))
vi.mock('../../lib/core/sync', () => ({ mirrorCollection: vi.fn() }))
vi.mock('../../components/ui/NodeActions', () => ({ NodeActions: () => null }))
vi.mock('./lib/render', () => ({ getRenderer: vi.fn(), extractMeta: vi.fn() }))
vi.mock('./lib/bookStore', () => ({
  listBooks: () => mockBooks,
  getBook: (id: string) => mockBooks.find(b => b.id === id),
  addBook: vi.fn(),
  getBookBlob: vi.fn(),
  updateBook: vi.fn(),
  deleteBook: (id: string) => deleteBook(id),
  addHighlight: vi.fn(),
  removeHighlight: vi.fn(),
}))

const BOOK: BookMeta = {
  id: 'b1', title: 'Dune', author: 'Frank Herbert', format: 'epub',
  size: 1000, addedAt: 0, progress: 0.5, highlights: [],
}

describe('Reader — S2 shell migration (Library view)', () => {
  beforeEach(() => { mockBooks = []; deleteBook.mockClear() })

  it('shows the empty state with a clickable "Add your first book" CTA', () => {
    render(<Reader />)
    expect(screen.getByText('Your library is empty')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add your first book' })).toBeTruthy()
  })

  it('renders the header "Add book" button', () => {
    render(<Reader />)
    expect(screen.getByRole('button', { name: /Add book/ })).toBeTruthy()
  })

  it('renders a book tile whose delete control carries an accessible name', () => {
    mockBooks = [BOOK]
    render(<Reader />)
    // The card is an accessible clickable surface (role=button) naming the book…
    expect(screen.getByRole('button', { name: 'Open Dune' })).toBeTruthy()
    // …and the icon-only delete control is named, not a nameless <button>.
    const del = screen.getByRole('button', { name: 'Delete Dune' })
    fireEvent.click(del)
    expect(deleteBook).toHaveBeenCalledWith('b1')
  })
})
