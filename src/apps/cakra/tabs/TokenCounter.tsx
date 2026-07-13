import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Button, TextArea } from '../../../components/ui'
import { cssVar, tint } from '../../../design-system/tokens'
import { ProvenanceChip } from '../../../components/ui/ProvenanceChip'
import { SendResultMenu } from '../../../components/ui/SendResultMenu'
import { useInboundHandoff } from '../../../lib/useInboundHandoff'
import { emit } from '../../../lib/eventBus'
import {
  Hash, Copy, Check, Info, BarChart2, Upload
} from 'lucide-react'

type Model = 'gpt-3.5' | 'gpt-4' | 'claude' | 'gemini' | 'estimate'

interface TokenEstimate {
  model: Model
  label: string
  tokens: number
  per1k: number
  charsPerToken: number
}

interface TextStats {
  chars: number
  words: number
  sentences: number
  paragraphs: number
  lines: number
  codeBlocks: number
}

function countPatterns(text: string): TextStats {
  const chars = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length
  const lines = text.split('\n').length
  const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length
  return { chars, words, sentences, paragraphs, lines, codeBlocks }
}

// tiktoken-like ratio estimation per model
const MODEL_RATIOS: Record<Model, number> = {
  'gpt-3.5': 4,    // ~4 chars per token
  'gpt-4': 4.5,     // ~4.5 chars per token
  'claude': 3.5,    // ~3.5 chars per token
  'gemini': 4,      // ~4 chars per token
  'estimate': 4,   // default
}

const MODEL_LABELS: Record<Model, string> = {
  'gpt-3.5': 'GPT-3.5 Turbo',
  'gpt-4': 'GPT-4 / 4o',
  'claude': 'Claude 3.5',
  'gemini': 'Gemini 1.5',
  'estimate': 'Avg Estimate',
}

function estimateTokens(text: string, model: Model): number {
  if (!text.trim()) return 0
  // More accurate: use actual encoding ratios
  const ratio = MODEL_RATIOS[model]
  // For English: ~4 chars/token. For code: ~3.5. For CJK: ~1.5
  const hasCode = /```|```|\bfunction\b|\bconst\b|\bvar\b|\blet\b|\breturn\b/.test(text)
  const hasCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(text)
  let multiplier = ratio
  if (hasCode) multiplier = ratio * 0.85 // code is denser
  if (hasCJK) multiplier = ratio * 0.35 // CJK chars are ~1 token each
  return Math.ceil(text.length / multiplier)
}

export default function TokenCounter() {
  const [text, setText] = useState('')
  const [estimates, setEstimates] = useState<TokenEstimate[]>([])
  const [copied, setCopied] = useState(false)
  const [selectedModels, setSelectedModels] = useState<Model[]>(['gpt-3.5', 'gpt-4', 'claude', 'gemini'])
  const [stats, setStats] = useState<TextStats | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [comparisonTexts, setComparisonTexts] = useState<string[]>(['', ''])
  const [fileNames] = useState<string[]>(['', ''])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const inbound = useInboundHandoff<{ text?: string; from?: string }>('empire-token-clipboard')

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'token-counter' })
  }, [])

  // Preload the handed-off text once it's read from the inbound payload.
  useEffect(() => {
    if (inbound.payload?.text) setText(inbound.payload.text)
  }, [inbound.payload])

  const recalculate = useCallback((input: string) => {
    if (!input.trim()) {
      setEstimates([])
      setStats(null)
      return
    }
    const newStats = countPatterns(input)
    setStats(newStats)
    const results: TokenEstimate[] = selectedModels.map(model => ({
      model,
      label: MODEL_LABELS[model],
      tokens: estimateTokens(input, model),
      per1k: parseFloat((estimateTokens(input, model) / Math.max(input.length, 1) * 1000).toFixed(2)),
      charsPerToken: parseFloat((input.length / Math.max(estimateTokens(input, model), 1)).toFixed(2)),
    }))
    setEstimates(results)
  }, [selectedModels])

  useEffect(() => {
    const timer = setTimeout(() => recalculate(text), 200)
    return () => clearTimeout(timer)
  }, [text, recalculate])

  const copyTokens = async () => {
    if (!estimates.length) return
    const summary = estimates.map(e => `${e.label}: ${e.tokens} tokens`).join('\n')
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const content = ev.target?.result as string
      setText(content)
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleModel = (model: Model) => {
    setSelectedModels(prev =>
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    )
  }

  const totalTokens = estimates.reduce((sum, e) => sum + e.tokens, 0)
 const avgTokens = estimates.length ? Math.round(totalTokens / estimates.length) : 0

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Hash className="w-5 h-5" /> Token Counter
          </h1>
          <div className="flex gap-1 ml-auto">
            <Button onClick={() => { setCompareMode(false); setText(''); setComparisonTexts(['', '']) }}
              className={`text-xs ${!compareMode ? 'bg-signal text-fg' : 'bg-glass hover:bg-glass'}`}>
              Single
            </Button>
            <Button onClick={() => setCompareMode(true)} className={`text-xs ${compareMode ? 'bg-signal text-fg' : 'bg-glass hover:bg-glass'}`}>
              <BarChart2 className="w-3 h-3 mr-1" /> Compare
            </Button>
          </div>
        </div>

        {/* Model selector */}
        <div className="flex items-center gap-1 flex-wrap mb-2">
          <span className="text-xs text-faint mr-1">Models:</span>
          {(Object.keys(MODEL_LABELS) as Model[]).map(model => (
            <Button key={model} variant="ghost" size="sm" onClick={() => toggleModel(model)}
              aria-pressed={selectedModels.includes(model)} className="text-xs"
              style={selectedModels.includes(model)
                ? { background: tint('signal', 40), color: cssVar('signal') }
                : { color: cssVar('text3') }}>
              {MODEL_LABELS[model]}
            </Button>
          ))}
        </div>

        {inbound.source && (
          <div className="mb-2">
            <ProvenanceChip from={inbound.source} onDismiss={inbound.dismiss} />
          </div>
        )}

        <TextArea
          value={text}
          onChange={setText}
          placeholder="Paste or type text to count tokens..."
          mono
          style={{ minHeight: '180px' }}
        />

        <div className="flex gap-2 mt-2">
          <Button onClick={() => fileInputRef.current?.click()} className="text-xs bg-glass hover:bg-glass">
            <Upload className="w-3 h-3 mr-1" /> Load File
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.md,.json,.py,.js,.ts,.html,.css,.xml,.yaml,.yml,.log,.env,.gitignore,.npmrc,.prettierrc" />
          {/* Pass the counted text onward — lights a token-counter→target arc. */}
          <div className="ml-auto">
            <SendResultMenu source="token-counter" text={text} label="Send text to…" />
          </div>
          <Button onClick={() => setText('')} className="text-xs bg-glass hover:bg-glass">
            Clear
          </Button>
        </div>
      </Card>

      {/* Compare Mode */}
      {compareMode && (
        <Card className="p-4">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Compare Texts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1].map(i => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-faint">Text {i + 1} {fileNames[i] && `(${fileNames[i]})`}</span>
                  <span className="text-xs text-faint">{comparisonTexts[i] ? `${estimateTokens(comparisonTexts[i], 'estimate')} tokens` : '—'}</span>
                </div>
                <TextArea
                  value={comparisonTexts[i]}
                  onChange={val => {
                    const next = [...comparisonTexts]
                    next[i] = val
                    setComparisonTexts(next)
                  }}
                  placeholder={`Text ${i + 1}...`}
                  mono
                  className="text-xs"
                  style={{ minHeight: '100px' }}
                />
              </div>
            ))}
          </div>
          {comparisonTexts[0] && comparisonTexts[1] && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-glass rounded-lg">
                <p className="text-xs text-faint">Text 1</p>
                <p className="text-xl font-bold">{estimateTokens(comparisonTexts[0], 'estimate')} tokens</p>
              </div>
              <div className="p-2 bg-glass rounded-lg">
                <p className="text-xs text-faint">Text 2</p>
                <p className="text-xl font-bold">{estimateTokens(comparisonTexts[1], 'estimate')} tokens</p>
              </div>
              <div className="col-span-2 p-2 bg-signal/20 rounded-lg">
                <p className="text-xs text-faint">Difference</p>
                <p className="text-xl font-bold">
                  {Math.abs(estimateTokens(comparisonTexts[0], 'estimate') - estimateTokens(comparisonTexts[1], 'estimate'))} tokens
                  ({estimateTokens(comparisonTexts[0], 'estimate') > estimateTokens(comparisonTexts[1], 'estimate') ? 'Text 1 longer' : 'Text 2 longer'})
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

 {/* Empty state — prompt to paste text */}
 {!text.trim() && (
 <Card className="p-6 text-center">
 <Hash className="w-10 h-10 mx-auto text-faint mb-3" />
 <p className="text-muted text-sm">Paste or type text above to see token estimates across models.</p>
 <p className="text-faint text-xs mt-1">Supports GPT-4, Claude, Gemini, and custom model ratios.</p>
 </Card>
 )}

 {/* Stats */}
 {stats && text.trim() && (
        <Card className="p-3">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.chars.toLocaleString()}</p>
              <p className="text-xs text-faint">Characters</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.words.toLocaleString()}</p>
              <p className="text-xs text-faint">Words</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.sentences}</p>
              <p className="text-xs text-faint">Sentences</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.paragraphs}</p>
              <p className="text-xs text-faint">Paragraphs</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.lines}</p>
              <p className="text-xs text-faint">Lines</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.codeBlocks}</p>
              <p className="text-xs text-faint">Code Blocks</p>
            </div>
          </div>
        </Card>
      )}

      {/* Token estimates */}
      {estimates.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <Hash className="w-4 h-4" /> Token Estimates
            </h2>
            <Button onClick={copyTokens} className="text-xs bg-glass hover:bg-glass">
              {copied ? <><Check className="w-3 h-3 mr-1" />Copied</> : <><Copy className="w-3 h-3 mr-1" />Copy</>}
            </Button>
          </div>

          <div className="space-y-2 mb-4">
            {estimates.map(est => (
              <div key={est.model} className="flex items-center gap-3">
                <div className="w-32 text-sm text-muted">{est.label}</div>
                <div className="flex-1">
                  <div className="h-6 bg-glass rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-ion to-danger rounded-full transition-all"
                      style={{ width: `${Math.min(100, (est.tokens / Math.max(...estimates.map(e => e.tokens))) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="font-bold text-lg">{est.tokens.toLocaleString()}</span>
                  <span className="text-xs text-faint ml-1">tok</span>
                </div>
                <div className="w-20 text-right text-xs text-faint">
                  {est.charsPerToken} ch/tok
                </div>
              </div>
            ))}
          </div>

          {/* Summary bar */}
          <div className="flex items-center justify-between text-sm border-t border-hair pt-3">
            <div>
              <span className="text-faint">Average: </span>
              <span className="font-bold">{avgTokens.toLocaleString()} tokens</span>
            </div>
            <div className="flex gap-4">
              <span className="text-faint">
                {estimates[0]?.charsPerToken.toFixed(2)} chars/token avg
              </span>
              <span className="text-faint">
                ${(avgTokens / 1000 * 0.01).toFixed(4)} @ GPT-4
              </span>
              <span className="text-faint">
                ${(avgTokens / 1000 * 0.0005).toFixed(4)} @ GPT-3.5
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Context window reference */}
      {estimates.length > 0 && (
        <Card className="p-3">
          <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" /> Context Window Reference
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {[
              { model: 'GPT-3.5', limit: '16,385', pct: avgTokens > 0 ? Math.min(100, (avgTokens / 16385) * 100) : 0 },
              { model: 'GPT-4-8K', limit: '8,192', pct: avgTokens > 0 ? Math.min(100, (avgTokens / 8192) * 100) : 0 },
              { model: 'GPT-4-32K', limit: '32,768', pct: avgTokens > 0 ? Math.min(100, (avgTokens / 32768) * 100) : 0 },
              { model: 'Claude 100K', limit: '100,000', pct: avgTokens > 0 ? Math.min(100, (avgTokens / 100000) * 100) : 0 },
            ].map(ctx => (
              <div key={ctx.model} className="bg-glass rounded p-2">
                <p className="text-muted">{ctx.model}</p>
                <div className="mt-1 h-1.5 bg-glass rounded-full overflow-hidden">
                  <div className="h-full bg-signal rounded-full" style={{ width: `${ctx.pct}%` }} />
                </div>
                <p className="text-faint mt-1">{ctx.limit} limit · {ctx.pct.toFixed(1)}% used</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}