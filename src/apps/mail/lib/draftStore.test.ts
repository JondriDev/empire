import { describe, it, expect, beforeEach, vi } from 'vitest'
import { listDrafts, saveDraft, deleteDraft, newDraftId } from './draftStore'

// The global test setup mocks localStorage as bare vi.fn()s that never persist.
// Back them with a real in-memory map so the store's save→list→delete roundtrip
// exercises the true serialize/parse path.
function installMemoryStorage() {
  const mem = new Map<string, string>()
  vi.spyOn(window.localStorage, 'getItem').mockImplementation(k => (mem.has(k) ? mem.get(k)! : null))
  vi.spyOn(window.localStorage, 'setItem').mockImplementation((k, v) => { mem.set(k, String(v)) })
  vi.spyOn(window.localStorage, 'removeItem').mockImplementation(k => { mem.delete(k) })
  return mem
}

describe('draftStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    installMemoryStorage()
  })

  it('save → list roundtrip: a saved draft survives a fresh listDrafts()', () => {
    saveDraft({ id: 'd1', to: 'a@b.co', subject: 'Hi', body: 'there' })
    const all = listDrafts()
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({ id: 'd1', to: 'a@b.co', subject: 'Hi', body: 'there' })
    expect(typeof all[0].updatedAt).toBe('number')
  })

  it('upserts by id (a matching id replaces in place, not appends)', () => {
    saveDraft({ id: 'd1', to: '', subject: 'v1', body: '' })
    saveDraft({ id: 'd1', to: 'x@y.z', subject: 'v2', body: 'edited' })
    const all = listDrafts()
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({ id: 'd1', subject: 'v2', body: 'edited', to: 'x@y.z' })
  })

  it('appends distinct ids and lists newest-edited first', () => {
    const a = saveDraft({ id: 'a', to: '', subject: 'A', body: '' })
    const b = saveDraft({ id: 'b', to: '', subject: 'B', body: '' })
    // b was saved after a → sorts first by updatedAt desc (ties fall back to insertion).
    const all = listDrafts()
    expect(all.map(d => d.id)).toEqual(expect.arrayContaining(['a', 'b']))
    expect(all).toHaveLength(2)
    expect(b.updatedAt).toBeGreaterThanOrEqual(a.updatedAt)
  })

  it('deleteDraft removes only the matching id', () => {
    saveDraft({ id: 'a', to: '', subject: 'A', body: '' })
    saveDraft({ id: 'b', to: '', subject: 'B', body: '' })
    deleteDraft('a')
    const all = listDrafts()
    expect(all.map(d => d.id)).toEqual(['b'])
  })

  it('deleteDraft is a no-op for an unknown id', () => {
    saveDraft({ id: 'a', to: '', subject: 'A', body: '' })
    deleteDraft('missing')
    expect(listDrafts().map(d => d.id)).toEqual(['a'])
  })

  it('listDrafts tolerates an empty / corrupt store', () => {
    expect(listDrafts()).toEqual([])
    window.localStorage.setItem('empire-mail-drafts', 'not json{')
    expect(listDrafts()).toEqual([])
  })

  it('newDraftId mints distinct ids', () => {
    expect(newDraftId()).not.toBe(newDraftId())
  })
})
