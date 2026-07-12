import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Music from './Music'

/**
 * Music player a11y pass. Every transport control is icon-only, so without a
 * programmatic name it reads as a bare "button" to assistive tech; the
 * shuffle/repeat/mute toggles convey their active state by background colour
 * alone. And the per-track remove control was `opacity-0` until hover — a phone
 * (no hover) could never reach it. These tests lock:
 *  - transport controls (play/pause, prev, next, shuffle, repeat, mute) and the
 *    seek/volume sliders carry accessible names,
 *  - shuffle/repeat/mute expose their state via `aria-pressed`, and Repeat's
 *    label names its current mode (off / all / one),
 *  - the remove control has an accessible name and is NOT hover-gated (touch-reachable).
 *
 * The playlist is hydrated through the async media restore, so mediaStore is
 * mocked to return one track; eventBus is silenced.
 */

const TRACK = { id: 't1', title: 'Song One', artist: 'Artist A', duration: 200, src: 'blob:t1' }

vi.mock('../../lib/eventBus', () => ({ emit: vi.fn() }))
vi.mock('../../lib/mediaStore', () => ({
  MEDIA_SIZE_CAP: 75 * 1024 * 1024,
  shouldPersistBlob: () => true,
  toStorableMeta: (items: unknown) => items,
  rehydrateMedia: () => [TRACK],
  loadMediaUrls: async () => new Map([['t1', 'blob:t1']]),
  putMedia: vi.fn(),
  deleteMedia: vi.fn(),
  getMedia: vi.fn(),
  allMediaIds: vi.fn(),
}))

// Render + wait for the async restore to surface the seeded track, then play it
// so the Now Playing transport controls mount.
async function renderPlaying() {
  render(<Music />)
  await waitFor(() => expect(screen.getByText('Song One')).toBeTruthy())
  fireEvent.doubleClick(screen.getByText('Song One'))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy())
}

describe('Music player — a11y', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('gives every icon-only transport control an accessible name', async () => {
    await renderPlaying()
    expect(screen.getByRole('button', { name: 'Previous track' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next track' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Shuffle' })).toBeTruthy()
    expect(screen.getByLabelText('Seek')).toBeTruthy()
    expect(screen.getByLabelText('Volume')).toBeTruthy()
  })

  it('renders seek + volume as ui Slider range controls (role=slider)', async () => {
    await renderPlaying()
    expect(screen.getByRole('slider', { name: 'Seek' }).getAttribute('type')).toBe('range')
    expect(screen.getByRole('slider', { name: 'Volume' }).getAttribute('type')).toBe('range')
  })

  it('exposes the shuffle toggle state via aria-pressed and flips it', async () => {
    await renderPlaying()
    const shuffle = screen.getByRole('button', { name: 'Shuffle' })
    expect(shuffle.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(shuffle)
    expect(shuffle.getAttribute('aria-pressed')).toBe('true')
  })

  it('names the repeat mode in its label as it cycles off → all → one', async () => {
    await renderPlaying()
    expect(screen.getByRole('button', { name: 'Repeat: off' }).getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: 'Repeat: off' }))
    expect(screen.getByRole('button', { name: 'Repeat: all' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Repeat: all' }))
    expect(screen.getByRole('button', { name: 'Repeat: one' })).toBeTruthy()
  })

  it('toggles the mute control label + aria-pressed', async () => {
    await renderPlaying()
    const mute = screen.getByRole('button', { name: 'Mute' })
    expect(mute.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(mute)
    expect(screen.getByRole('button', { name: 'Unmute' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('gives the per-track remove control an accessible name and keeps it touch-reachable (not hover-gated)', async () => {
    await renderPlaying()
    const remove = screen.getByRole('button', { name: 'Remove Song One' })
    expect(remove).toBeTruthy()
    // opacity-0 would make it invisible/untappable on touch (no hover) — must not be present.
    expect(remove.className).not.toContain('opacity-0')
  })
})
