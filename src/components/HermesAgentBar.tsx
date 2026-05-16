/**
 * Hermes Agent Bar — floating AI/context panel visible in every app
 *
 * This is the "I am the connector" piece. A subtle pill-button on the edge
 * of every screen that gives quick access to AI, cross-app actions,
 * and context awareness.
 */

import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Sparkles, X, StickyNote, Hash, GraduationCap, Wand2, Zap } from 'lucide-react'
import { apps, getAppIcon } from '../lib/registry'
import { CROSS_APP_ACTIONS, type DataPayload } from '../lib/appActions'
import { getModelName } from '../lib/ai'

interface HermesBarProps {
  currentAppId: string
  currentContent?: string
  currentTitle?: string
}

export default function HermesAgentBar({ currentAppId, currentContent, currentTitle }: HermesBarProps) {
  const [open, setOpen] = useState(false)
  const [model, setModel] = useState('')
  const navigate = useNavigate()

  useEffect(() => { setModel(getModelName()) }, [])

  const appDef = apps.find(a => a.id === currentAppId)

  const hasContent = currentContent && currentContent.length > 0

  const sendAction = useCallback((actionKey: keyof typeof CROSS_APP_ACTIONS) => {
    const action = CROSS_APP_ACTIONS[actionKey]
    if (!action || !currentContent) return
    const payload: DataPayload = {
      text: currentContent,
      title: currentTitle || `From ${appDef?.name || currentAppId}`,
      source: currentAppId,
    }
    setOpen(false)
    action.execute(payload)
  }, [currentContent, currentTitle, currentAppId, appDef])

  const openAIChat = useCallback(() => {
    if (hasContent) {
      sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
        text: currentContent,
        title: currentTitle,
        from: currentAppId,
      }))
    }
    setOpen(false)
    navigate('/app/ai-chat')
  }, [currentContent, currentTitle, currentAppId, navigate, hasContent])

  if (!appDef?.hermesEnabled) return null

  return (
    <>
      {/* Floating trigger pill */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-3 bottom-20 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg transition-all duration-200 hover:scale-105 group"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))',
          border: '1px solid rgba(139,92,246,0.3)',
          backdropFilter: 'blur(12px)',
        }}
        title="Hermes — AI Connector"
      >
        <Bot className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[10px] text-purple-300 hidden sm:inline">Hermes</span>
        <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-purple-400' : 'bg-green-400 animate-pulse'}`} />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed right-3 bottom-24 z-50 w-64 rounded-2xl shadow-2xl border overflow-hidden"
          style={{
            background: 'rgba(15, 15, 25, 0.95)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(139,92,246,0.2)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium">Hermes</div>
                <div className="text-[8px] text-gray-500">{model.split('/').pop() || 'connected'}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">{appDef?.name}</span>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-500 hover:text-white"><X className="w-3 h-3" /></button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="p-3 space-y-1">
            <button
              onClick={openAIChat}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-colors text-left"
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>Ask Hermes</span>
              {hasContent && <span className="text-gray-500 ml-auto text-[10px]">+context</span>}
            </button>

            {hasContent && (
              <>
                <div className="text-[10px] text-gray-600 px-3 pt-2 pb-1 border-t border-white/5 mt-1">Send to...</div>

<button
                onClick={() => sendAction('SEND_TO_NOTES' as keyof typeof CROSS_APP_ACTIONS)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-colors text-left"
              >
                  <StickyNote className="w-3 h-3 text-yellow-400" />
                  <span>Notes</span>
                </button>

                <button
                  onClick={() => sendAction('SEND_TO_TOKEN_COUNTER')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-colors text-left"
                >
                  <Hash className="w-3 h-3 text-blue-400" />
                  <span>Token Counter</span>
                </button>

                <button
                  onClick={() => sendAction('SEND_TO_EDITOR')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-colors text-left"
                >
                  <Wand2 className="w-3 h-3 text-indigo-400" />
                  <span>Code Editor</span>
                </button>

                <button
                  onClick={() => sendAction('SEND_TO_LEARNING')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-colors text-left"
                >
                  <GraduationCap className="w-3 h-3 text-green-400" />
                  <span>Learning Tracker</span>
                </button>

                <button
                  onClick={() => sendAction('SEND_TO_PROMPT_GEN')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-colors text-left"
                >
                  <Zap className="w-3 h-3 text-pink-400" />
                  <span>Prompt Generator</span>
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 text-[9px] text-gray-600 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            I am the connector — every app talks through me.
          </div>
        </div>
      )}
    </>
  )
}