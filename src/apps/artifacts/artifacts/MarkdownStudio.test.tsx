import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MarkdownStudio from './MarkdownStudio'

/**
 * EPIC-14 S5 — MarkdownStudio migrated onto the `ui` shell primitives (Button /
 * TextArea / Segmented): no bare interactive control remains. These tests lock
 * the migrated controls' semantics — the edit/split/preview toggle is a proper
 * single-select `radiogroup` (radios with aria-checked, NOT aria-pressed),
 * Reset/Copy/Download are named Buttons, and the editor is a real textbox.
 */

describe('MarkdownStudio — S5 shell migration', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders the mode toggle as a single-select radiogroup', () => {
    render(<MarkdownStudio />)
    expect(screen.getByRole('radiogroup', { name: 'Editor mode' })).toBeTruthy()
    const split = screen.getByRole('radio', { name: 'Split' })
    expect(split.getAttribute('aria-checked')).toBe('true')
    const edit = screen.getByRole('radio', { name: 'Edit' })
    fireEvent.click(edit)
    expect(edit.getAttribute('aria-checked')).toBe('true')
    expect(split.getAttribute('aria-checked')).toBe('false')
  })

  it('exposes the toolbar actions as named Buttons and the editor as a textbox', () => {
    render(<MarkdownStudio />)
    expect(screen.getByRole('button', { name: 'Reset' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Download .md' })).toBeTruthy()
    expect(screen.getByRole('textbox')).toBeTruthy()
  })
})
