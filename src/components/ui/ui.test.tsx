import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IconButton, Select, Segmented } from './index'

describe('IconButton', () => {
  it('renders as a button carrying the required aria-label', () => {
    render(<IconButton icon={<svg />} aria-label="Delete" onClick={() => {}} />)
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy()
  })

  it('fires onClick', () => {
    const fn = vi.fn()
    render(<IconButton icon={<svg />} aria-label="Play" onClick={fn} />)
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('is type=button (never submits a form)', () => {
    render(<IconButton icon={<svg />} aria-label="X" onClick={() => {}} />)
    expect(screen.getByRole('button', { name: 'X' }).getAttribute('type')).toBe('button')
  })
})

describe('Select', () => {
  const opts = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ]

  it('renders the options and reflects the value', () => {
    render(<Select value="b" onChange={() => {}} options={opts} ariaLabel="Pick" />)
    const el = screen.getByRole('combobox', { name: 'Pick' }) as HTMLSelectElement
    expect(el.value).toBe('b')
    expect(screen.getByRole('option', { name: 'Alpha' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Beta' })).toBeTruthy()
  })

  it('emits the raw value string on change', () => {
    const fn = vi.fn()
    render(<Select value="a" onChange={fn} options={opts} ariaLabel="Pick" />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Pick' }), { target: { value: 'b' } })
    expect(fn).toHaveBeenCalledWith('b')
  })
})

describe('Segmented', () => {
  const items = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
  ]

  it('is a radiogroup whose selected item is aria-checked', () => {
    render(<Segmented value="week" onChange={() => {}} items={items} ariaLabel="View" />)
    expect(screen.getByRole('radiogroup', { name: 'View' })).toBeTruthy()
    expect((screen.getByRole('radio', { name: 'Week' }) as HTMLButtonElement).getAttribute('aria-checked')).toBe('true')
    expect((screen.getByRole('radio', { name: 'Day' }) as HTMLButtonElement).getAttribute('aria-checked')).toBe('false')
  })

  it('emits the item value on click', () => {
    const fn = vi.fn()
    render(<Segmented value="day" onChange={fn} items={items} ariaLabel="View" />)
    fireEvent.click(screen.getByRole('radio', { name: 'Week' }))
    expect(fn).toHaveBeenCalledWith('week')
  })

  it('falls back to ariaLabel when an item has an icon but no text label', () => {
    render(
      <Segmented
        value="a"
        onChange={() => {}}
        items={[{ value: 'a', icon: <svg />, ariaLabel: 'List view' }]}
        ariaLabel="Layout"
      />,
    )
    expect(screen.getByRole('radio', { name: 'List view' })).toBeTruthy()
  })
})
