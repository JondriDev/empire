import { describe, it, expect } from 'vitest'
import { accumulateFiles, fileNodeData, dirOf, type FileLike, type AccumulatedFile } from './filesGraph'

const f = (path: string, over: Partial<FileLike> = {}): FileLike => ({
  name: path.slice(path.lastIndexOf('/') + 1),
  path,
  size: 10,
  extension: path.includes('.') ? path.slice(path.lastIndexOf('.') + 1) : '',
  isDirectory: false,
  ...over,
})

describe('dirOf', () => {
  it('returns the parent directory', () => {
    expect(dirOf('/a/b/c.txt')).toBe('/a/b')
    expect(dirOf('/storage/emulated/0/Documents/note.md')).toBe('/storage/emulated/0/Documents')
  })
  it('is root-safe for top-level paths', () => {
    expect(dirOf('/file.txt')).toBe('/')
    expect(dirOf('file.txt')).toBe('/')
  })
})

describe('accumulateFiles', () => {
  it('accumulates the union across directories (the navigate-drop fix)', () => {
    let acc: Map<string, AccumulatedFile> = new Map()
    acc = accumulateFiles(acc, [f('/dir-a/one.txt'), f('/dir-a/two.txt')])
    acc = accumulateFiles(acc, [f('/dir-b/three.txt')])
    // Files from the FIRST directory must survive navigating to the second.
    expect([...acc.keys()].sort()).toEqual(['/dir-a/one.txt', '/dir-a/two.txt', '/dir-b/three.txt'])
  })

  it('excludes directories — only real files are graph-worthy', () => {
    const acc = accumulateFiles(new Map(), [
      f('/dir/sub', { isDirectory: true }),
      f('/dir/real.txt'),
    ])
    expect([...acc.keys()]).toEqual(['/dir/real.txt'])
  })

  it('dedupes by path and updates metadata in place on re-visit', () => {
    let acc = accumulateFiles(new Map(), [f('/dir/a.txt', { size: 10 })])
    acc = accumulateFiles(acc, [f('/dir/a.txt', { size: 99 })])
    expect(acc.size).toBe(1)
    expect(acc.get('/dir/a.txt')?.size).toBe(99)
  })

  it('is immutable — never mutates the previous map', () => {
    const prev = accumulateFiles(new Map(), [f('/dir/a.txt')])
    const next = accumulateFiles(prev, [f('/dir/b.txt')])
    expect(prev.size).toBe(1)
    expect(next.size).toBe(2)
    expect(next).not.toBe(prev)
  })

  it('records the parent directory for each accumulated file', () => {
    const acc = accumulateFiles(new Map(), [f('/storage/emulated/0/Documents/note.md')])
    expect(acc.get('/storage/emulated/0/Documents/note.md')?.dir).toBe('/storage/emulated/0/Documents')
  })
})

describe('fileNodeData', () => {
  it('shapes the graph-node data payload', () => {
    const file: AccumulatedFile = { name: 'a.txt', path: '/d/a.txt', size: 42, extension: 'txt', dir: '/d' }
    expect(fileNodeData(file)).toEqual({ path: '/d/a.txt', size: 42, extension: 'txt', dir: '/d' })
  })
})
