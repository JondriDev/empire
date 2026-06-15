// Command Center — Hermes/Empire control panel
export interface HermesStatus {
  model: string
  provider: string
  sessionId: string
  uptime: string
  skills: number
  mcps: number
  crons: number
  activeTasks: number
}

export interface Skill {
  name: string
  description: string
  category: string
  loaded: boolean
}

export interface MCPServer {
  name: string
  status: 'connected' | 'disconnected' | 'error'
  tools: number
  lastPing?: string
}

export interface CronJob {
  id: string
  name: string
  schedule: string
  status: 'active' | 'paused' | 'error'
  lastRun?: string
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  description: string
  action: string
  color: string
  danger?: boolean
}

export interface CostInfo {
  today: number
  budget: number
  remaining: number
  model: string
}