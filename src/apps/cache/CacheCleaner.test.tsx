import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import CacheCleaner from './CacheCleaner'

/**
 * CacheCleaner — the destructive-action safety net.
 *
 * "Clear All" / "Clear Selected" wipe real per-app localStorage and cannot be
 * undone, so both must ARM a confirmation first (a second, explicit tap) rather
 * than delete on the first click. These tests lock that gate plus the honest
 * disabled-states and the screen-reader semantics.
 *
 * The global test setup stubs `localStorage` with no-op `vi.fn()`s (no real
 * `length`/`key`), so here we install a working in-memory Storage the component
 * can actually scan, and restore the original afterwards.
 */
function makeStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() { return map.size },
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => { map.set(k, String(v)) },
    removeItem: (k: string) => { map.delete(k) },
    clear: () => { map.clear() },
  } as Storage
}

describe('CacheCleaner — destructive-action confirmation gate', () => {
  let origLocal: PropertyDescriptor | undefined
  let origSession: PropertyDescriptor | undefined

  beforeEach(() => {
    origLocal = Object.getOwnPropertyDescriptor(window, 'localStorage')
    origSession = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
    Object.defineProperty(window, 'localStorage', { value: makeStorage(), configurable: true, writable: true })
    Object.defineProperty(window, 'sessionStorage', { value: makeStorage(), configurable: true, writable: true })
    localStorage.setItem('empire-alpha', 'x'.repeat(100))
    localStorage.setItem('empire-beta', 'y'.repeat(50))
  })
  afterEach(() => {
    if (origLocal) Object.defineProperty(window, 'localStorage', origLocal)
    if (origSession) Object.defineProperty(window, 'sessionStorage', origSession)
    vi.restoreAllMocks()
  })

  it('shows the shared EmptyState when there is nothing to clear', () => {
    localStorage.clear()
    sessionStorage.clear()
    render(<CacheCleaner />)
    // Migrated off the bare "No cache entries found" div onto the shared EmptyState.
    expect(screen.getByText('Nothing cached')).toBeTruthy()
    expect(screen.getByText(/Storage is clean/)).toBeTruthy()
  })

  it('names the icon-only Rescan control for screen readers', () => {
    render(<CacheCleaner />)
    expect(screen.getByLabelText('Rescan cache')).toBeTruthy()
  })

  it('disables Clear Selected until something is selected', () => {
    render(<CacheCleaner />)
    const clearSelected = screen.getByRole('button', { name: 'Clear Selected' }) as HTMLButtonElement
    expect(clearSelected.disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Select All' }))
    expect((screen.getByRole('button', { name: 'Clear Selected' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('Clear All arms a confirmation instead of wiping immediately', () => {
    render(<CacheCleaner />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }))

    // Nothing deleted yet — the data is still there behind the confirm gate.
    expect(localStorage.getItem('empire-alpha')).not.toBeNull()
    const dialog = screen.getByRole('alertdialog')
    expect(within(dialog).getByText(/2 entries/)).toBeTruthy()
  })

  it('Cancel dismisses the confirmation without deleting', () => {
    render(<CacheCleaner />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(localStorage.getItem('empire-alpha')).not.toBeNull()
  })

  it('Delete forever executes the wipe and announces the freed space', () => {
    render(<CacheCleaner />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete forever' }))

    expect(localStorage.getItem('empire-alpha')).toBeNull()
    expect(localStorage.getItem('empire-beta')).toBeNull()
    // The freed-space confirmation is a live status region.
    const status = screen.getByRole('status')
    expect(status.textContent).toMatch(/Freed/)
  })

  it('Clear Selected only removes the checked entries', () => {
    render(<CacheCleaner />)
    // Check just the first entry.
    const boxes = screen.getAllByRole('checkbox')
    fireEvent.click(boxes[0])
    fireEvent.click(screen.getByRole('button', { name: 'Clear Selected' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete forever' }))

    // Exactly one of the two seeded keys survives.
    const survivors = ['empire-alpha', 'empire-beta'].filter(k => localStorage.getItem(k) !== null)
    expect(survivors.length).toBe(1)
  })
})
