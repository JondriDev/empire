/**
 * Messages — connected to the Empire eventBus
 * Messages are stored in Zustand, broadcast on send.
 */

import { useState, useEffect } from 'react'
import { Bot, Send, Trash2 } from 'lucide-react'
import { useStore } from '../../lib/store'
import { emit } from '../../lib/eventBus'

const CONTACTS = ['Jondri', 'Work', 'Family', 'Urgent', 'AI Bot']

export default function Messages() {
  const { messages, addMessage } = useStore()
 const [draft, setDraft] = useState('')
 const [recipient, setRecipient] = useState(CONTACTS[0])

 // Emit APP_OPENED for activity feed tracking
 useEffect(() => {
 emit({ type: 'APP_OPENED', appId: 'messages' })
 }, [])

 const send = () => {
    if (!draft.trim()) return
    const msg = {
      id: Date.now().toString(),
      sender: 'Me',
      content: draft.trim(),
      timestamp: Date.now(),
    }
    addMessage(msg)
    emit({ type: 'MESSAGE_SENT', sender: 'Me', content: draft.trim() })
    setDraft('')
  }

  const askHermesDraft = () => {
    if (!draft.trim()) return
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `Draft message to ${recipient}:\n\n${draft}`,
      title: `Draft to ${recipient}`,
      from: 'messages',
    }))
    window.location.href = '/app/ai-chat'
  }

  const askHermesThread = () => {
    const recent = messages.slice(-5).map(m => `[${m.sender}]: ${m.content}`).join('\n')
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: recent || 'No messages yet',
      title: 'Message Thread Analysis',
      from: 'messages',
    }))
    window.location.href = '/app/ai-chat'
  }

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>
      {/* Thread list */}
      <div className="w-72 border-r flex flex-col" style={{ borderColor: 'var(--border)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-lg font-bold">Messages</h1>
          <p className="text-xs text-gray-400">{messages.length} messages</p>
        </div>
        <div className="flex-1 overflow-auto">
          <button
            onClick={askHermesThread}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <Bot className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-sm font-medium text-purple-300">Ask Hermes</div>
              <div className="text-xs text-gray-500">Analyze my messages</div>
            </div>
          </button>
          {CONTACTS.map(contact => (
            <button
              key={contact}
              onClick={() => setRecipient(contact)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b ${recipient === contact ? 'bg-purple-500/10' : 'hover:bg-white/5'}`}
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                {contact[0]}
              </div>
              <div>
                <div className="text-sm font-medium">{contact}</div>
                <div className="text-xs text-gray-500">
                  {messages.filter(m => m.sender === contact || m.sender === 'Me').length} messages
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {recipient[0]}
            </div>
            <div>
              <div className="text-sm font-semibold">{recipient}</div>
              <div className="text-xs text-gray-500">Active now</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-3">
          {messages.filter(m => m.sender === recipient || m.sender === 'Me').length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No messages with {recipient} yet</p>
            </div>
          )}
          {messages.map(msg => {
            const isMe = msg.sender === 'Me'
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    isMe ? 'bg-purple-600 text-white rounded-tr-sm' : 'border border-white/10 rounded-tl-sm'
                  }`}
                  style={!isMe ? { background: 'var(--card-bg)' } : {}}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-purple-200' : 'text-gray-600'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Input */}
        <div className="px-6 pb-6 pt-2">
          <div className="flex gap-2 items-end">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder={`Message ${recipient}...`}
              rows={1}
              className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              style={{ background: 'var(--input-bg)', color: 'var(--text)', minHeight: '48px', maxHeight: '100px' }}
            />
            {draft.trim() && (
              <button
                onClick={askHermesDraft}
                className="w-10 h-10 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 flex items-center justify-center text-purple-400 transition-colors flex-shrink-0"
                title="Refine with Hermes"
              >
                <Bot className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={send}
              disabled={!draft.trim()}
              className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 flex items-center justify-center text-white transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5">Enter to send · Shift+Enter for newline</p>
        </div>
      </div>
    </div>
  )
}