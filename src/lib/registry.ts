import { Terminal, Calculator, Calendar, Clock, CloudSun, SpellCheck, Languages, Music, Video, Folder, Trash2, Globe, Code2, StickyNote, Image, Database, MapPin, MessageSquare, Wand2, Hash, GraduationCap, Bot, Sparkles, type LucideIcon } from 'lucide-react'

export interface AppDefinition {
  id: string
  name: string
  icon: string
  route: string
  description: string
  color: string
  hermesEnabled?: boolean  // AI integration flag
}

export const apps: AppDefinition[] = [
  { id: 'ai-chat', name: 'Hermes AI', icon: 'Bot', route: '/app/ai-chat', description: 'Ask Hermes anything', color: '#8b5cf6', hermesEnabled: true },
  { id: 'calculator', name: 'Calculator', icon: 'Calculator', route: '/app/calculator', description: 'Scientific calculations', color: '#f97316', hermesEnabled: true },
  { id: 'calendar', name: 'Calendar', icon: 'Calendar', route: '/app/calendar', description: 'Schedule & events', color: '#3b82f6', hermesEnabled: true },
  { id: 'clock', name: 'Clock', icon: 'Clock', route: '/app/clock', description: 'Time & alarms', color: '#8b5cf6', hermesEnabled: false },
  { id: 'weather', name: 'Weather', icon: 'CloudSun', route: '/app/weather', description: 'Forecasts & conditions', color: '#06b6d4', hermesEnabled: false },
  { id: 'grammar', name: 'Grammar Fix', icon: 'SpellCheck', route: '/app/grammar', description: 'Fix your writing', color: '#10b981', hermesEnabled: true },
  { id: 'language', name: 'Language Lab', icon: 'Languages', route: '/app/language', description: 'Learn new languages', color: '#22d3ee', hermesEnabled: true },
  { id: 'music', name: 'Music', icon: 'Music', route: '/app/music', description: 'Play your tracks', color: '#ec4899', hermesEnabled: false },
  { id: 'video', name: 'Video', icon: 'Video', route: '/app/video', description: 'Watch videos', color: '#ef4444', hermesEnabled: false },
  { id: 'files', name: 'Files', icon: 'Folder', route: '/app/files', description: 'Browse files', color: '#f59e0b', hermesEnabled: false },
  { id: 'cache', name: 'Cache Cleaner', icon: 'Trash2', route: '/app/cache', description: 'Free up space', color: '#78716c', hermesEnabled: false },
  { id: 'browser', name: 'Browser', icon: 'Globe', route: '/app/browser', description: 'Browse the web', color: '#14b8a6', hermesEnabled: true },
  { id: 'editor', name: 'Code Editor', icon: 'Code2', route: '/app/editor', description: 'Write & edit code', color: '#6366f1', hermesEnabled: true },
  { id: 'notes', name: 'Notes', icon: 'StickyNote', route: '/app/notes', description: 'Write & organize', color: '#eab308', hermesEnabled: true },
  { id: 'photos', name: 'Photos', icon: 'Image', route: '/app/photos', description: 'Your gallery', color: '#a855f7', hermesEnabled: false },
  { id: 'datacenter', name: 'Data Center', icon: 'Database', route: '/app/datacenter', description: 'Manage data', color: '#64748b', hermesEnabled: true },
  { id: 'maps', name: 'Maps', icon: 'MapPin', route: '/app/maps', description: 'Explore locations', color: '#34d399', hermesEnabled: false },
  { id: 'messages', name: 'Messages', icon: 'MessageSquare', route: '/app/messages', description: 'Chat over WiFi', color: '#818cf8', hermesEnabled: true },
  { id: 'prompt-generator', name: 'Prompt Gen', icon: 'Wand2', route: '/app/prompt-generator', description: 'Craft AI prompts', color: '#d946ef', hermesEnabled: true },
  { id: 'token-counter', name: 'Token Counter', icon: 'Hash', route: '/app/token-counter', description: 'Count AI tokens', color: '#38bdf8', hermesEnabled: true },
  { id: 'learning-tracker', name: 'Learning Tracker', icon: 'GraduationCap', route: '/app/learning-tracker', description: 'Track & challenge yourself', color: '#22c55e', hermesEnabled: true },
]

const iconMap: Record<string, LucideIcon> = {
  Terminal, Calculator, Calendar, Clock, CloudSun, SpellCheck, Languages,
  Music, Video, Folder, Trash2, Globe, Code2, StickyNote, Image, Database,
  MapPin, MessageSquare, Wand2, Hash, GraduationCap, Bot, Sparkles
}

export function getAppIcon(name: string): LucideIcon {
  return iconMap[name] || Terminal
}