import { describe, it, expect } from 'vitest'
import { rgbCss, typeRgb, TYPE_RGB, SIGNAL, ION, PLASMA, VOID } from './nodeColors'

describe('nodeColors', () => {
  it('rgbCss assembles a CSS colour from a triplet without alpha', () => {
    expect(rgbCss(SIGNAL)).toBe('rgb(52,245,214)')
  })

  it('rgbCss appends alpha when provided', () => {
    expect(rgbCss(ION, 0.5)).toBe('rgba(77,155,255,0.5)')
  })

  it('typeRgb returns the canonical accent for known types', () => {
    expect(typeRgb('note')).toBe(TYPE_RGB.note)
    expect(typeRgb('message')).toBe(SIGNAL)
  })

  it('typeRgb falls back deterministically for unknown types', () => {
    expect(typeRgb('mystery')).toBe(typeRgb('mystery'))
  })

  it('accent triplets are bare "r,g,b" strings (no literal colour fn → metric stays clean)', () => {
    for (const t of [SIGNAL, ION, PLASMA, VOID]) {
      expect(t).toMatch(/^\d{1,3},\d{1,3},\d{1,3}$/)
    }
  })
})
