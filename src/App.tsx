import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './dashboard/Dashboard'
import AppShell from './dashboard/AppShell'
import LoadingSpinner from './components/ui/LoadingSpinner'

const apps = {
  Calculator: lazy(() => import('./apps/calculator/Calculator')),
  Calendar: lazy(() => import('./apps/calendar/Calendar')),
  Clock: lazy(() => import('./apps/clock/Clock')),
  Weather: lazy(() => import('./apps/weather/Weather')),
  Grammar: lazy(() => import('./apps/grammar/Grammar')),
  Language: lazy(() => import('./apps/language/Language')),
  Music: lazy(() => import('./apps/music/Music')),
  Video: lazy(() => import('./apps/video/Video')),
  Files: lazy(() => import('./apps/files/Files')),
  Cache: lazy(() => import('./apps/cache/CacheCleaner')),
  Browser: lazy(() => import('./apps/browser/Browser')),
  Editor: lazy(() => import('./apps/editor/Editor')),
  Notes: lazy(() => import('./apps/notes/Notes')),
  Photos: lazy(() => import('./apps/photos/Photos')),
  Datacenter: lazy(() => import('./apps/datacenter/DataCenter')),
  Maps: lazy(() => import('./apps/maps/Maps')),
  Messages: lazy(() => import('./apps/messages/Messages')),
  PromptGenerator: lazy(() => import('./apps/prompt-generator/PromptGenerator')),
  TokenCounter: lazy(() => import('./apps/token-counter/TokenCounter')),
  LearningTracker: lazy(() => import('./apps/learning-tracker/LearningTracker')),
  Agent: lazy(() => import('./apps/ai-agent/Agent')),
}

const appComponentMap: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  calculator: apps.Calculator, calendar: apps.Calendar, clock: apps.Clock,
  weather: apps.Weather, grammar: apps.Grammar, language: apps.Language,
  music: apps.Music, video: apps.Video, files: apps.Files, cache: apps.Cache,
  browser: apps.Browser, editor: apps.Editor, notes: apps.Notes, photos: apps.Photos,
  datacenter: apps.Datacenter, maps: apps.Maps, messages: apps.Messages,
  'prompt-generator': apps.PromptGenerator, 'token-counter': apps.TokenCounter,
  'learning-tracker': apps.LearningTracker,
  'ai-agent': apps.Agent,
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/app/:appId" element={<AppShell appMap={appComponentMap} />} />
      </Routes>
    </Suspense>
  )
}