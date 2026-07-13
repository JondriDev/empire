import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Photos from './Photos'

/**
 * EPIC-14 S4 — Photos migrated onto the `ui` shell primitives (Segmented /
 * Input / IconButton): no bare interactive control remains. These tests lock
 * the migrated controls' semantics — the toolbar toggles (grid columns, view
 * mode, favourites filter) and tag chips are proper single-select `radiogroup`s,
 * the search is a named Input, and every icon-only lightbox / list action
 * (favourite, delete, close, prev/next) carries an accessible name it did not
 * have as a bare `<button>`.
 *
 * The library hydrates through the async media restore, so mediaStore is mocked
 * to return one tagged photo; the graph mirror, NodeActions and eventBus are
 * stubbed. The media-store persistence path itself is untouched by S4.
 */

// Mutable fixture the mediaStore mock hydrates from, so a test can render the
// component against an untagged / non-favourite library (the real default) and
// not only the one tagged photo.
const { PHOTO, UNTAGGED, state } = vi.hoisted(() => {
  const PHOTO = { id: 'p1', src: 'blob:p1', name: 'Sky.jpg', size: 1000, date: '2026-07-11T00:00:00.000Z', tags: ['sky'], favorite: false }
  const UNTAGGED = { id: 'p2', src: 'blob:p2', name: 'Beach.png', size: 2000, date: '2026-07-12T00:00:00.000Z', tags: [], favorite: false }
  return { PHOTO, UNTAGGED, state: { photos: [PHOTO] as Array<typeof PHOTO> } }
})

vi.mock('../../lib/eventBus', () => ({ emit: vi.fn() }))
vi.mock('../../lib/core/sync', () => ({ mirrorCollection: vi.fn() }))
vi.mock('../../components/ui/NodeActions', () => ({ NodeActions: () => null }))
vi.mock('../../lib/mediaStore', () => ({
  shouldPersistBlob: () => true,
  toStorableMeta: (items: unknown) => items,
  rehydrateMedia: () => state.photos,
  loadMediaUrls: async () => new Map(state.photos.map(p => [p.id, p.src])),
  putMedia: vi.fn(),
  deleteMedia: vi.fn(),
}))

async function renderWithPhoto() {
  render(<Photos />)
  await waitFor(() => expect(screen.getByAltText('Sky.jpg')).toBeTruthy())
}

describe('Photos — S4 shell migration', () => {
  beforeEach(() => { localStorage.clear(); state.photos = [PHOTO] })
  afterEach(() => { vi.restoreAllMocks(); document.body.style.overflow = '' })

  it('renders the toolbar toggles as named single-select radiogroups', async () => {
    await renderWithPhoto()
    expect(screen.getByRole('radiogroup', { name: 'Grid columns' })).toBeTruthy()
    expect(screen.getByRole('radiogroup', { name: 'View mode' })).toBeTruthy()
    expect(screen.getByRole('radiogroup', { name: 'Filter' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Grid view' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'List view' })).toBeTruthy()
  })

  it('names the search Input and exposes tags as radios', async () => {
    await renderWithPhoto()
    expect(screen.getByLabelText('Search photos')).toBeTruthy()
    expect(screen.getByRole('radio', { name: '#sky' })).toBeTruthy()
  })

  it('gives the list-view favourite action a name + pressed state', async () => {
    await renderWithPhoto()
    fireEvent.click(screen.getByRole('radio', { name: 'List view' }))
    const fav = screen.getByRole('button', { name: 'Favorite Sky.jpg' })
    expect(fav.getAttribute('aria-pressed')).toBe('false')
  })

  it('names every icon-only lightbox control', async () => {
    await renderWithPhoto()
    fireEvent.doubleClick(screen.getByAltText('Sky.jpg'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy())
    expect(screen.getByRole('button', { name: 'Previous photo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next photo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Delete photo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Favorite' })).toBeTruthy()
  })

  // Regression: the search Input used to be gated behind `allTags.length > 0`.
  // Photos import untagged and there's no tag-adding UI, so the filename search
  // was permanently unreachable for a real (untagged) library. It must now show
  // whenever there are photos.
  it('exposes the filename search for an untagged library (no tags required)', async () => {
    state.photos = [UNTAGGED]
    render(<Photos />)
    await waitFor(() => expect(screen.getByAltText('Beach.png')).toBeTruthy())
    expect(screen.getByLabelText('Search photos')).toBeTruthy()
    // …but with no tags there are no tag radios to filter by.
    expect(screen.queryByRole('radiogroup', { name: 'Filter by tag' })).toBeNull()
  })

  it('filters by filename and shows an honest no-match empty state', async () => {
    await renderWithPhoto()
    fireEvent.change(screen.getByLabelText('Search photos'), { target: { value: 'zzz' } })
    expect(screen.queryByAltText('Sky.jpg')).toBeNull()
    expect(screen.getByText('No matches')).toBeTruthy()
    expect(screen.getByText('No photo matches "zzz".')).toBeTruthy()
    // A filename substring match keeps the photo visible.
    fireEvent.change(screen.getByLabelText('Search photos'), { target: { value: 'sky' } })
    expect(screen.getByAltText('Sky.jpg')).toBeTruthy()
  })

  it('shows a favourites-specific empty state, not "No photos yet", when none are favourited', async () => {
    state.photos = [UNTAGGED]
    render(<Photos />)
    await waitFor(() => expect(screen.getByAltText('Beach.png')).toBeTruthy())
    fireEvent.click(screen.getByRole('radio', { name: 'Favorites' }))
    expect(screen.getByText('No favorites yet')).toBeTruthy()
    expect(screen.queryByText('No photos yet')).toBeNull()
  })
})
