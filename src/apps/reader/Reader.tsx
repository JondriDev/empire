/**
 * Reader — read your books (EPUB · PDF · TXT · Markdown · DOCX), and ask Cakra
 * about anything you're reading, in real time. Select a passage → "Ask Cakra"
 * streams an answer grounded in that text. Powered by the Empire AI bridge.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  BookOpen, Plus, ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Send, X,
  Highlighter, Type, Sun, Trash2, Loader2,
} from 'lucide-react'
import { emit } from '../../lib/eventBus'
import { mirrorCollection } from '../../lib/core/sync'
import { Button, IconButton, TextArea, Card } from '../../components/ui'
import { SendResultMenu } from '../../components/ui/SendResultMenu'
import { NodeActions } from '../../components/ui/NodeActions'
import { EmptyState } from '../../components/ui/Utility'
import { bookNodeData } from './readerGraph'
import {
  listBooks, getBook, addBook, getBookBlob, updateBook, deleteBook,
  addHighlight, removeHighlight,
} from './lib/bookStore'
import { detectFormat, READER_ACCEPT, FORMAT_LABEL, type BookMeta, type ReaderHandle } from './lib/types'
import { getRenderer, extractMeta } from './lib/render'
import { askCakra, type AskTurn } from './lib/ask'
import './reader.css'

type ReadingTheme = 'day' | 'sepia' | 'night'
const THEME_KEY = 'empire-reader-theme'
const FONT_KEY = 'empire-reader-font'
const ACCENT = 'var(--c-pembaca)'

export default function Reader() {
  const [books, setBooks] = useState<BookMeta[]>(() => listBooks())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { emit({ type: 'APP_OPENED', appId: 'reader' }) }, [])
  const refresh = useCallback(() => setBooks(listBooks()), [])

  // Mirror the whole book library into the Core graph as `book` nodes so Reader
  // joins the organism — the last collection-owning app to become graph-legible.
  // `books` is always the entire library (not one open book), so a direct mirror
  // is safe against mirrorCollection's prune-unseen semantics. The blob lives in
  // IDB; the node carries only durable metadata (see readerGraph.bookNodeData).
  useEffect(() => {
    mirrorCollection('book', 'reader', books, {
      id: b => b.id,
      title: b => b.title,
      data: bookNodeData,
    })
  }, [books])

  const onImport = useCallback(async (files: FileList | null) => {
    if (!files?.length) return
    setImporting(true)
    for (const file of Array.from(files)) {
      const fmt = detectFormat(file.name, file.type)
      if (!fmt) continue
      try {
        const meta = await extractMeta(file, fmt, file.name)
        await addBook(file, fmt, meta)
      } catch { /* skip unreadable file */ }
    }
    setImporting(false)
    refresh()
  }, [refresh])

  const onDelete = useCallback(async (id: string) => {
    await deleteBook(id)
    if (activeId === id) setActiveId(null)
    refresh()
  }, [activeId, refresh])

  const active = activeId ? getBook(activeId) : undefined

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <input
        ref={fileRef}
        type="file"
        accept={READER_ACCEPT}
        multiple
        hidden
        onChange={e => { onImport(e.target.files); e.target.value = '' }}
      />
      {active
        ? <ReadingView key={active.id} book={active} onBack={() => { setActiveId(null); refresh() }} onChanged={refresh} />
        : <Library
            books={books}
            importing={importing}
            onOpen={setActiveId}
            onDelete={onDelete}
            onImportClick={() => fileRef.current?.click()}
          />
      }
    </div>
  )
}

/* ── Library ─────────────────────────────────────────────────────────── */
function Library({ books, importing, onOpen, onDelete, onImportClick }: {
  books: BookMeta[]
  importing: boolean
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onImportClick: () => void
}) {
  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in srgb, ${ACCENT} 18%, transparent)` }}>
            <BookOpen className="w-5 h-5" style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Reader</h1>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>Your books · ask Cakra as you read</p>
          </div>
        </div>
        <Button
          onClick={onImportClick}
          disabled={importing}
          icon={importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          style={{ background: ACCENT, color: 'var(--void)', border: 'none' }}
        >
          {importing ? 'Importing…' : 'Add book'}
        </Button>
      </header>

      {books.length === 0 ? (
        <EmptyState
          className="flex-1"
          accent={ACCENT}
          icon={<BookOpen className="w-6 h-6" />}
          title="Your library is empty"
          description="Add an EPUB, PDF, Markdown, text, or Word file. While you read, select any passage and ask Cakra about it."
          action={
            <Button onClick={onImportClick} icon={<Plus className="w-4 h-4" />} style={{ background: ACCENT, color: 'var(--void)', border: 'none' }}>
              Add your first book
            </Button>
          }
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
            {books.map(b => (
              <Card
                key={b.id}
                interactive
                padding="none"
                onClick={() => onOpen(b.id)}
                aria-label={`Open ${b.title}`}
                className="rounded-2xl overflow-hidden flex flex-col group text-left"
                style={{ ['--app-color' as string]: ACCENT }}
              >
                <div className="aspect-[3/4] flex items-center justify-center relative" style={{ background: b.cover ? undefined : `color-mix(in srgb, ${ACCENT} 12%, var(--card-bg))` }}>
                  {b.cover
                    ? <img src={b.cover} alt="" className="w-full h-full object-cover" />
                    : <BookOpen className="w-10 h-10" style={{ color: ACCENT, opacity: 0.7 }} />}
                  <span className="absolute top-2 left-2 text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--void) 60%, transparent)', color: 'var(--xenon)' }}>
                    {FORMAT_LABEL[b.format]}
                  </span>
                </div>
                <div className="p-3">
                  <div className="text-sm font-semibold line-clamp-2 leading-snug">{b.title}</div>
                  {b.author && <div className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text3)' }}>{b.author}</div>}
                </div>
                {/* Footer actions must not trigger the card-wide open. */}
                <div className="px-3 pb-3 mt-auto flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--holo-bg-h)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.round((b.progress || 0) * 100)}%`, background: ACCENT }} />
                  </div>
                  <span className="text-[10px] tabular-nums" style={{ color: 'var(--text3)' }}>{Math.round((b.progress || 0) * 100)}%</span>
                  <NodeActions type="book" sourceId={b.id} />
                  <IconButton
                    onClick={() => onDelete(b.id)}
                    aria-label={`Delete ${b.title}`}
                    size="sm"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    className="opacity-60 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                    style={{ color: 'var(--text3)' }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

/* ── Reading view ────────────────────────────────────────────────────── */
function ReadingView({ book, onBack, onChanged }: { book: BookMeta; onBack: () => void; onChanged: () => void }) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<ReaderHandle | null>(null)
  const posRef = useRef<string | undefined>(book.position)
  const [loadError, setLoadError] = useState(false)
  const [theme, setTheme] = useState<ReadingTheme>(() => (localStorage.getItem(THEME_KEY) as ReadingTheme) || 'night')
  const [fontScale, setFontScale] = useState<number>(() => Number(localStorage.getItem(FONT_KEY)) || 1)
  const [selection, setSelection] = useState('')
  const [askOpen, setAskOpen] = useState(false)
  const [askPassage, setAskPassage] = useState<string | undefined>(undefined)
  const paginated = book.format === 'epub' || book.format === 'pdf'

  // Mount the reading surface (re-mounts only when the book changes).
  useEffect(() => {
    let cancelled = false
    let handle: ReaderHandle | null = null
    const el = surfaceRef.current
    ;(async () => {
      const blob = await getBookBlob(book.id)
      if (!blob) { if (!cancelled) setLoadError(true); return }
      if (cancelled || !el) return
      el.innerHTML = ''
      const renderer = await getRenderer(book.format)
      handle = await renderer.mount(el, blob, {
        position: book.position,
        theme,
        fontScale,
        onPosition: (pos, prog) => { posRef.current = pos; updateBook(book.id, { position: pos, progress: prog, lastReadAt: Date.now() }) },
        onSelect: (text) => setSelection(text),
      })
      if (cancelled) { handle.destroy(); return }
      handleRef.current = handle
    })()
    return () => { cancelled = true; handle?.destroy(); handleRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id])

  // Live theme / font changes (no re-mount).
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    handleRef.current?.setTheme?.(theme)
  }, [theme])
  useEffect(() => {
    localStorage.setItem(FONT_KEY, String(fontScale))
    handleRef.current?.setFontScale?.(fontScale)
  }, [fontScale])

  const askAboutSelection = useCallback(() => {
    setAskPassage(selection || undefined)
    setAskOpen(true)
  }, [selection])

  const highlightSelection = useCallback(() => {
    if (!selection.trim()) return
    addHighlight(book.id, { text: selection, anchor: posRef.current })
    setSelection('')
    window.getSelection()?.removeAllRanges()
    onChanged()
  }, [selection, book.id, onChanged])

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Reading toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <IconButton onClick={onBack} aria-label="Back to library" icon={<ArrowLeft className="w-4 h-4" />} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{book.title}</div>
          {book.author && <div className="text-[11px] truncate" style={{ color: 'var(--text3)' }}>{book.author}</div>}
        </div>
        {paginated && (
          <>
            <IconButton onClick={() => handleRef.current?.prev()} aria-label="Previous" icon={<ChevronLeft className="w-4 h-4" />} />
            <IconButton onClick={() => handleRef.current?.next()} aria-label="Next" icon={<ChevronRight className="w-4 h-4" />} />
          </>
        )}
        <FontControl scale={fontScale} setScale={setFontScale} />
        <ThemeControl theme={theme} setTheme={setTheme} />
        <Button
          onClick={() => { setAskPassage(undefined); setAskOpen(o => !o) }}
          size="sm"
          icon={<Sparkles className="w-3.5 h-3.5" />}
          style={{ background: `color-mix(in srgb, var(--c-cakra) 22%, transparent)`, color: 'var(--c-cakra)', border: 'none' }}
        >
          Cakra
        </Button>
      </div>

      {/* Body: surface + ask panel */}
      <div className="flex-1 relative min-h-0">
        {loadError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6" style={{ color: 'var(--text3)' }}>
            <X className="w-8 h-8" />
            <p>This book's file couldn't be loaded. Try re-importing it.</p>
          </div>
        ) : (
          <div ref={surfaceRef} className="reader-surface" data-reading-theme={theme} style={{ ['--reader-font-scale' as string]: fontScale }} />
        )}

        {/* Selection action bar */}
        {selection.trim() && !askOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-5 flex items-center gap-1.5 px-1.5 py-1.5 rounded-full animate-fade-in-up gp" style={{ zIndex: 5 }}>
            <Button onClick={askAboutSelection} size="sm" icon={<Sparkles className="w-3.5 h-3.5" />} style={{ background: 'var(--c-cakra)', color: 'var(--xenon)', border: 'none', borderRadius: 'var(--radius-full)' }}>
              Ask Cakra
            </Button>
            <Button onClick={highlightSelection} variant="ghost" size="sm" icon={<Highlighter className="w-3.5 h-3.5" />} style={{ color: 'var(--text2)', borderRadius: 'var(--radius-full)' }}>
              Highlight
            </Button>
            <IconButton onClick={() => { setSelection(''); window.getSelection()?.removeAllRanges() }} size="sm" aria-label="Dismiss" icon={<X className="w-3.5 h-3.5" />} style={{ color: 'var(--text3)', borderRadius: 'var(--radius-full)' }} />
          </div>
        )}

        {askOpen && (
          <AskPanel
            book={book}
            passage={askPassage}
            onClose={() => setAskOpen(false)}
            onChanged={onChanged}
          />
        )}
      </div>
    </div>
  )
}

function FontControl({ scale, setScale }: { scale: number; setScale: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <IconButton onClick={() => setScale(Math.max(0.8, +(scale - 0.1).toFixed(2)))} size="sm" aria-label="Smaller text" icon={<Type className="w-3 h-3" />} />
      <IconButton onClick={() => setScale(Math.min(1.8, +(scale + 0.1).toFixed(2)))} size="sm" aria-label="Larger text" icon={<Type className="w-4 h-4" />} />
    </div>
  )
}

function ThemeControl({ theme, setTheme }: { theme: ReadingTheme; setTheme: (t: ReadingTheme) => void }) {
  const order: ReadingTheme[] = ['day', 'sepia', 'night']
  const next = () => setTheme(order[(order.indexOf(theme) + 1) % order.length])
  return (
    <IconButton
      onClick={next}
      aria-label={`Reading theme: ${theme}`}
      title={`Theme: ${theme}`}
      icon={<Sun className="w-4 h-4" style={{ color: theme === 'day' ? 'var(--c-warn)' : theme === 'sepia' ? 'var(--ember)' : 'var(--text3)' }} />}
    />
  )
}

/* ── Ask Cakra panel ─────────────────────────────────────────────────── */
function AskPanel({ book, passage, onClose, onChanged }: { book: BookMeta; passage?: string; onClose: () => void; onChanged: () => void }) {
  const [turns, setTurns] = useState<AskTurn[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const cancelRef = useRef<(() => void) | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const highlights = book.highlights || []

  useEffect(() => () => cancelRef.current?.(), [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [turns])

  const submit = useCallback((question: string) => {
    const q = question.trim()
    if (!q || streaming) return
    const history = turns
    setTurns(t => [...t, { role: 'user', content: q }, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)
    let acc = ''
    const ctx = { bookTitle: book.title, author: book.author, passage }
    const { cancel } = askCakra(
      ctx, history, q,
      (tok) => { acc += tok; setTurns(t => { const c = [...t]; c[c.length - 1] = { role: 'assistant', content: acc }; return c }) },
      () => setStreaming(false),
      (err) => { setStreaming(false); setTurns(t => { const c = [...t]; c[c.length - 1] = { role: 'assistant', content: `⚠️ ${err.message}` }; return c }) },
    )
    cancelRef.current = cancel
  }, [turns, streaming, book.title, book.author, passage])

  return (
    <div className="absolute top-0 right-0 bottom-0 flex flex-col animate-slide-up" style={{ width: 'min(420px, 92vw)', zIndex: 6, background: 'var(--card-bg)', backdropFilter: 'var(--gl-blur)', borderLeft: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: 'var(--c-cakra)' }} />
          <span className="text-sm font-semibold">Ask Cakra</span>
        </div>
        <IconButton onClick={onClose} size="sm" aria-label="Close" icon={<X className="w-4 h-4" />} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {passage && (
          <div className="text-xs rounded-xl p-3" style={{ background: 'var(--holo-bg-h)', borderLeft: '3px solid var(--c-cakra)' }}>
            <div className="font-semibold mb-1" style={{ color: 'var(--c-cakra)' }}>Selected passage</div>
            <div className="line-clamp-4" style={{ color: 'var(--text2)' }}>{passage}</div>
          </div>
        )}

        {turns.length === 0 && (
          <div className="text-sm" style={{ color: 'var(--text3)' }}>
            <p className="mb-3">Ask anything about <span style={{ color: 'var(--text2)' }}>{book.title}</span>{passage ? ' or the selected passage' : ''}.</p>
            <div className="flex flex-wrap gap-2">
              {(passage
                ? ['Explain this passage', 'Define the hard words', 'Why does this matter?']
                : ['Summarize so far', 'Who are the key figures?', 'Explain the main idea']
              ).map(s => (
                <Button key={s} onClick={() => submit(s)} variant="secondary" size="sm" style={{ borderColor: 'var(--border)', color: 'var(--text2)', borderRadius: 'var(--radius-full)' }}>{s}</Button>
              ))}
            </div>
          </div>
        )}

        {turns.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed"
              style={m.role === 'user'
                ? { background: 'var(--c-cakra)', color: 'var(--xenon)' }
                : { background: 'var(--holo-bg)', color: 'var(--text)' }}>
              {m.content || (streaming && i === turns.length - 1 ? '●' : '')}
              {m.role === 'assistant' && m.content && !streaming && (
                <div className="mt-1.5"><SendResultMenu source="reader" text={m.content} label="Send to…" /></div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {highlights.length > 0 && turns.length === 0 && (
        <div className="px-4 pb-2 max-h-32 overflow-y-auto">
          <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text3)' }}>Highlights</div>
          {highlights.slice(0, 6).map(h => (
            <div key={h.id} className="text-xs flex items-start gap-2 py-1 group">
              <Highlighter className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />
              <span className="flex-1 line-clamp-2" style={{ color: 'var(--text2)' }}>{h.text}</span>
              <IconButton onClick={() => { removeHighlight(book.id, h.id); onChanged() }} size="sm" aria-label="Remove highlight" icon={<X className="w-3 h-3" />} className="opacity-60 group-hover:opacity-100 focus-visible:opacity-100" style={{ color: 'var(--text3)' }} />
            </div>
          ))}
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); submit(input) }} className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="relative">
          <TextArea
            value={input}
            onChange={setInput}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input) } }}
            placeholder={passage ? 'Ask about this passage…' : 'Ask about this book…'}
            rows={1}
            aria-label="Ask a question"
            style={{ minHeight: 46, maxHeight: 120, resize: 'none', padding: '10px 44px 10px 12px' }}
          />
          <IconButton
            onClick={() => submit(input)}
            disabled={!input.trim() || streaming}
            aria-label="Send"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            style={{ background: 'var(--c-cakra)', border: 'none' }}
            icon={streaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--xenon)' }} /> : <Send className="w-3.5 h-3.5" style={{ color: 'var(--xenon)' }} />}
          />
        </div>
      </form>
    </div>
  )
}
