/**
 * Keyboard-operability helpers (WCAG 2.1.1).
 *
 * In React a bare `onClick` on a non-interactive host element (a `<div>`/`<span>`
 * that must stay a host tag for layout) never fires on Enter/Space — the browser
 * only synthesises click-on-key for natively-actionable elements. So a clickable
 * host needs three things to be keyboard-operable: `role="button"`, `tabIndex={0}`,
 * and an `onKeyDown` that fires the same action on Enter/Space. This helper is that
 * key handler; pair it with the role + tabIndex.
 *
 * Prefer the `ui` `<Card interactive>` primitive for a plain click-to-select
 * tile/row/card — it already bundles role + tabIndex + Enter/Space. Reach for
 * `onActivate` only when the element must remain a bare host tag (nested
 * clickables, an existing glass surface that a `Card` would double, etc.).
 *
 * `stopPropagation` mirrors the click semantics of nested clickables (the inner
 * control's onClick already stops the parent's) so a focused child doesn't also
 * trigger its ancestor's activation; on a top-level clickable it is a harmless
 * no-op.
 */
import type { KeyboardEvent } from 'react'

export function onActivate(fn: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      fn()
    }
  }
}
