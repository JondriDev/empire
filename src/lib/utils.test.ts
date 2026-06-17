import { describe, it, expect } from 'vitest'
import { formatBytes, clamp } from './utils'

describe('formatBytes', () => {
  it('returns "0 B" for zero', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('formats raw bytes', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('formats kilobytes with one decimal', () => {
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB')
    expect(formatBytes(2.3 * 1024 * 1024)).toBe('2.3 MB')
  })

  it('formats gigabytes', () => {
    expect(formatBytes(1024 ** 3)).toBe('1 GB')
  })
})

describe('clamp', () => {
  it('leaves a value within range unchanged', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps below the minimum up to min', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
  })

  it('clamps above the maximum down to max', () => {
    expect(clamp(99, 0, 10)).toBe(10)
  })

  it('handles equal bounds', () => {
    expect(clamp(5, 7, 7)).toBe(7)
  })
})
