import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Flashcards from './Flashcards'

/**
 * EPIC-14 S5 — Flashcards migrated onto the `ui` shell primitives (Button /
 * IconButton): no bare interactive control remains. These tests lock the
 * migrated controls' semantics — "New Deck" / "Got it" / "Don't know" are named
 * Buttons, and every icon-only study control (prev, flip, next, add card,
 * delete deck) carries an accessible name it did not have as a bare `<button>`.
 */

describe('Flashcards — S5 shell migration', () => {
  beforeEach(() => { localStorage.clear() })

  it('exposes New Deck and the per-deck delete as named controls', () => {
    render(<Flashcards />)
    expect(screen.getByRole('button', { name: 'New Deck' })).toBeTruthy()
    // Seeded decks each get an accessible delete name.
    expect(screen.getByRole('button', { name: 'Delete deck JavaScript Fundamentals' })).toBeTruthy()
  })

  it('gives the study controls accessible names once a deck is open', () => {
    render(<Flashcards />)
    fireEvent.click(screen.getByText('JavaScript Fundamentals'))
    expect(screen.getByRole('button', { name: 'Previous card' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Flip card' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next card' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add card' })).toBeTruthy()
    expect(screen.getByRole('button', { name: "Don't know" })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Got it' })).toBeTruthy()
  })
})
