/**
 * SettingsPanel — API keys, permissions, preferences
 */

import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { cssVar, tint } from '../../../design-system/tokens'
import { getApiBase, setApiBase, checkBackend } from '../../../lib/apiBase'
import { PROVIDER_LIST } from '../lib/providers'
import type { ProviderId } from '../lib/types'
import type { AgentSettings } from '../lib/agent'

interface Props {
  settings: AgentSettings
  onChange: (s: AgentSettings) => void
  onClose: () => void
}

export default function SettingsPanel({ settings, onChange, onClose }: Props) {
  const [visibleKeys, setVisibleKeys] = useState<Set<ProviderId>>(new Set())
  const [backendUrl, setBackendUrl] = useState(getApiBase())
  const [backendTest, setBackendTest] = useState<'idle' | 'testing' | 'online' | 'offline'>('idle')

  const toggleKeyVisibility = (id: ProviderId) => {
    setVisibleKeys(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: tint('void', 70), backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
        style={{ background: cssVar('abyss'), border: `1px solid ${tint('xenon', 10)}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: tint('xenon', 10) }}>
          <h2 className="text-base font-semibold" style={{ color: cssVar('text') }}>Agent Settings</h2>
          <button onClick={onClose} className="p-1 rounded" style={{ color: cssVar('text2') }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Backend server (optional) — powers DataCenter, Files, Cakra, AI proxy */}
          <section>
            <h3 className="text-sm font-semibold mb-1" style={{ color: cssVar('text') }}>
              Backend server (optional)
            </h3>
            <p className="text-xs mb-3" style={{ color: cssVar('text2') }}>
              Empire runs fully offline. To power DataCenter, Files, Cakra and the AI
              proxy, point it at a machine running <code>server.js</code> (your PC, or the
              Termux box on the same Wi-Fi). Leave blank to use the local server when present.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={backendUrl}
                onChange={e => setBackendUrl(e.target.value)}
                placeholder="http://192.168.1.10:3001"
                className="flex-1 rounded-lg px-3 py-2 text-sm font-mono"
                style={{ background: tint('xenon', 5), border: `1px solid ${tint('xenon', 10)}`, color: cssVar('text'), outline: 'none' }}
              />
              <button
                onClick={async () => {
                  setApiBase(backendUrl)
                  setBackendTest('testing')
                  setBackendTest((await checkBackend()) ? 'online' : 'offline')
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                style={{ background: tint('ion', 22), color: cssVar('text') }}
              >
                {backendTest === 'testing' ? 'Testing…' : 'Save & test'}
              </button>
            </div>
            {backendTest === 'online' && (
              <p className="text-xs mt-2" style={{ color: cssVar('c-success') }}>● Connected</p>
            )}
            {backendTest === 'offline' && (
              <p className="text-xs mt-2" style={{ color: cssVar('c-danger') }}>● Not reachable — saved anyway</p>
            )}
          </section>

          {/* Provider API Keys */}
          <section>
            <h3 className="text-sm font-semibold mb-3" style={{ color: cssVar('text') }}>
              API Keys — All Free Tier
            </h3>
            <div className="space-y-3">
              {PROVIDER_LIST.map(provider => {
                const config = settings.providers[provider.id]
                const key = config?.apiKey || ''
                const isVisible = visibleKeys.has(provider.id)

                return (
                  <div key={provider.id}>
                    <label className="text-xs mb-1 block" style={{ color: cssVar('text2') }}>
                      {provider.logo} {provider.name}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={key}
                        onChange={e => {
                          onChange({
                            ...settings,
                            providers: {
                              ...settings.providers,
                              [provider.id]: { ...config!, apiKey: e.target.value },
                            },
                          })
                        }}
                        placeholder={`Enter ${provider.name} API key`}
                        className="flex-1 rounded-lg px-3 py-2 text-sm"
                        style={{
                          background: tint('xenon', 5),
                          border: `1px solid ${tint('xenon', 10)}`,
                          color: cssVar('text'),
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => toggleKeyVisibility(provider.id)}
                        className="p-2 rounded-lg"
                        style={{ color: cssVar('text2'), background: tint('xenon', 5) }}
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs mt-2" style={{ color: cssVar('text3') }}>
              API keys are stored locally in your browser — never sent to any server except the provider.
            </p>
          </section>

          {/* Permissions */}
          <section>
            <h3 className="text-sm font-semibold mb-3" style={{ color: cssVar('text') }}>Permissions</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoConfirmDangerous}
                onChange={e => onChange({ ...settings, autoConfirmDangerous: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <div>
                <div className="text-sm" style={{ color: cssVar('text') }}>Auto-confirm dangerous tools</div>
                <div className="text-xs" style={{ color: cssVar('text3') }}>
                  Automatically run shell commands and file writes without asking
                </div>
              </div>
            </label>
          </section>

          {/* Behavior */}
          <section>
            <h3 className="text-sm font-semibold mb-3" style={{ color: cssVar('text') }}>Behavior</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showThinking}
                onChange={e => onChange({ ...settings, showThinking: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <div>
                <div className="text-sm" style={{ color: cssVar('text') }}>Always show thinking trace</div>
                <div className="text-xs" style={{ color: cssVar('text3') }}>See the AI's reasoning steps</div>
              </div>
            </label>
          </section>

          {/* Model settings */}
          <section>
            <h3 className="text-sm font-semibold mb-3" style={{ color: cssVar('text') }}>Generation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: cssVar('text2') }}>Temperature</label>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={settings.temperature}
                  onChange={e => onChange({ ...settings, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-center" style={{ color: cssVar('text2') }}>{settings.temperature.toFixed(1)}</div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: cssVar('text2') }}>Max Tokens</label>
                <input
                  type="range"
                  min={512}
                  max={8192}
                  step={256}
                  value={settings.maxTokens}
                  onChange={e => onChange({ ...settings, maxTokens: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-center" style={{ color: cssVar('text2') }}>{settings.maxTokens}</div>
              </div>
            </div>
          </section>

          {/* Tool info */}
          <section>
            <h3 className="text-sm font-semibold mb-3" style={{ color: cssVar('text') }}>Available Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { name: 'file_read', icon: '📄', desc: 'Read files' },
                { name: 'file_write', icon: '✏️', desc: 'Write files' },
                { name: 'file_list', icon: '📁', desc: 'List directories' },
                { name: 'shell_exec', icon: '⌨️', desc: 'Run commands' },
                { name: 'web_search', icon: '🔍', desc: 'Web search' },
                { name: 'web_fetch', icon: '🌐', desc: 'Fetch pages' },
                { name: 'code_exec', icon: '▶️', desc: 'Run code' },
              ].map(tool => (
                <div key={tool.name} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: tint('xenon', 4) }}>
                  <span>{tool.icon}</span>
                  <div>
                    <div className="text-xs font-mono" style={{ color: cssVar('text') }}>{tool.name}</div>
                    <div className="text-xs" style={{ color: cssVar('text3') }}>{tool.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}