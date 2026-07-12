import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IconButton, Select, Segmented, Slider, Input } from './index'

describe('Input (seamless)', () => {
  it('renders a borderless textbox that still emits the raw string value', () => {
    const fn = vi.fn()
    render(<Input seamless value="hi" onChange={fn} aria-label="Cell" />)
    const el = screen.getByRole('textbox', { name: 'Cell' }) as HTMLInputElement
    expect(el.value).toBe('hi')
    // The seamless wrapper is transparent + borderless (no glass chrome).
    const wrap = el.parentElement as HTMLElement
    expect(wrap.style.background).toBe('transparent')
    fireEvent.change(el, { target: { value: 'ho' } })
    expect(fn).toHaveBeenCalledWith('ho')
  })
})

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

describe('Slider', () => {
  it('renders a range slider carrying the required aria-label', () => {
    render(<Slider value={5} min={0} max={10} onChange={() => {}} aria-label="Seek" />)
    const el = screen.getByRole('slider', { name: 'Seek' }) as HTMLInputElement
    expect(el.getAttribute('type')).toBe('range')
    expect(el.value).toBe('5')
  })

  it('emits a numeric value (not a string) on change', () => {
    const fn = vi.fn()
    render(<Slider value={0} min={0} max={1} step={0.1} onChange={fn} aria-label="Volume" />)
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0.4' } })
    expect(fn).toHaveBeenCalledWith(0.4)
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
