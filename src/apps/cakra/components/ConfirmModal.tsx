/**
 * ConfirmModal — Confirm dangerous tool calls
 */

import type { ToolCall } from '../lib/types'
import { AlertTriangle } from 'lucide-react'
import { cssVar, tint } from '../../../design-system/tokens'

interface Props {
  calls: ToolCall[]
  onConfirm: () => void
  onDeny: () => void
}

export default function ConfirmModal({ calls, onConfirm, onDeny }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: tint('void', 70), backdropFilter: 'blur(4px)' }}
      onClick={onDeny}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: cssVar('abyss'), border: `1px solid ${tint('ember', 30)}` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: tint('ember', 15) }}>
              <AlertTriangle className="w-5 h-5" style={{ color: cssVar('ember') }} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: cssVar('text') }}>
                Confirm Actions
              </h2>
              <p className="text-xs" style={{ color: cssVar('text2') }}>
                These tools need your approval
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            {calls.map(call => (
              <div
                key={call.id}
                className="rounded-lg p-3 text-xs font-mono"
                style={{
                  background: tint('ember', 8),
                  border: `1px solid ${tint('ember', 20)}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: cssVar('ember') }}>⚠️</span>
                  <span style={{ color: cssVar('ember'), fontWeight: 600 }}>{call.name}</span>
                </div>
                <div style={{ color: cssVar('text2'), fontSize: 'var(--text-xs)' }}>
                  {Object.entries(call.arguments)
                    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
                    .join(' · ')}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onDeny}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ background: tint('xenon', 7), color: cssVar('text2') }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ background: cssVar('ember'), color: cssVar('void') }}
            >
              Run Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}