import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Weather from './Weather'

/**
 * Weather component a11y — the Settings dialog must be keyboard- and
 * screen-reader-navigable. The network path is stubbed (fetch rejects) so the
 * component settles into its error state without hitting Open-Meteo; these tests
 * only exercise the header controls + the settings dialog semantics.
 */
describe('Weather — settings dialog a11y', () => {
  beforeEach(() => {
    // No geolocation + a failing fetch → the mount effect settles into the
    // caught error branch; the UI (and its buttons) still render.
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  async function renderSettled() {
    const view = render(<Weather />)
    // Let the mount fetch reject + state settle.
    await waitFor(() => expect(screen.getByLabelText('Weather settings')).toBeTruthy())
    return view
  }

  it('labels the header icon buttons for screen readers', async () => {
    await renderSettled()
    expect(screen.getByLabelText('Refresh weather')).toBeTruthy()
    expect(screen.getByLabelText('Weather settings')).toBeTruthy()
  })

  it('opens an accessible dialog with an associated location field', async () => {
    await renderSettled()
    fireEvent.click(screen.getByLabelText('Weather settings'))

    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    // The dialog is named by its heading.
    expect(dialog.getAttribute('aria-labelledby')).toBe('weather-settings-title')
    expect(screen.getByText('Weather Settings').id).toBe('weather-settings-title')
    // The location input is programmatically labelled (htmlFor/id).
    expect(screen.getByLabelText('Location')).toBeTruthy()
    // The close control has an accessible name (not just a bare "×" glyph).
    expect(screen.getByLabelText('Close settings')).toBeTruthy()
  })

  it('closes the dialog on Escape', async () => {
    await renderSettled()
    fireEvent.click(screen.getByLabelText('Weather settings'))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()

    fireEvent.keyDown(dialog, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('closes the dialog when the labelled close button is pressed', async () => {
    await renderSettled()
    fireEvent.click(screen.getByLabelText('Weather settings'))
    expect(screen.getByRole('dialog')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Close settings'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
