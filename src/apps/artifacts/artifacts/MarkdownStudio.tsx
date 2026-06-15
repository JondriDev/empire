/**
 * Artifact 05 — Markdown Studio
 * Split-pane markdown editor with live preview, syntax hints, copy & .md download.
 * Polished, self-contained, zero deps.
 */
import { useState, useMemo, useEffect, useRef } from 'react'
import { Eye, Edit3, Download, Copy, Check, RotateCcw, FileText, Sparkles } from 'lucide-react'

const SAMPLE = `# Hello, Markdown ✨

Welcome to **Markdown Studio** — your split-pane editor with live preview.

## Features
- Live preview as you type
- Split pane resizable
- Copy to clipboard
- Download as .md
- localStorage persistence

## Try it
1. Type on the left
2. See HTML on the right
3. Click *Download .md* to save

> Tip: Press \`Ctrl/Cmd + S\` to download.

\`\`\`ts
function greet(name: string) {
  return \`Hello, \${name}!\`
}
\`\`\`

- [x] Split pane
- [x] Live preview
- [x] localStorage save
- [ ] World domination

*Italic*, **bold**, ~~strikethrough~~, \`inline code\`.
`

// ─── Minimal but tasteful Markdown → HTML engine ──────────────
// Covers what the sample uses (and what makers actually need):
// headings, bold, italic, strikethrough, inline code, fenced code,
// unordered + ordered lists, task lists, blockquotes, links, hr, paragraphs.
// No external deps.
function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}


function renderInline(s: string) {
  // Escape first, then re-introduce markdown syntax as HTML tokens.
  let out = escapeHtml(s)
  out = out.replace(/`([^`]+)`/g, '<code class="md-code-inline">$1</code>')
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
  out = out.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>')
  out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text: string, url: string) => {
    const safeUrl = /^(?:https?:|mailto:|tel:|#|\/)/i.test(url) ? url : '#'
    return '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer">' + text + '</a>'
  })
  return out
}

function renderMd(src: string): string {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let i = 0
  let inList: 'ul' | 'ol' | 'task' | null = null

  const flushList = () => {
    if (inList) {
      out.push(`</${inList === 'task' ? 'ul' : inList}>`)
      inList = null
    }
  }

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    const fence = line.match(/^```(\w+)?/)
    if (fence) {
      flushList()
      const lang = fence[1] || ''
      i++
      const buf: string[] = []
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i])
        i++
      }
      i++ // skip closing fence
      out.push(
        `<pre class="md-pre"><code class="md-code${lang ? ' language-' + lang : ''}">${escapeHtml(buf.join('\n'))}</code></pre>`
      )
      continue
    }

    // Horizontal rule
    if (/^-{3,}$|^\*{3,}$/.test(line.trim())) {
      flushList()
      out.push('<hr class="md-hr" />')
      i++; continue
    }

    // Heading
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      flushList()
      const level = h[1].length
      out.push(`<h${level} class="md-h md-h${level}">${renderInline(h[2])}</h${level}>`)
      i++; continue
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      flushList()
      const buf: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      out.push(`<blockquote class="md-quote">${renderMd(buf.join('\n'))}</blockquote>`)
      continue
    }

    // Task list
    const taskMatch = line.match(/^- \[( |x|X)\]\s+(.*)$/)
    if (taskMatch) {
      if (inList !== 'task') {
        flushList()
        out.push('<ul class="md-task-list">')
        inList = 'task'
      }
      const checked = taskMatch[1].toLowerCase() === 'x'
      out.push(
        `<li class="md-task"><label><input type="checkbox" ${checked ? 'checked' : ''} disabled /> <span>${renderInline(taskMatch[2])}</span></label></li>`
      )
      i++; continue
    }

    // Unordered list
    const ulMatch = line.match(/^[-*+]\s+(.*)$/)
    if (ulMatch) {
      if (inList !== 'ul') {
        flushList()
        out.push('<ul class="md-ul">')
        inList = 'ul'
      }
      out.push(`<li>${renderInline(ulMatch[1])}</li>`)
      i++; continue
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.*)$/)
    if (olMatch) {
      if (inList !== 'ol') {
        flushList()
        out.push('<ol class="md-ol">')
        inList = 'ol'
      }
      out.push(`<li>${renderInline(olMatch[1])}</li>`)
      i++; continue
    }

    // Blank line
    if (!line.trim()) {
      flushList()
      i++; continue
    }

    // Paragraph — consume contiguous non-blank lines
    flushList()
    const buf: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|>\s?|[-*+]\s|\d+\.\s|```|---|\*\*\*) /.test(lines[i])) {
      buf.push(lines[i])
      i++
    }
    out.push(`<p class="md-p">${renderInline(buf.join(' '))}</p>`)
  }
  flushList()
  return out.join('\n')
}

const KEY = 'empire-artifact-markdown::content'

export default function MarkdownStudio() {
  const [content, setContent] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(KEY)
      return saved ?? SAMPLE
    } catch { return SAMPLE }
  })
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split')
  const [copied, setCopied] = useState(false)
  const [splitPct, setSplitPct] = useState(50)
  const splitContainerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  // Persist
  useEffect(() => {
    try { localStorage.setItem(KEY, content) } catch {}
  }, [content])

  const html = useMemo(() => renderMd(content), [content])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = content
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `document-${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    if (content && content !== SAMPLE && !confirm('Clear editor content?')) return
    setContent('')
  }

  // Split-pane drag
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !splitContainerRef.current) return
      const rect = splitContainerRef.current.getBoundingClientRect()
      const pct = Math.min(85, Math.max(15, ((e.clientX - rect.left) / rect.width) * 100))
      setSplitPct(pct)
    }
    const onUp = () => { draggingRef.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  // Keyboard shortcut: Ctrl/Cmd+S = download
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleDownload()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [content])

  const stats = useMemo(() => {
    const words = (content.trim().match(/\S+/g) || []).length
    const chars = content.length
    const lines = content.split('\n').length
    const readMin = Math.max(1, Math.round(words / 200))
    return { words, chars, lines, readMin }
  }, [content])

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-amber-950/10 to-slate-950 text-slate-100">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg"
               style={{ background: 'linear-gradient(135deg, #f59e0b, #f59e0b80)', boxShadow: '0 8px 24px #f59e0b30' }}>
            <FileText size={16} />
          </div>
          <div>
            <div className="font-bold text-sm flex items-center gap-1.5">
              Markdown Studio
              <Sparkles size={11} className="text-amber-400" />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Write beautifully.</div>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5">
            {(['edit', 'split', 'preview'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  mode === m ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'edit' && <Edit3 size={11} />}
                {m === 'split' && <span className="font-bold">⫶</span>}
                {m === 'preview' && <Eye size={11} />}
                {m[0].toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClear}
            title="Clear"
            className="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center gap-1.5"
          >
            <RotateCcw size={12} />
            Reset
          </button>
          <button
            onClick={handleCopy}
            title="Copy markdown"
            className="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center gap-1.5"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            title="Download .md"
            className="px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 text-white shadow"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 12px #f59e0b30' }}
          >
            <Download size={12} />
            Download .md
          </button>
        </div>
      </div>

      {/* Editor / Preview area */}
      <div ref={splitContainerRef} className="flex-1 flex overflow-hidden">
        {(mode === 'edit' || mode === 'split') && (
          <div
            className="relative flex flex-col overflow-hidden border-r border-white/10"
            style={{ width: mode === 'split' ? `${splitPct}%` : '100%' }}
          >
            <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 bg-black/20 border-b border-white/5">
              Markdown
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full bg-transparent p-4 font-mono text-sm text-slate-200 resize-none focus:outline-none leading-relaxed"
              placeholder="# Start typing..."
            />
          </div>
        )}

        {mode === 'split' && (
          <div
            className="w-1.5 bg-white/5 cursor-col-resize hover:bg-amber-500/40 transition-colors flex-shrink-0"
            onMouseDown={() => { draggingRef.current = true }}
              onDoubleClick={() => setSplitPct(50)}
            title="Drag to resize · Double-click to reset"
          />
        )}

        {(mode === 'preview' || mode === 'split') && (
          <div
            className="flex-1 overflow-auto"
          >
            <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 bg-black/20 border-b border-white/5">
              Preview
            </div>
            <div
              className="md-preview p-6 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 text-[10px] text-slate-500 border-t border-white/10 bg-black/30 font-mono">
        <div className="flex items-center gap-3">
          <span>{stats.words} words</span>
          <span>•</span>
          <span>{stats.chars} chars</span>
          <span>•</span>
          <span>{stats.lines} lines</span>
          <span>•</span>
          <span>~{stats.readMin} min read</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> auto-saved</span>
          <span>Ctrl/⌘+S to download</span>
        </div>
      </div>

      <style>{`
        .md-preview h1.md-h { font-size: 2rem; font-weight: 800; margin: 1.5rem 0 0.75rem; line-height: 1.2; background: linear-gradient(135deg, #fbbf24, #f59e0b); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .md-preview h2.md-h { font-size: 1.5rem; font-weight: 700; margin: 1.25rem 0 0.5rem; color: #fcd34d; }
        .md-preview h3.md-h { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; color: #fde68a; }
        .md-preview h4.md-h, .md-preview h5.md-h, .md-preview h6.md-h { font-weight: 600; margin: 1rem 0 0.5rem; color: #fef3c7; }
        .md-preview p.md-p { margin: 0.5rem 0; line-height: 1.7; color: #cbd5e1; }
        .md-preview .md-code-inline { background: rgba(245, 158, 11, 0.15); color: #fcd34d; padding: 1px 5px; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 0.85em; border: 1px solid rgba(245, 158, 11, 0.2); }
        .md-preview pre.md-pre { background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
        .md-preview pre.md-pre code { color: #e0e7ff; font-family: ui-monospace, monospace; font-size: 0.85rem; line-height: 1.6; }
        .md-preview blockquote.md-quote { border-left: 3px solid #f59e0b; padding-left: 1rem; margin: 1rem 0; color: #94a3b8; font-style: italic; background: rgba(245, 158, 11, 0.05); padding: 0.5rem 1rem; border-radius: 0 8px 8px 0; }
        .md-preview ul.md-ul, .md-preview ol.md-ol, .md-preview ul.md-task-list { padding-left: 1.5rem; margin: 0.5rem 0; color: #cbd5e1; }
        .md-preview ul.md-ul li, .md-preview ol.md-ol li { margin: 0.25rem 0; line-height: 1.6; }
        .md-preview .md-task-list { list-style: none; padding-left: 0.5rem; }
        .md-preview .md-task { list-style: none; }
        .md-preview .md-task label { display: inline-flex; align-items: center; gap: 0.5rem; cursor: default; }
        .md-preview .md-task input[type="checkbox"] { accent-color: #f59e0b; }
        .md-preview hr.md-hr { border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 1.5rem 0; }
        .md-preview a { color: #fbbf24; text-decoration: underline; text-decoration-color: rgba(251, 191, 36, 0.4); }
        .md-preview a:hover { color: #fcd34d; text-decoration-color: #fcd34d; }
        .md-preview del { color: #94a3b8; }
      `}</style>
    </div>
  )
}
