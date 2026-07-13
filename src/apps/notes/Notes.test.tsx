import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Notes from './Notes'
import { useStore } from '../../lib/store'
import type { Note } from '../../lib/store'

// Notes uses useNavigate() (the "Ask Cakra" jump), so it must render inside a
// Router.
const renderNotes = () => render(<MemoryRouter><Notes /></MemoryRouter>)

const seed = (notes: Note[]) => useStore.setState({ notes })

/**
 * Notes — keyboard parity lock.
 *
 * The new-note card already honoured Escape (cancel) and Cmd/Ctrl+Enter (save).
 * The in-place *edit* card did not, so a keyboard user who learned those
 * shortcuts on the create form hit a dead surface when editing. These tests
 * hold both cards to the same keyboard contract so the parity can't regress.
 */
describe('Notes — create/edit keyboard parity', () => {
  beforeEach(() => {
    localStorage.clear()
    seed([])
  })
  afterEach(() => {
    vi.restoreAllMocks()
    seed([])
  })

  it('create card: Escape closes the form without saving', () => {
    renderNotes()
    fireEvent.click(screen.getByRole('button', { name: 'New Note' }))
    const dialog = screen.getByRole('dialog', { name: 'Create new note' })
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Create new note' })).toBeNull()
    expect(useStore.getState().notes).toHaveLength(0)
  })

  it('create card: Cmd/Ctrl+Enter saves the note', () => {
    renderNotes()
    fireEvent.click(screen.getByRole('button', { name: 'New Note' }))
    fireEvent.change(screen.getByPlaceholderText('Note title…'), { target: { value: 'Groceries' } })
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Create new note' }), {
      key: 'Enter',
      ctrlKey: true,
    })
    const notes = useStore.getState().notes
    expect(notes).toHaveLength(1)
    expect(notes[0].title).toBe('Groceries')
  })

  it('edit card: exposes an "Edit note" group and Escape cancels the edit', () => {
    seed([{ id: '1', title: 'Original', content: 'body', updatedAt: 1, tags: [] }])
    renderNotes()
    fireEvent.click(screen.getByRole('button', { name: 'Edit note' }))
    const group = screen.getByRole('group', { name: 'Edit note' })
    // Type a change, then bail with Escape — the change must NOT persist.
    fireEvent.change(screen.getByDisplayValue('Original'), { target: { value: 'Changed' } })
    fireEvent.keyDown(group, { key: 'Escape' })
    expect(screen.queryByRole('group', { name: 'Edit note' })).toBeNull()
    expect(useStore.getState().notes[0].title).toBe('Original')
  })

  it('edit card: Cmd/Ctrl+Enter commits the edit', () => {
    seed([{ id: '1', title: 'Original', content: 'body', updatedAt: 1, tags: [] }])
    renderNotes()
    fireEvent.click(screen.getByRole('button', { name: 'Edit note' }))
    fireEvent.change(screen.getByDisplayValue('Original'), { target: { value: 'Renamed' } })
    fireEvent.keyDown(screen.getByRole('group', { name: 'Edit note' }), {
      key: 'Enter',
      metaKey: true,
    })
    // Edit committed and the card returned to view mode.
    expect(screen.queryByRole('group', { name: 'Edit note' })).toBeNull()
    expect(useStore.getState().notes[0].title).toBe('Renamed')
  })
})
