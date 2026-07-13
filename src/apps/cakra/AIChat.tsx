/**
 * Cakra — the primary AI interface for The Empire
 *
 * I am the central AI hub. Every app can feed context here.
 * I have full awareness of Empire state and can talk to any app.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, Settings, Sparkles, X, Trash2, Copy, Zap, Brain, ChevronRight } from 'lucide-react'
import { streamChat, buildEmpireContext, saveConfig, getConfig } from '../../lib/ai'
import { runAutoChat } from './lib/autoChat'
import { hasArtifacts, ARTIFACT_SYSTEM_PROMPT } from './lib/artifactProtocol'
import ArtifactMessageContent from './components/ArtifactMessageContent'
import { emit, getRecent } from '../../lib/eventBus'
import { Button, IconButton, Input, TextArea } from '../../components/ui'
import { ProvenanceChip } from '../../components/ui/ProvenanceChip'
import { SendResultMenu } from '../../components/ui/SendResultMenu'
import { useInboundHandoff } from '../../lib/useInboundHandoff'
import { cssVar, tint } from '../../design-system/tokens'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  /** Reasoning / orchestration trace, streamed separately from the answer. */
  thinking?: string
  timestamp: number
}

const CONTEXT_APPS = ['notes', 'calendar', 'messages', 'learning-tracker', 'token-counter', 'prompt-generator', 'editor', 'calculator', 'datacenter']

const AUTO_KEY = 'cakra-auto-mode'

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [contextExpanded, setContextExpanded] = useState(false)
  // Cakra Auto: multi-model orchestration (Thinker → Answerer) on the proxy path. On by default.
  const [autoMode, setAutoMode] = useState(() => {
    try { return localStorage.getItem(AUTO_KEY) !== '0' } catch { return true }
  })
  const toggleAuto = () => setAutoMode(v => {
    const next = !v
    try { localStorage.setItem(AUTO_KEY, next ? '1' : '0') } catch { /* ignore */ }
    return next
  })
  const bottomRef = useRef<HTMLDivElement>(null)

 // Emit APP_OPENED for activity feed tracking
 useEffect(() => {
 emit({ type: 'APP_OPENED', appId: 'ai-chat' })
 }, [])

 // Load clipboard content from other apps (HANDOFF receiver)
 const inbound = useInboundHandoff<{ text?: string; title?: string; from?: string }>('empire-ai-clipboard')
 useEffect(() => {
    if (!inbound.payload?.text) return
    const { text, title } = inbound.payload
    setInput(title ? `${title}\n\n${text}` : text)
    setTimeout(() => (document.getElementById('cakra-compose') as HTMLTextAreaElement | null)?.focus(), 100)
  }, [inbound.payload])

  // Load recent AI events from bus
  useEffect(() => {
  const recent = getRecent('AI_QUERY', 5)
  if (recent.length > 0 && messages.length === 0) {
  const welcomeMsg: Message = {
  id: 'system-welcome',
  role: 'assistant',
  content: `👋 I'm **Cakra** — the AI connector for The Empire.\n\nI have context from **${CONTEXT_APPS.length}** apps. Ask me anything about your data, or use the panel button on any app to send me context directly.`,
  timestamp: Date.now(),
  }
  setMessages([welcomeMsg])
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length]) // only re-scroll when count changes

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Emit AI query event
    emit({ type: 'AI_QUERY', query: userMsg.content, context: buildEmpireContext(), app: 'ai-chat' })

    // Build messages with Empire context
    const empireContext = buildEmpireContext()
    const systemPrompt = `You are **Cakra**, the AI agent powering The Empire — Jondri's personal application suite on Android/Termux with a Mac-themed XFCE desktop.

You have full context awareness across these apps: ${CONTEXT_APPS.join(', ')}.

${empireContext ? `CURRENT EMPIRE STATE:\n${empireContext}\n` : ''}
Be concise, helpful, and slightly playful. When referencing data from other apps, summarize accurately. You can take actions like drafting notes, composing messages, or analyzing code — and explain what you're doing.${ARTIFACT_SYSTEM_PROMPT}`

    const historyMessages = messages
      .filter(m => m.id !== 'system-welcome')
      .slice(-10)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    try {
      let assistantContent = ''
      let assistantThinking = ''
      const assistantMsgId = (Date.now() + 1).toString()

      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        thinking: '',
        timestamp: Date.now(),
      }])

      const outMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...historyMessages,
        { role: 'user' as const, content: userMsg.content },
      ]
      const onToken = (token: string) => {
        assistantContent += token
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: assistantContent } : m
        ))
      }
      const onThinking = (text: string) => {
        assistantThinking += text
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, thinking: assistantThinking } : m
        ))
      }
      const onDone = () => {
        setLoading(false)
        emit({ type: 'AI_RESPONSE', query: userMsg.content, response: assistantContent, app: 'ai-chat' })
      }
      const onError = (err: Error) => {
        setLoading(false)
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: `⚠️ Error: ${err.message}` } : m
        ))
      }

      // Auto ON → multi-model orchestration (hard tasks get a Thinker pass);
      // Auto OFF → a single streamed model (still shows reasoning traces).
      if (autoMode) {
        await runAutoChat(outMessages, { onToken, onThinking, onDone, onError })
      } else {
        await streamChat(outMessages, {}, onToken, onDone, onError, onThinking)
      }
    } catch (err: unknown) {
    setLoading(false)
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    const errorMsg: Message = {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: `⚠️ Failed to connect: ${errMsg}\n\nMake sure the server is running on port 3001.`,
    timestamp: Date.now(),
    }
      setMessages(prev => [...prev.slice(0, -1), errorMsg])
    }
  }, [input, loading, messages, autoMode])

  const clearChat = () => setMessages([])
  const copyMessage = (content: string) => navigator.clipboard.writeText(content)

  const empireContext = buildEmpireContext()

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ion to-ion flex items-center justify-center">
            <Bot className="w-5 h-5 text-fg" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Cakra</h1>
            <p className="text-xs text-faint">AI Connector — all apps, one intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAuto}
            icon={<Zap className="w-3.5 h-3.5" />}
            aria-pressed={autoMode}
            title={autoMode ? 'Cakra Auto ON — routes hard tasks through a multi-model pass' : 'Cakra Auto OFF — single model'}
            style={autoMode
              ? { background: tint('signal', 15), color: cssVar('signal'), border: `1px solid ${tint('signal', 30)}` }
              : { color: cssVar('text3'), border: '1px solid var(--border)' }}
          >
            Auto
          </Button>
          <IconButton
            onClick={clearChat}
            aria-label="Clear chat"
            title="Clear chat"
            icon={<Trash2 className="w-4 h-4" />}
          />
          <IconButton
            onClick={() => setSettingsOpen(true)}
            aria-label="AI Settings"
            title="AI Settings"
            icon={<Settings className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Empire Context Banner */}
      {empireContext && (
        <div className="mx-6 mt-4 p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: tint('signal', 5) }}>
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={() => setContextExpanded(!contextExpanded)}
            aria-expanded={contextExpanded}
            className="text-xs text-signal"
            style={{ justifyContent: 'space-between', padding: 0, color: cssVar('signal') }}
          >
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Empire Context Active</span>
            <span className="text-faint">{contextExpanded ? '▲' : '▼'}</span>
          </Button>
          {contextExpanded && (
            <pre className="mt-2 text-xs text-muted whitespace-pre-wrap font-mono overflow-auto max-h-32">{empireContext}</pre>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ion/20 to-ion/20 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-signal" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Ask me anything</h2>
            <p className="text-sm text-faint max-w-sm mx-auto">
              I have context from all your apps. Ask about your notes, calendar, code, data — anything in the Empire.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                'Summarize my notes',
                'What events do I have coming up?',
                'Analyze this code...',
                'Draft a message',
              ].map((q, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  size="sm"
                  onClick={() => setInput(q)}
                  className="text-xs"
                  style={{ borderRadius: 'var(--radius-full)', border: `1px solid ${tint('signal', 30)}`, color: cssVar('signal') }}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-ion to-ion flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-fg" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-signal text-fg rounded-tr-sm'
                : 'border border-hair rounded-tl-sm'
            }`} style={msg.role === 'assistant' ? { background: 'var(--card-bg)' } : {}}>
              {msg.role === 'assistant' && msg.thinking ? (
                <ThinkingBox
                  text={msg.thinking}
                  live={loading && msg.id === messages[messages.length - 1]?.id && !msg.content}
                />
              ) : null}
              {msg.role === 'assistant' && hasArtifacts(msg.content) ? (
                <div className="text-sm leading-relaxed">
                  <ArtifactMessageContent
                    content={msg.content}
                    streaming={loading && msg.id === messages[messages.length - 1]?.id}
                    renderText={text => <span className="block whitespace-pre-wrap">{text}</span>}
                  />
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content || (msg.role === 'assistant' && loading && msg.id === messages[messages.length - 1]?.id ? '●' : '')}</div>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {msg.role === 'assistant' && (
                  <>
                    <IconButton
                      onClick={() => copyMessage(msg.content)}
                      aria-label="Copy message"
                      title="Copy"
                      size="sm"
                      icon={<Copy className="w-3 h-3" />}
                      style={{ width: '20px', height: '20px' }}
                    />
                    {/* Route this reply onward — lights an ai-chat→target arc. */}
                    <SendResultMenu source="ai-chat" text={msg.content} label="Send reply to…" />
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-2">
        {inbound.source && (
          <div className="mb-2">
            <ProvenanceChip from={inbound.source} onDismiss={inbound.dismiss} />
          </div>
        )}
        <div className="relative">
          <TextArea
            id="cakra-compose"
            value={input}
            onChange={setInput}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="Ask Cakra anything..."
            rows={1}
            style={{ minHeight: '52px', maxHeight: '120px', paddingRight: '48px', resize: 'none', borderRadius: 'var(--radius-lg)' }}
          />
          <IconButton
            onClick={() => handleSubmit()}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            icon={<Send className="w-3.5 h-3.5 text-fg" />}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            style={{ width: '32px', height: '32px', background: cssVar('signal') }}
          />
        </div>
        <p className="text-center text-[10px] text-faint mt-2">
          Cakra sees all apps · Press Enter to send, Shift+Enter for newline
        </p>
      </div>

      {/* Settings Modal */}
      {settingsOpen && <AISettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

/** Collapsible reasoning / orchestration trace shown above an assistant reply. */
function ThinkingBox({ text, live }: { text: string; live: boolean }) {
  const [open, setOpen] = useState(live)
  // Auto-expand while the model is thinking, collapse once the answer arrives.
  useEffect(() => { setOpen(live) }, [live])
  return (
    <div
      className="mb-2 rounded-xl text-xs overflow-hidden"
      style={{ background: tint('signal', 5), border: `1px solid ${tint('signal', 20)}` }}
    >
      <Button
        variant="ghost"
        fullWidth
        size="sm"
        onClick={() => setOpen(o => !o)}
        icon={<Brain className="w-3 h-3" />}
        iconRight={
          <ChevronRight
            className="w-3 h-3 transition-transform"
            style={{ transform: open ? 'rotate(90deg)' : 'none' }}
          />
        }
        style={{ justifyContent: 'space-between', gap: '6px', padding: '8px 12px', fontSize: 'var(--text-xs)', fontWeight: 600, color: cssVar('signal') }}
      >
        <span>{live ? 'Thinking…' : 'Reasoning'}</span>
      </Button>
      {open && (
        <pre
          className="px-3 pb-2 whitespace-pre-wrap font-mono overflow-auto max-h-48"
          style={{ color: cssVar('text2') }}
        >{text}</pre>
      )}
    </div>
  )
}

function AISettingsModal({ onClose }: { onClose: () => void }) {
  const config = getConfig()
  const [model, setModel] = useState(config.model)
  const [apiKey, setApiKey] = useState(config.apiKey)
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt)

  const handleSave = () => {
    saveConfig({ model, apiKey, systemPrompt })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: tint('void', 60) }}>
      <div className="w-full max-w-md rounded-2xl border border-hair p-6" style={{ background: 'var(--card-bg)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4" /> AI Settings
          </h2>
          <IconButton onClick={onClose} aria-label="Close settings" size="sm" icon={<X className="w-4 h-4" />} />
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted mb-1 block">Model</label>
            <Input
              value={model}
              onChange={setModel}
              placeholder="minimaxai/minimax-m3"
            />
            <p className="text-[10px] text-faint mt-1">Defaults to MiniMax-M3 via NVIDIA NIM; Cakra auto-routes harder tasks to a deeper model.</p>
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block">API Key (optional — server env var used if empty)</label>
            <Input
              type="password"
              value={apiKey}
              onChange={setApiKey}
              placeholder="nvapi-..."
            />
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block">System Prompt</label>
            <TextArea
              value={systemPrompt}
              onChange={setSystemPrompt}
              rows={4}
              style={{ resize: 'none' }}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="secondary" fullWidth onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button fullWidth onClick={handleSave} className="flex-1" style={{ flex: 1, background: cssVar('signal'), color: cssVar('void') }}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}