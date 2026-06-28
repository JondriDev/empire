import { describe, it, expect } from 'vitest'
import {
  toStorableMeta,
  rehydrateMedia,
  shouldPersistBlob,
  MEDIA_SIZE_CAP,
  type MediaRecord,
} from './mediaStore'

interface Track extends MediaRecord {
  id: string
  src: string
  title: string
  artist: string
  duration: number
  ephemeral?: boolean
}

const track = (over: Partial<Track> = {}): Track => ({
  id: 't1',
  src: 'blob:session/abc',
  title: 'Song',
  artist: 'Artist',
  duration: 120,
  ...over,
})

describe('toStorableMeta', () => {
  it('strips the volatile blob src so a dead URL never reaches localStorage', () => {
    const stored = toStorableMeta([track()])
    expect(stored).toHaveLength(1)
    expect('src' in stored[0]).toBe(false)
  })

  it('preserves all non-volatile metadata', () => {
    const [meta] = toStorableMeta([track({ id: 'x', title: 'T', artist: 'A', duration: 99 })])
    expect(meta).toEqual({ id: 'x', title: 'T', artist: 'A', duration: 99 })
  })

  it('drops session-only (ephemeral) items so they never persist as ghosts', () => {
    const stored = toStorableMeta([
      track({ id: 'keep' }),
      track({ id: 'big', ephemeral: true }),
    ])
    expect(stored.map((s) => s.id)).toEqual(['keep'])
    expect('ephemeral' in stored[0]).toBe(false)
  })

  it('handles an empty library', () => {
    expect(toStorableMeta([])).toEqual([])
  })
})

describe('rehydrateMedia', () => {
  it('attaches a fresh object URL for every recovered blob', () => {
    const stored = toStorableMeta([track({ id: 'a' }), track({ id: 'b' })])
    const urls = new Map([
      ['a', 'blob:fresh/a'],
      ['b', 'blob:fresh/b'],
    ])
    const live = rehydrateMedia<Track>(stored, (id) => urls.get(id) ?? null)
    expect(live).toHaveLength(2)
    expect(live[0].src).toBe('blob:fresh/a')
    expect(live[1].src).toBe('blob:fresh/b')
    expect(live[0].title).toBe('Song')
  })

  it('DROPS items whose blob is missing — the ghost-row bug is fixed', () => {
    const stored = toStorableMeta([track({ id: 'a' }), track({ id: 'gone' })])
    const live = rehydrateMedia<Track>(stored, (id) => (id === 'a' ? 'blob:fresh/a' : null))
    expect(live.map((t) => t.id)).toEqual(['a'])
  })

  it('round-trips strip → rehydrate into a playable library', () => {
    const original = [track({ id: 'a', src: 'blob:old/a' })]
    const stored = toStorableMeta(original)
    const live = rehydrateMedia<Track>(stored, () => 'blob:new/a')
    expect(live[0]).toMatchObject({ id: 'a', title: 'Song', src: 'blob:new/a' })
    // the persisted form never carried the old (dead) blob URL
    expect(JSON.stringify(stored)).not.toContain('blob:old/a')
  })

  it('returns an empty library when nothing was stored', () => {
    expect(rehydrateMedia<Track>([], () => 'blob:x')).toEqual([])
  })
})

describe('shouldPersistBlob', () => {
  it('persists blobs at or under the cap', () => {
    expect(shouldPersistBlob(0)).toBe(true)
    expect(shouldPersistBlob(MEDIA_SIZE_CAP)).toBe(true)
  })

  it('skips blobs over the cap (kept session-only to protect quota)', () => {
    expect(shouldPersistBlob(MEDIA_SIZE_CAP + 1)).toBe(false)
  })

  it('rejects bogus sizes', () => {
    expect(shouldPersistBlob(NaN)).toBe(false)
    expect(shouldPersistBlob(-1)).toBe(false)
  })
})
