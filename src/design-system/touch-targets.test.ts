import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* Regression lock for the phone-first touch-target floor (UX axis: touch
   targets & thumb reach). The fix is a single @media (pointer: coarse) block
   in design-system.css that clamps every `ui` primitive UP to --tap-min so
   thumbs can hit them on a phone, while desktop density is untouched. jsdom
   can't evaluate @media (pointer: coarse), so we lock the SOURCE contract:
   the token exists, is ≥44px, and each primitive class is enforced inside a
   coarse-pointer block. If someone deletes the block or a selector, this bites. */

const css = readFileSync(resolve(process.cwd(), 'src/design-system.css'), 'utf8')

// Isolate the @media (pointer: coarse) { … } body (balanced to its closing brace).
function coarseBlock(src: string): string {
  const start = src.search(/@media\s*\(\s*pointer:\s*coarse\s*\)\s*\{/)
  expect(start).toBeGreaterThanOrEqual(0)
  let depth = 0
  let i = src.indexOf('{', start)
  const from = i
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}' && --depth === 0) return src.slice(from + 1, i)
  }
  throw new Error('unbalanced @media (pointer: coarse) block')
}

describe('touch targets — coarse-pointer floor', () => {
  it('defines a --tap-min token of at least 44px', () => {
    const m = css.match(/--tap-min:\s*(\d+)px/)
    expect(m).not.toBeNull()
    expect(Number(m![1])).toBeGreaterThanOrEqual(44)
  })

  const block = coarseBlock(css)

  // Every standalone interactive primitive gets a min-height floor on touch.
  it.each([
    '.empire-btn',
    '.empire-icon-btn',
    '.empire-select-field',
    '.empire-segmented button',
    '.empire-slider',
  ])('enforces min-height on %s under a coarse pointer', (selector) => {
    const rule = new RegExp(
      `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{}]*(,[^{}]*)*\\{[^}]*min-height:\\s*var\\(--tap-min\\)`,
    )
    // selector may be grouped with others before the shared { … }; assert the
    // selector appears and a min-height:var(--tap-min) declaration exists nearby.
    expect(block).toMatch(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    expect(rule.test(block) || /min-height:\s*var\(--tap-min\)/.test(block)).toBe(true)
  })

  it('gives icon-only buttons a min-width floor too (square thumb target)', () => {
    expect(block).toMatch(/\.empire-icon-btn\s*\{[^}]*min-width:\s*var\(--tap-min\)/)
  })

  it('scopes the floor to coarse pointers only (desktop density preserved)', () => {
    // The floor declarations must live INSIDE the coarse block, not at top level.
    const topLevel = css.replace(block, '')
    expect(topLevel).not.toMatch(/\.empire-icon-btn\s*\{[^}]*min-width:\s*var\(--tap-min\)/)
  })
})
