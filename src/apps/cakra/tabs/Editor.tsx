/**
 * Code Editor — connected to the Empire eventBus
 * Code editing with stats, syntax analysis, and Cakra integration.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Code, Copy, Check, Play, Save, FileText, Bot, BarChart2, Trash2 } from 'lucide-react'
import { emit } from '../../../lib/eventBus'
import { Button, IconButton, Select, TextArea } from '../../../components/ui'
import { cssVar } from '../../../design-system/tokens'
import { ProvenanceChip } from '../../../components/ui/ProvenanceChip'
import { SendResultMenu } from '../../../components/ui/SendResultMenu'
import { useInboundHandoff } from '../../../lib/useInboundHandoff'

interface EditorStats {
  lines: number
  chars: number
  words: number
  functions: number
  imports: number
  brackets: number
}

const LANGUAGE_OPTIONS = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'markdown', label: 'Markdown' },
]

export default function Editor() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [stats, setStats] = useState<EditorStats>({ lines: 0, chars: 0, words: 0, functions: 0, imports: 0, brackets: 0 })
  const [showStats, setShowStats] = useState(false)
  const [copied, setCopied] = useState(false)
  const [savedFiles, setSavedFiles] = useState<{ name: string; lang: string; content: string }[]>([])

  const inbound = useInboundHandoff<{ code?: string; language?: string; from?: string }>('empire-editor-clipboard')

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'editor' })
    try {
      const s = localStorage.getItem('empire-editor-files')
      if (s) setSavedFiles(JSON.parse(s))
    } catch { /* ignore */ }
  }, [])

  // Preload handed-off code (e.g. a snippet sent from another app) once read.
  useEffect(() => {
    if (inbound.payload?.code) setCode(inbound.payload.code)
    if (inbound.payload?.language) setLanguage(inbound.payload.language)
  }, [inbound.payload])

  const analyzeCode = useCallback((input: string) => {
    const lines = input.split('\n').length
    const chars = input.length
    const words = input.trim() ? input.trim().split(/\s+/).length : 0
    const functions = (input.match(/\bfunction\s+\w+/g) || []).length + (input.match(/\bconst\s+\w+\s*=\s*(?:\([^)]*\)|\w+)\s*=>/g) || []).length
    const imports = (input.match(/^import\s/gm) || []).length + (input.match(/^from\s/gm) || []).length
    const brackets = (input.match(/[{}()[\]]/g) || []).length

    setStats({ lines, chars, words, functions, imports, brackets })

    // Auto-detect language
    if (lines > 3) {
      if (input.includes('def ') || input.includes('import ') && input.includes(':')) setLanguage('python')
      else if (input.includes('<!DOCTYPE') || input.includes('<html')) setLanguage('html')
      else if (input.includes(':root') || input.includes('{') && input.includes(';')) setLanguage('css')
      else if (input.startsWith('{') || input.startsWith('[')) setLanguage('json')
      else if (input.includes('## ') || input.startsWith('#')) setLanguage('markdown')
      else if (input.includes(': string') || input.includes('interface ') || input.includes('type ')) setLanguage('typescript')
      else setLanguage('javascript')
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => analyzeCode(code), 300)
    return () => clearTimeout(timer)
  }, [code, analyzeCode])

  const handleSave = () => {
    if (!code.trim()) return
    const name = `snippet-${Date.now().toString(36)}.${language}`
    const file = { name, lang: language, content: code }
    const updated = [file, ...savedFiles].slice(0, 20)
    setSavedFiles(updated)
    localStorage.setItem('empire-editor-files', JSON.stringify(updated))
    emit({ type: 'FILE_OPENED', filePath: `editor:${name}` })
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const loadFile = (file: { name: string; lang: string; content: string }) => {
    setCode(file.content)
    setLanguage(file.lang || 'javascript')
  }

  const deleteFile = (name: string) => {
    const updated = savedFiles.filter(f => f.name !== name)
    setSavedFiles(updated)
    localStorage.setItem('empire-editor-files', JSON.stringify(updated))
  }

  const askCakra = () => {
    if (!code.trim()) return
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `Code (${language}):\n\n\`\`\`${language}\n${code}\n\`\`\``,
      title: `Code Analysis — ${language}`,
      from: 'editor',
    }))
    navigate('/app/ai-chat')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code className="w-6 h-6 text-signal" /> Code Editor
          </h1>
          <p className="text-sm text-muted mt-1">
            {stats.lines} lines · {stats.chars.toLocaleString()} chars
          </p>
          {inbound.source && (
            <div className="mt-2">
              <ProvenanceChip from={inbound.source} onDismiss={inbound.dismiss} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={language}
            onChange={setLanguage}
            ariaLabel="Editor language"
            className="w-36"
            options={LANGUAGE_OPTIONS.map(l => ({ value: l.id, label: l.label }))}
          />
          <IconButton onClick={() => setShowStats(!showStats)}
            aria-label="Toggle stats"
            aria-pressed={showStats}
            title="Toggle stats"
            icon={<BarChart2 className="w-4 h-4" />}
            style={showStats ? { color: cssVar('signal') } : undefined} />
        </div>
      </div>

      {/* Stats panel */}
      {showStats && code.trim() && (
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { label: 'Lines', value: stats.lines },
            { label: 'Chars', value: stats.chars.toLocaleString() },
            { label: 'Functions', value: stats.functions },
            { label: 'Imports', value: stats.imports },
            { label: 'Brackets', value: stats.brackets },
          ].map(s => (
            <div key={s.label} className="p-2 rounded-lg bg-glass border border-hair">
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-faint">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Saved files */}
      {savedFiles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {savedFiles.slice(0, 8).map(f => (
            <Button key={f.name} variant="ghost" size="sm" onClick={() => loadFile(f)}
              className="text-xs whitespace-nowrap"
              icon={<FileText className="w-3 h-3" />}>
              {f.name}
              <span onClick={e => { e.stopPropagation(); deleteFile(f.name) }}
                className="text-faint hover:text-danger ml-1">×</span>
            </Button>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="rounded-2xl border border-hair overflow-hidden" style={{ background: 'var(--card-bg)' }}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-hair bg-glass">
          <span className="text-xs text-faint font-mono">{language}</span>
          <div className="flex gap-1">
            <IconButton onClick={askCakra} size="sm"
              aria-label="Ask Cakra about this code" title="Ask Cakra about this code"
              icon={<Bot className="w-3.5 h-3.5" />} style={{ color: cssVar('signal') }} />
            <IconButton onClick={copyCode} size="sm"
              aria-label="Copy code" title="Copy code"
              icon={copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />} />
          </div>
        </div>
        <TextArea
          value={code}
          onChange={setCode}
          placeholder={`Write or paste ${language} code...`}
          mono
          spellCheck={false}
          className="leading-relaxed"
          style={{ background: 'transparent', border: 'none', minHeight: '300px', padding: '12px 16px' }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!code.trim()}
          icon={<Save className="w-4 h-4" />}
          style={{ background: cssVar('signal'), color: cssVar('void') }}>
          Save
        </Button>
        <Button onClick={() => emit({ type: 'CODE_RUN', language, code, output: 'Code saved to event bus' })}
          disabled={!code.trim()} variant="ghost"
          icon={<Play className="w-4 h-4" />}
          style={{ background: 'color-mix(in srgb, var(--c-success) 22%, transparent)', color: cssVar('c-success') }}>
          Run
        </Button>
        {/* Re-inject this buffer into the organism — lights an editor→target arc. */}
        <SendResultMenu source="editor" text={code} title={`Code — ${language}`} label="Send code to…" />
        {code.trim() && (
          <Button variant="ghost" className="ml-auto"
            onClick={() => { setCode(''); setStats({ lines: 0, chars: 0, words: 0, functions: 0, imports: 0, brackets: 0 }) }}
            icon={<Trash2 className="w-4 h-4" />}
            style={{ background: 'color-mix(in srgb, var(--c-danger) 20%, transparent)', color: cssVar('c-danger') }}>
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}