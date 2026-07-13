import { useNavigate, useParams } from 'react-router-dom'
import { Suspense } from 'react'
import { ArrowLeft, Grid3X3, Sun, Moon, Bot } from 'lucide-react'
import { apps, getAppIcon } from '../lib/registry'
import { useStore } from '../lib/store'
import { tint } from '../design-system/tokens'
import { Button, IconButton } from './ui'
import LoadingSpinner from './ui/LoadingSpinner'
import { ErrorBoundary } from './ErrorBoundary'

interface AppShellProps {
  appMap: Record<string, React.LazyExoticComponent<React.ComponentType<any>>>
}

export default function AppShell({ appMap }: AppShellProps) {
  const { appId } = useParams()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useStore()
  const appDef = apps.find(a => a.id === appId)
  const AppComponent = appId ? appMap[appId] : null
  const isLight = theme === 'light'

  if (!appDef || !AppComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <p className="text-xl" style={{ color: 'var(--text)' }}>App not found</p>
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mt-4"
            style={{ color: 'var(--color-teal-3)', background: 'var(--btn-secondary-bg)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)' }}
          >
            Back to Empire
          </Button>
        </div>
      </div>
    )
  }

  const Icon = getAppIcon(appDef.icon)

  return (
    <div
      className="min-h-screen flex flex-col layer-content"
      style={{ background: 'var(--grad)', backgroundAttachment: 'fixed' }}
    >
      {/* macOS-style title bar */}
      <div
        className="flex items-center justify-between px-4 py-3 animate-fade-in"
        style={{
          background: 'var(--nav-bg)',
          backdropFilter: 'var(--gl-blur)',
          borderBottom: '1px solid var(--nav-border)',
          boxShadow: 'var(--nav-shadow)',
        }}
      >
        {/* Left: back chevron + app identity */}
        <div className="flex items-center gap-3">
          {/* Android back chevron */}
          <IconButton
            variant="ghost"
            onClick={() => navigate('/')}
            style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-lg)',
              background: tint('xenon', 6),
              border: `1px solid ${tint('xenon', 8)}`,
            }}
            title="Back to Empire"
            aria-label="Back to Empire"
            icon={<ArrowLeft className="w-4 h-4" style={{ color: 'var(--text2)' }} />}
          />

          {/* App icon + name */}
          <Icon className="w-4 h-4 ml-1" style={{ color: appDef.color }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {appDef.name}
          </span>
          {appDef.cakraEnabled && (
            <span
              className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: `${appDef.color}18`, color: appDef.color }}
            >
              <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: appDef.color }} />
              AI
            </span>
          )}
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1">
          <IconButton
            variant="ghost"
            onClick={() => navigate('/app/ai-chat')}
            style={{ color: 'var(--text2)', borderRadius: 'var(--radius-lg)' }}
            title="Ask Cakra"
            aria-label="Ask Cakra"
            icon={<Bot className="w-4 h-4" />}
          />
          <IconButton
            variant="ghost"
            onClick={toggleTheme}
            style={{ color: 'var(--text2)', borderRadius: 'var(--radius-lg)' }}
            title={isLight ? 'Dark mode' : 'Light mode'}
            aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            icon={isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          />
          <IconButton
            variant="ghost"
            onClick={() => navigate('/')}
            style={{ color: 'var(--text2)', borderRadius: 'var(--radius-lg)' }}
            title="Empire home"
            aria-label="Empire home"
            icon={<Grid3X3 className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* App content */}
      <div className="flex-1 overflow-auto relative">
        <Suspense fallback={<LoadingSpinner />}>
          <ErrorBoundary>
            <AppComponent />
          </ErrorBoundary>
        </Suspense>
      </div>

      {/* Dock */}
      <Dock currentApp={appId!} />
    </div>
  )
}

function Dock({ currentApp }: { currentApp: string }) {
  const navigate = useNavigate()

  return (
    <div className="flex justify-center pb-3 pt-2 px-4">
      <div
        className="flex items-end gap-0.5 px-3 py-2.5 rounded-2xl animate-slide-up"
        style={{
          background: 'var(--gl-bg)',
          backdropFilter: 'var(--gl-blur)',
          border: '1px solid var(--gl-border-b)',
          borderTopColor: 'var(--gl-border-t)',
          boxShadow: 'var(--gl-shadow)',
          animationDelay: '200ms',
          opacity: 0,
        }}
      >
        {apps.map(app => {
          const Icon = getAppIcon(app.icon)
          const isActive = app.id === currentApp
          return (
            <Button
              key={app.id}
              variant="ghost"
              onClick={() => navigate(app.route)}
              className="dock-item relative rounded-xl"
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-lg)',
                ...(isActive ? { background: 'var(--gl-bg-h)' } : {}),
              }}
              title={app.name}
              icon={
                <Icon
                  className="w-5 h-5"
                  style={{ color: isActive ? app.color : 'var(--text2)' }}
                />
              }
            >
              {/* Active dot */}
              {isActive && (
                <span
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full dock-dot"
                  style={{ background: app.color }}
                />
              )}

              {/* Tooltip */}
              <span
                className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap"
                style={{
                  background: 'var(--gl-bg-el)',
                  backdropFilter: 'var(--gl-blur-el)',
                  color: 'var(--text)',
                  boxShadow: `0 4px 12px ${tint('void', 40)}`,
                }}
              >
                {app.name}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}