/**
 * Cakra — the primary AI interface for The Empire
 *
 * I am the central AI hub. Every app can feed context here.
 * I have full awareness of Empire state and can talk to any app.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, Settings, Sparkles, X, Trash2, Copy } from 'lucide-react'
import { streamChat, buildEmpireContext, saveConfig, getConfig } from '../../lib/ai'
import { emit, getRecent } from '../../lib/eventBus'
import { ProvenanceChip } from '../../components/ui/ProvenanceChip'
import { SendResultMenu } from '../../components/ui/SendResultMenu'
import { useInboundHandoff } from '../../lib/useInboundHandoff'
import { tint } from '../../design-system/tokens'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

const CONTEXT_APPS = ['notes', 'calendar', 'messages', 'learning-tracker', 'token-counter', 'prompt-generator', 'editor', 'calculator', 'datacenter']

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [contextExpanded, setContextExpanded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
    setTimeout(() => inputRef.current?.focus(), 100)
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
Be concise, helpful, and slightly playful. When referencing data from other apps, summarize accurately. You can take actions like drafting notes, composing messages, or analyzing code — and explain what you're doing.`

    const historyMessages = messages
      .filter(m => m.id !== 'system-welcome')
      .slice(-10)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    try {
      let assistantContent = ''
      const assistantMsgId = (Date.now() + 1).toString()

      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }])

      await streamChat(
        [
          { role: 'system', content: systemPrompt },
          ...historyMessages,
          { role: 'user', content: userMsg.content },
        ],
        {},
        (token) => {
          assistantContent += token
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: assistantContent } : m
          ))
        },
        () => {
          setLoading(false)
          emit({ type: 'AI_RESPONSE', query: userMsg.content, response: assistantContent, app: 'ai-chat' })
        },
        (err) => {
          setLoading(false)
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: `⚠️ Error: ${err.message}` } : m
          ))
        }
      )
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
  }, [input, loading, messages])

  const clearChat = () => setMessages([])
  const copyMessage = (content: string) => navigator.clipboard.writeText(content)

  const empireContext = buildEmpireContext()

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Cakra</h1>
            <p className="text-xs text-gray-500">AI Connector — all apps, one intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            title="AI Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empire Context Banner */}
      {empireContext && (
        <div className="mx-6 mt-4 p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: tint('signal', 5) }}>
          <button
            onClick={() => setContextExpanded(!contextExpanded)}
            className="w-full flex items-center justify-between text-xs text-cyan-300"
          >
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Empire Context Active</span>
            <span className="text-gray-500">{contextExpanded ? '▲' : '▼'}</span>
          </button>
          {contextExpanded && (
            <pre className="mt-2 text-xs text-gray-400 whitespace-pre-wrap font-mono overflow-auto max-h-32">{empireContext}</pre>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-cyan-300" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Ask me anything</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              I have context from all your apps. Ask about your notes, calendar, code, data — anything in the Empire.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                'Summarize my notes',
                'What events do I have coming up?',
                'Analyze this code...',
                'Draft a message',
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 rounded-full text-xs border border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-cyan-600 text-white rounded-tr-sm'
                : 'border border-white/10 rounded-tl-sm'
            }`} style={msg.role === 'assistant' ? { background: 'var(--card-bg)' } : {}}>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content || (msg.role === 'assistant' && loading && msg.id === messages[messages.length - 1]?.id ? '●' : '')}</div>
              <div className="flex items-center gap-2 mt-1.5">
                {msg.role === 'assistant' && (
                  <>
                    <button
                      onClick={() => copyMessage(msg.content)}
                      className="p-0.5 text-gray-600 hover:text-gray-400 transition-colors"
                      title="Copy"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
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
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="Ask Cakra anything..."
            className="w-full resize-none rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/50"
            style={{ background: 'var(--input-bg)', color: 'var(--text)', minHeight: '52px', maxHeight: '120px' }}
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-600 mt-2">
          Cakra sees all apps · Press Enter to send, Shift+Enter for newline
        </p>
      </div>

      {/* Settings Modal */}
      {settingsOpen && <AISettingsModal onClose={() => setSettingsOpen(false)} />}
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
      <div className="w-full max-w-md rounded-2xl border border-white/10 p-6" style={{ background: 'var(--card-bg)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4" /> AI Settings
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Model</label>
            <input
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-600"
              style={{ background: 'var(--input-bg)', color: 'var(--text)' }}
              placeholder="deepseek/deepseek-v4-flash"
            />
            <p className="text-[10px] text-gray-600 mt-1">Defaults to DeepSeek V4 Flash via OpenRouter</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">API Key (optional — server env var used if empty)</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-600"
              style={{ background: 'var(--input-bg)', color: 'var(--text)' }}
              placeholder="sk-or-v-..."
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={4}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-600 resize-none"
              style={{ background: 'var(--input-bg)', color: 'var(--text)' }}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm hover:bg-cyan-500 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}