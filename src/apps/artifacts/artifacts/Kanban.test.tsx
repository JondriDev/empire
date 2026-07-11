import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Kanban from './Kanban'

/**
 * EPIC-14 S5 — Kanban migrated onto the `ui` shell primitives (Button /
 * IconButton / Input): no bare interactive control remains. These tests lock
 * the migrated controls' semantics — "Reset to demo" / "Add" are named Buttons,
 * the per-column add and per-card remove are named IconButtons, and the
 * new-task title/tag fields are named Inputs. The graph mirror + NodeActions
 * are stubbed (the mirrorCollection path is untouched by S5).
 */

vi.mock('../../../lib/core/sync', () => ({ mirrorCollection: vi.fn() }))
vi.mock('../../../components/ui/NodeActions', () => ({ NodeActions: () => null }))

describe('Kanban — S5 shell migration', () => {
  beforeEach(() => { localStorage.clear() })

  it('exposes the reset action and per-column add as named controls', () => {
    render(<Kanban />)
    expect(screen.getByRole('button', { name: 'Reset to demo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add task to To Do' })).toBeTruthy()
  })

  it('opens a named new-task form with named Inputs and Add button', () => {
    render(<Kanban />)
    fireEvent.click(screen.getByRole('button', { name: 'Add task to To Do' }))
    expect(screen.getByLabelText('Task title')).toBeTruthy()
    expect(screen.getByLabelText('Task tag')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel new task' })).toBeTruthy()
  })
})
