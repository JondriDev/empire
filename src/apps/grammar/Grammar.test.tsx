import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Grammar from './Grammar'

/**
 * Grammar Fix a11y + behaviour. The component is self-contained (no network),
 * so these tests drive the real UI: the Check/Fix segmented toggle must expose
 * its active state to assistive tech via `aria-pressed` (it is otherwise
 * conveyed by background colour alone), the textarea must carry a programmatic
 * label, and the debounced analysis must surface issues into the live region.
 */
describe('Grammar Fix — a11y + analysis', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('labels the textarea for screen readers', () => {
    render(<Grammar />)
    expect(screen.getByLabelText('Text to check for grammar issues')).toBeTruthy()
  })

  it('exposes the mode toggle state via aria-pressed and flips it on click', () => {
    render(<Grammar />)
    const check = screen.getByRole('button', { name: /check/i })
    const fix = screen.getByRole('button', { name: /fix/i })
    // Default mode is 'check'.
    expect(check.getAttribute('aria-pressed')).toBe('true')
    expect(fix.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(fix)
    expect(check.getAttribute('aria-pressed')).toBe('false')
    expect(fix.getAttribute('aria-pressed')).toBe('true')
  })

  it('groups the mode toggle under a labelled group', () => {
    render(<Grammar />)
    expect(screen.getByRole('group', { name: 'Analysis mode' })).toBeTruthy()
  })

  it('shows a getting-started empty state while idle, and clears it once text is entered', () => {
    render(<Grammar />)
    // Idle: the shared empty-state invites the user to start.
    expect(screen.getByText('Check your writing')).toBeTruthy()
    const input = screen.getByLabelText('Text to check for grammar issues')
    fireEvent.change(input, { target: { value: 'Some text.' } })
    // Once there's something to analyze the empty state gives way to the stats/results.
    expect(screen.queryByText('Check your writing')).toBeNull()
  })

  it('surfaces detected issues after the debounced analysis', async () => {
    render(<Grammar />)
    const input = screen.getByLabelText('Text to check for grammar issues')
    // "i am" trips the capitalize-"I" rule — a reliable, deterministic issue.
    fireEvent.change(input, { target: { value: 'i am here' } })
    await waitFor(
      () => expect(screen.getByText(/Found/)).toBeTruthy(),
      { timeout: 1500 },
    )
    // The live-region subtitle reflects a non-zero count.
    await waitFor(() =>
      expect(screen.queryByText(/0 issues found/)).toBeNull(),
    )
  })

  it('shows the clean-text status when no issues are found', async () => {
    render(<Grammar />)
    const input = screen.getByLabelText('Text to check for grammar issues')
    fireEvent.change(input, { target: { value: 'The cat sat.' } })
    await waitFor(
      () => expect(screen.getByText(/No issues found/)).toBeTruthy(),
      { timeout: 1500 },
    )
  })
})
