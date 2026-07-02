import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LineageTrail } from './LineageTrail'
import { useProvenance } from '../../lib/core/provenance'

beforeEach(() => {
  // Start every case from an empty durable ledger.
  useProvenance.setState({ edges: [] })
})

describe('LineageTrail', () => {
  it('renders the direct pair when a concrete `from` is supplied (durable, no ledger needed)', () => {
    render(<LineageTrail app="goals" from="calculator" />)
    // Both the receiving app and its stored source are named on the trail.
    expect(screen.getByText('Goals')).toBeTruthy()
    expect(screen.getByText('Calculator')).toBeTruthy()
    // The accessible label reads as origin ("From <source>").
    expect(screen.getByRole('note').getAttribute('aria-label')).toContain('Calculator')
  })

  it('renders nothing for an app with no `from` and no ledger history', () => {
    const { container } = render(<LineageTrail app="goals" />)
    expect(container.firstChild).toBeNull()
  })

  it('walks the durable ledger when no `from` is given', () => {
    // A recorded editor→notes edge means Notes was fed by Editor.
    useProvenance.setState({ edges: [{ fromApp: 'editor', toApp: 'notes', at: 1 }] })
    render(<LineageTrail app="notes" />)
    expect(screen.getByText('Notes')).toBeTruthy()
    expect(screen.getByText('Code Editor')).toBeTruthy()
  })
})
