/**
 * ConfirmModal — Confirm dangerous tool calls
 */

import type { ToolCall } from '../lib/types'
import { AlertTriangle } from 'lucide-react'

interface Props {
  calls: ToolCall[]
  onConfirm: () => void
  onDeny: () => void
}

export default function ConfirmModal({ calls, onConfirm, onDeny }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onDeny}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#111827', border: '1px solid rgba(245,158,11,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
                Confirm Actions
              </h2>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
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
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.2)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: '#f59e0b' }}>⚠️</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>{call.name}</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>
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
              style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ background: '#f59e0b', color: '#000' }}
            >
              Run Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}