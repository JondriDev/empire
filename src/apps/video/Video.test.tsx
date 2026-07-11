import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Video from './Video'

/**
 * Video player a11y + touch pass. Every transport control is icon-only, so
 * without a programmatic name it reads as a bare "button" to assistive tech;
 * the mute + playback-speed toggles convey their active state by background
 * colour alone; and the per-item remove control was `opacity-0` until hover —
 * a phone (no hover) could never reach it. These tests lock:
 *  - transport controls (play/pause, back/forward, mute, fullscreen) and the
 *    seek/volume sliders carry accessible names,
 *  - mute + the active playback-speed expose their state via `aria-pressed`,
 *  - the remove control has an accessible name and is NOT hover-gated (touch-reachable).
 *
 * The playlist is hydrated through the async media restore, so mediaStore is
 * mocked to return one video; eventBus is silenced.
 */

const VIDEO = { id: 'v1', title: 'My Clip', src: 'blob:v1', duration: 120, size: 1000, type: 'video/mp4', date: '2026-07-11' }

vi.mock('../../lib/eventBus', () => ({ emit: vi.fn() }))
vi.mock('../../lib/mediaStore', () => ({
  shouldPersistBlob: () => true,
  toStorableMeta: (items: unknown) => items,
  rehydrateMedia: () => [VIDEO],
  loadMediaUrls: async () => new Map([['v1', 'blob:v1']]),
  putMedia: vi.fn(),
  deleteMedia: vi.fn(),
}))

// Render + wait for the async restore to surface the seeded video, then play it
// so the transport controls mount.
async function renderPlaying() {
  render(<Video />)
  await waitFor(() => expect(screen.getByText('My Clip')).toBeTruthy())
  fireEvent.click(screen.getByText('My Clip'))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy())
}

describe('Video player — a11y', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('gives every icon-only transport control an accessible name', async () => {
    await renderPlaying()
    expect(screen.getByRole('button', { name: 'Back 10 seconds' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Forward 10 seconds' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Fullscreen' })).toBeTruthy()
    expect(screen.getByLabelText('Seek')).toBeTruthy()
    expect(screen.getByLabelText('Volume')).toBeTruthy()
  })

  it('exposes the mute control state via aria-pressed and flips its label', async () => {
    await renderPlaying()
    const mute = screen.getByRole('button', { name: 'Mute' })
    expect(mute.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(mute)
    expect(screen.getByRole('button', { name: 'Unmute' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('marks the active playback speed with aria-pressed', async () => {
    await renderPlaying()
    // 1× is the default active rate.
    expect(screen.getByRole('button', { name: 'Playback speed 1×' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Playback speed 2×' }).getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: 'Playback speed 2×' }))
    expect(screen.getByRole('button', { name: 'Playback speed 2×' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('exposes the playlist toggle state via aria-pressed', async () => {
    await renderPlaying()
    const toggle = screen.getByRole('button', { name: 'Hide playlist' })
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Show playlist' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('gives the per-item remove control an accessible name and keeps it touch-reachable (not hover-gated)', async () => {
    await renderPlaying()
    const remove = screen.getByRole('button', { name: 'Remove My Clip' })
    expect(remove).toBeTruthy()
    // opacity-0 would make it invisible/untappable on touch (no hover) — must not be present.
    expect(remove.className).not.toContain('opacity-0')
  })
})
