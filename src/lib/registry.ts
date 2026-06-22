import { Terminal, Calculator, Calendar, Clock, CloudSun, SpellCheck, Languages, Music, Video, Folder, Trash2, Globe, Code2, StickyNote, Image, Database, MapPin, MessageSquare, Wand2, Hash, GraduationCap, Command, Bot, Sparkles, Palette, Network, Target, Inbox, type LucideIcon } from 'lucide-react'

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
  { id: 'ai-agent', name: 'Cakra Agent', icon: 'Sparkles', route: '/app/ai-agent', description: 'AI that actually acts', color: '#22d3ee', hermesEnabled: true },
  { id: 'calculator', name: 'Calculator', icon: 'Calculator', route: '/app/calculator', description: 'Scientific calculations', color: '#2dd4bf', hermesEnabled: true },
  { id: 'calendar', name: 'Calendar', icon: 'Calendar', route: '/app/calendar', description: 'Schedule & events', color: '#60a5fa', hermesEnabled: true },
  { id: 'clock', name: 'Clock', icon: 'Clock', route: '/app/clock', description: 'Time & alarms', color: '#38bdf8', hermesEnabled: false },
  { id: 'weather', name: 'Weather', icon: 'CloudSun', route: '/app/weather', description: 'Forecasts & conditions', color: '#7dd3fc', hermesEnabled: false },
  { id: 'grammar', name: 'Grammar Fix', icon: 'SpellCheck', route: '/app/grammar', description: 'Fix your writing', color: '#34d399', hermesEnabled: true },
  { id: 'language', name: 'Language Lab', icon: 'Languages', route: '/app/language', description: 'Learn new languages', color: '#5eead4', hermesEnabled: true },
  { id: 'music', name: 'Music', icon: 'Music', route: '/app/music', description: 'Play your tracks', color: '#818cf8', hermesEnabled: false },
  { id: 'video', name: 'Video', icon: 'Video', route: '/app/video', description: 'Watch videos', color: '#a78bfa', hermesEnabled: false },
  { id: 'files', name: 'Files', icon: 'Folder', route: '/app/files', description: 'Browse files', color: '#67e8f9', hermesEnabled: false },
  { id: 'cache', name: 'Cache Cleaner', icon: 'Trash2', route: '/app/cache', description: 'Free up space', color: '#64748b', hermesEnabled: false },
  { id: 'browser', name: 'Browser', icon: 'Globe', route: '/app/browser', description: 'Browse the web', color: '#14b8a6', hermesEnabled: true },
  { id: 'editor', name: 'Code Editor', icon: 'Code2', route: '/app/editor', description: 'Write & edit code', color: '#818cf8', hermesEnabled: true },
  { id: 'notes', name: 'Notes', icon: 'StickyNote', route: '/app/notes', description: 'Write & organize', color: '#5eead4', hermesEnabled: true },
  { id: 'photos', name: 'Photos', icon: 'Image', route: '/app/photos', description: 'Your gallery', color: '#7dd3fc', hermesEnabled: false },
  { id: 'datacenter', name: 'Data Center', icon: 'Database', route: '/app/datacenter', description: 'Manage data', color: '#94a3b8', hermesEnabled: true },
  { id: 'maps', name: 'Maps', icon: 'MapPin', route: '/app/maps', description: 'Explore locations', color: '#4ade80', hermesEnabled: false },
  { id: 'messages', name: 'Messages', icon: 'MessageSquare', route: '/app/messages', description: 'Chat over WiFi', color: '#60a5fa', hermesEnabled: true },
  { id: 'prompt-generator', name: 'Prompt Gen', icon: 'Wand2', route: '/app/prompt-generator', description: 'Craft AI prompts', color: '#c084fc', hermesEnabled: true },
  { id: 'token-counter', name: 'Token Counter', icon: 'Hash', route: '/app/token-counter', description: 'Count AI tokens', color: '#38bdf8', hermesEnabled: true },
  { id: 'learning-tracker', name: 'Learning Tracker', icon: 'GraduationCap', route: '/app/learning-tracker', description: 'Track & challenge yourself', color: '#34d399', hermesEnabled: true },
  { id: 'goals', name: 'Goals', icon: 'Target', route: '/app/goals', description: 'Set goals, track progress', color: '#818cf8', hermesEnabled: true },
  { id: 'hermes-cc', name: 'Cakra CC', icon: 'Command', route: '/app/hermes-cc', description: 'One-click command center', color: '#22d3ee', hermesEnabled: true },
  { id: 'ai-chat', name: 'AI Chat', icon: 'Sparkles', route: '/app/ai-chat', description: 'Chat with Cakra', color: '#a78bfa', hermesEnabled: true },
  { id: 'artifacts', name: 'Artifacts', icon: 'Palette', route: '/app/artifacts', description: 'Self-contained mini-apps & builders', color: '#c084fc', hermesEnabled: true },
  { id: 'network', name: 'Network', icon: 'Network', route: '/app/network', description: 'The ecosystem as a live node-graph', color: '#34f5d6', hermesEnabled: false },
  { id: 'inbox', name: 'Inbox', icon: 'Inbox', route: '/app/inbox', description: 'Every open task, one home', color: '#5eead4', hermesEnabled: false },
]

const iconMap: Record<string, LucideIcon> = {
  Terminal, Calculator, Calendar, Clock, CloudSun, SpellCheck, Languages,
  Music, Video, Folder, Trash2, Globe, Code2, StickyNote, Image, Database,
  MapPin, MessageSquare, Wand2, Hash, GraduationCap, Bot, Sparkles, Command,
  Palette,  // For the Artifacts app — fixed
  Network,  // For the Network node-graph app (merged from the-empire)
  Target,   // For the Goals Tracker app
  Inbox,    // For the Inbox / Today task aggregation view
}

export function getAppIcon(name: string): LucideIcon {
  return iconMap[name] || Terminal
}