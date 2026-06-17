/**
 * Hermes Agent Bar — floating AI connector visible in every app
 *
 * I am the connector. I give every app in the Empire:
 * - Live awareness of what's happening across all apps (eventBus subscription)
 * - Inline mini-chat with Hermes without leaving the current app
 * - Quick cross-app actions (Send to Notes, Editor, etc.)
 * - Context-aware content detection
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bot, Sparkles, X, StickyNote, Hash, GraduationCap, Wand2, Zap, Send, ChevronUp, Activity, MessageSquare, Minimize2 } from 'lucide-react'
import { apps } from '../lib/registry'
import { CROSS_APP_ACTIONS, type DataPayload } from '../lib/appActions'
import { getModelName, streamChat, buildEmpireContext } from '../lib/ai'
import { on, emit, getAllRecent } from '../lib/eventBus'
import type { EmpireEvent } from '../lib/eventBus'

// Auto-detect current app from URL
function useCurrentAppId(): string {
  const params = useParams<{ appId: string }>()
  return params.appId || 'home'
}

interface ActivityItem {
  id: string
  app: string
  description: string
  time: string
  type: EmpireEvent['type']
}

const APP_COLORS: Record<string, string> = {
  calculator: '#f97316', notes: '#eab308', calendar: '#3b82f6',
  messages: '#818cf8', learningtracker: '#22c55e', aichat: '#0d9488',
  editor: '#6366f1', datacenter: '#64748b', grammar: '#10b981',
  language: '#22d3ee', browser: '#14b8a6', default: '#0d9488',
}

const EVENT_TYPE_MAP: Array<{ prefix: string; appId: string }> = [
  { prefix: 'NOTE_',     appId: 'notes' },
  { prefix: 'CALC',      appId: 'calculator' },
  { prefix: 'EVENT_',   appId: 'calendar' },
  { prefix: 'MESSAGE',  appId: 'messages' },
  { prefix: 'LEARNING', appId: 'learning-tracker' },
  { prefix: 'TOKEN_',   appId: 'token-counter' },
  { prefix: 'PROMPT_',  appId: 'prompt-generator' },
  { prefix: 'AI_',      appId: 'ai-chat' },
  { prefix: 'CODE',     appId: 'editor' },
  { prefix: 'DATA_',    appId: 'datacenter' },
]

const ACTIVITY_LABELS: Partial<Record<EmpireEvent['type'], string>> = {
  NOTE_CREATED:         'created a note',
  NOTE_DELETED:         'deleted a note',
  NOTE_UPDATED:         'updated a note',
  CALCULATION_RESULT:   'calculated',
  EVENT_CREATED:        'created an event',
  EVENT_DELETED:        'deleted an event',
  MESSAGE_SENT:         'sent a message',
  CODE_RUN:             'ran code',
  LEARNING_LOGGED:      'logged learning',
  LEARNING_CHALLENGE:   'completed a challenge',
  TOKEN_COUNTED:        'counted tokens',
  PROMPT_GENERATED:     'generated a prompt',
  AI_QUERY:             'asked Hermes',
  AI_RESPONSE:          'got AI response',
  APP_OPENED:           'opened app',
  DATA_TABLE_UPDATED:   'updated data',
}

export default function HermesAgentBar() {
  const currentAppId = useCurrentAppId()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'actions' | 'activity' | 'chat'>('actions')
  const [model, setModel] = useState('')
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ id: string; role: 'hermes' | 'user'; text: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const unsubRef = useRef<(() => void)[]>([])

  useEffect(() => { setModel(getModelName()) }, [])

  // Subscribe to eventBus
  useEffect(() => {
    const EVENT_TYPES: EmpireEvent['type'][] = [
      'NOTE_CREATED', 'NOTE_DELETED', 'NOTE_UPDATED',
      'CALCULATION_RESULT', 'EVENT_CREATED', 'EVENT_DELETED',
      'MESSAGE_SENT', 'CODE_RUN', 'LEARNING_LOGGED', 'LEARNING_CHALLENGE',
      'TOKEN_COUNTED', 'PROMPT_GENERATED', 'AI_QUERY', 'AI_RESPONSE',
      'APP_OPENED', 'DATA_TABLE_UPDATED',
    ]

    const addActivity = (event: EmpireEvent) => {
    const match = EVENT_TYPE_MAP.find(m => event.type.startsWith(m.prefix))
    const appId = match?.appId || ('app' in event ? String((event as Record<string, unknown>).app) : '') || 'unknown'
    const appDef = apps.find(a => a.id === appId)
    const appName = appDef?.name || 'Empire'

    let description = ACTIVITY_LABELS[event.type] || event.type
    if (event.type === 'NOTE_CREATED')
    description = `created note "${String(event.title || '').substring(0, 20)}"`
    else if (event.type === 'CALCULATION_RESULT')
    description = `calculated: ${event.result}`
    else if (event.type === 'AI_QUERY')
    description = `asked: "${String(event.query || '').substring(0, 30)}…"`

      const item: ActivityItem = {
        id: Date.now().toString() + Math.random(),
        app: appName,
        description,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: event.type,
      }
      setActivity(prev => [item, ...prev].slice(0, 50))
    }

    const unsubs: (() => void)[] = []
    EVENT_TYPES.forEach(type => {
    // Handler accepts any EmpireEvent variant; on() expects specific variant
    unsubs.push(on(type, ((e: EmpireEvent) => addActivity(e)) as never))
    })
    unsubRef.current = unsubs

    const recent = getAllRecent(10)
    const initial: ActivityItem[] = recent.map(e => {
      const match = EVENT_TYPE_MAP.find(m => e.type.startsWith(m.prefix))
      const appId = match?.appId || ('app' in e ? String((e as Record<string, unknown>).app) : '') || 'unknown'
      const appDef = apps.find(a => a.id === appId)
      return {
        id: Math.random().toString(),
        app: appDef?.name || 'Empire',
        description: ACTIVITY_LABELS[e.type] || e.type,
        time: '',
        type: e.type,
      }
    }).reverse()
    if (initial.length > 0) setActivity(initial)

    return () => unsubs.forEach(u => u())
  }, [])

  useEffect(() => {
    if (tab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, tab])

  const appDef = apps.find(a => a.id === currentAppId)

  const sendAction = useCallback((actionKey: keyof typeof CROSS_APP_ACTIONS) => {
    const action = CROSS_APP_ACTIONS[actionKey]
    if (!action) return
    const payload: DataPayload = {
      text: '',
      title: `From ${appDef?.name || currentAppId}`,
      source: currentAppId,
    }
    const result = action.execute(payload)
    setChatMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'hermes', text: `✅ ${result}` }])
  }, [currentAppId, appDef])

  const openAIChat = useCallback(() => navigate('/app/ai-chat'), [navigate])

  const handleChatSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!chatInput.trim() || chatLoading) return

    const userText = chatInput.trim()
    setChatInput('')
    setChatLoading(true)
     setChatMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text: userText }])

    emit({ type: 'AI_QUERY', query: userText, context: buildEmpireContext(), app: currentAppId })

    const empireContext = buildEmpireContext()
    const systemPrompt = `You are Hermes, the AI connector for The Empire. Be concise (1-3 sentences). Current app: ${appDef?.name}.${empireContext ? ` Empire state:\n${empireContext}` : ''}`

    let assistantText = ''
    try {
      await streamChat(
        [{ role: 'system', content: systemPrompt }, { role: 'user', content: userText }],
        {},
        (token) => { assistantText += token },
        () => {
          setChatLoading(false)
           setChatMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'hermes', text: assistantText || 'Done.' }])
          emit({ type: 'AI_RESPONSE', query: userText, response: assistantText, app: currentAppId })
        },
        (err: Error) => {
          setChatLoading(false)
           setChatMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'hermes', text: `⚠️ ${err.message}` }])
        }
      )
    } catch (err: unknown) {
    setChatLoading(false)
    const msg = err instanceof Error ? err.message : 'Unknown error'
     setChatMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'hermes', text: `⚠️ ${msg}` }])
    }
  }, [chatInput, chatLoading, currentAppId, appDef])

  const currentAppColor = APP_COLORS[currentAppId] || APP_COLORS.default

  // ── Minimized pill ──
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        aria-label="Open Hermes assistant"
        className="hermes-trigger fixed right-3 bottom-20 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{
          background: 'var(--gl-bg)',
          backdropFilter: 'var(--gl-blur)',
          WebkitBackdropFilter: 'var(--gl-blur)',
          border: '1px solid rgba(34,211,238,0.25)',
          boxShadow: 'var(--glow-teal)',
        }}
      >
        <Bot className="w-3.5 h-3.5 text-cyan-300" />
        <span className="text-[10px] text-cyan-200">Hermes</span>
        {activity.length > 0 && (
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        )}
      </button>
    )
  }

  return (
    <>
      {/* ── Trigger pill ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close Hermes panel' : 'Open Hermes panel'}
        aria-expanded={open}
        className="hermes-trigger fixed right-3 bottom-20 z-40 flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all duration-200"
        style={{
          background: 'rgba(13, 18, 36, 0.85)',
          backdropFilter: 'blur(var(--blur-xl)) saturate(1.6)',
          WebkitBackdropFilter: 'blur(var(--blur-xl)) saturate(1.6)',
          border: '1px solid rgba(34,211,238,0.3)',
          boxShadow: '0 4px 18px rgba(0,0,0,0.4), 0 0 24px rgba(34,211,238,0.18), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = '' }}
      >
        <Bot className="w-3.5 h-3.5 text-cyan-300" />
        <span className="text-[10px] font-semibold text-cyan-200 hidden sm:inline">Hermes</span>
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: open ? 'var(--color-cyan-4)' : 'var(--color-green-4)',
            boxShadow: open ? '0 0 8px var(--color-cyan-4)' : '0 0 6px var(--color-green-4)',
            animation: open ? 'none' : 'pulse 2s ease-in-out infinite',
          }}
        />
      </button>

      {/* ── Connector Panel ── */}
      {open && (
        <div
          className="fixed right-3 bottom-24 z-50 w-72 rounded-2xl overflow-hidden flex flex-col animate-scale-in"
          style={{
            background: 'var(--gl-bg-el)',
            backdropFilter: 'var(--gl-blur-el)',
            WebkitBackdropFilter: 'var(--gl-blur-el)',
            border: '1px solid rgba(34,211,238,0.2)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.3), var(--glow-teal)',
            maxHeight: '480px',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0d9488, #0e7490)' }}
              >
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Hermes</div>
                <div className="text-[9px] font-mono" style={{ color: 'var(--text3)' }}>
                  {model.split('/').pop() || 'connected'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${currentAppColor}18`, color: currentAppColor }}
              >
                {appDef?.name}
              </span>
              <button
                onClick={() => setMinimized(true)}
                aria-label="Minimize Hermes to pill"
                className="p-1 rounded transition-colors hover:bg-white/5"
                style={{ color: 'var(--text3)' }}
              >
                <Minimize2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close Hermes panel"
                className="p-1 rounded transition-colors hover:bg-white/5"
                style={{ color: 'var(--text3)' }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {([
              { id: 'actions'  as const, label: 'Actions',  icon: Zap },
              { id: 'activity' as const, label: 'Activity', icon: Activity },
              { id: 'chat'     as const, label: 'Chat',     icon: MessageSquare },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] transition-colors"
                style={{
                  color: tab === t.id ? 'var(--color-teal-3)' : 'var(--text3)',
                  borderBottom: tab === t.id ? '1.5px solid var(--color-cyan-4)' : '1.5px solid transparent',
                }}
              >
                <t.icon className="w-3 h-3" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">

            {/* Actions tab */}
            {tab === 'actions' && (
              <div className="p-3 space-y-0.5">
                <button
                  onClick={openAIChat}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-colors hover:bg-white/6"
                  style={{ color: 'var(--text)' }}
                >
                  <Bot className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Open AI Chat</span>
                </button>

                <div
                  className="text-[9px] px-3 pt-2 pb-1 font-medium tracking-wider uppercase"
                  style={{ color: 'var(--text3)' }}
                >
                  Cross-app actions
                </div>

                {([
                  { key: 'SEND_TO_NOTES'       as const, icon: StickyNote,      color: '#eab308', label: 'Save to Notes' },
                  { key: 'SEND_TO_EDITOR'       as const, icon: Wand2,          color: '#6366f1', label: 'Open in Code Editor' },
                  { key: 'SEND_TO_TOKEN_COUNTER' as const, icon: Hash,          color: '#38bdf8', label: 'Count Tokens' },
                  { key: 'SEND_TO_LEARNING'    as const, icon: GraduationCap,   color: '#22c55e', label: 'Track as Learning' },
                  { key: 'SEND_TO_PROMPT_GEN'  as const, icon: Zap,             color: '#0d9488', label: 'Generate Prompt' },
                  { key: 'SEND_TO_AI_CHAT'    as const, icon: Sparkles,        color: '#0d9488', label: 'Ask Hermes (this context)' },
                ]).map(action => (
                  <button
                    key={action.key}
                    onClick={() => sendAction(action.key)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors hover:bg-white/6"
                  >
                    <action.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: action.color }} />
                    <span className="text-xs" style={{ color: 'var(--text)' }}>{action.label}</span>
                  </button>
                ))}

                <div className="text-[9px] px-3 pt-2" style={{ color: 'var(--text3)' }}>
                  Activity: <span style={{ color: 'var(--color-teal-3)' }}>{activity.length} events</span>
                </div>
              </div>
            )}

            {/* Activity tab */}
            {tab === 'activity' && (
              <div className="p-2">
                {activity.length === 0 ? (
                  <p className="text-[10px] text-center py-8" style={{ color: 'var(--text3)' }}>
                    No activity yet. Use apps to generate events.
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    {activity.map(item => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2.5 px-2 py-1.5 rounded-lg transition-colors hover:bg-white/3"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                          style={{ background: APP_COLORS[item.app.toLowerCase().replace(/ /g, '')] || currentAppColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] truncate" style={{ color: 'var(--text2)' }}>
                            {item.description}
                          </div>
                          <div className="text-[9px]" style={{ color: 'var(--text3)' }}>
                            {item.app}{item.time ? ` · ${item.time}` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat tab */}
            {tab === 'chat' && (
              <div className="flex flex-col" style={{ minHeight: '280px' }}>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {chatMessages.length === 0 && (
                    <p className="text-[10px] text-center py-6" style={{ color: 'var(--text3)' }}>
                      Ask me anything about the Empire.<br />I connect all your apps.
                    </p>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-[85%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed"
                        style={{
                          background: msg.role === 'user'
                            ? 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(13,148,136,0.2))'
                            : 'rgba(255,255,255,0.05)',
                          color: msg.role === 'user' ? '#e0f7fa' : 'var(--text2)',
                          border: msg.role === 'user'
                            ? '1px solid rgba(34,211,238,0.2)'
                            : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {msg.role === 'hermes' && <Bot className="w-2.5 h-2.5 inline mr-1 text-cyan-300" />}
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div
                        className="rounded-2xl px-3 py-2 text-[11px]"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <span className="animate-pulse" style={{ color: 'var(--color-cyan-4)' }}>●</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat input */}
                <form
                  onSubmit={handleChatSubmit}
                  className="p-2 flex gap-2 flex-shrink-0"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Ask Hermes…"
                    aria-label="Ask Hermes"
                    className="flex-1 rounded-xl px-3 py-2 text-[11px] transition-all duration-150"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'var(--text)',
                      outline: 'none',
                    }}
                    onFocus={e => {
                      e.target.style.background = 'rgba(255,255,255,0.09)'
                      e.target.style.borderColor = 'rgba(34,211,238,0.4)'
                      e.target.style.boxShadow = '0 0 0 2px rgba(34,211,238,0.2)'
                    }}
                    onBlur={e => {
                      e.target.style.background = 'rgba(255,255,255,0.06)'
                      e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    aria-label="Send message to Hermes"
                    className="p-2 rounded-xl transition-all duration-150 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-cyan-5), var(--color-teal-3))',
                      boxShadow: '0 2px 8px rgba(34,211,238,0.4)',
                    }}
                  >
                    <Send className="w-3 h-3 text-white" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-4 py-1.5 text-[9px] flex items-center justify-between flex-shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--text3)' }}
          >
            <span>I am the connector</span>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-0.5 transition-colors hover:text-white"
              style={{ color: 'var(--text3)' }}
            >
              <ChevronUp className="w-2.5 h-2.5" /> collapse
            </button>
          </div>
        </div>
      )}
    </>
  )
}