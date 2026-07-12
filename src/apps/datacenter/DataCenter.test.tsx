import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DataCenter from './DataCenter'

/**
 * Data Center shell-conformance (EPIC-14 S7). Data Center was the joint-heaviest
 * off-shell offender (14 bare controls: 10 <button> + 4 <input>). This locks the
 * migration onto the `ui` primitive layer:
 *  - sidebar / modal actions are real `Button` / `IconButton`s with names,
 *  - the inline spreadsheet cells route through the new `seamless` `Input`
 *    variant (a real textbox with an accessible name, not a bare <input>),
 *  - the add / delete row controls are icon-only `IconButton`s with labels.
 * With storage empty the component opens on its seeded `tasks` table, so the
 * grid + its controls render immediately. emit / graph mirror / ⚡ NodeActions
 * are silenced (covered elsewhere).
 */

vi.mock('../../lib/eventBus', () => ({ emit: vi.fn() }))
vi.mock('../../lib/core/sync', () => ({ mirrorCollection: vi.fn() }))
vi.mock('../../components/ui/NodeActions', () => ({ NodeActions: () => null }))

function renderDC() {
  return render(
    <MemoryRouter>
      <DataCenter />
    </MemoryRouter>,
  )
}

describe('Data Center — shell conformance', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders inline cells as labelled seamless textboxes (not bare inputs)', () => {
    renderDC()
    // Seeded `tasks` table → each editable cell is a real textbox with a name.
    const titleCells = screen.getAllByLabelText('title value') as HTMLInputElement[]
    expect(titleCells.length).toBeGreaterThan(0)
    expect(titleCells[0].tagName).toBe('INPUT')
    expect(titleCells[0].value).toBe('Ship Empire redesign')
  })

  it('names the sidebar + main actions and the per-row / add-row controls', () => {
    renderDC()
    expect(screen.getByRole('button', { name: 'Ask Cakra' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Analyze with Cakra' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'New table' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add row' })).toBeTruthy()
    // One delete control per seeded row.
    expect(screen.getAllByRole('button', { name: 'Delete row' }).length).toBeGreaterThan(0)
  })

  it('exposes the new-table modal fields as labelled inputs', () => {
    renderDC()
    fireEvent.click(screen.getByRole('button', { name: 'New table' }))
    expect(screen.getByLabelText('Table name')).toBeTruthy()
    expect(screen.getByLabelText('Columns (comma-separated)')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Create table' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy()
  })

  it('commits a new row through the labelled new-row cell + Enter', async () => {
    renderDC()
    const before = screen.getAllByLabelText('title value').length
    const entry = screen.getByLabelText('New row title')
    fireEvent.change(entry, { target: { value: 'Fresh task' } })
    fireEvent.keyDown(entry, { key: 'Enter' })
    await waitFor(() =>
      expect(screen.getAllByLabelText('title value').length).toBe(before + 1),
    )
  })
})
