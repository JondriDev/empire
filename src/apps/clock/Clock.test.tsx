import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Clock from './Clock'

/**
 * EPIC-14 S4 — Clock migrated onto the `ui` shell primitives (Segmented /
 * Select / Input / IconButton): no bare interactive control remains. These
 * tests lock the migrated controls' semantics — the mode tabs and timer presets
 * are a proper single-select `radiogroup`, the "Add city" control is a named
 * Select, and every icon-only alarm action (enable toggle, remove) carries an
 * accessible name + `aria-pressed` state it did not have as a bare `<button>`.
 * A regression back to a bare control or a nameless icon button is caught here,
 * not only by the off-shell-control metric.
 *
 * The event bus is stubbed; localStorage is cleared so each render starts from
 * the seed defaults.
 */

vi.mock('../../lib/eventBus', () => ({ emit: vi.fn() }))

describe('Clock — S4 shell migration', () => {
  beforeEach(() => { localStorage.clear() })
  afterEach(() => { vi.restoreAllMocks() })

  it('renders the mode tabs as a single-select radiogroup', () => {
    render(<Clock />)
    const tabs = screen.getByRole('radiogroup', { name: 'Clock mode' })
    expect(tabs).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Clock' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Timer' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Stopwatch' })).toBeTruthy()
    const alarmTab = screen.getByRole('radio', { name: 'Alarm' })
    // The selected mode is reflected via aria-checked (not a colour-only cue).
    expect(screen.getByRole('radio', { name: 'Clock' }).getAttribute('aria-checked')).toBe('true')
    fireEvent.click(alarmTab)
    expect(alarmTab.getAttribute('aria-checked')).toBe('true')
  })

  it('names the "Add city" Select on the world-clocks card', () => {
    render(<Clock />)
    expect(screen.getByRole('combobox', { name: 'Add a city' })).toBeTruthy()
  })

  it('exposes each timer preset as a named radio', () => {
    render(<Clock />)
    fireEvent.click(screen.getByRole('radio', { name: 'Timer' }))
    const presets = screen.getByRole('radiogroup', { name: 'Timer presets' })
    expect(presets).toBeTruthy()
    expect(screen.getByRole('radio', { name: '5m' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: '25m' })).toBeTruthy()
  })

  it('gives added-alarm icon actions accessible names + pressed state', () => {
    render(<Clock />)
    fireEvent.click(screen.getByRole('radio', { name: 'Alarm' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    // A new alarm (default label "Alarm", enabled) surfaces a named enable
    // toggle carrying its state + a named remove control — neither had a name
    // as a bare <button>.
    const toggle = screen.getByRole('button', { name: 'Disable Alarm' })
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Remove Alarm' })).toBeTruthy()
  })
})
