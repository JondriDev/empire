import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChartBuilder from './ChartBuilder'

/**
 * EPIC-14 S5 — ChartBuilder migrated onto the `ui` shell primitives (Button /
 * IconButton / Input / Segmented): no bare interactive control remains. These
 * tests lock the migrated controls' semantics — the chart-type toggle is a
 * proper single-select `radiogroup` (radios with aria-checked, NOT aria-pressed),
 * Randomize/SVG are named Buttons, the add / remove data-point controls are
 * named IconButtons, and the data rows are named Inputs.
 */

describe('ChartBuilder — S5 shell migration', () => {
  it('renders the chart-type toggle as a single-select radiogroup', () => {
    render(<ChartBuilder />)
    const group = screen.getByRole('radiogroup', { name: 'Chart type' })
    expect(group).toBeTruthy()
    const bar = screen.getByRole('radio', { name: 'bar' })
    expect(bar.getAttribute('aria-checked')).toBe('true')
    const pie = screen.getByRole('radio', { name: 'pie' })
    fireEvent.click(pie)
    expect(pie.getAttribute('aria-checked')).toBe('true')
    expect(bar.getAttribute('aria-checked')).toBe('false')
  })

  it('exposes toolbar and data-editor actions as named controls', () => {
    render(<ChartBuilder />)
    expect(screen.getByRole('button', { name: 'Randomize' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'SVG' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add data point' })).toBeTruthy()
    expect(screen.getByLabelText('Chart title')).toBeTruthy()
    expect(screen.getByLabelText('Data point 1 label')).toBeTruthy()
    expect(screen.getByLabelText('Data point 1 value')).toBeTruthy()
  })

  // Regression: `removeRow` had no floor, so the user could delete every data
  // point. On an empty dataset the line renderer read `points[points.length - 1]`
  // (crash on []) and the Min stat showed `Math.min()` === Infinity. The floor
  // keeps ≥1 datum. This drives the exact path: switch to the line chart, then
  // try to remove every row.
  it('keeps at least one datum so the line chart cannot crash on an empty dataset', () => {
    render(<ChartBuilder />)
    fireEvent.click(screen.getByRole('radio', { name: 'line' }))
    const initial = screen.getAllByLabelText(/Data point \d+ value/).length
    // Attempt to remove every row while the line chart is live (each removal
    // re-renders it — before the fix, emptying the data threw here).
    for (let k = 0; k < initial; k++) {
      fireEvent.click(screen.getAllByRole('button', { name: /Remove data point/ })[0])
    }
    expect(screen.getAllByLabelText(/Data point \d+ value/)).toHaveLength(1)
    expect(screen.queryByText('Infinity')).toBeNull()
  })
})
