/**
 * ModelPicker — Select provider and model
 */

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { PROVIDER_LIST, getNimPool } from '../lib/providers'
import type { ProviderId } from '../lib/types'
import type { AgentSettings } from '../lib/agent'

interface Props {
  settings: AgentSettings
  onChange: (s: AgentSettings) => void
  onClose: () => void
}

export default function ModelPicker({ settings, onChange, onClose }: Props) {
  const [selected, setSelected] = useState<ProviderId>(settings.activeProvider)

  const provider = PROVIDER_LIST.find(p => p.id === selected)!

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#111827', border: '1px solid #1e2d4a' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1e2d4a' }}>
          <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>Choose Model</h2>
          <button onClick={onClose} className="p-1 rounded" style={{ color: '#94a3b8' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cakra Auto — orchestrate across the whole NIM pool */}
        <div className="px-5 pt-4">
          <button
            onClick={() => onChange({ ...settings, orchestrate: !settings.orchestrate })}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors"
            style={{
              background: settings.orchestrate ? 'rgba(118,185,0,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${settings.orchestrate ? '#76b90055' : 'transparent'}`,
            }}
          >
            <div>
              <div className="text-sm font-medium" style={{ color: '#f1f5f9' }}>
                ✨ Cakra Auto
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#475569' }}>
                Orchestrate across {getNimPool().length} NIM models — auto-routes & escalates hard tasks
              </div>
            </div>
            <div
              className="w-10 h-6 rounded-full flex items-center px-0.5 transition-all"
              style={{
                background: settings.orchestrate ? '#76b900' : 'rgba(255,255,255,0.15)',
                justifyContent: settings.orchestrate ? 'flex-end' : 'flex-start',
              }}
            >
              <div className="w-5 h-5 rounded-full bg-white" />
            </div>
          </button>
          {settings.orchestrate && (
            <p className="text-xs mt-2 px-1" style={{ color: '#76b900' }}>
              Cakra picks the model per task. Manual selection below turns Auto off.
            </p>
          )}
        </div>

        {/* Provider tabs */}
        <div
          className="flex overflow-x-auto px-5 pt-4 gap-2"
          style={{ opacity: settings.orchestrate ? 0.45 : 1 }}
        >
          {PROVIDER_LIST.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className="px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors"
              style={{
                background: selected === p.id ? `${p.color}22` : 'rgba(255,255,255,0.05)',
                color: selected === p.id ? p.color : '#94a3b8',
                border: `1px solid ${selected === p.id ? p.color + '44' : 'transparent'}`,
              }}
            >
              <span>{p.logo}</span> {p.name}
            </button>
          ))}
        </div>

        {/* Provider info */}
        <div className="px-5 pt-2 pb-3">
          <p className="text-xs" style={{ color: '#475569' }}>
            {provider.free && '✓ Free tier available'} · {provider.models.length} models
          </p>
        </div>

        {/* Model list */}
        <div className="px-5 pb-5 space-y-2 max-h-64 overflow-y-auto">
          {provider.models.map(m => (
            <button
              key={m.id}
              onClick={() => {
                onChange({
                  ...settings,
                  orchestrate: false,
                  activeProvider: selected,
                  providers: {
                    ...settings.providers,
                    [selected]: {
                      ...settings.providers[selected],
                      model: m.id,
                    },
                  },
                })
                onClose()
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm transition-colors"
              style={{
                background: settings.providers[selected]?.model === m.id
                  ? `${provider.color}15`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${settings.providers[selected]?.model === m.id ? provider.color + '44' : 'transparent'}`,
              }}
            >
              <div>
                <div style={{ color: '#f1f5f9' }}>{m.name}</div>
                <div className="text-xs mt-0.5" style={{ color: '#475569' }}>
                  {m.contextWindow.toLocaleString()} ctx · {m.notes}
                </div>
              </div>
              {settings.providers[selected]?.model === m.id && (
                <Check className="w-4 h-4" style={{ color: provider.color }} />
              )}
            </button>
          ))}
        </div>

        {/* API key status */}
        <div className="px-5 pb-4">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{
              background: settings.providers[selected]?.apiKey
                ? 'rgba(16,185,129,0.1)'
                : 'rgba(245,158,11,0.1)',
              color: settings.providers[selected]?.apiKey ? '#10b981' : '#f59e0b',
            }}
          >
            <span>{settings.providers[selected]?.apiKey ? '✓' : '⚠'}</span>
            <span>{settings.providers[selected]?.apiKey ? 'API key configured' : 'No API key — add in Settings'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}