/**
 * Cakra Agent — Main App
 * Agentic AI for The Empire, with a Manus-style transparent Workspace panel
 * so you can watch every action Cakra takes — reading files, searching,
 * running code — live, as it happens.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Settings, Play, Square, Zap, ChevronDown, PanelRight, Trash2 } from 'lucide-react'
import { Button, IconButton, TextArea } from '../../components/ui'
import { runAgentTurn, getSettings, saveSettings, type AgentSettings } from './lib/agent'
import { runOrchestratedTurn } from './lib/orchestrator'
import type { Message, ToolCall, ThinkingStep } from './lib/types'
import { getProvider } from './lib/providers'
import { cssVar, tint } from '../../design-system/tokens'
import { TOOL_LIST } from './lib/tools'
import { useActivityStore } from './lib/activityStore'
import ChatPanel from './components/ChatPanel'
import ThinkingTrace from './components/ThinkingTrace'
import ModelPicker from './components/ModelPicker'
import SettingsPanel from './components/SettingsPanel'
import ConfirmModal from './components/ConfirmModal'
import WorkspacePanel from './components/WorkspacePanel'
import { emit } from '../../lib/eventBus'

const AGENT_NAME = 'Cakra'

const WELCOME = `👋 **${AGENT_NAME} is ready.**

I can *act* — not just chat. Here's what I can do:

**📄 File Operations**
Read, write, and browse files in your Android storage.

**⌨️ Shell Commands**
Run any Terminal command on your Termux session.

**🔍 Web Search**
Search the web and fetch page content.

**▶️ Code Execution**
Run Python or JavaScript code directly.

**Just ask me to do something.** Be specific — "read my notes file", "find all .py files in projects", "search for the latest AI news", "run this Python script" etc.

*Watch everything I do live in the **Workspace** panel on the right.*`

export default function AgentSurface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: WELCOME,
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modelPickerOpen, setModelPickerOpen] = useState(false)
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([])
  const [showThinking, setShowThinking] = useState(false)
  const [pendingConfirmCalls, setPendingConfirmCalls] = useState<ToolCall[]>([])
  const [settings, setSettings] = useState<AgentSettings>(getSettings)
  const [_aborted, setAborted] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [containerW, setContainerW] = useState(0)

  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Live activity log — Cakra's transparent Workspace
  const startActivity = useActivityStore(s => s.start)
  const finishActivity = useActivityStore(s => s.finish)

  // Track the window width so the Workspace docks beside the chat on wide
  // screens and slides over as a full panel on a phone.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setContainerW(e.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const isNarrow = containerW > 0 && containerW < 560

  // Match panel visibility to layout when the breakpoint flips: open beside a
  // wide chat, tucked away on a narrow one (it auto-opens when Cakra acts).
  useEffect(() => {
    setPanelOpen(!isNarrow)
  }, [isNarrow])

  // Emit APP_OPENED
  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'ai-chat' })
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinkingSteps])

  // ─── Load clipboard from other apps ─────────────────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem('empire-ai-clipboard')
    if (raw) {
      try {
        const { text, title, from } = JSON.parse(raw)
        // `from` is optional (the home Bridge's ask line sends none) — never
        // render a "From undefined:" prefix.
        const ctx = from
          ? `From ${from}${title ? ` (${title})` : ''}:\n\n${text}`
          : (title ? `${title}\n\n${text}` : text)
        setInput(ctx)
        sessionStorage.removeItem('empire-ai-clipboard')
      } catch { /* ignore */ }
    }
  }, [])

  // Auto-grow the compose field to fit its content (bounded), on both typing
  // and inbound-clipboard prefill. (The TextArea primitive isn't a forwardRef,
  // so we size it by id — the AIChat S9 pattern.)
  useEffect(() => {
    const el = document.getElementById('cakra-agent-compose') as HTMLTextAreaElement | null
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [input])

  // ─── Run agent turn ───────────────────────────────────────────────────────
  const runTurn = useCallback((userContent: string, extraMessages: Message[] = []) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setThinkingSteps([])
    setAborted(false)

    const historyMessages: Message[] = [
      ...messages.filter(m => m.id !== 'welcome'),
      ...extraMessages,
      userMsg,
    ]

    const assistantMsgId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }])

    // Cakra Auto orchestrates across the whole NIM pool; otherwise run the
    // single-model agentic loop. Both share the same callbacks below.
    const runTurnFn = settings.orchestrate ? runOrchestratedTurn : runAgentTurn

    runTurnFn(historyMessages, settings, {
      onPhaseChange(phase) {
        if (phase === 'thinking') {
          setThinkingSteps([{ step: 1, text: 'Analyzing request...', timestamp: Date.now() }])
        }
      },
      onThinking(step) {
        setThinkingSteps(prev => [...prev, step])
      },
      onToken(token) {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: m.content + token } : m
        ))
      },
      onToolStart(call) {
        // The instant Cakra begins an action, surface it in the Workspace.
        startActivity(call)
        setPanelOpen(true)
      },
      onToolCall(call, result) {
        finishActivity(call.id, result)
      },
      onConfirmNeeded(calls) {
        setLoading(false)
        setPendingConfirmCalls(calls)
      },
      onDone() {
        setLoading(false)
      },
      onError(err) {
        setLoading(false)
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: `⚠️ **Error:** ${err.message}` }
            : m
        ))
      },
    })
  }, [messages, settings, startActivity, finishActivity])

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || loading) return
    runTurn(input.trim())
  }, [input, loading, runTurn])

  const handleConfirmDangerous = useCallback(async (calls: ToolCall[]) => {
    // Execute approved dangerous calls — and show each one in the Workspace.
    const toolRequests = calls.map(c => ({
      tool: c.name as any,
      params: c.arguments,
      callId: c.id,
    }))

    setPendingConfirmCalls([])
    setLoading(true)
    setPanelOpen(true)
    calls.forEach(c => startActivity(c))

    try {
      const { executeToolsParallel } = await import('./lib/toolExecutor')
      const results = await executeToolsParallel(toolRequests)
      calls.forEach(c => finishActivity(c.id, results[c.id]))
      setLoading(false)
    } catch (_err) {
      setLoading(false)
    }
  }, [startActivity, finishActivity])

  const handleCancel = () => {
    abortRef.current?.abort()
    setLoading(false)
  }

  const clearChat = () => setMessages([{
    id: 'welcome',
    role: 'assistant',
    content: WELCOME,
    timestamp: Date.now(),
  }])

  const activeProvider = getProvider(settings.activeProvider)
  const activeModel = settings.providers[settings.activeProvider]?.model || activeProvider.models[0]?.id

  return (
    <div ref={rootRef} className="h-full flex relative" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* ─── Chat column ─────────────────────────────────────────────────── */}
      <div className="h-full flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ion to-signal flex items-center justify-center">
              <Bot className="w-5 h-5 text-fg" />
            </div>
            <div>
              <h1 className="text-base font-semibold">{AGENT_NAME}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModelPickerOpen(true)}
                iconRight={<ChevronDown className="w-3 h-3" />}
                aria-label="Choose model"
                style={{
                  ...(settings.orchestrate
                    ? { background: tint('aurora', 15), color: cssVar('aurora') }
                    : { background: tint('ion', 15), color: cssVar('ion') }),
                  borderRadius: 'var(--radius-full)',
                  padding: '2px 8px',
                  fontSize: 'var(--text-xs)',
                  gap: '4px',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {settings.orchestrate ? (
                    <>
                      <span>✨ Cakra Auto</span>
                      <span style={{ color: cssVar('text2') }}>·</span>
                      <span>NIM pool</span>
                    </>
                  ) : (
                    <>
                      <span>{activeProvider.name}</span>
                      <span style={{ color: cssVar('text2') }}>·</span>
                      <span>{activeModel?.split('/').pop()}</span>
                    </>
                  )}
                </span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <IconButton
              onClick={() => setShowThinking(v => !v)}
              icon={<Zap className="w-4 h-4" />}
              aria-label="Toggle thinking trace"
              aria-pressed={showThinking}
              title="Toggle thinking trace"
              style={{ color: cssVar('text2'), background: showThinking ? tint('signal', 10) : 'transparent' }}
            />
            <IconButton
              onClick={() => setPanelOpen(v => !v)}
              icon={<PanelRight className="w-4 h-4" />}
              aria-label="Toggle Workspace"
              aria-pressed={panelOpen}
              title="Toggle Workspace — see what Cakra is doing"
              style={{ color: panelOpen ? cssVar('signal') : cssVar('text2'), background: panelOpen ? tint('signal', 10) : 'transparent' }}
            />
            <IconButton
              onClick={clearChat}
              icon={<Trash2 className="w-4 h-4" />}
              aria-label="Clear chat"
              title="Clear chat"
              style={{ color: cssVar('text2') }}
            />
            <IconButton
              onClick={() => setSettingsOpen(true)}
              icon={<Settings className="w-4 h-4" />}
              aria-label="Settings"
              title="Settings"
              style={{ color: cssVar('text2') }}
            />
          </div>
        </div>

        {/* Thinking Trace */}
        {showThinking && thinkingSteps.length > 0 && (
          <ThinkingTrace steps={thinkingSteps} />
        )}

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto">
          <ChatPanel
            messages={messages}
            toolList={TOOL_LIST}
            streaming={loading}
          />
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <TextArea
                id="cakra-agent-compose"
                value={input}
                onChange={setInput}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="Ask me to do something..."
                rows={1}
                aria-label="Message Cakra"
                className="pr-12"
                disabled={loading}
                style={{
                  background: tint('xenon', 5),
                  resize: 'none',
                  minHeight: 0,
                  maxHeight: '120px',
                  padding: '12px 48px 12px 16px',
                  borderRadius: 'var(--radius-lg)',
                }}
              />
              {loading && (
                <IconButton
                  size="sm"
                  onClick={handleCancel}
                  icon={<Square className="w-4 h-4" />}
                  aria-label="Stop"
                  className="absolute right-3 bottom-3"
                  style={{ color: cssVar('c-danger') }}
                />
              )}
            </div>
            <IconButton
              onClick={() => handleSubmit()}
              disabled={!input.trim() || loading}
              icon={<Play className="w-4 h-4" />}
              aria-label="Send"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-lg)',
                background: input.trim() && !loading ? cssVar('ion') : tint('ion', 30),
                color: cssVar('xenon'),
              }}
            />
          </div>
          <p className="text-xs text-center mt-2" style={{ color: cssVar('text3') }}>
            Shift+Enter for newline · Enter to send · I'm an AI that can take actions
          </p>
        </div>
      </div>

      {/* ─── Workspace panel (Manus-style transparency) ──────────────────── */}
      {panelOpen && (
        <WorkspacePanel overlay={isNarrow} onClose={() => setPanelOpen(false)} />
      )}

      {/* Model Picker */}
      {modelPickerOpen && (
        <ModelPicker
          settings={settings}
          onChange={newSettings => {
            setSettings(newSettings)
            saveSettings(newSettings)
          }}
          onClose={() => setModelPickerOpen(false)}
        />
      )}

      {/* Settings Panel */}
      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onChange={newSettings => {
            setSettings(newSettings)
            saveSettings(newSettings)
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Dangerous tool confirmation */}
      {pendingConfirmCalls.length > 0 && (
        <ConfirmModal
          calls={pendingConfirmCalls}
          onConfirm={() => handleConfirmDangerous(pendingConfirmCalls)}
          onDeny={() => setPendingConfirmCalls([])}
        />
      )}
    </div>
  )
}
