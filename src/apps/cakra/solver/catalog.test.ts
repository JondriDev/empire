import { describe, expect, it } from 'vitest'
import { CATEGORIES, WORLD_CATALOG } from './catalog'

describe('world catalog', () => {
  it('ships a meaningful backlog (30+ problems)', () => {
    expect(WORLD_CATALOG.length).toBeGreaterThanOrEqual(30)
  })

  it('has unique catalogIds', () => {
    const ids = WORLD_CATALOG.map(c => c.catalogId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every entry is complete and in range', () => {
    for (const c of WORLD_CATALOG) {
      expect(c.title.trim()).not.toBe('')
      expect(c.blurb.trim()).not.toBe('')
      expect((CATEGORIES as readonly string[]).includes(c.category)).toBe(true)
      expect(c.severity).toBeGreaterThanOrEqual(1)
      expect(c.severity).toBeLessThanOrEqual(5)
      expect(c.tractability).toBeGreaterThanOrEqual(1)
      expect(c.tractability).toBeLessThanOrEqual(5)
    }
  })
})
