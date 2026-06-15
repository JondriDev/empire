/**
 * ChatPanel — Message list with tool call rendering
 */

import type { Message, Tool } from '../lib/types'
import { Bot } from 'lucide-react'

interface Props {
  messages: Message[]
  toolList: Tool[]
}

function formatContent(content: string) {
  const lines = content.split('\n')
  return lines.map((line, i) => {
    // Escape HTML first — critical for any content sourced from an LLM,
    // since AI responses cannot be trusted. Markdown regex is then run
    // against the (safe) escaped text; the regex injects literal tags.
    const escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    const formatted = escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(99,102,241,0.15);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>')

    return (
      <span
        key={i}
        dangerouslySetInnerHTML={{ __html: formatted }}
        style={{ display: 'block' }}
      />
    )
  })
}

export default function ChatPanel({ messages, toolList }: Props) {
  function getTool(name?: string): Tool | undefined {
    return name ? toolList.find(t => t.name === name) : undefined
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {messages.map(msg => {
        if (msg.role === 'tool') {
          const tool = getTool(msg.toolName)
          return (
            <div key={msg.id} className="flex justify-center">
              <div
                className="max-w-2xl w-full rounded-xl p-4 text-sm"
                style={{
                  background: 'rgba(34,211,238,0.05)',
                  border: `1px solid ${msg.error ? 'rgba(239,68,68,0.4)' : 'rgba(34,211,238,0.25)'}`,
                  borderLeft: `3px solid ${msg.error ? '#ef4444' : '#22d3ee'}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: '#22d3ee' }}>{tool?.icon || '🔧'}</span>
                  <span className="font-mono text-xs" style={{ color: '#22d3ee' }}>
                    {tool?.name || msg.toolName}
                  </span>
                  {msg.error && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                      Error
                    </span>
                  )}
                </div>
                <pre
                  className="whitespace-pre-wrap break-all font-mono text-xs"
                  style={{ color: '#94a3b8', maxHeight: '300px', overflowY: 'auto' }}
                >
                  {msg.content}
                </pre>
              </div>
            </div>
          )
        }

        if (msg.role === 'user') {
          return (
            <div key={msg.id} className="flex justify-end">
              <div
                className="max-w-2xl rounded-2xl px-4 py-3 text-sm"
                style={{
                  background: 'rgba(99,102,241,0.3)',
                  color: '#f1f5f9',
                  borderBottomRightRadius: '6px',
                }}
              >
                {formatContent(msg.content)}
              </div>
            </div>
          )
        }

        // assistant
        return (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-2xl w-full flex gap-3">
              <div
                className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.2)' }}
              >
                <Bot className="w-4 h-4" style={{ color: '#6366f1' }} />
              </div>
              <div
                className="rounded-2xl px-4 py-3 text-sm"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: '#f1f5f9',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderBottomLeftRadius: '6px',
                }}
              >
                {formatContent(msg.content)}
                {msg.content === '' && (
                  <span style={{ color: '#475569' }}>Thinking...</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}