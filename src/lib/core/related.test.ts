import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { significantTerms, relatedTo } from './related'
import type { CoreNode } from './graph'

let seq = 0
const node = (
  partial: Partial<CoreNode> & { title: string },
): CoreNode => ({
  id: partial.id ?? `n${seq++}`,
  type: partial.type ?? 'note',
  title: partial.title,
  data: partial.data ?? {},
  links: partial.links ?? [],
  meta: {
    created: partial.meta?.created ?? 0,
    updated: partial.meta?.updated ?? 0,
    app: partial.meta?.app ?? 'notes',
  },
})

describe('significantTerms', () => {
  it('unions title + body tokens, keeps length ≥ 4, drops stopwords + short terms', () => {
    const n = node({
      title: 'Xenobloom is a rare flower',
      data: { body: 'notes about the bloom', tags: ['botany'] },
    })
    const terms = significantTerms(n)
    expect(terms).toContain('xenobloom')
    expect(terms).toContain('flower')
    expect(terms).toContain('bloom')
    expect(terms).toContain('botany')
    // 'is', 'a' too short; 'about', 'the' are stopwords / short
    expect(terms).not.toContain('is')
    expect(terms).not.toContain('about')
    expect(terms).not.toContain('the')
  })

  it('dedupes repeated terms', () => {
    const n = node({ title: 'signal signal', data: { note: 'signal again' } })
    expect(significantTerms(n).filter(t => t === 'signal')).toHaveLength(1)
  })
})

describe('relatedTo', () => {
  const DAY = 86_400_000
  const d = (i: number) => ({ created: i * DAY, updated: i * DAY, app: 'notes' })

  it('relates two notes that share a significant term (distinct days, so only the term signal fires)', () => {
    const a = node({ id: 'a', title: 'The Xenobloom garden', meta: d(1) })
    const b = node({ id: 'b', title: 'Growing Xenobloom indoors', meta: d(2) })
    const c = node({ id: 'c', title: 'A completely different topic', meta: d(3) })
    const out = relatedTo([a, b, c], 'a')
    expect(out.map(r => r.node.id)).toEqual(['b'])
    expect(out[0].reasons).toEqual(['shared-term'])
  })

  it('excludes a node with no overlap', () => {
    const a = node({ id: 'a', title: 'Xenobloom', meta: d(1) })
    const b = node({ id: 'b', title: 'Quantum mesh drive', meta: d(5) })
    expect(relatedTo([a, b], 'a')).toEqual([])
  })

  it('an explicit data.from link scores highest with reasons starting linked', () => {
    const a = node({ id: 'a', title: 'Xenobloom notes' })
    const linked = node({ id: 'b', title: 'Xenobloom follow-up', data: { from: 'a' } })
    const termOnly = node({ id: 'c', title: 'Xenobloom sighting' })
    const out = relatedTo([a, linked, termOnly], 'a')
    expect(out[0].node.id).toBe('b')
    expect(out[0].reasons[0]).toBe('linked')
    expect(out[0].score).toBeGreaterThan(out[1].score)
  })

  it('counts a graph link as linked in both directions', () => {
    const a = node({ id: 'a', title: 'alpha', links: ['b'] })
    const b = node({ id: 'b', title: 'beta' })
    const c = node({ id: 'c', title: 'gamma', links: ['a'] })
    const fromA = relatedTo([a, b, c], 'a')
    expect(fromA.find(r => r.node.id === 'b')?.reasons).toContain('linked') // T -> N
    expect(fromA.find(r => r.node.id === 'c')?.reasons).toContain('linked') // N -> T
  })

  it('relates on a shared tag', () => {
    // Use sub-4-char tags so they don't ALSO count as significant terms
    // (significantTerms reads nodeBodyText, which includes tag strings ≥ 4 chars).
    const a = node({ id: 'a', title: 'one', data: { tags: ['zen'] }, meta: d(1) })
    const b = node({ id: 'b', title: 'two', data: { tags: ['zen', 'ux'] }, meta: d(2) })
    const c = node({ id: 'c', title: 'six', data: { tags: ['no'] }, meta: d(3) })
    const out = relatedTo([a, b, c], 'a')
    expect(out.map(r => r.node.id)).toEqual(['b'])
    expect(out[0].reasons).toEqual(['shared-tag'])
    expect(out[0].score).toBe(4)
  })

  it('relates on same creation day', () => {
    const day = Date.parse('2026-07-15T09:00:00Z')
    const same = Date.parse('2026-07-15T23:00:00Z')
    const other = Date.parse('2026-07-16T01:00:00Z')
    const a = node({ id: 'a', title: 'alpha', meta: { created: day, updated: day, app: 'notes' } })
    const b = node({ id: 'b', title: 'beta', meta: { created: same, updated: same, app: 'notes' } })
    const c = node({ id: 'c', title: 'gamma', meta: { created: other, updated: other, app: 'notes' } })
    const out = relatedTo([a, b, c], 'a')
    expect(out.map(r => r.node.id)).toEqual(['b'])
    expect(out[0].reasons).toEqual(['same-day'])
    expect(out[0].score).toBe(2)
  })

  // Regression: the same-day signal must bucket by the user's LOCAL calendar day
  // (matching Calendar's `data.date`), not by UTC. A naive `toISOString()` bucket
  // fires on the wrong day for any non-UTC user — false positives just after local
  // midnight, false negatives just after UTC midnight. Forced TZ so a UTC CI (where
  // local == UTC and the bug hides) still exercises it.
  describe('same-day buckets by local calendar day, not UTC', () => {
    const realTZ = process.env.TZ
    beforeAll(() => { process.env.TZ = 'Asia/Jakarta' }) // UTC+7
    afterAll(() => { process.env.TZ = realTZ })

    it('does NOT relate two entities that share a UTC day but fall on different local days', () => {
      // Both are 2026-07-14 in UTC, but in Jakarta a is 07-15 06:00 and b is 07-14 20:00.
      const a = node({ id: 'a', title: 'alpha', meta: { created: Date.parse('2026-07-14T23:00:00Z'), updated: 0, app: 'notes' } })
      const b = node({ id: 'b', title: 'bravo', meta: { created: Date.parse('2026-07-14T13:00:00Z'), updated: 0, app: 'notes' } })
      expect(relatedTo([a, b], 'a')).toEqual([])
    })

    it('DOES relate two entities that share a local day but fall on different UTC days', () => {
      // c is 2026-07-14 UTC and d is 2026-07-15 UTC, but in Jakarta both are 07-15.
      const c = node({ id: 'c', title: 'charlie', meta: { created: Date.parse('2026-07-14T20:00:00Z'), updated: 0, app: 'notes' } })
      const d = node({ id: 'd', title: 'delta', meta: { created: Date.parse('2026-07-15T02:00:00Z'), updated: 0, app: 'notes' } })
      const out = relatedTo([c, d], 'c')
      expect(out.map(r => r.node.id)).toEqual(['d'])
      expect(out[0].reasons).toEqual(['same-day'])
    })
  })

  it('does not relate via stopwords or sub-4-char terms', () => {
    const a = node({ id: 'a', title: 'they were here', meta: d(1) })
    const b = node({ id: 'b', title: 'they were there', meta: d(4) })
    expect(relatedTo([a, b], 'a')).toEqual([])
  })

  it('excludes the target itself', () => {
    const a = node({ id: 'a', title: 'Xenobloom', links: ['a'] })
    expect(relatedTo([a], 'a')).toEqual([])
  })

  it('returns [] when the id is missing', () => {
    const a = node({ id: 'a', title: 'alpha' })
    expect(relatedTo([a], 'nope')).toEqual([])
  })

  it('returns [] for an empty graph', () => {
    expect(relatedTo([], 'a')).toEqual([])
  })

  it('caps to the limit', () => {
    const target = node({ id: 't', title: 'Xenobloom hub' })
    const others = Array.from({ length: 10 }, (_, i) =>
      node({ id: `x${i}`, title: `Xenobloom satellite ${i}` }),
    )
    expect(relatedTo([target, ...others], 't', 3)).toHaveLength(3)
  })

  it('sorts by score desc then meta.updated desc', () => {
    const t = node({ id: 't', title: 'Xenobloom', data: { tags: ['aurora'] } })
    // linked (+8) wins; then two term-only nodes tie on score, newer updated first.
    const linked = node({ id: 'l', title: 'unrelated words', data: { from: 't' }, meta: { created: 0, updated: 5, app: 'notes' } })
    const older = node({ id: 'o', title: 'Xenobloom old', meta: { created: 0, updated: 1, app: 'notes' } })
    const newer = node({ id: 'n', title: 'Xenobloom new', meta: { created: 0, updated: 9, app: 'notes' } })
    const out = relatedTo([t, older, linked, newer], 't')
    expect(out.map(r => r.node.id)).toEqual(['l', 'n', 'o'])
  })

  it('accumulates multiple signals with ordered reasons', () => {
    const day = 1_000
    const t = node({ id: 't', title: 'Xenobloom bloom', data: { tags: ['botany'] }, meta: { created: day, updated: day, app: 'notes' } })
    const n = node({
      id: 'n',
      title: 'Xenobloom bloom guide',
      data: { from: 't', tags: ['botany'] },
      meta: { created: day, updated: day, app: 'notes' },
    })
    const out = relatedTo([t, n], 't')
    // linked +8, shared-tag +4, shared-term +9 (xenobloom · bloom · botany — the
    // 'botany' tag counts as a term too since significantTerms reads nodeBodyText,
    // which folds in tag strings), same-day +2 → 23.
    expect(out[0].reasons).toEqual(['linked', 'shared-tag', 'shared-term', 'same-day'])
    expect(out[0].score).toBe(8 + 4 + 9 + 2)
  })
})
