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
    <div className="h-full flex flex-col bg-gradient-to-br from-void via-ion/30 to-void text-fg overflow-hidden">
      <div className="px-6 py-4 border-b border-hair flex items-center justify-between bg-void/20 backdrop-blur">
        <div>
          <h1 className="text-2xl font-bold">Flashcards</h1>
          <p className="text-xs text-faint mt-0.5">{totalCards} cards · {totalKnown} mastered ({Math.round(totalCards ? (totalKnown / totalCards) * 100 : 0)}%)</p>
        </div>
        <button onClick={newDeck} className="px-3 py-1.5 rounded-lg bg-ion/20 text-ion border border-ion/30 text-sm flex items-center gap-2 hover:bg-ion/30">
          <Plus size={14} /> New Deck
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-hair bg-void/20 p-3 overflow-auto max-h-[40dvh] md:max-h-none">
          <h3 className="text-xs uppercase tracking-wider text-faint mb-2 px-2 font-semibold">Decks</h3>
          <div className="space-y-1">
            {decks.map(d => {
              const known = d.cards.filter(c => c.known).length
              const pct = d.cards.length ? Math.round((known / d.cards.length) * 100) : 0
              return (
                <div key={d.id} className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer ${activeDeck === d.id ? 'bg-ion/20 border border-ion/30' : 'hover:bg-glass border border-transparent'}`}
                  onClick={() => { setActiveDeck(d.id); setIdx(0); setFlipped(false) }}>
                  <span className="text-lg">{d.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{d.name}</div>
                    <div className="text-[10px] text-faint">{d.cards.length} cards · {pct}% mastered</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeDeck(d.id) }} className="opacity-0 group-hover:opacity-100 text-faint hover:text-danger"><Trash2 size={12} /></button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex items-center justify-center p-8">
          {!deck ? (
            <div className="text-center text-faint">
              <ListChecks size={48} className="mx-auto mb-3 opacity-30" />
              <p>Choose a deck on the left or create a new one.</p>
            </div>
          ) : deck.cards.length === 0 ? (
            <div className="text-center text-faint">
              <Sparkles size={48} className="mx-auto mb-3 opacity-30" />
              <p className="mb-3">This deck is empty.</p>
              <button onClick={addCard} className="px-4 py-2 rounded-lg bg-ion/20 text-ion border border-ion/30">Add first card</button>
            </div>
          ) : (
            <div className="w-full max-w-2xl">
              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                  <span>{deck.emoji} {deck.name}</span>
                  <span>Card {idx + 1} of {deck.cards.length}</span>
                </div>
                <div className="h-1 bg-glass rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-ion to-ion transition-all"
                    style={{ width: `${deck.cards.length ? ((idx + 1) / deck.cards.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Card */}
              <div
                onClick={() => setFlipped(!flipped)}
                className="relative bg-gradient-to-br from-xenon/10 to-xenon/5 backdrop-blur border border-hair rounded-3xl p-12 min-h-[320px] flex items-center justify-center cursor-pointer hover:border-hair transition shadow-2xl shadow-ion/10"
              >
                <div className="text-center max-w-xl">
                  <div className="text-xs uppercase tracking-widest text-faint mb-4">{flipped ? 'Answer' : 'Question'}</div>
                  <p className="text-3xl font-medium leading-relaxed">
                    {flipped ? card?.back : card?.front}
                  </p>
                </div>
                <div className="absolute top-4 right-4 text-xs text-faint">tap to flip</div>
              </div>

              {/* Controls */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={prev} className="p-2 rounded-lg bg-glass hover:bg-glass"><ChevronLeft size={16} /></button>
                  <button onClick={() => setFlipped(!flipped)} className="p-2 rounded-lg bg-glass hover:bg-glass"><RotateCcw size={16} /></button>
                  <button onClick={next} className="p-2 rounded-lg bg-glass hover:bg-glass"><ChevronRight size={16} /></button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={addCard} className="p-2 rounded-lg bg-glass hover:bg-glass text-muted" title="Add card"><Plus size={16} /></button>
                  <button onClick={() => markKnown(false)} className="px-4 py-2 rounded-lg bg-danger/20 text-danger border border-danger/30 text-sm flex items-center gap-1.5 hover:bg-danger/30">
                    <XIcon size={14} /> Don't know
                  </button>
                  <button onClick={() => markKnown(true)} className="px-4 py-2 rounded-lg bg-success/20 text-success border border-success/30 text-sm flex items-center gap-1.5 hover:bg-success/30">
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
