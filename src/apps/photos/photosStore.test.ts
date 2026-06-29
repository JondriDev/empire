import { describe, it, expect } from 'vitest'
import {
  toStorableMeta,
  rehydrateMedia,
  type MediaRecord,
} from '../../lib/mediaStore'

// Mirrors the Photo shape in Photos.tsx — pins the Photo contract against the
// shared media rail so a future field-strip regression (e.g. accidentally
// persisting the volatile blob `src`, or losing favorite/tags) fails loudly.
interface Photo extends MediaRecord {
  id: string
  src: string
  name: string
  size: number
  width?: number
  height?: number
  date: string
  tags: string[]
  favorite: boolean
  ephemeral?: boolean
}

const photo = (over: Partial<Photo> = {}): Photo => ({
  id: 'p1',
  src: 'blob:session/abc',
  name: 'sunset.png',
  size: 12345,
  width: 1920,
  height: 1080,
  date: '2026-06-29T00:00:00.000Z',
  tags: ['sky', 'travel'],
  favorite: true,
  ...over,
})

describe('photos storable metadata', () => {
  it('strips the volatile blob src so a dead URL never reaches localStorage', () => {
    const [meta] = toStorableMeta([photo()])
    expect('src' in meta).toBe(false)
  })

  it('keeps favorite, tags, dimensions, name, size and date', () => {
    const [meta] = toStorableMeta([photo()])
    expect(meta).toEqual({
      id: 'p1',
      name: 'sunset.png',
      size: 12345,
      width: 1920,
      height: 1080,
      date: '2026-06-29T00:00:00.000Z',
      tags: ['sky', 'travel'],
      favorite: true,
    })
  })

  it('drops session-only (ephemeral, oversized) photos so they never persist as ghosts', () => {
    const stored = toStorableMeta([
      photo({ id: 'keep' }),
      photo({ id: 'huge', ephemeral: true }),
    ])
    expect(stored.map(s => s.id)).toEqual(['keep'])
    expect('ephemeral' in stored[0]).toBe(false)
  })
})

describe('photos rehydrate on reload', () => {
  it('re-attaches a fresh object URL for every recovered blob', () => {
    const stored = toStorableMeta([photo({ id: 'a' }), photo({ id: 'b' })])
    const urls = new Map([
      ['a', 'blob:fresh/a'],
      ['b', 'blob:fresh/b'],
    ])
    const live = rehydrateMedia<Photo>(stored, id => urls.get(id) ?? null)
    expect(live.map(p => p.src)).toEqual(['blob:fresh/a', 'blob:fresh/b'])
    // non-volatile metadata survives the round trip
    expect(live[0]).toMatchObject({ name: 'sunset.png', favorite: true, tags: ['sky', 'travel'] })
  })

  it('DROPS a photo whose blob is missing — the broken-image grid bug is fixed', () => {
    const stored = toStorableMeta([photo({ id: 'a' }), photo({ id: 'gone' })])
    const live = rehydrateMedia<Photo>(stored, id => (id === 'a' ? 'blob:fresh/a' : null))
    expect(live.map(p => p.id)).toEqual(['a'])
  })

  it('round-trips strip → rehydrate without ever persisting the dead blob URL', () => {
    const stored = toStorableMeta([photo({ id: 'a', src: 'blob:old/a' })])
    const live = rehydrateMedia<Photo>(stored, () => 'blob:new/a')
    expect(live[0]).toMatchObject({ id: 'a', name: 'sunset.png', src: 'blob:new/a' })
    expect(JSON.stringify(stored)).not.toContain('blob:old/a')
  })
})
