import { useNavigate, useParams } from 'react-router-dom'
import { Suspense } from 'react'
import { ArrowLeft, Grid3X3, Sun, Moon, Bot } from 'lucide-react'
import { apps, getAppIcon } from '../lib/registry'
import { useStore } from '../lib/store'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import HermesAgentBar from '../components/HermesAgentBar'

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
      <div className="min-h-screen text-white flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <p className="text-xl">App not found</p>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-400 hover:underline">Back to Empire</button>
        </div>
      </div>
    )
  }

  const Icon = getAppIcon(appDef.icon)

  return (
    <div className="min-h-screen flex flex-col text-white" style={{ background: 'var(--grad)', backgroundAttachment: 'fixed' }}>
      {/* macOS-style title bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--nav-bg)', backdropFilter: 'var(--gl-blur)', borderBottom: '1px solid var(--nav-border)', boxShadow: 'var(--nav-shadow)' }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <button onClick={() => navigate('/')} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors flex items-center justify-center" title="Back to Empire">
              <ArrowLeft className="w-2 h-2 text-red-900 opacity-0 hover:opacity-100" />
            </button>
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <Icon className="w-4 h-4 ml-2" style={{ color: appDef.color }} />
          <span className="text-sm font-medium">{appDef.name}</span>
        </div>
        {/* Dashboard link + Theme toggle */}
        <div className="flex items-center gap-2">
          {/* Hermes quick link */}
          <button onClick={() => navigate('/app/ai-chat')} className="text-gray-400 hover:text-purple-400 transition-colors" title="Ask Hermes AI">
            <Bot className="w-4 h-4" />
          </button>
          <button onClick={toggleTheme} className="text-gray-400 hover:text-white transition-colors" title={isLight ? 'Dark mode' : 'Light mode'}>
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors">
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* App content */}
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<LoadingSpinner />}>
          <AppComponent />
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
      <div className="flex items-end gap-1 px-4 py-2 rounded-2xl shadow-2xl" style={{ background: 'var(--gl-bg)', backdropFilter: 'var(--gl-blur)', border: '1px solid var(--gl-border-b)', borderTopColor: 'var(--gl-border-t)', boxShadow: 'var(--gl-shadow)' }}>
        {apps.map(app => {
          const Icon = getAppIcon(app.icon)
          const isActive = app.id === currentApp
          return (
            <button
              key={app.id}
              onClick={() => navigate(app.route)}
              className={`relative p-2 rounded-xl transition-all duration-150 group ${isActive ? 'scale-110' : 'hover:scale-105'}`}
              style={isActive ? { background: 'var(--gl-bg-h)' } : {}}
              title={app.name}
            >
              <Icon className="w-5 h-5" style={{ color: isActive ? app.color : 'var(--text2)' }} />
              {isActive && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: app.color }} />}
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg" style={{ background: 'var(--gl-bg)', color: 'var(--text)', backdropFilter: 'var(--gl-blur)' }}>
                {app.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}