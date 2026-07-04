/**
 * The Empire — app registry (per-app identity manifest).
 *
 * `icon` is a key into the bespoke alien SVG icon set (src/design-system/icons).
 * `color` is the per-app accent from the JondriDev Earth-from-Space palette — the
 * single source consumed across the shell as `${app.color}` / rgbOf(app.color).
 * That makes this file palette DATA, not render code bypassing the system
 * (see scripts/metrics.mjs DS_INFRA), so the raw accents below are intentional.
 */
import { getAppIcon, type AppIcon } from '../design-system/icons'

export type { AppIcon }
export { getAppIcon }

export interface AppDefinition {
  id: string
  name: string
  icon: string
  route: string
  description: string
  color: string
  cakraEnabled?: boolean  // Cakra AI integration flag
  /** Hide from the home launcher grid (e.g. tools merged into another app). */
  hidden?: boolean
  /** This id is an alias that opens another app, optionally on a given tab.
   *  Keeps legacy ids/handoffs/deep-links alive after a merge (e.g. the
   *  Prompt/Token/Code tools merged into Cakra). */
  aliasOf?: { appId: string; tab: string }
}

export const apps: AppDefinition[] = [
  { id: 'ai-chat', name: 'Cakra', icon: 'cakra', route: '/app/ai-chat', description: 'Chat that acts — your AI', color: '#5b8fb9', cakraEnabled: true },
  { id: 'calculator', name: 'Calculator', icon: 'Calculator', route: '/app/calculator', description: 'Scientific calculations', color: '#5b8fb9', cakraEnabled: true },
  { id: 'calendar', name: 'Calendar', icon: 'Calendar', route: '/app/calendar', description: 'Schedule & events', color: '#1a8caa', cakraEnabled: true },
  { id: 'clock', name: 'Clock', icon: 'Clock', route: '/app/clock', description: 'Time & alarms', color: '#8fb4d8', cakraEnabled: false },
  { id: 'weather', name: 'Weather', icon: 'CloudSun', route: '/app/weather', description: 'Forecasts & conditions', color: '#5b8fb9', cakraEnabled: false },
  { id: 'grammar', name: 'Grammar Fix', icon: 'SpellCheck', route: '/app/grammar', description: 'Fix your writing', color: '#66d9a0', cakraEnabled: true },
  { id: 'language', name: 'Language Lab', icon: 'Languages', route: '/app/language', description: 'Learn new languages', color: '#1a8caa', cakraEnabled: true },
  { id: 'music', name: 'Music', icon: 'Music', route: '/app/music', description: 'Play your tracks', color: '#c4a265', cakraEnabled: false },
  { id: 'video', name: 'Video', icon: 'Video', route: '/app/video', description: 'Watch videos', color: '#f0c94e', cakraEnabled: false },
  { id: 'files', name: 'Files', icon: 'Folder', route: '/app/files', description: 'Browse files', color: '#8fb4d8', cakraEnabled: false },
  { id: 'cache', name: 'Cache Cleaner', icon: 'Trash2', route: '/app/cache', description: 'Free up space', color: '#7a8faa', cakraEnabled: false },
  { id: 'browser', name: 'Browser', icon: 'Globe', route: '/app/browser', description: 'Browse the web', color: '#1a8caa', cakraEnabled: true },
  { id: 'editor', name: 'Code Editor', icon: 'Code2', route: '/app/editor', description: 'Write & edit code', color: '#5b8fb9', cakraEnabled: true, hidden: true, aliasOf: { appId: 'ai-chat', tab: 'code' } },
  { id: 'notes', name: 'Notes', icon: 'StickyNote', route: '/app/notes', description: 'Write & organize', color: '#66d9a0', cakraEnabled: true },
  { id: 'photos', name: 'Photos', icon: 'Image', route: '/app/photos', description: 'Your gallery', color: '#c4a265', cakraEnabled: false },
  { id: 'datacenter', name: 'Data Center', icon: 'Database', route: '/app/datacenter', description: 'Manage data', color: '#8fb4d8', cakraEnabled: true },
  { id: 'maps', name: 'Maps', icon: 'MapPin', route: '/app/maps', description: 'Explore locations', color: '#3c7a4a', cakraEnabled: false },
  { id: 'messages', name: 'Messages', icon: 'MessageSquare', route: '/app/messages', description: 'Chat over WiFi', color: '#1a8caa', cakraEnabled: true },
  { id: 'prompt-generator', name: 'Prompt Gen', icon: 'Wand2', route: '/app/prompt-generator', description: 'Craft AI prompts', color: '#5b8fb9', cakraEnabled: true, hidden: true, aliasOf: { appId: 'ai-chat', tab: 'prompt' } },
  { id: 'token-counter', name: 'Token Counter', icon: 'Hash', route: '/app/token-counter', description: 'Count AI tokens', color: '#8fb4d8', cakraEnabled: true, hidden: true, aliasOf: { appId: 'ai-chat', tab: 'tokens' } },
  { id: 'learning-tracker', name: 'Learning Tracker', icon: 'GraduationCap', route: '/app/learning-tracker', description: 'Track & challenge yourself', color: '#66d9a0', cakraEnabled: true },
  { id: 'goals', name: 'Goals', icon: 'Target', route: '/app/goals', description: 'Set goals, track progress', color: '#f0c94e', cakraEnabled: true },
  { id: 'artifacts', name: 'Artifacts', icon: 'Palette', route: '/app/artifacts', description: 'Self-contained mini-apps & builders', color: '#5b8fb9', cakraEnabled: true },
  { id: 'network', name: 'Network', icon: 'Network', route: '/app/network', description: 'The ecosystem as a live node-graph', color: '#1a8caa', cakraEnabled: false },
  { id: 'inbox', name: 'Inbox', icon: 'Inbox', route: '/app/inbox', description: 'Every open task, one home', color: '#66d9a0', cakraEnabled: false },
  { id: 'reader', name: 'Reader', icon: 'Reader', route: '/app/reader', description: 'Read your books · ask Cakra', color: '#f0c94e', cakraEnabled: true },
  { id: 'search', name: 'Search', icon: 'Search', route: '/app/search', description: 'Find anything across every app', color: '#5b8fb9', cakraEnabled: false },
  { id: 'timeline', name: 'Timeline', icon: 'Timeline', route: '/app/timeline', description: 'The organism’s history, one stream', color: '#8fb4d8', cakraEnabled: false },
  { id: 'solver', name: 'Problem Solver', icon: 'Target', route: '/app/solver', description: 'Cakra solves problems — world to personal', color: '#66d9a0', cakraEnabled: true, hidden: true, aliasOf: { appId: 'ai-chat', tab: 'solver' } },
]

/** Apps shown on the home launcher grid (excludes hidden tools + merge aliases). */
export const launcherApps: AppDefinition[] = apps.filter(a => !a.hidden && !a.aliasOf)
