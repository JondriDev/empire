import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Message {
  id: string
  sender: string
  content: string
  timestamp: number
}

export interface Note {
  id: string
  title: string
  content: string
  updatedAt: number
  tags: string[]
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
}

interface AppState {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  notes: Note[]
  addNote: (note: Note) => void
  updateNote: (id: string, note: Partial<Note>) => void
  deleteNote: (id: string) => void
  messages: Message[]
  addMessage: (msg: Message) => void
  events: CalendarEvent[]
  addEvent: (event: CalendarEvent) => void
  removeEvent: (id: string) => void
  learningItems: LearningItem[]
  addLearningItem: (item: LearningItem) => void
  updateLearningItem: (id: string, item: Partial<LearningItem>) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
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
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      addNote: (note) => set(s => ({ notes: [...s.notes, note] })),
      updateNote: (id, partial) => set(s => ({
        notes: s.notes.map(n => n.id === id ? { ...n, ...partial } : n),
      })),
      deleteNote: (id) => set(s => ({ notes: s.notes.filter(n => n.id !== id) })),

      addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),

      addEvent: (event) => set(s => ({ events: [...s.events, event] })),
      removeEvent: (id) => set(s => ({ events: s.events.filter(e => e.id !== id) })),

      addLearningItem: (item) => set(s => ({ learningItems: [...s.learningItems, item] })),
      updateLearningItem: (id, partial) => set(s => ({
        learningItems: s.learningItems.map(li => li.id === id ? { ...li, ...partial } : li),
      })),
    }),
    { name: 'empire-store' }
  )
)