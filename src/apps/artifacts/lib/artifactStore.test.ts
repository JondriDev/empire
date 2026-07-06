import { beforeEach, describe, expect, it } from 'vitest'
import { localStorageMock } from '../../../test/setup'
import {
  GENERATED_KEY,
  deleteGenerated,
  getGeneratedContent,
  listGenerated,
  newArtifactId,
  renameGenerated,
  saveGenerated,
} from './artifactStore'

// The global setup stubs localStorage with no-op vi.fn()s; back them with a
// real map here so the persistence rail itself is what gets pinned. jsdom has
// no IndexedDB, so these tests also exercise the `inline` fallback path —
// the same one private-mode browsers hit.
const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  localStorageMock.getItem.mockImplementation((k: string) => store.get(k) ?? null)
  localStorageMock.setItem.mockImplementation((k: string, v: string) => { store.set(k, String(v)) })
  localStorageMock.removeItem.mockImplementation((k: string) => { store.delete(k) })
})

describe('artifactStore', () => {
  it('mints ids in the art-<ts36>-<rand> shape', () => {
    expect(newArtifactId()).toMatch(/^art-[a-z0-9]+-[a-z0-9]{6}$/)
  })

  it('saves an artifact and lists it newest-first', async () => {
    const first = await saveGenerated({ type: 'html', title: 'Timer', content: '<p>t</p>' })
    const second = await saveGenerated({ type: 'svg', title: 'Logo', content: '<svg/>' })
    const metas = listGenerated()
    expect(metas.map(m => m.id)).toEqual([second.id, first.id])
    expect(metas[1]).toMatchObject({ type: 'html', title: 'Timer', size: 8 })
    expect(metas[1].createdAt).toBeGreaterThan(0)
  })

  it('falls back to inline content when IndexedDB is unavailable', async () => {
    const meta = await saveGenerated({ type: 'markdown', title: 'Notes', content: '# hi' })
    expect(meta.inline).toBe('# hi')
    await expect(getGeneratedContent(meta.id)).resolves.toBe('# hi')
  })

  it('returns null content for unknown ids', async () => {
    await expect(getGeneratedContent('art-nope-000000')).resolves.toBeNull()
  })

  it('renames in place and bumps updatedAt', async () => {
    const meta = await saveGenerated({ type: 'html', title: 'Old', content: 'x' })
    const metas = renameGenerated(meta.id, 'New')
    expect(metas[0].title).toBe('New')
    expect(metas[0].updatedAt).toBeGreaterThanOrEqual(meta.updatedAt)
    expect(listGenerated()[0].title).toBe('New')
  })

  it('deletes meta (and keeps the rest)', async () => {
    const a = await saveGenerated({ type: 'html', title: 'A', content: 'a' })
    const b = await saveGenerated({ type: 'html', title: 'B', content: 'b' })
    const metas = await deleteGenerated(a.id)
    expect(metas.map(m => m.id)).toEqual([b.id])
    expect(listGenerated().map(m => m.id)).toEqual([b.id])
  })

  it('tolerates corrupt storage', () => {
    localStorage.setItem(GENERATED_KEY, '{not json')
    expect(listGenerated()).toEqual([])
    localStorage.setItem(GENERATED_KEY, '"a string"')
    expect(listGenerated()).toEqual([])
  })
})
