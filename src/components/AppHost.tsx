/**
 * AppHost — renders the ACTIVE app full-bleed (no window chrome).
 *
 * Replaces the old floating <Window>. There are no traffic-lights, no titlebar
 * drag, no resize handles. Just a slim top bar (back/home + identity + recents)
 * and the app filling the rest of the screen. When no app is active it renders
 * nothing, revealing the home launcher beneath it.
 */
import { Suspense } from 'react'
import { ChevronLeft, House, LayoutGrid } from 'lucide-react'
import { getAppIcon } from '../lib/registry'
import { useWindowStore } from '../lib/windowStore'
import { appComponents } from '../lib/appComponents'
import { IconButton } from './ui'
import LoadingSpinner from './ui/LoadingSpinner'
import { ErrorBoundary } from './ErrorBoundary'

export default function AppHost({ onRecents }: { onRecents: () => void }) {
  const activeId = useWindowStore(s => s.activeWindowId)
  const win = useWindowStore(s => s.windows.find(w => w.id === activeId) || null)
  const goHome = useWindowStore(s => s.goHome)

  if (!win) return null

  const AppComponent = appComponents[win.appId]
  const Icon = getAppIcon(win.icon)

  return (
    <div
      className="empire-apphost animate-scale-in"
      style={{ ['--app-color' as string]: win.color }}
      key={win.appId}
    >
      <div className="empire-topbar">
        <IconButton
          className="empire-topbar-back"
          style={{ width: '40px', height: '40px' }}
          onClick={goHome}
          aria-label="Back to home"
          icon={<ChevronLeft className="w-5 h-5" />}
        />
        <div className="empire-topbar-identity">
          <Icon className="w-4 h-4" style={{ color: win.color }} aria-hidden />
          <span className="empire-topbar-title">{win.title}</span>
        </div>
        <div className="empire-topbar-actions">
          <IconButton
            className="empire-topbar-btn"
            style={{ width: '40px', height: '40px' }}
            onClick={goHome}
            aria-label="Home"
            title="Home"
            icon={<House className="w-4 h-4" />}
          />
          <IconButton
            className="empire-topbar-btn"
            style={{ width: '40px', height: '40px' }}
            onClick={onRecents}
            aria-label="Recent apps"
            title="Recents"
            icon={<LayoutGrid className="w-4 h-4" />}
          />
        </div>
      </div>

      <div className="empire-app-surface">
        {AppComponent ? (
          <Suspense fallback={<LoadingSpinner />}>
            <ErrorBoundary>
              <AppComponent />
            </ErrorBoundary>
          </Suspense>
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--text3)' }}>
            App not available
          </div>
        )}
      </div>
    </div>
  )
}
