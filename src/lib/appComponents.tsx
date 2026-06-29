/**
 * Empire lazy-loaded app components.
 *
 * Single source of truth for `React.lazy()` imports. Both the Desktop <Window>
 * shell and the legacy /app/:appId route use this map — previously it was
 * duplicated in App.tsx and Window.tsx and **they had drifted apart**, which
 * meant most apps rendered "App not available" when launched from the
 * desktop/taskbar.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export type AppComponentMap = Record<string, LazyExoticComponent<ComponentType<unknown>>>

export const appComponents: AppComponentMap = {
  calculator:       lazy(() => import('../apps/calculator/Calculator')),
  calendar:         lazy(() => import('../apps/calendar/Calendar')),
  clock:            lazy(() => import('../apps/clock/Clock')),
  weather:          lazy(() => import('../apps/weather/Weather')),
  grammar:          lazy(() => import('../apps/grammar/Grammar')),
  language:         lazy(() => import('../apps/language/Language')),
  music:            lazy(() => import('../apps/music/Music')),
  video:            lazy(() => import('../apps/video/Video')),
  files:            lazy(() => import('../apps/files/Files')),
  cache:            lazy(() => import('../apps/cache/CacheCleaner')),
  browser:          lazy(() => import('../apps/browser/Browser')),
  editor:           lazy(() => import('../apps/editor/Editor')),
  notes:            lazy(() => import('../apps/notes/Notes')),
  photos:           lazy(() => import('../apps/photos/Photos')),
  datacenter:       lazy(() => import('../apps/datacenter/DataCenter')),
  maps:             lazy(() => import('../apps/maps/Maps')),
  messages:         lazy(() => import('../apps/messages/Messages')),
  'prompt-generator':   lazy(() => import('../apps/prompt-generator/PromptGenerator')),
  'token-counter':      lazy(() => import('../apps/token-counter/TokenCounter')),
  'learning-tracker':   lazy(() => import('../apps/learning-tracker/LearningTracker')),
  'ai-chat':            lazy(() => import('../apps/cakra/CakraShell')),
  'goals':              lazy(() => import('../apps/goals/Goals')),
  'artifacts':          lazy(() => import('../apps/artifacts/ArtifactsApp')),
  'network':            lazy(() => import('../apps/network/Network')),
  'inbox':              lazy(() => import('../apps/inbox/Inbox')),
  'reader':             lazy(() => import('../apps/reader/Reader')),
}
