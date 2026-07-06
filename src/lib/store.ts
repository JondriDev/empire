import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Message {
  id: string
  sender: string
  content: string
  timestamp: number
  /** Source app id when this message arrived via a cross-app handoff (S3). Optional → backward-compatible with stored messages. */
  from?: string
}

export interface Note {
  id: string
  title: string
  content: string
  updatedAt: number
  tags: string[]
  /** Source node id when this note arrived via a cross-app intent (EPIC-12). Optional → backward-compatible with stored notes. */
  from?: string
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  description: string
}

export interface LearningItem {
  id: string
  topic: string
  learned: string
  date: string
  nextReview: string
  mastered: boolean
  /** Source app id when this item arrived via a cross-app handoff (S6a). Optional → backward-compatible with stored items. */
  from?: string
}

export type Lang = 'en' | 'id'

interface AppState {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  lang: Lang
  setLang: (_lang: Lang) => void
  toggleLang: () => void
  sidebarOpen: boolean
  setSidebarOpen: (_open: boolean) => void
  notes: Note[]
  addNote: (_note: Note) => void
  updateNote: (_id: string, _note: Partial<Note>) => void
  deleteNote: (_id: string) => void
  messages: Message[]
  addMessage: (_msg: Message) => void
  events: CalendarEvent[]
  addEvent: (_event: CalendarEvent) => void
  removeEvent: (_id: string) => void
  learningItems: LearningItem[]
  addLearningItem: (_item: LearningItem) => void
  updateLearningItem: (_id: string, _item: Partial<LearningItem>) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      lang: 'en',
      sidebarOpen: false,
      notes: [],
      messages: [],
      events: [],
      learningItems: [],

      toggleTheme: () => set(s => {
        const next = s.theme === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        return { theme: next }
      }),
      setLang: (_lang) => set(() => {
        document.documentElement.setAttribute('lang', _lang)
        return { lang: _lang }
      }),
      toggleLang: () => set(s => {
        const next: Lang = s.lang === 'en' ? 'id' : 'en'
        document.documentElement.setAttribute('lang', next)
        return { lang: next }
      }),
      setSidebarOpen: (_open) => set({ sidebarOpen: _open }),

      addNote: (_note) => set(s => ({ notes: [...s.notes, _note] })),
      updateNote: (_id, _partial) => set(s => ({
        notes: s.notes.map(n => n.id === _id ? { ...n, ..._partial } : n),
      })),
      deleteNote: (_id) => set(s => ({ notes: s.notes.filter(n => n.id !== _id) })),

      addMessage: (_msg) => set(s => ({ messages: [...s.messages, _msg] })),

      addEvent: (_event) => set(s => ({ events: [...s.events, _event] })),
      removeEvent: (_id) => set(s => ({ events: s.events.filter(e => e.id !== _id) })),

      addLearningItem: (_item) => set(s => ({ learningItems: [...s.learningItems, _item] })),
      updateLearningItem: (_id, _partial) => set(s => ({
        learningItems: s.learningItems.map(li => li.id === _id ? { ...li, ..._partial } : li),
      })),
    }),
    { name: 'empire-store' }
  )
)