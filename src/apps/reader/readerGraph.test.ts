import { describe, it, expect } from 'vitest'
import { bookNodeData } from './readerGraph'
import type { BookMeta } from './lib/types'

const book = (over: Partial<BookMeta> = {}): BookMeta => ({
  id: 'bk-1',
  title: 'The Recovered Manual',
  author: 'Unknown',
  format: 'epub',
  size: 1234,
  addedAt: 1,
  highlights: [],
  ...over,
})

describe('bookNodeData', () => {
  it('shapes the graph-node data payload (durable metadata only, no blob)', () => {
    expect(bookNodeData(book({ format: 'pdf', author: 'A. Nother', progress: 0.5 }))).toEqual({
      format: 'pdf',
      author: 'A. Nother',
      progress: 0.5,
      highlights: 0,
    })
  })

  it('defaults progress to 0 and reduces highlights to a count', () => {
    const data = bookNodeData(book({
      progress: undefined,
      highlights: [
        { id: 'h1', text: 'a', createdAt: 1 },
        { id: 'h2', text: 'b', createdAt: 2 },
      ],
    }))
    expect(data.progress).toBe(0)
    expect(data.highlights).toBe(2)
  })

  it('tolerates a missing highlights array (never throws)', () => {
    // @ts-expect-error — exercise the runtime guard for legacy/partial metadata
    expect(bookNodeData({ ...book(), highlights: undefined }).highlights).toBe(0)
  })
})
