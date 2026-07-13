/**
 * Recents — the app switcher. A full-screen overlay listing every open app as
 * a card (Android/PWA style). Tap a card to bring it forward; ✕ to close it.
 */
import { X } from 'lucide-react'
import { getAppIcon } from '../lib/registry'
import { useWindowStore } from '../lib/windowStore'
import { Button, Card } from './ui'

export default function Recents({ open, onClose }: { open: boolean; onClose: () => void }) {
  const windows = useWindowStore(s => s.windows)
  const focusWindow = useWindowStore(s => s.focusWindow)
  const closeWindow = useWindowStore(s => s.closeWindow)

  if (!open) return null

  return (
    <div className="empire-recents" onClick={onClose}>
      <div className="empire-recents-head">
        <span>Recent apps</span>
        {windows.length > 0 && (
          <Button
            variant="ghost"
            className="empire-recents-clear"
            style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', border: '1px solid var(--hair)', color: 'var(--text3)' }}
            onClick={(e) => { e.stopPropagation(); useWindowStore.setState({ windows: [], activeWindowId: null }); onClose() }}
          >
            Close all
          </Button>
        )}
      </div>

      {windows.length === 0 ? (
        <div className="empire-recents-empty">No open apps — tap an app to start.</div>
      ) : (
        <div className="empire-recents-grid" onClick={(e) => e.stopPropagation()}>
          {windows.map(win => {
            const Icon = getAppIcon(win.icon)
            return (
              <Card
                key={win.id}
                interactive
                padding="none"
                className="empire-recents-card animate-scale-in"
                style={{ padding: '22px 12px 16px', ['--app-color' as string]: win.color }}
                onClick={() => { focusWindow(win.id); onClose() }}
              >
                <span
                  className="empire-recents-close"
                  role="button"
                  aria-label={`Close ${win.title}`}
                  onClick={(e) => { e.stopPropagation(); closeWindow(win.id) }}
                >
                  <X className="w-3.5 h-3.5" />
                </span>
                <span className="empire-recents-icon" style={{ background: `${win.color}1A` }}>
                  <Icon className="w-7 h-7" style={{ color: win.color }} />
                </span>
                <span className="empire-recents-title">{win.title}</span>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
