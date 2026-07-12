import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Language from './Language'

// Language uses useNavigate() (base-aware "Ask Cakra" jump), so it must render
// inside a Router.
const renderLanguage = () => render(<MemoryRouter><Language /></MemoryRouter>)

/**
 * Language Lab a11y + honest-state behaviour. The translation runs through the
 * async `chat` bridge, so we mock it. These tests lock:
 *  - the raw language `<select>`s and the icon-only swap button carry
 *    programmatic labels (they were otherwise unnamed to assistive tech),
 *  - the textarea has a real label,
 *  - the Phrases toggle exposes its active state via `aria-pressed` (it was
 *    conveyed by background colour alone),
 *  - a translation FAILURE renders in a distinct `role="alert"` channel — never
 *    inside the green "success" box — and a SUCCESS lands in a polite live region.
 */

const chatMock = vi.fn()
vi.mock('../../lib/ai', () => ({ chat: (...args: unknown[]) => chatMock(...args) }))
vi.mock('../../lib/eventBus', () => ({ emit: vi.fn() }))

describe('Language Lab — a11y + honest states', () => {
  beforeEach(() => {
    localStorage.clear()
    chatMock.mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('labels the language selectors and the swap control for screen readers', () => {
    renderLanguage()
    expect(screen.getByLabelText('Translate from')).toBeTruthy()
    expect(screen.getByLabelText('Translate to')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Swap languages' })).toBeTruthy()
    expect(screen.getByLabelText('Text to translate')).toBeTruthy()
  })

  it('routes the selectors through the ui Select (comboboxes) with the Auto-Detect option preserved', () => {
    renderLanguage()
    const from = screen.getByRole('combobox', { name: 'Translate from' }) as HTMLSelectElement
    const to = screen.getByRole('combobox', { name: 'Translate to' }) as HTMLSelectElement
    // The "from" select carries the extra 🌐 Auto Detect option; "to" does not.
    expect(screen.getByRole('option', { name: /Auto Detect/ })).toBeTruthy()
    expect(from.value).toBe('en')
    expect(to.value).toBe('es')
  })

  it('exposes the Phrases toggle state via aria-pressed and flips it on click', () => {
    renderLanguage()
    const toggle = screen.getByRole('button', { name: /phrases/i })
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
  })

  it('renders a translation FAILURE in a distinct alert, not the success box', async () => {
    chatMock.mockRejectedValue(new Error('network down'))
    renderLanguage()
    fireEvent.change(screen.getByLabelText('Text to translate'), { target: { value: 'hello' } })
    const alert = await waitFor(() => screen.getByRole('alert'), { timeout: 2000 })
    expect(alert.textContent).toContain('network down')
  })

  it('surfaces a successful translation in a polite live region', async () => {
    chatMock.mockResolvedValue('Hola')
    renderLanguage()
    fireEvent.change(screen.getByLabelText('Text to translate'), { target: { value: 'hello' } })
    await waitFor(() => expect(screen.getByText('Hola')).toBeTruthy(), { timeout: 2000 })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('gives each saved-phrase delete control an accessible label', () => {
    // localStorage is a bare mock in this repo's test setup — stub the read.
    vi.spyOn(window.localStorage, 'getItem').mockReturnValue(JSON.stringify([
      { id: '1', original: 'hello', translated: 'hola', from: 'en', to: 'es', date: '2026-07-10T00:00:00.000Z' },
    ]))
    renderLanguage()
    fireEvent.click(screen.getByRole('button', { name: /phrases/i }))
    expect(screen.getByRole('button', { name: 'Delete saved phrase' })).toBeTruthy()
  })
})
