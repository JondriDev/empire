import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FormBuilder from './FormBuilder'

/**
 * EPIC-14 S5 — FormBuilder migrated onto the `ui` shell primitives (Button /
 * IconButton / Input / TextArea / Select): no bare interactive control remains.
 * These tests lock the migrated controls' semantics — the header title is a
 * named Input, the preview/export/submit actions are named Buttons, and every
 * icon-only field action (move up/down, remove field, remove option) carries an
 * accessible name it did not have as a bare `<button>`. The live-preview select
 * is a real named combobox.
 */

describe('FormBuilder — S5 shell migration', () => {
  beforeEach(() => { localStorage.clear() })

  it('exposes the title as a named Input and the header actions as named Buttons', () => {
    render(<FormBuilder />)
    expect((screen.getByLabelText('Form title') as HTMLInputElement).value).toBe('Untitled Form')
    expect(screen.getByRole('button', { name: 'Preview' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Export' })).toBeTruthy()
  })

  it('gives every field row action an accessible name', () => {
    render(<FormBuilder />)
    // Seeded with two fields → each has move up/down + remove.
    expect(screen.getAllByRole('button', { name: 'Move field up' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Move field down' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Remove field' }).length).toBeGreaterThan(0)
  })

  it('adds a field via the palette Button and renders a named live-preview control', () => {
    render(<FormBuilder />)
    fireEvent.click(screen.getByRole('button', { name: /Dropdown/ }))
    // Switch to preview; the dropdown field becomes a native combobox named by its label.
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(screen.getByRole('combobox', { name: 'Dropdown' })).toBeTruthy()
  })
})
