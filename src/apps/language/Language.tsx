/**
 * Language Lab — connected to the Empire eventBus
 * Multi-language translation, phrase book, and Cakra integration.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Languages, Copy, Check, BookOpen, ArrowRightLeft, Globe, Bot, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui'
import { emit } from '../../lib/eventBus'
import { chat } from '../../lib/ai'

interface PhraseBookEntry {
  id: string
  original: string
  translated: string
  from: string
  to: string
  date: string
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
]

const GREETINGS: Record<string, string> = {
  es: '¡Hola! ¿Cómo estás?',
  fr: 'Bonjour! Comment allez-vous?',
  de: 'Hallo! Wie geht es Ihnen?',
  it: 'Ciao! Come stai?',
  pt: 'Olá! Como vai?',
  ru: 'Привет! Как дела?',
  zh: '你好！你怎么样？',
  ja: 'こんにちは！お元気ですか？',
  ko: '안녕하세요! 어떻게 지내세요?',
  ar: 'مرحبا! كيف حالك؟',
  hi: 'नमस्ते! आप कैसे हैं?',
}

export default function Language() {
  const [input, setInput] = useState('')
  const [translation, setTranslation] = useState('')
  const [fromLang, setFromLang] = useState('en')
  const [toLang, setToLang] = useState('es')
  const [detectedLang, setDetectedLang] = useState('')
  const [copied, setCopied] = useState(false)
  const [phraseBook, setPhraseBook] = useState<PhraseBookEntry[]>([])
  const [showPhraseBook, setShowPhraseBook] = useState(false)
  const [loading, setLoading] = useState(false)
  const reqIdRef = useRef(0)

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'language' })
    try {
      const saved = localStorage.getItem('empire-phrase-book')
      if (saved) setPhraseBook(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  // Simple language detection
  const detectLanguage = useCallback((text: string): string => {
    if (!text.trim()) return ''
    // Check for non-Latin scripts
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh'
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'
    if (/[\u0400-\u04ff]/.test(text)) return 'ru'
    if (/[\u0600-\u06ff]/.test(text)) return 'ar'
    if (/[\u0900-\u097f]/.test(text)) return 'hi'
    // European language hints
    const words = text.toLowerCase().split(/\s+/)
    const esWords = ['hola', 'gracias', 'por', 'favor', 'bueno', 'cómo', 'estás', 'qué', 'muy']
    const frWords = ['bonjour', 'merci', 's\'il', 'vous', 'plait', 'tres', 'bien', 'oui', 'non']
    const deWords = ['hallo', 'danke', 'bitte', 'gut', 'wie', 'geht', 'ihnen', 'ja', 'nein']
    const esCount = words.filter(w => esWords.includes(w)).length
    const frCount = words.filter(w => frWords.includes(w)).length
    const deCount = words.filter(w => deWords.includes(w)).length
    if (esCount > 0 && esCount >= frCount && esCount >= deCount) return 'es'
    if (frCount > 0 && frCount >= deCount) return 'fr'
    if (deCount > 0) return 'de'
    return 'en'
  }, [])

  const translate = useCallback(async () => {
    const text = input.trim()
    if (!text) { setTranslation(''); setLoading(false); return }

    const target = LANGUAGES.find(l => l.code === toLang)?.name || toLang
    const myId = ++reqIdRef.current
    setLoading(true)
    try {
      // Real translation through Cakra (proxy-routed on the live web, no key).
      const result = await chat([
        { role: 'system', content: `You are a precise translator. Translate the user's message into ${target}. Output ONLY the translation — no explanations, no quotes, no transliteration unless the user asks.` },
        { role: 'user', content: text },
      ])
      if (myId !== reqIdRef.current) return // a newer request superseded this one
      setTranslation((result || '').trim())
    } catch (err: unknown) {
      if (myId !== reqIdRef.current) return
      setTranslation(`⚠️ ${err instanceof Error ? err.message : 'Translation failed'}`)
    } finally {
      if (myId === reqIdRef.current) setLoading(false)
    }
  }, [input, toLang])

  // Instant local detection for the hint; debounced network translation.
  useEffect(() => { setDetectedLang(detectLanguage(input)) }, [input, detectLanguage])
  useEffect(() => {
    const timer = setTimeout(translate, 800)
    return () => clearTimeout(timer)
  }, [translate])

  const swapLanguages = () => {
    setFromLang(toLang)
    setToLang(fromLang === 'auto' ? 'en' : fromLang)
    setInput(translation)
    setTranslation(input)
  }

  const copyTranslation = async () => {
    try {
      await navigator.clipboard.writeText(translation || input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const saveToPhraseBook = () => {
    if (!input.trim() || !translation.trim()) return
    const entry: PhraseBookEntry = {
      id: Date.now().toString(),
      original: input,
      translated: translation,
      from: fromLang === 'auto' ? detectedLang : fromLang,
      to: toLang,
      date: new Date().toISOString(),
    }
    const updated = [entry, ...phraseBook].slice(0, 50)
    setPhraseBook(updated)
    localStorage.setItem('empire-phrase-book', JSON.stringify(updated))
  }

  const askCakra = () => {
    if (!translation && !input) return
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `Translation request:\n\nOriginal (${LANGUAGES.find(l => l.code === (fromLang === 'auto' ? detectedLang : fromLang))?.name}): ${input}\n\nTranslation (${LANGUAGES.find(l => l.code === toLang)?.name}): ${translation}`,
      title: 'Language Translation',
      from: 'language',
    }))
    window.location.href = '/app/ai-chat'
  }

  const deletePhrase = (id: string) => {
    const updated = phraseBook.filter(p => p.id !== id)
    setPhraseBook(updated)
    localStorage.setItem('empire-phrase-book', JSON.stringify(updated))
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Languages className="w-6 h-6 text-signal" /> Language Lab
        </h1>
        <Button onClick={() => setShowPhraseBook(!showPhraseBook)} className={`text-xs px-3 py-1 ${showPhraseBook ? 'bg-signal' : 'bg-glass'}`}>
          <BookOpen className="w-3 h-3 mr-1" /> Phrases ({phraseBook.length})
        </Button>
      </div>

      {/* Language selector */}
      <div className="flex items-center gap-2">
        <select value={fromLang} onChange={e => setFromLang(e.target.value)}
          className="flex-1 bg-glass border-0 rounded-xl px-3 py-2.5 text-sm text-fg">
          <option value="auto" className="bg-faint">🌐 Auto Detect</option>
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code} className="bg-faint">{l.name}</option>
          ))}
        </select>
        <button onClick={swapLanguages}
          className="p-2.5 rounded-xl hover:bg-glass text-signal transition-colors">
          <ArrowRightLeft className="w-5 h-5" />
        </button>
        <select value={toLang} onChange={e => setToLang(e.target.value)}
          className="flex-1 bg-glass border-0 rounded-xl px-3 py-2.5 text-sm text-fg">
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code} className="bg-faint">{l.name}</option>
          ))}
        </select>
      </div>

      {detectedLang && fromLang === 'auto' && (
        <div className="text-xs text-faint flex items-center gap-1">
          <Globe className="w-3 h-3" /> Detected: {LANGUAGES.find(l => l.code === detectedLang)?.name || 'Unknown'}
        </div>
      )}

      {/* Quick phrases */}
      <div className="flex gap-1 flex-wrap">
        {Object.entries(GREETINGS).slice(0, 6).map(([code, greeting]) => (
          <button key={code} onClick={() => { setInput(greeting); setToLang(code); if (code !== 'en') setFromLang('en') }}
            className="text-xs px-2 py-1 rounded-lg bg-glass hover:bg-glass text-muted transition-colors">
            {LANGUAGES.find(l => l.code === code)?.name}: {greeting}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="rounded-2xl border border-hair overflow-hidden" style={{ background: 'var(--card-bg)' }}>
        <div className="px-4 py-2 border-b border-hair bg-glass">
          <span className="text-xs text-faint">
            {LANGUAGES.find(l => l.code === (fromLang === 'auto' ? detectedLang || 'en' : fromLang))?.name}
          </span>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type text to translate..."
          className="w-full bg-transparent px-4 py-3 text-sm min-h-[120px] resize-y focus:outline-none"
          style={{ color: 'var(--text)' }}
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-signal"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Translating…</div>
      )}

      {/* Translation */}
      {translation && (
        <div className="rounded-2xl border border-success/20 overflow-hidden" style={{ background: 'var(--card-bg)' }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-hair">
            <span className="text-xs text-faint">{LANGUAGES.find(l => l.code === toLang)?.name}</span>
            <div className="flex gap-1">
              <button onClick={copyTranslation}
                className="p-1 rounded hover:bg-glass text-muted transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button onClick={saveToPhraseBook}
                className="p-1 rounded hover:bg-warn/20 text-warn transition-colors" title="Save to phrase book">
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="p-4 text-sm whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
            {translation}
          </div>
        </div>
      )}

      {/* Phrase Book */}
      {showPhraseBook && (
        <div className="space-y-2">
          <h3 className="text-sm text-muted">Saved Phrases ({phraseBook.length})</h3>
          {phraseBook.length === 0 ? (
            <div className="text-center py-8 text-faint text-sm">No saved phrases yet. Translate something and click the book icon to save.</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {phraseBook.map(p => (
                <div key={p.id} className="p-3 rounded-xl border border-hair" style={{ background: 'var(--card-bg)' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-faint">
                        {LANGUAGES.find(l => l.code === p.from)?.name} → {LANGUAGES.find(l => l.code === p.to)?.name}
                      </p>
                      <p className="text-sm mt-1">{p.original}</p>
                      <p className="text-sm text-success mt-0.5">{p.translated}</p>
                    </div>
                    <button onClick={() => deletePhrase(p.id)}
                      className="text-faint hover:text-danger text-xs p-1">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cakra */}
      <div className="flex gap-2">
        <Button onClick={askCakra} className="text-xs bg-signal hover:bg-signal">
          <Bot className="w-3 h-3 mr-1" /> Ask Cakra
        </Button>
      </div>
    </div>
  )
}