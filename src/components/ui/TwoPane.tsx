/**
 * TwoPane — the shell's master-detail layout primitive.
 *
 * Wide (≥ md): a fixed-width `side` pane and a flexible `main` pane sit in a
 * row, both visible. Compact (< md, via `useIsCompact`): one pane shows at a
 * time — `side` by default, `main` when `showMain` is true, with a 44px back
 * row above it that calls `onBack`.
 *
 * The DOM structure is identical across breakpoints: only inline styles toggle
 * (panes hide with `display:none`, never unmount). This is load-bearing — apps
 * like Maps hold a live Leaflet instance in `main` that must survive a rotate
 * or resize across the boundary instead of being torn down and re-initialised.
 *
 * Used only by true master-detail apps (Messages, Maps). The calling app owns
 * the selection state that drives `showMain`/`onBack`.
 */
import type { CSSProperties, ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useIsCompact } from '../../lib/useViewport'

interface TwoPaneProps {
  /** Master pane (list/sidebar). Always visible wide; default view compact. */
  side: ReactNode
  /** Detail pane (conversation/map). Right column wide; pushed view compact. */
  main: ReactNode
  /** Compact-only: show `main` instead of `side`. Ignored on wide layouts. */
  showMain: boolean
  /** Compact-only: tapped in the back row to return to `side`. */
  onBack: () => void
  /** Wide-layout fixed width of the master pane. Default '18rem' (≈ w-72). */
  sideWidth?: string
  /** Draw the divider between panes on wide layouts. Default true. */
  sideBorder?: boolean
  /** Optional label shown in the compact back row (e.g. the open item). */
  backLabel?: ReactNode
  /** Merged into the root element (e.g. the app surface background). */
  style?: CSSProperties
}

const fill: CSSProperties = { display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }

export function TwoPane({
  side,
  main,
  showMain,
  onBack,
  sideWidth = '18rem',
  sideBorder = true,
  backLabel,
  style,
}: TwoPaneProps) {
  const compact = useIsCompact()
  const sideHidden = compact && showMain
  const mainHidden = compact && !showMain

  return (
    <div style={{ display: 'flex', flexDirection: compact ? 'column' : 'row', height: '100%', ...style }}>
      <div
        style={{
          ...fill,
          display: sideHidden ? 'none' : 'flex',
          ...(compact
            ? { flex: 1 }
            : { width: sideWidth, flexShrink: 0, borderRight: sideBorder ? '1px solid var(--border)' : undefined }),
        }}
      >
        {side}
      </div>

      <div style={{ ...fill, flex: 1, display: mainHidden ? 'none' : 'flex' }}>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium hover:bg-glass"
          style={{
            display: compact ? 'flex' : 'none',
            alignItems: 'center',
            gap: '6px',
            height: '44px',
            flexShrink: 0,
            padding: '0 12px',
            borderBottom: '1px solid var(--border)',
            color: 'var(--text2)',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          {backLabel ?? 'Back'}
        </button>
        <div style={{ ...fill, flex: 1 }}>{main}</div>
      </div>
    </div>
  )
}
