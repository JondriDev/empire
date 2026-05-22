/**
 * Code Editor — connected to the Empire eventBus
 * Code editing with stats, syntax analysis, and Hermes integration.
 */

import { useState, useEffect, useCallback } from 'react'
import { Code, Copy, Check, Play, Save, FileText, Bot, BarChart2, Trash2 } from 'lucide-react'
import { Card, Button } from '../../components/ui'
import { emit } from '../../lib/eventBus'

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
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [stats, setStats] = useState<EditorStats>({ lines: 0, chars: 0, words: 0, functions: 0, imports: 0, brackets: 0 })
  const [showStats, setShowStats] = useState(false)
  const [copied, setCopied] = useState(false)
  const [savedFiles, setSavedFiles] = useState<{ name: string; lang: string; content: string }[]>([])

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'editor' })
    try {
      const s = localStorage.getItem('empire-editor-files')
      if (s) setSavedFiles(JSON.parse(s))
    } catch { /* ignore */ }
  }, [])

  const analyzeCode = useCallback((input: string) => {
    const lines = input.split('\n').length
    const chars = input.length
    const words = input.trim() ? input.trim().split(/\s+/).length : 0
    const functions = (input.match(/\bfunction\s+\w+/g) || []).length + (input.match(/\bconst\s+\w+\s*=\s*(?:\([^)]*\)|\w+)\s*=>/g) || []).length
    const imports = (input.match(/^import\s/gm) || []).length + (input.match(/^from\s/gm) || []).length
    const brackets = (input.match(/[{}()\[\]]/g) || []).length

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

  const askHermes = () => {
    if (!code.trim()) return
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `Code (${language}):\n\n\`\`\`${language}\n${code}\n\`\`\``,
      title: `Code Analysis — ${language}`,
      from: 'editor',
    }))
    window.location.href = '/app/ai-chat'
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code className="w-6 h-6 text-purple-400" /> Code Editor
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {stats.lines} lines · {stats.chars.toLocaleString()} chars
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="bg-white/10 border-0 rounded-lg px-3 py-1.5 text-xs text-white"
          >
            {LANGUAGE_OPTIONS.map(l => (
              <option key={l.id} value={l.id} className="bg-gray-900">{l.label}</option>
            ))}
          </select>
          <button onClick={() => setShowStats(!showStats)}
            className={`p-2 rounded-lg transition-colors ${showStats ? 'bg-purple-600 text-white' : 'hover:bg-white/10 text-gray-400'}`}
            title="Toggle stats">
            <BarChart2 className="w-4 h-4" />
          </button>
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
            <div key={s.label} className="p-2 rounded-lg bg-white/5 border border-white/10">
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Saved files */}
      {savedFiles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {savedFiles.slice(0, 8).map(f => (
            <button key={f.name} onClick={() => loadFile(f)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs whitespace-nowrap border border-white/10">
              <FileText className="w-3 h-3" />
              {f.name}
              <span onClick={e => { e.stopPropagation(); deleteFile(f.name) }}
                className="text-gray-500 hover:text-red-400 ml-1">×</span>
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'var(--card-bg)' }}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/3">
          <span className="text-xs text-gray-500 font-mono">{language}</span>
          <div className="flex gap-1">
            <button onClick={askHermes}
              className="p-1 rounded hover:bg-purple-500/20 text-purple-400 transition-colors" title="Ask Hermes about this code">
              <Bot className="w-3.5 h-3.5" />
            </button>
            <button onClick={copyCode}
              className="p-1 rounded hover:bg-white/10 text-gray-400 transition-colors" title="Copy code">
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder={`Write or paste ${language} code...`}
          className="w-full bg-transparent px-4 py-3 text-sm font-mono min-h-[300px] resize-y focus:outline-none leading-relaxed"
          style={{ color: 'var(--text)' }}
          spellCheck={false}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={handleSave}
          disabled={!code.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white text-sm transition-colors">
          <Save className="w-4 h-4" /> Save
        </button>
        <button onClick={() => emit({ type: 'CODE_RUN', language, code, output: 'Code saved to event bus' })}
          disabled={!code.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600/30 hover:bg-green-600/50 disabled:opacity-30 text-green-300 text-sm transition-colors">
          <Play className="w-4 h-4" /> Run
        </button>
        {code.trim() && (
          <button onClick={() => { setCode(''); setStats({ lines: 0, chars: 0, words: 0, functions: 0, imports: 0, brackets: 0 }) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm transition-colors ml-auto">
            <Trash2 className="w-4 h-4" /> Clear
          </button>
        )}
      </div>
    </div>
  )
}