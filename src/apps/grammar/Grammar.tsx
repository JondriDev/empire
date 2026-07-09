/**
 * Grammar Fix — connected to the Empire eventBus
 * Detects common grammar issues and suggests corrections.
 */

import { useState, useEffect, useCallback } from 'react'
import { SpellCheck, Copy, Check, RefreshCw, ListChecks, AlertTriangle, Info } from 'lucide-react'
import { Button } from '../../components/ui'
import { emit } from '../../lib/eventBus'

interface GrammarIssue {
  type: 'spelling' | 'grammar' | 'style' | 'punctuation' | 'redundancy'
  word: string
  suggestion: string
  start: number
  end: number
  description: string
}

const COMMON_MISTAKES: [RegExp, string, string][] = [
  [/their(\s+[^.!?]*?\s+)there\b/gi, 'their … there', '"Their" vs "there" — "there" refers to a place'],
  [/\byour\s+(?![\w\s]*?you\b)[\w\s]*?you're\b/gi, 'your … you\'re', '"Your" vs "you\'re" — "you\'re" means "you are"'],
  [/\bits\s+[\w\s]*?\bit's\b/gi, 'its … it\'s', '"Its" vs "it\'s" — "it\'s" means "it is"'],
  [/\baffect\b[\s\S]{0,50}\beffect\b/gi, 'affect/effect', 'Usually "affect" is a verb, "effect" is a noun'],
  [/\bto\s+[\w\s]*?\btoo\b/gi, 'to … too', '"To" vs "too" — "too" means "also" or "excessively"'],
  [/\bthen\s+[\w\s]*?\bthan\b/gi, 'then … than', '"Then" vs "than" — "than" is used for comparisons'],
  [/\bi\s+am\b/g, 'I am', 'Capitalize "I"'],
  [/\bi\s+have\b/g, 'I have', 'Capitalize "I"'],
  [/\bi\s+will\b/g, 'I will', 'Capitalize "I"'],
  [/\bi\s+would\b/g, 'I would', 'Capitalize "I"'],
  [/\b\w+ing\s+to\s+(\w+)\b/g, 'Infinitive form', 'Consider: replace "-ing + to" with infinitive form'],
  [/\.\s*\.\s*\./g, '…', 'Ellipsis should use "…" (single character)'],
  [/\s{2,}/g, 'Single space', 'Multiple spaces — use a single space'],
  [/\bi\b(?![\w'])/g, 'I', 'Pronoun "I" should be capitalized'],
]

export default function Grammar() {
  const [text, setText] = useState('')
  const [issues, setIssues] = useState<GrammarIssue[]>([])
  const [correctedText, setCorrectedText] = useState('')
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<'check' | 'fix'>('check')
  const [stats, setStats] = useState({ chars: 0, words: 0, sentences: 0, readability: 0 })

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'grammar' })
  }, [])

  const analyzeText = useCallback((input: string) => {
    if (!input.trim()) {
      setIssues([])
      setCorrectedText('')
      setStats({ chars: 0, words: 0, sentences: 0, readability: 0 })
      return
    }

    const found: GrammarIssue[] = []

    // Check common patterns
    COMMON_MISTAKES.forEach(([pattern, suggestion, desc]) => {
      const matches = [...input.matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'))]
      matches.forEach(m => {
        const idx = m.index ?? 0
        const word = m[0]
        found.push({
          type: word.length > 15 ? 'grammar' : 'spelling',
          word: word.substring(0, 30),
          suggestion: typeof suggestion === 'string' ? suggestion : 'Consider rewriting',
          start: idx,
          end: idx + word.length,
          description: desc || 'Potential grammar issue detected',
        })
      })
    })

    // Check for passive voice
    const passiveMatches = [...input.matchAll(/\b(?:am|is|are|was|were|be|been|being)\s+\w+ed\b/gi)]
    passiveMatches.forEach(m => {
      const idx = m.index ?? 0
      found.push({
        type: 'style',
        word: m[0],
        suggestion: 'Consider active voice',
        start: idx,
        end: idx + m[0].length,
        description: 'Passive voice detected — consider rewriting in active voice',
      })
    })

    // Check for long sentences
    const sentences = input.split(/[.!?]+/).filter(s => s.trim())
    sentences.forEach((s, i) => {
      if (s.split(/\s+/).length > 30) {
        let idx = 0
        for (let j = 0; j < i; j++) idx += sentences[j].length + 1
        found.push({
          type: 'style',
          word: s.substring(0, 50) + '...',
          suggestion: 'Break into shorter sentences',
          start: idx,
          end: idx + s.length,
          description: `Sentence has ${s.split(/\s+/).length} words — consider breaking it up`,
        })
      }
    })

    // Remove duplicates
    const unique = found.filter((f, i, arr) => 
      i === arr.findIndex(x => x.start === f.start && x.end === f.end)
    )
    setIssues(unique)

    // Apply automatic fixes
    let autoFixed = input
    autoFixed = autoFixed.replace(/\bi\s+(?=[a-z])/g, (m) => m.replace(/^i/i, 'I '))
    autoFixed = autoFixed.replace(/\bi\b(?![\w'])/g, 'I')
    autoFixed = autoFixed.replace(/\s{2,}/g, ' ')
    autoFixed = autoFixed.replace(/\.{3,}/g, '…')
    setCorrectedText(autoFixed)

    // Stats
    const words = input.trim().split(/\s+/).filter(Boolean).length
    const sents = sentences.length
    const chars = input.length
    const readability = sents > 0 && words > 0
      ? Math.round(206.835 - 1.015 * (words / sents) - 84.6 * (syllableCount(input) / words))
      : 0
    setStats({ chars, words, sentences: sents, readability })
  }, [])

  const syllableCount = (text: string): number => {
    const words = text.toLowerCase().split(/\s+/)
    return words.reduce((sum, word) => {
      const vowels = word.match(/[aeiouy]+/g)
      return sum + (vowels ? vowels.length : 1)
    }, 0)
  }

  useEffect(() => {
    const timer = setTimeout(() => analyzeText(text), 300)
    return () => clearTimeout(timer)
  }, [text, analyzeText])

  const copyResult = async () => {
    const final = mode === 'fix' ? correctedText : 
      issues.map(i => `• ${i.type}: "${i.word}" → ${i.suggestion} (${i.description})`).join('\n')
    try {
      await navigator.clipboard.writeText(final || text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'spelling': return 'bg-danger/20 text-danger border-danger/20'
      case 'grammar': return 'bg-warn/20 text-warn border-warn/20'
      case 'style': return 'bg-ion/20 text-ion border-ion/20'
      case 'punctuation': return 'bg-signal/20 text-signal border-signal/20'
      default: return 'bg-faint/20 text-muted border-hair'
    }
  }

  const getReadabilityLabel = (score: number) => {
    if (score >= 90) return { label: 'Very Easy', color: 'text-success' }
    if (score >= 80) return { label: 'Easy', color: 'text-success' }
    if (score >= 70) return { label: 'Fairly Easy', color: 'text-signal' }
    if (score >= 60) return { label: 'Standard', color: 'text-warn' }
    if (score >= 50) return { label: 'Fairly Difficult', color: 'text-ember' }
    if (score >= 30) return { label: 'Difficult', color: 'text-danger' }
    return { label: 'Very Difficult', color: 'text-danger' }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SpellCheck className="w-6 h-6 text-signal" aria-hidden="true" /> Grammar Fix
          </h1>
          <p className="text-sm text-muted mt-1" aria-live="polite">
            {stats.words} words · {issues.length} issues found
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Analysis mode">
          <Button onClick={() => setMode('check')}
            aria-pressed={mode === 'check'}
            className={`text-xs px-3 py-1 ${mode === 'check' ? 'bg-signal' : 'bg-glass'}`}>
            <ListChecks className="w-3 h-3 mr-1" aria-hidden="true" /> Check
          </Button>
          <Button onClick={() => setMode('fix')}
            aria-pressed={mode === 'fix'}
            className={`text-xs px-3 py-1 ${mode === 'fix' ? 'bg-signal' : 'bg-glass'}`}>
            <SpellCheck className="w-3 h-3 mr-1" aria-hidden="true" /> Fix
          </Button>
        </div>
      </div>

      {/* Input */}
      <div className="rounded-2xl border border-hair overflow-hidden" style={{ background: 'var(--card-bg)' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste or type text to check grammar..."
          aria-label="Text to check for grammar issues"
          className="w-full bg-transparent px-4 py-3 text-sm min-h-[180px] resize-y focus:outline-none focus:ring-1 focus:ring-signal/50 rounded-lg"
          style={{ color: 'var(--text)' }}
        />
      </div>

      {/* Stats bar */}
      {text.trim() && (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-glass border border-hair text-xs">
          <span>{stats.chars.toLocaleString()} chars</span>
          <span className="text-faint">·</span>
          <span>{stats.words} words</span>
          <span className="text-faint">·</span>
          <span>{stats.sentences} sentences</span>
          <span className="text-faint">·</span>
          <span className={getReadabilityLabel(stats.readability).color}>
            Readability: {getReadabilityLabel(stats.readability).label} ({stats.readability})
          </span>
        </div>
      )}

      {/* Results */}
      {text.trim() && mode === 'check' && issues.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-warn" aria-hidden="true" />
            {issues.length} Issue{issues.length !== 1 ? 's' : ''} Found
          </h3>
          {issues.slice(0, 20).map((issue, i) => (
            <div key={i} className={`p-3 rounded-xl border text-sm ${getTypeColor(issue.type)}`}>
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold uppercase mt-0.5">{issue.type}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="line-through opacity-60">"{issue.word}"</span>
                    <span className="text-success font-medium">→ {issue.suggestion}</span>
                  </div>
                  <p className="text-xs opacity-70 mt-0.5">{issue.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {text.trim() && mode === 'check' && issues.length === 0 && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2" role="status">
          <Check className="w-4 h-4" aria-hidden="true" /> No issues found! Your text looks clean.
        </div>
      )}

      {/* Corrected text */}
      {text.trim() && mode === 'fix' && (
        <div className="rounded-2xl border border-success/20 overflow-hidden" style={{ background: 'var(--card-bg)' }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-hair">
            <span className="text-xs text-muted flex items-center gap-1">
              <Info className="w-3 h-3" /> Corrected Text
            </span>
            <button onClick={copyResult} className="text-xs text-signal hover:text-signal flex items-center gap-1">
              {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
          </div>
          <div className="p-4 text-sm whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
            {correctedText || text}
          </div>
          {correctedText !== text && (
            <div className="px-4 py-2 border-t border-hair text-xs text-success flex items-center gap-1">
              <Check className="w-3 h-3" /> Auto-fixes applied (capitalization, spacing, ellipsis)
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      {text.trim() && (
        <div className="flex gap-2">
          <Button onClick={copyResult} className="text-xs bg-glass hover:bg-glass">
            <Copy className="w-3 h-3 mr-1" /> Copy Report
          </Button>
          <Button onClick={() => {
            setText(correctedText || text)
            setIssues([])
          }} className="text-xs bg-signal hover:bg-signal">
            <RefreshCw className="w-3 h-3 mr-1" /> Apply Fixes
          </Button>
        </div>
      )}
    </div>
  )
}