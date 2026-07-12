import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Browser from './Browser'

// Browser uses useNavigate() (base-aware "Ask Cakra" jump), so it must render
// inside a Router.
const renderBrowser = () => render(<MemoryRouter><Browser /></MemoryRouter>)

/**
 * Browser shell-conformance (EPIC-14 S6) a11y lock. The migration moved the app
 * onto the `ui` primitive layer; these tests hold the contract that survived it:
 *  - the browse/bookmarks/history tabs are a real `Segmented` radiogroup (the
 *    active tab is `aria-checked`, not conveyed by background colour alone),
 *  - the URL bar is a labelled text field,
 *  - navigation controls (Go, Ask Cakra) and the per-bookmark remove control
 *    carry accessible names.
 */
describe('Browser — shell conformance a11y', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the section tabs as a radiogroup with the active tab aria-checked', () => {
    renderBrowser()
    expect(screen.getByRole('radiogroup', { name: 'Browser section' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Browse' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: 'Bookmarks' }).getAttribute('aria-checked')).toBe('false')
    fireEvent.click(screen.getByRole('radio', { name: 'Bookmarks' }))
    expect(screen.getByRole('radio', { name: 'Bookmarks' }).getAttribute('aria-checked')).toBe('true')
  })

  it('labels the URL field and the navigation controls', () => {
    renderBrowser()
    expect(screen.getByLabelText('URL or search query')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Go/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ask Cakra about this URL' })).toBeTruthy()
  })

  it('surfaces the bookmark + remove controls once a URL is typed and saved', () => {
    renderBrowser()
    const field = screen.getByLabelText('URL or search query')
    fireEvent.change(field, { target: { value: 'example.com' } })
    // The star (bookmark-this-URL) control appears only with a non-empty URL.
    const star = screen.getByRole('button', { name: 'Bookmark this URL' })
    fireEvent.click(star)
    fireEvent.click(screen.getByRole('radio', { name: 'Bookmarks' }))
    // The saved bookmark's remove control is labelled (exact — default bookmarks
    // each have their own) and touch-reachable (not fully hover-gated).
    const remove = screen.getByRole('button', { name: 'Remove bookmark example.com' })
    expect(remove).toBeTruthy()
    expect(remove.className).not.toContain('opacity-0')
  })

  it('exposes bookmark tiles as keyboard-operable buttons and activates them with Enter', () => {
    renderBrowser()
    fireEvent.click(screen.getByRole('radio', { name: 'Bookmarks' }))
    // Each default bookmark tile is a focusable role=button with an accessible name.
    const tile = screen.getByRole('button', { name: 'Open GitHub' })
    expect(tile.getAttribute('tabindex')).toBe('0')
    // Enter navigates: it jumps back to Browse and the URL field carries the target.
    fireEvent.keyDown(tile, { key: 'Enter' })
    expect(screen.getByRole('radio', { name: 'Browse' }).getAttribute('aria-checked')).toBe('true')
    expect((screen.getByLabelText('URL or search query') as HTMLInputElement).value).toBe('https://github.com')
  })

  it('does not record a history entry when Enter is pressed on an empty URL field', () => {
    renderBrowser()
    const field = screen.getByLabelText('URL or search query')
    fireEvent.keyDown(field, { key: 'Enter' })
    fireEvent.click(screen.getByRole('radio', { name: 'History' }))
    // The empty-URL Enter is a no-op (mirrors the disabled Go button) — no junk
    // "https://" entry, so the honest empty state shows.
    expect(screen.getByText('No browsing history yet')).toBeTruthy()
  })
})
