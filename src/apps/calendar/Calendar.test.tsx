import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Calendar from './Calendar'

/**
 * EPIC-14 S3 — Calendar migrated onto the `ui` shell primitives (Button /
 * IconButton / Input / TextArea): no bare interactive control remains. These
 * tests lock the migrated controls' accessible names — every icon-only action
 * (month nav, day add, modal close, colour swatch) carries a name it did not
 * have as a bare `<button>` — and verify the New-Event modal opens through the
 * shelled CTA and saves through the primary Button, so a regression back to a
 * bare control or a nameless icon button is caught here, not only by the
 * off-shell-control metric.
 *
 * The organism wiring (eventBus, graph mirror, NodeActions, inbound handoff,
 * provenance/lineage chips) is stubbed — this suite exercises Calendar's own
 * control shell, not the cross-app rails.
 */

vi.mock('../../lib/eventBus', () => ({ emit: vi.fn() }))
vi.mock('../../lib/core/sync', () => ({ mirrorCollection: vi.fn() }))
vi.mock('../../components/ui/NodeActions', () => ({ NodeActions: () => null }))
vi.mock('../../components/ui/ProvenanceChip', () => ({ ProvenanceChip: () => null }))
vi.mock('../../components/ui/LineageTrail', () => ({ LineageTrail: () => null }))
vi.mock('../../lib/useInboundHandoff', () => ({
  useInboundHandoff: () => ({ payload: null, source: null, dismiss: vi.fn() }),
}))

describe('Calendar — S3 shell migration', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('names the month-navigation icon controls (Previous / Today / Next)', () => {
    render(<Calendar />)
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next month' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy()
  })

  it('opens the New Event modal from the shelled "Add Event" CTA', () => {
    render(<Calendar />)
    fireEvent.click(screen.getByRole('button', { name: /Add Event/ }))
    // The modal title + a named, non-bare Create button confirm the shell mounted.
    expect(screen.getByText('New Event')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Create/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy()
  })

  it('exposes each colour swatch as a named, toggle-state control', () => {
    render(<Calendar />)
    fireEvent.click(screen.getByRole('button', { name: /Add Event/ }))
    // Purple is the default new-event colour (bg-signal) → pressed on open.
    const purple = screen.getByRole('button', { name: 'Purple' })
    expect(purple.getAttribute('aria-pressed')).toBe('true')
    const blue = screen.getByRole('button', { name: 'Blue' })
    expect(blue.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(blue)
    expect(blue.getAttribute('aria-pressed')).toBe('true')
    expect(purple.getAttribute('aria-pressed')).toBe('false')
  })

  it('creates an event through the shelled Input + primary Button', () => {
    render(<Calendar />)
    fireEvent.click(screen.getByRole('button', { name: /Add Event/ }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Standup' } })
    fireEvent.click(screen.getByRole('button', { name: /Create/ }))
    // Modal closes on save (its title is gone) and the event surfaces in the list.
    expect(screen.queryByText('New Event')).toBeNull()
    expect(screen.getByText('Standup')).toBeTruthy()
  })
})

// Regression: the highlighted "today" cell must be the user's LOCAL calendar day,
// not the UTC day. The grid cells + getEventsForDay are built from LOCAL Y/M/D, but
// `today` was derived from `new Date().toISOString()` (UTC). For any negative-offset
// user in the evening, UTC has already rolled to tomorrow, so the wrong cell lit up
// (and the default event date / side-panel header disagreed with the events shown).
// TZ forced so a UTC CI (where local == UTC and the bug hides) still exercises it.
// Same class as the related.ts / weather UTC fixes — reuse the ONE local-day format.
describe('Calendar — "today" highlight uses the LOCAL day, not UTC', () => {
  const realTZ = process.env.TZ
  beforeEach(() => {
    process.env.TZ = 'America/Los_Angeles' // UTC-7 in July (PDT)
    // Fake ONLY Date (leave setTimeout/microtasks real so React render is unaffected).
    vi.useFakeTimers({ toFake: ['Date'] })
    // 2026-07-16T05:00Z === 2026-07-15 22:00 PDT → LOCAL day is the 15th, UTC day is the 16th.
    vi.setSystemTime(new Date('2026-07-16T05:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    process.env.TZ = realTZ
  })

  it('marks the local-day cell (Jul 15) as today, and NOT the UTC-day cell (Jul 16)', () => {
    render(<Calendar />)
    const localCell = screen.getByRole('button', { name: 'Select 2026-07-15' })
    const utcCell = screen.getByRole('button', { name: 'Select 2026-07-16' })
    expect(localCell.className).toContain('bg-signal/10')
    expect(utcCell.className).not.toContain('bg-signal/10')
  })
})
