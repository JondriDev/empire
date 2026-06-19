/**
 * Hermes Command Center — one-click hub for everything Hermes
 *
 * Sections:
 * 1. Status Dashboard — Hermes agent status, health, uptime
 * 2. App Connectors — launch any app with one click + cross-app actions
 * 3. MCPs — view, connect, configure MCP servers
 * 4. Skills — browse, search, load skills
 * 5. Tools — system tools, file ops, shell, web
 * 6. Quick Actions — one-click operations
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { apiUrl } from '../../lib/apiBase'
import {
  Activity, Sparkles, Puzzle, BookOpen, Wrench,
  Zap, Server, Cpu, HardDrive, Globe,
  RefreshCw, Search, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, Clock, AlertCircle,
  Terminal, Code2, FileText, Link2,
  Copy, Check,
  Grid3X3, ArrowRight, Command
} from 'lucide-react'
import { apps, getAppIcon } from '../../lib/registry'
import { useWindowStore } from '../../lib/windowStore'

// ─── Types ────────────────────────────────────────────────────

interface HermesStatus {
  version: string
  uptime: number
  model: string
  provider: string
  configured: boolean
  skillsCount: number
  pluginsCount: number
  mcpCount: number
  memoryUsage: { current: number; limit: number; percent: number }
  system: { os: string; arch: string; memory: string; storage: string }
}

interface McpServer {
  name: string
  command: string
  args: string[]
  status: 'connected' | 'disconnected' | 'error'
  tools?: string[]
}

interface SkillItem {
  name: string
  category: string
  description: string
}

interface ToolAction {
  id: string
  label: string
  icon: string
  description: string
  action: () => void
}

// ─── Section Component ─────────────────────────────────────────

function SectionHeader({
  title, icon: Icon, count, color = 'var(--color-teal-3)',
  expanded, onToggle, children
}: {
  title: string
  icon: any
  count?: number
  color?: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '10px 14px',
          border: 'none',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          cursor: 'pointer',
          color: 'var(--text)',
          textAlign: 'left',
          fontSize: 14,
          fontWeight: 600,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${color}18`, color,
        }}>
          <Icon className="w-4 h-4" />
        </div>
        <span style={{ flex: 1 }}>{title}</span>
        {count !== undefined && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text3)',
            background: 'rgba(255,255,255,0.06)', borderRadius: 8,
            padding: '2px 8px',
          }}>
            {count}
          </span>
        )}
        {expanded ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--text3)' }} />
          : <ChevronRight className="w-4 h-4" style={{ color: 'var(--text3)' }} />}
      </button>
      {expanded && (
        <div style={{ padding: '10px 0 0 0' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Status Card ───────────────────────────────────────────────

function StatusCard({ label, value, icon: Icon, color, status }: {
  label: string
  value: string
  icon: any
  color: string
  status?: 'ok' | 'warn' | 'error'
}) {
  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: 10,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}14`,
      }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
      </div>
      {status && (
        status === 'ok' ? <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
          : status === 'warn' ? <AlertCircle className="w-4 h-4" style={{ color: '#eab308' }} />
            : <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
      )}
    </div>
  )
}

// ─── Metric Bar ────────────────────────────────────────────────

function MetricBar({ label, value, max, color }: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--text3)' }}>{label}</span>
        <span style={{ color: 'var(--text2)', fontWeight: 600 }}>{value}/{max}</span>
      </div>
      <div style={{
        height: 6, borderRadius: 3,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 3,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  )
}

// ─── Action Button ────────────────────────────────────────────

function ActionButton({ icon: Icon, label, onClick, color, disabled, subtle }: {
  icon: any
  label: string
  onClick: () => void
  color?: string
  disabled?: boolean
  subtle?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        background: subtle ? 'transparent' : 'rgba(255,255,255,0.03)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? 'var(--text3)' : 'var(--text2)',
        fontSize: 13,
        fontWeight: 500,
        transition: 'all 0.15s',
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={e => {
        if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = subtle ? 'transparent' : 'rgba(255,255,255,0.03)'
      }}
    >
      <Icon className="w-4 h-4" style={{ color: color || 'var(--text3)' }} />
      {label}
    </button>
  )
}

// ─── App Connector Card ────────────────────────────────────────

function AppConnectorCard({ app, onOpen }: {
  app: typeof apps[0]
  onOpen: (id: string) => void
}) {
  const Icon = getAppIcon(app.icon)
  return (
    <button
      onClick={() => onOpen(app.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.02)',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        color: 'var(--text)',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = `${app.color}30` }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${app.color}14`,
      }}>
        <Icon className="w-4 h-4" style={{ color: app.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{app.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {app.description}
        </div>
      </div>
      <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--text3)', flexShrink: 0 }} />
    </button>
  )
}

// ─── Skill Card ────────────────────────────────────────────────

function SkillCard({ skill }: { skill: SkillItem }) {
  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 8,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
        {skill.name}
      </div>
      {skill.category && (
        <div style={{ fontSize: 11, color: 'var(--color-teal-3)', marginBottom: 4 }}>
          {skill.category}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>
        {skill.description}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────

export default function HermesCommandCenter() {
  const { openApp, windows, focusWindow } = useWindowStore()
  const [status, setStatus] = useState<HermesStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [skillSearch, setSkillSearch] = useState('')
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [mcps, setMcps] = useState<McpServer[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Section expanded state
  const [sections, setSections] = useState({
    status: true,
    connectors: false,
    skills: false,
    mcps: false,
    tools: false,
    quick: false,
  })

  const toggleSection = (key: keyof typeof sections) =>
    setSections(s => ({ ...s, [key]: !s[key] }))

  // ─── Load data on mount ──────────────────────────────────

  const loadStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statusRes, skillsRes, mcpsRes] = await Promise.all([
        fetch(apiUrl('/api/hermes/status')).then(r => r.ok ? r.json() : null),
        fetch(apiUrl('/api/hermes/skills')).then(r => r.ok ? r.json() : []),
        fetch(apiUrl('/api/hermes/mcps')).then(r => r.ok ? r.json() : []),
      ])
      if (statusRes) setStatus(statusRes)
      if (skillsRes?.skills) setSkills(skillsRes.skills)
      if (mcpsRes?.servers) setMcps(mcpsRes.servers)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Hermes status')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  // ─── App open helper ─────────────────────────────────────

  const handleOpenApp = useCallback((appId: string) => {
    const appDef = apps.find(a => a.id === appId)
    if (!appDef) return
    const existing = windows.find(w => w.appId === appId)
    if (existing) {
      if (existing.minimized) useWindowStore.getState().minimizeWindow(existing.id)
      focusWindow(existing.id)
    } else {
      openApp(appId, appDef.name, appDef.icon, appDef.color)
    }
  }, [windows, openApp, focusWindow])

  // ─── Filtered skills ─────────────────────────────────────

  const filteredSkills = useMemo(() => {
    if (!skillSearch.trim()) return skills.slice(0, 30)
    const q = skillSearch.toLowerCase()
    return skills.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q)
    ).slice(0, 30)
  }, [skills, skillSearch])

  // ─── Tool actions ────────────────────────────────────────

  const tools: ToolAction[] = [
    {
      id: 'terminal', label: 'Open Terminal', icon: 'Terminal',
      description: 'Full system shell',
      action: () => handleOpenApp('terminal'),
    },
    {
      id: 'editor', label: 'Open Code Editor', icon: 'Code2',
      description: 'Write & edit code',
      action: () => handleOpenApp('editor'),
    },
    {
      id: 'files', label: 'File Manager', icon: 'FileText',
      description: 'Browse & manage files',
      action: () => handleOpenApp('files'),
    },
    {
      id: 'browser', label: 'Web Browser', icon: 'Globe',
      description: 'Browse the web',
      action: () => handleOpenApp('browser'),
    },
  ]

  // ─── Quick actions ───────────────────────────────────────

  const quickActions: ToolAction[] = [
    {
      id: 'refresh-status', label: 'Refresh Status', icon: 'RefreshCw',
      description: 'Reload Hermes status data',
      action: loadStatus,
    },
    {
      id: 'new-note', label: 'New Note', icon: 'FileText',
      description: 'Create a quick note',
      action: () => handleOpenApp('notes'),
    },
  ]

  // ─── Copy to clipboard ───────────────────────────────────

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* fallback */ }
  }

  // ─── Render ──────────────────────────────────────────────

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      color: 'var(--text)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        }}>
          <Command className="w-5 h-5" style={{ color: '#fff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Hermes Command Center</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            {status ? `v${status.version}` : 'loading...'} &middot; One-click control hub
          </div>
        </div>
        <button
          onClick={loadStatus}
          style={{
            padding: 8, borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.03)',
            cursor: 'pointer',
            color: 'var(--text3)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
          }}
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '14px 18px 24px',
      }}>
        {/* Loading / Error */}
        {loading && !status && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 14 }}>
            <Activity className="w-8 h-8" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            Loading Hermes status...
          </div>
        )}

        {error && !status && (
          <div style={{
            padding: 16, borderRadius: 10,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#ef4444',
            fontSize: 13,
            marginBottom: 16,
          }}>
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* ═══════ STATUS SECTION ═══════ */}
        <SectionHeader
          title="Status Dashboard"
          icon={Activity}
          color="#22c55e"
          expanded={sections.status}
          onToggle={() => toggleSection('status')}
        >
          {status ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                marginBottom: 12,
              }}>
                <StatusCard label="Version" value={status.version} icon={Sparkles} color="#6366f1" status="ok" />
                <StatusCard label="Model" value={status.model} icon={Cpu} color="#8b5cf6" status="ok" />
                <StatusCard label="Provider" value={status.provider} icon={Server} color="#06b6d4" status="ok" />
                <StatusCard label="Uptime" value={`${Math.floor(status.uptime / 60)}m ${Math.floor(status.uptime % 60)}s`} icon={Clock} color="#22c55e" status="ok" />
                <StatusCard label="Arch" value={status.system.arch} icon={Cpu} color="#f59e0b" />
                <StatusCard label="Memory" value={status.system.memory} icon={HardDrive} color="#ec4899" status={status.memoryUsage.percent > 80 ? 'warn' : 'ok'} />
                <StatusCard label="Storage" value={status.system.storage} icon={HardDrive} color="#14b8a6" status="ok" />
                <StatusCard label="AI Proxy" value={status.configured ? 'Configured' : 'No API Key'} icon={Globe} color="#6366f1" status={status.configured ? 'ok' : 'warn'} />
              </div>

              <MetricBar
                label="Memory Usage"
                value={status.memoryUsage.current}
                max={status.memoryUsage.limit}
                color="#6366f1"
              />

              <div style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginTop: 8,
              }}>
                <StatusCard label="Skills" value={`${status.skillsCount}`} icon={BookOpen} color="#8b5cf6" />
                <StatusCard label="Plugins" value={`${status.pluginsCount}`} icon={Puzzle} color="#ec4899" />
                <StatusCard label="MCP Servers" value={`${status.mcpCount}`} icon={Link2} color="#06b6d4" />
              </div>
            </>
          ) : loading ? null : (
            <div style={{ color: 'var(--text3)', fontSize: 13, padding: 8 }}>
              Status unavailable. Hermes API may not be reachable.
            </div>
          )}
        </SectionHeader>

        {/* ═══════ APP CONNECTORS SECTION ═══════ */}
        <SectionHeader
          title="App Connectors"
          icon={Grid3X3}
          color="#6366f1"
          count={apps.length}
          expanded={sections.connectors}
          onToggle={() => toggleSection('connectors')}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
          }}>
            {apps.map(app => (
              <AppConnectorCard key={app.id} app={app} onOpen={handleOpenApp} />
            ))}
          </div>
        </SectionHeader>

        {/* ═══════ SKILLS SECTION ═══════ */}
        <SectionHeader
          title="Skills"
          icon={BookOpen}
          color="#8b5cf6"
          count={skills.length}
          expanded={sections.skills}
          onToggle={() => toggleSection('skills')}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: 10,
          }}>
            <Search className="w-4 h-4" style={{ color: 'var(--text3)' }} />
            <input
              type="text"
              placeholder="Search skills..."
              value={skillSearch}
              onChange={e => setSkillSearch(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
            {skills.length > 0 && (
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                {filteredSkills.length} of {skills.length}
              </span>
            )}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            maxHeight: 320,
            overflow: 'auto',
          }}>
            {filteredSkills.map(skill => (
              <SkillCard key={skill.name} skill={skill} />
            ))}
            {filteredSkills.length === 0 && (
              <div style={{ gridColumn: '1 / -1', color: 'var(--text3)', fontSize: 13, padding: 12, textAlign: 'center' }}>
                {skillSearch ? 'No matching skills' : 'No skills loaded'}
              </div>
            )}
          </div>
        </SectionHeader>

        {/* ═══════ MCP SERVERS SECTION ═══════ */}
        <SectionHeader
          title="MCP Servers"
          icon={Link2}
          color="#06b6d4"
          count={mcps.length}
          expanded={sections.mcps}
          onToggle={() => toggleSection('mcps')}
        >
          {mcps.length === 0 ? (
            <div style={{
              padding: 20, borderRadius: 8,
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.08)',
              textAlign: 'center',
              color: 'var(--text3)',
              fontSize: 13,
            }}>
              <Link2 className="w-6 h-6" style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              No MCP servers configured
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mcps.map(mcp => (
                <div key={mcp.name} style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: mcp.status === 'connected' ? '#22c55e'
                      : mcp.status === 'error' ? '#ef4444' : '#78716c',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {mcp.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {mcp.command} {mcp.args?.join(' ')}
                    </div>
                  </div>
                  {mcp.tools && (
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {mcp.tools.length} tools
                    </span>
                  )}
                  <button
                    onClick={() => copyToClipboard(mcp.command + ' ' + (mcp.args?.join(' ') || ''), `mcp-${mcp.name}`)}
                    style={{
                      padding: 4, borderRadius: 6,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: copiedId === `mcp-${mcp.name}` ? '#22c55e' : 'var(--text3)',
                    }}
                    title="Copy command"
                  >
                    {copiedId === `mcp-${mcp.name}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionHeader>

        {/* ═══════ TOOLS SECTION ═══════ */}
        <SectionHeader
          title="System Tools"
          icon={Wrench}
          color="#f59e0b"
          expanded={sections.tools}
          onToggle={() => toggleSection('tools')}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tools.map(tool => (
              <ActionButton
                key={tool.id}
                icon={tool.id === 'terminal' ? Terminal : tool.id === 'editor' ? Code2 : tool.id === 'files' ? FileText : Globe}
                label={tool.label}
                onClick={tool.action}
                color="#f59e0b"
              />
            ))}
          </div>

          {status && (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>
                System Info
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.8 }}>
                <div>OS: {status.system.os} ({status.system.arch})</div>
                <div>Memory: {status.system.memory}</div>
                <div>Storage: {status.system.storage}</div>
                <div>Hermes: v{status.version} &middot; {status.provider} &middot; {status.model}</div>
              </div>
            </div>
          )}
        </SectionHeader>

        {/* ═══════ QUICK ACTIONS ═══════ */}
        <SectionHeader
          title="Quick Actions"
          icon={Zap}
          color="#eab308"
          expanded={sections.quick}
          onToggle={() => toggleSection('quick')}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {quickActions.map(action => (
              <ActionButton
                key={action.id}
                icon={Zap}
                label={action.label}
                onClick={action.action}
                color={action.id === 'refresh-status' ? '#6366f1' : '#22c55e'}
              />
            ))}
          </div>

          <div style={{
            padding: 10, borderRadius: 8,
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.12)',
            fontSize: 12,
            color: 'var(--text2)',
            lineHeight: 1.5,
          }}>
            <strong style={{ color: '#818cf8' }}>Hermes Agent v{status?.version || '?'}</strong>
            <br />
            Running on {status?.system.os || 'Android'} &middot; {status?.provider || 'Unknown'} provider
            <br />
            Skills: {status?.skillsCount || 0} &middot; Plugins: {status?.pluginsCount || 0} &middot; MCPs: {status?.mcpCount || 0}
          </div>
        </SectionHeader>
      </div>
    </div>
  )
}