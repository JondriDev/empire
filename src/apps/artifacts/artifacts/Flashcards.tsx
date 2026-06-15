/**
 * Artifact 04 — Flashcard Quiz
 * Spaced repetition flashcard deck with built-in sample decks.
 * Adds new decks, flips cards, tracks mastery.
 */
import { useState, useEffect } from 'react'
import { Plus, RotateCcw, ChevronLeft, ChevronRight, Trash2, Check, X as XIcon, Sparkles, ListChecks } from 'lucide-react'

interface Card { id: string; front: string; back: string; known?: boolean }
interface Deck { id: string; name: string; emoji: string; cards: Card[] }

const STORAGE = 'empire-artifact-flashcards'

const uid = () => Math.random().toString(36).slice(2, 9)

const defaultDecks = (): Deck[] => [
  {
    id: uid(), name: 'JavaScript Fundamentals', emoji: '⚡',
    cards: [
      { id: uid(), front: 'What is a closure?', back: 'A function that has access to variables from its outer (enclosing) function scope, even after the outer function has returned.' },
      { id: uid(), front: '== vs ===', back: '== does type coercion then compares; === compares value AND type without coercion. Always prefer ===.' },
      { id: uid(), front: 'What is hoisting?', back: 'JavaScript moves declarations (var, function, class) to the top of their scope before code execution.' },
      { id: uid(), front: 'What does Array.map() do?', back: 'Creates a new array by applying a function to every element of the original array. Does not mutate the source.' },
      { id: uid(), front: 'What is the event loop?', back: 'The mechanism that handles async callbacks in JS — pulls tasks from the queue and pushes them onto the call stack when empty.' },
    ]
  },
  {
    id: uid(), name: 'World Capitals', emoji: '🌍',
    cards: [
      { id: uid(), front: 'Japan', back: 'Tokyo' },
      { id: uid(), front: 'Australia', back: 'Canberra' },
      { id: uid(), front: 'Brazil', back: 'Brasília' },
      { id: uid(), front: 'Egypt', back: 'Cairo' },
      { id: uid(), front: 'Canada', back: 'Ottawa' },
    ]
  },
]

export default function Flashcards() {
  const [decks, setDecks] = useState<Deck[]>(() => {
    try { const s = localStorage.getItem(STORAGE); if (s) return JSON.parse(s) } catch {}
    return defaultDecks()
  })
  const [activeDeck, setActiveDeck] = useState<string | null>(null)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify(decks)) } catch {}
  }, [decks])

  const deck = decks.find(d => d.id === activeDeck)
  const card = deck?.cards[idx]

  const next = () => {
    if (!deck) return
    setFlipped(false)
    setIdx((idx + 1) % deck.cards.length)
  }
  const prev = () => {
    if (!deck) return
    setFlipped(false)
    setIdx((idx - 1 + deck.cards.length) % deck.cards.length)
  }
  const markKnown = (known: boolean) => {
    if (!deck || !card) return
    setDecks(decks.map(d => d.id === deck.id ? { ...d, cards: d.cards.map(c => c.id === card.id ? { ...c, known } : c) } : d))
    next()
  }
  const addCard = () => {
    if (!deck) return
    const front = prompt('Front (question):')
    if (!front) return
    const back = prompt('Back (answer):')
    if (!back) return
    setDecks(decks.map(d => d.id === deck.id ? { ...d, cards: [...d.cards, { id: uid(), front, back }] } : d))
  }
  const removeDeck = (id: string) => {
    if (!confirm('Delete this deck?')) return
    setDecks(decks.filter(d => d.id !== id))
    if (activeDeck === id) setActiveDeck(null)
  }
  const newDeck = () => {
    const name = prompt('Deck name:')
    if (!name) return
    const emoji = prompt('Emoji icon:', '📚') || '📚'
    setDecks([...decks, { id: uid(), name, emoji, cards: [] }])
  }

  // Stats
  const totalKnown = decks.reduce((s, d) => s + d.cards.filter(c => c.known).length, 0)
  const totalCards = decks.reduce((s, d) => s + d.cards.length, 0)

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 text-white overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur">
        <div>
          <h1 className="text-2xl font-bold">Flashcards</h1>
          <p className="text-xs text-slate-500 mt-0.5">{totalCards} cards · {totalKnown} mastered ({Math.round(totalCards ? (totalKnown / totalCards) * 100 : 0)}%)</p>
        </div>
        <button onClick={newDeck} className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-sm flex items-center gap-2 hover:bg-indigo-500/30">
          <Plus size={14} /> New Deck
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-white/10 bg-black/20 p-3 overflow-auto">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2 px-2 font-semibold">Decks</h3>
          <div className="space-y-1">
            {decks.map(d => {
              const known = d.cards.filter(c => c.known).length
              const pct = d.cards.length ? Math.round((known / d.cards.length) * 100) : 0
              return (
                <div key={d.id} className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer ${activeDeck === d.id ? 'bg-indigo-500/20 border border-indigo-400/30' : 'hover:bg-white/5 border border-transparent'}`}
                  onClick={() => { setActiveDeck(d.id); setIdx(0); setFlipped(false) }}>
                  <span className="text-lg">{d.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{d.name}</div>
                    <div className="text-[10px] text-slate-500">{d.cards.length} cards · {pct}% mastered</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeDeck(d.id) }} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400"><Trash2 size={12} /></button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex items-center justify-center p-8">
          {!deck ? (
            <div className="text-center text-slate-500">
              <ListChecks size={48} className="mx-auto mb-3 opacity-30" />
              <p>Choose a deck on the left or create a new one.</p>
            </div>
          ) : deck.cards.length === 0 ? (
            <div className="text-center text-slate-500">
              <Sparkles size={48} className="mx-auto mb-3 opacity-30" />
              <p className="mb-3">This deck is empty.</p>
              <button onClick={addCard} className="px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">Add first card</button>
            </div>
          ) : (
            <div className="w-full max-w-2xl">
              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>{deck.emoji} {deck.name}</span>
                  <span>Card {idx + 1} of {deck.cards.length}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all"
                    style={{ width: `${deck.cards.length ? ((idx + 1) / deck.cards.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Card */}
              <div
                onClick={() => setFlipped(!flipped)}
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/20 rounded-3xl p-12 min-h-[320px] flex items-center justify-center cursor-pointer hover:border-white/30 transition shadow-2xl shadow-indigo-500/10"
              >
                <div className="text-center max-w-xl">
                  <div className="text-xs uppercase tracking-widest text-slate-500 mb-4">{flipped ? 'Answer' : 'Question'}</div>
                  <p className="text-3xl font-medium leading-relaxed">
                    {flipped ? card?.back : card?.front}
                  </p>
                </div>
                <div className="absolute top-4 right-4 text-xs text-slate-500">tap to flip</div>
              </div>

              {/* Controls */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={prev} className="p-2 rounded-lg bg-white/5 hover:bg-white/10"><ChevronLeft size={16} /></button>
                  <button onClick={() => setFlipped(!flipped)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10"><RotateCcw size={16} /></button>
                  <button onClick={next} className="p-2 rounded-lg bg-white/5 hover:bg-white/10"><ChevronRight size={16} /></button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={addCard} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400" title="Add card"><Plus size={16} /></button>
                  <button onClick={() => markKnown(false)} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-400/30 text-sm flex items-center gap-1.5 hover:bg-red-500/30">
                    <XIcon size={14} /> Don't know
                  </button>
                  <button onClick={() => markKnown(true)} className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-sm flex items-center gap-1.5 hover:bg-emerald-500/30">
                    <Check size={14} /> Got it
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
