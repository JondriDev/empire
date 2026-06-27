/**
 * Cakra's Workspace — a Manus-style transparency panel.
 *
 * Shows every action Cakra takes, live: reading files & books, searching the
 * web, running code. Click any action to see exactly what it read or returned.
 * Nothing Cakra does is hidden — this panel is the glass box.
 */

import { useEffect, useRef } from 'react'
import { Loader2, Check, X, Activity, Trash2, ChevronRight } from 'lucide-react'
import {
  useActivityStore,
  describeActivity,
  primaryArg,
  type ActivityEntry,
} from '../lib/activityStore'
import { formatToolResult } from '../lib/toolExecutor'

const ACCENT = '#22d3ee'

function StatusIcon({ status, accent }: { status: ActivityEntry['status']; accent: string }) {
  if (status === 'running') return <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: accent }} />
  if (status === 'error') return <X className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
  return <Check className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
}

function Viewer({ entry }: { entry: ActivityEntry }) {
  const d = describeActivity(entry)
  const arg = primaryArg(entry)
  const elapsed =
    entry.endedAt && entry.startedAt ? ((entry.endedAt - entry.startedAt) / 1000).toFixed(1) : null

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base leading-none">{d.icon}</span>
        <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
          {d.verb}
        </span>
        {entry.status === 'running' && (
          <Loader2 className="w-3 h-3 animate-spin" style={{ color: ACCENT }} />
        )}
        {elapsed && (
          <span className="text-[10px] ml-auto" style={{ color: '#475569' }}>
            {elapsed}s
          </span>
        )}
      </div>

      {arg && (
        <div
          className="text-[11px] font-mono mb-2 px-2 py-1.5 rounded-lg break-all"
          style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8' }}
        >
          {arg}
        </div>
      )}

      {entry.status === 'running' ? (
        <div className="flex items-center gap-2 text-xs py-6" style={{ color: '#64748b' }}>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: ACCENT }} />
          {d.verb}…
        </div>
      ) : (
        <pre
          className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed"
          style={{ color: entry.status === 'error' ? '#fca5a5' : '#cbd5e1' }}
        >
          {entry.result ? formatToolResult(entry.result, 20000) : '(no output)'}
        </pre>
      )}
    </div>
  )
}

interface Props {
  onClose: () => void
  overlay?: boolean
}

export default function WorkspacePanel({ onClose, overlay }: Props) {
  const entries = useActivityStore((s) => s.entries)
  const selectedId = useActivityStore((s) => s.selectedId)
  const select = useActivityStore((s) => s.select)
  const clear = useActivityStore((s) => s.clear)

  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [entries.length])

  const selected = entries.find((e) => e.id === selectedId) ?? entries[entries.length - 1]
  const working = entries.some((e) => e.status === 'running')

  return (
    <div
      className={overlay ? 'absolute inset-0 z-20 flex flex-col' : 'flex flex-col h-full flex-shrink-0'}
      style={{
        width: overlay ? '100%' : 340,
        borderLeft: overlay ? 'none' : '1px solid var(--border)',
        background: 'var(--bg)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
            Cakra's Workspace
          </span>
          {working && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 flex-shrink-0"
              style={{ background: 'rgba(34,211,238,0.12)', color: ACCENT }}
            >
              <Loader2 className="w-2.5 h-2.5 animate-spin" /> working
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {entries.length > 0 && (
            <button
              onClick={clear}
              title="Clear activity"
              className="p-1.5 rounded-lg transition-colors hover:text-white"
              style={{ color: '#64748b' }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            title="Hide workspace"
            className="p-1.5 rounded-lg transition-colors hover:text-white"
            style={{ color: '#64748b' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div
          className="flex-1 flex flex-col items-center justify-center text-center px-6"
          style={{ color: '#64748b' }}
        >
          <Activity className="w-8 h-8 mb-3" style={{ opacity: 0.4 }} />
          <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
            Nothing yet
          </p>
          <p className="text-xs mt-1 leading-relaxed">
            Every file Cakra reads, every search it runs, and every command it executes shows up
            here — live, as it happens.
          </p>
        </div>
      ) : (
        <>
          {/* Action list */}
          <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: '42%', flexShrink: 0 }}>
            {entries.map((entry) => {
              const d = describeActivity(entry)
              const isSel = selected?.id === entry.id
              return (
                <button
                  key={entry.id}
                  onClick={() => select(entry.id)}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors"
                  style={{
                    background: isSel ? 'rgba(34,211,238,0.08)' : 'transparent',
                    borderLeft: `2px solid ${isSel ? ACCENT : 'transparent'}`,
                  }}
                >
                  <span className="text-base leading-none flex-shrink-0">{d.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
                      {d.verb}
                    </div>
                    {d.target && (
                      <div className="text-[11px] truncate font-mono" style={{ color: '#64748b' }}>
                        {d.target}
                      </div>
                    )}
                  </div>
                  <span className="flex-shrink-0">
                    <StatusIcon status={entry.status} accent={d.accent} />
                  </span>
                </button>
              )
            })}
          </div>

          {/* Viewer — the actual content of the selected action */}
          <div className="flex-1 overflow-y-auto border-t" style={{ borderColor: 'var(--border)' }}>
            {selected && <Viewer entry={selected} />}
          </div>
        </>
      )}
    </div>
  )
}
