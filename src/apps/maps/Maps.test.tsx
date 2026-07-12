import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

/**
 * Maps shell-conformance (EPIC-14 S7). Maps carried 12 bare controls
 * (11 <button> + 1 <input>). This locks the migration onto the `ui` layer:
 *  - the Search / Saved tab row is a real `Segmented` radiogroup (aria-checked),
 *  - the place search is a labelled `Input` + a named search `IconButton`,
 *  - per-place save / remove are icon-only `IconButton`s with accessible names.
 * Leaflet is mocked (jsdom has no real map/canvas) and ResizeObserver is
 * polyfilled, so the component renders far enough to exercise its controls.
 */

vi.mock('leaflet', () => {
  const layer: Record<string, unknown> = {}
  layer.addTo = vi.fn(() => layer)
  layer.clearLayers = vi.fn()
  const map: Record<string, unknown> = {}
  map.setView = vi.fn(() => map)
  map.remove = vi.fn()
  map.invalidateSize = vi.fn()
  map.flyTo = vi.fn()
  const tile = { addTo: vi.fn(() => tile) }
  const marker: Record<string, unknown> = {}
  marker.bindPopup = vi.fn(() => marker)
  marker.on = vi.fn(() => marker)
  marker.addTo = vi.fn(() => marker)
  const L = {
    map: vi.fn(() => map),
    tileLayer: vi.fn(() => tile),
    layerGroup: vi.fn(() => layer),
    marker: vi.fn(() => marker),
    divIcon: vi.fn(() => ({})),
  }
  return { default: L }
})
vi.mock('../../lib/eventBus', () => ({ emit: vi.fn() }))

import Maps from './Maps'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('Maps — shell conformance', () => {
  beforeEach(() => {
    ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Search/Saved tabs as an accessible Segmented radiogroup', () => {
    render(<Maps />)
    expect(screen.getByRole('radiogroup', { name: 'Map list' })).toBeTruthy()
    const search = screen.getByRole('radio', { name: 'Search' })
    const saved = screen.getByRole('radio', { name: 'Saved (0)' })
    expect(search.getAttribute('aria-checked')).toBe('true')
    expect(saved.getAttribute('aria-checked')).toBe('false')
  })

  it('switches to the Saved tab and shows its empty state', () => {
    render(<Maps />)
    fireEvent.click(screen.getByRole('radio', { name: 'Saved (0)' }))
    expect(screen.getByText('No saved places yet')).toBeTruthy()
  })

  it('routes place search through a labelled Input + a named search button', () => {
    render(<Maps />)
    expect(screen.getByLabelText('Search any place or address')).toBeTruthy()
    // The submit control is an icon-only IconButton (role=button, not the
    // "Search" tab which is role=radio) carrying its own accessible name.
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Use My Location' })).toBeTruthy()
  })
})
