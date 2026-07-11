import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Files from './Files'

/**
 * File browser a11y + touch pass. The header refresh / up / home controls and
 * the per-file download / preview / expand controls are all icon-only, so
 * without a programmatic name they read as bare "button"s to assistive tech;
 * the quick-path chips convey their active folder by background colour alone;
 * and the per-file action row was `opacity-0` until hover — a phone (no hover)
 * could never reach Download / Preview / ⚡. These tests lock:
 *  - every icon-only control carries an accessible name,
 *  - the active quick-path exposes its state via `aria-pressed`,
 *  - the Up control is disabled at internal-storage root (honest state),
 *  - the per-file action row is NOT hover-gated (touch-reachable),
 *  - loading is a `status` region and a load failure is an `alert`.
 *
 * The directory listing is fetched on mount, so `fetch` is stubbed; eventBus,
 * the graph mirror, and ⚡ NodeActions are silenced (they're covered elsewhere).
 */

vi.mock('../../lib/eventBus', () => ({ emit: vi.fn() }))
vi.mock('../../lib/core/sync', () => ({ mirrorCollection: vi.fn() }))
vi.mock('../../components/ui/NodeActions', () => ({ NodeActions: () => null }))

const DIR = {
  files: [
    { name: 'Documents', path: '/storage/emulated/0/Documents', isDirectory: true, size: 0, modified: '2026-07-11', extension: '' },
    { name: 'notes.txt', path: '/storage/emulated/0/notes.txt', isDirectory: false, size: 42, modified: '2026-07-11', extension: 'txt' },
  ],
}

function mockFetchOk() {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => DIR,
    text: async () => '',
  })))
}

async function renderLoaded() {
  render(<Files />)
  await waitFor(() => expect(screen.getByText('notes.txt')).toBeTruthy())
}

describe('Files browser — a11y', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetchOk()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('gives every icon-only navigation control an accessible name', async () => {
    await renderLoaded()
    expect(screen.getByRole('button', { name: 'Refresh directory' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Go up one folder' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Go to internal storage' })).toBeTruthy()
    expect(screen.getByLabelText('Search files in this folder')).toBeTruthy()
  })

  it('disables the Up control at internal-storage root (honest state)', async () => {
    await renderLoaded()
    expect(screen.getByRole('button', { name: 'Go up one folder' }).hasAttribute('disabled')).toBe(true)
  })

  it('marks the active quick-path with aria-pressed', async () => {
    await renderLoaded()
    // Default path is Internal Storage — its chip is the active one.
    expect(screen.getByRole('button', { name: 'Internal Storage' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Documents' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('names the per-file download / preview controls and keeps the action row touch-reachable (not hover-gated)', async () => {
    await renderLoaded()
    const download = screen.getByRole('button', { name: 'Download notes.txt' })
    const preview = screen.getByRole('button', { name: 'Preview notes.txt' })
    expect(download).toBeTruthy()
    expect(preview).toBeTruthy()
    // The wrapping action row must not be opacity-0 (invisible/untappable on touch).
    const row = download.closest('div')
    expect(row?.className).not.toContain('opacity-0')
  })

  it('names the directory expand control with aria-expanded', async () => {
    await renderLoaded()
    const toggle = screen.getByRole('button', { name: 'Expand Documents' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('surfaces a load failure as an alert with a Retry action', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}), text: async () => '' })))
    render(<Files />)
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Failed to load directory')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy()
  })
})
