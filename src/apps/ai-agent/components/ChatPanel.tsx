/**
 * ChatPanel — Message list with tool call rendering
 */

import type { Message, Tool } from '../lib/types'
import { Bot } from 'lucide-react'
import { cssVar, tint } from '../../../design-system/tokens'

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
      .replace(/`([^`]+)`/g, `<code style="background:${tint('ion', 15)};padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>`)

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
                  background: tint('signal', 5),
                  border: `1px solid ${msg.error ? tint('c-danger', 40) : tint('signal', 25)}`,
                  borderLeft: `3px solid ${msg.error ? cssVar('c-danger') : cssVar('signal')}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: cssVar('signal') }}>{tool?.icon || '🔧'}</span>
                  <span className="font-mono text-xs" style={{ color: cssVar('signal') }}>
                    {tool?.name || msg.toolName}
                  </span>
                  {msg.error && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: tint('c-danger', 20), color: cssVar('c-danger') }}>
                      Error
                    </span>
                  )}
                </div>
                <pre
                  className="whitespace-pre-wrap break-all font-mono text-xs"
                  style={{ color: cssVar('text2'), maxHeight: '300px', overflowY: 'auto' }}
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
                  background: tint('ion', 30),
                  color: cssVar('text'),
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
                style={{ background: tint('ion', 20) }}
              >
                <Bot className="w-4 h-4" style={{ color: cssVar('ion') }} />
              </div>
              <div
                className="rounded-2xl px-4 py-3 text-sm"
                style={{
                  background: tint('xenon', 4),
                  color: cssVar('text'),
                  border: `1px solid ${tint('xenon', 6)}`,
                  borderBottomLeftRadius: '6px',
                }}
              >
                {formatContent(msg.content)}
                {msg.content === '' && (
                  <span style={{ color: cssVar('text3') }}>Thinking...</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}