/**
 * ModelPicker — Select provider and model
 */

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { Button, IconButton } from '../../../components/ui'
import { PROVIDER_LIST, getNimPool } from '../lib/providers'
import type { ProviderId } from '../lib/types'
import type { AgentSettings } from '../lib/agent'
import { cssVar, tint } from '../../../design-system/tokens'

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
      style={{ background: tint('void', 70), backdropFilter: 'blur(4px)' }}
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: cssVar('abyss'), border: `1px solid ${tint('xenon', 10)}` }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose model"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: tint('xenon', 10) }}>
          <h2 className="text-base font-semibold" style={{ color: cssVar('text') }}>Choose Model</h2>
          <IconButton
            onClick={onClose}
            icon={<X className="w-5 h-5" />}
            aria-label="Close model picker"
            style={{ color: cssVar('text2') }}
          />
        </div>

        {/* Cakra Auto — orchestrate across the whole NIM pool */}
        <div className="px-5 pt-4">
          <Button
            variant="ghost"
            fullWidth
            onClick={() => onChange({ ...settings, orchestrate: !settings.orchestrate })}
            aria-pressed={settings.orchestrate}
            iconRight={
              <div
                className="w-10 h-6 rounded-full flex items-center px-0.5 transition-all"
                style={{
                  background: settings.orchestrate ? cssVar('aurora') : tint('xenon', 15),
                  justifyContent: settings.orchestrate ? 'flex-end' : 'flex-start',
                }}
              >
                <div className="w-5 h-5 rounded-full bg-glass" />
              </div>
            }
            style={{
              justifyContent: 'space-between',
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: 'var(--radius-lg)',
              background: settings.orchestrate ? tint('aurora', 12) : tint('xenon', 4),
              border: `1px solid ${settings.orchestrate ? tint('aurora', 33) : 'transparent'}`,
            }}
          >
            <div>
              <div className="text-sm font-medium" style={{ color: cssVar('text') }}>
                ✨ Cakra Auto
              </div>
              <div className="text-xs mt-0.5" style={{ color: cssVar('text3') }}>
                Orchestrate across {getNimPool().length} NIM models — auto-routes & escalates hard tasks
              </div>
            </div>
          </Button>
          {settings.orchestrate && (
            <p className="text-xs mt-2 px-1" style={{ color: cssVar('aurora') }}>
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
            <Button
              key={p.id}
              variant="ghost"
              size="sm"
              onClick={() => setSelected(p.id)}
              aria-pressed={selected === p.id}
              style={{
                fontSize: 'var(--text-xs)',
                background: selected === p.id ? `color-mix(in srgb, ${p.color} 13%, transparent)` : tint('xenon', 5),
                color: selected === p.id ? p.color : cssVar('text2'),
                border: `1px solid ${selected === p.id ? `color-mix(in srgb, ${p.color} 27%, transparent)` : 'transparent'}`,
              }}
            >
              <span>{p.logo} {p.name}</span>
            </Button>
          ))}
        </div>

        {/* Provider info */}
        <div className="px-5 pt-2 pb-3">
          <p className="text-xs" style={{ color: cssVar('text3') }}>
            {provider.free && '✓ Free tier available'} · {provider.models.length} models
          </p>
        </div>

        {/* Model list */}
        <div className="px-5 pb-5 space-y-2 max-h-64 overflow-y-auto">
          {provider.models.map(m => {
            const isActive = settings.providers[selected]?.model === m.id
            return (
              <Button
                key={m.id}
                variant="ghost"
                fullWidth
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
                aria-pressed={isActive}
                iconRight={isActive ? <Check className="w-4 h-4" style={{ color: provider.color }} /> : undefined}
                style={{
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-lg)',
                  background: isActive
                    ? `color-mix(in srgb, ${provider.color} 8%, transparent)`
                    : tint('xenon', 4),
                  border: `1px solid ${isActive ? `color-mix(in srgb, ${provider.color} 27%, transparent)` : 'transparent'}`,
                }}
              >
                <div>
                  <div style={{ color: cssVar('text') }}>{m.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: cssVar('text3') }}>
                    {m.contextWindow.toLocaleString()} ctx · {m.notes}
                  </div>
                </div>
              </Button>
            )
          })}
        </div>

        {/* API key status */}
        <div className="px-5 pb-4">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{
              background: settings.providers[selected]?.apiKey
                ? tint('c-success', 10)
                : tint('c-warn', 10),
              color: settings.providers[selected]?.apiKey ? cssVar('c-success') : cssVar('c-warn'),
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