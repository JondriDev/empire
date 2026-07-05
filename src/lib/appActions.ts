/**
 * Empire App Actions — standardized cross-app data transfer
 *
 * Every app can send data to any other app through me (the connector).
 * This is how Notes talk to Prompt Generator, Calculator talks to Notes, etc.
 */

import { emit } from './eventBus'
import { useStore } from './store'
import { chat } from './ai'

export interface AppAction {
  id: string
  label: string
  icon: string
  description: string
}

export interface DataPayload {
  text: string
  title?: string
  json?: unknown
  source: string // app id
}

// Announce a directed app→app handoff on the bus so observers (the Network
// mesh) can light an honest synapse arc between the two instruments. Emitted
// synchronously *before* any navigation, so a listening node lights in the
// moment the transfer happens.
function handoff(fromId: string, toId: string, label: string): void {
  if (!fromId || fromId === toId) return
  emit({ type: 'HANDOFF', fromId, toId, label })
}

// Navigate to an in-app route, honouring Vite's deploy base. An absolute path
// like '/app/ai-chat' ignores the base (`/empire/` on GitHub Pages) and lands
// outside the app → a hard 404. Prefixing import.meta.env.BASE_URL keeps the
// link inside the app on every target ('/', '/empire/', the Capacitor APK).
function openRoute(route: string): void {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  window.open(`${base}${route}`, '_self')
}

// ─── Actions available to apps ──────────────────────────────────

export const CROSS_APP_ACTIONS = {
  SEND_TO_NOTES: {
    id: 'send-to-notes',
    label: 'Send to Notes',
    icon: 'StickyNote',
    description: 'Save as a new note',
    execute: (data: DataPayload) => {
      const { addNote } = useStore.getState()
      // Compute the id once so the stored note and the emitted event agree —
      // two separate Date.now() calls can land on different milliseconds.
      const id = Date.now().toString()
      const title = data.title || `From ${data.source}`
      const tags = ['from-' + data.source]
      addNote({ id, title, content: data.text, updatedAt: Date.now(), tags })
      emit({ type: 'NOTE_CREATED', noteId: id, title, content: data.text, tags })
      return `Saved to Notes: "${(data.title || data.text).substring(0, 40)}..."`
    },
  } as const,

  SEND_TO_EDITOR: {
    id: 'send-to-editor',
    label: 'Open in Code Editor',
    icon: 'Code2',
    description: 'Edit this in Code Editor',
    execute: (data: DataPayload) => {
      sessionStorage.setItem('empire-editor-clipboard', JSON.stringify({
        code: data.text,
        language: 'javascript',
        from: data.source,
      }))
      handoff(data.source, 'editor', 'editing')
      openRoute('/app/editor')
      return 'Opened in Code Editor'
    },
  } as const,

  SEND_TO_TOKEN_COUNTER: {
    id: 'send-to-tokens',
    label: 'Count Tokens',
    icon: 'Hash',
    description: 'Analyze token count',
    execute: (data: DataPayload) => {
      sessionStorage.setItem('empire-token-clipboard', JSON.stringify({
        text: data.text,
        from: data.source,
      }))
      handoff(data.source, 'token-counter', 'counting')
      openRoute('/app/token-counter')
      return 'Opened in Token Counter'
    },
  } as const,

  SEND_TO_PROMPT_GEN: {
    id: 'send-to-prompt',
    label: 'Use as Prompt',
    icon: 'Wand2',
    description: 'Generate an AI prompt from this',
    execute: (data: DataPayload) => {
      sessionStorage.setItem('empire-prompt-clipboard', JSON.stringify({
        text: data.text,
        from: data.source,
      }))
      handoff(data.source, 'prompt-generator', 'prompting')
      openRoute('/app/prompt-generator')
      return 'Opened in Prompt Generator'
    },
  } as const,

  SEND_TO_AI_CHAT: {
    id: 'send-to-ai',
    label: 'Ask Cakra',
    icon: 'Sparkles',
    description: 'Send to Cakra for analysis',
    execute: (data: DataPayload) => {
      sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
        text: data.text,
        title: data.title,
        from: data.source,
      }))
      handoff(data.source, 'ai-chat', 'asking')
      openRoute('/app/ai-chat')
      return 'Opening Cakra…'
    },
  } as const,

  SEND_TO_LEARNING: {
    id: 'send-to-learning',
    label: 'Track as Learning',
    icon: 'GraduationCap',
    description: 'Add to Learning Tracker',
    execute: (data: DataPayload) => {
      const { addLearningItem } = useStore.getState()
      addLearningItem({
        id: Date.now().toString(),
        topic: data.title || data.text.substring(0, 50),
        learned: data.text,
        date: new Date().toISOString().split('T')[0],
        nextReview: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        mastered: false,
        // Tag the source so the item can render a ProvenanceChip — makes the
        // in-place receive legible and flips Learning to a both-ways app (S6a).
        from: data.source,
      })
      // Carry the source so the Network mesh can light the source→learning arc
      // (this transfer stays in place — no navigation — so a single tagged event
      // is cleaner than a separate HANDOFF that would double the ticker row).
      emit({ type: 'LEARNING_LOGGED', topic: data.title || data.text.substring(0, 50), learned: data.text, from: data.source })
      return 'Added to Learning Tracker!'
    },
  } as const,

  SEND_TO_CALENDAR: {
    id: 'send-to-calendar',
    label: 'Add to Calendar',
    icon: 'Calendar',
    description: 'Draft a calendar event from this',
    execute: (data: DataPayload) => {
      sessionStorage.setItem('empire-calendar-clipboard', JSON.stringify({
        text: data.text,
        title: data.title,
        from: data.source,
      }))
      handoff(data.source, 'calendar', 'scheduling')
      openRoute('/app/calendar')
      return 'Opened in Calendar'
    },
  } as const,

  SEND_TO_GOALS: {
    id: 'send-to-goals',
    label: 'Make a Goal',
    icon: 'Target',
    description: 'Turn this into a new goal',
    execute: (data: DataPayload) => {
      sessionStorage.setItem('empire-goals-clipboard', JSON.stringify({
        text: data.text,
        title: data.title,
        from: data.source,
      }))
      handoff(data.source, 'goals', 'goal-setting')
      openRoute('/app/goals')
      return 'Opened in Goals'
    },
  } as const,

  SEND_TO_MESSAGES: {
    id: 'send-to-messages',
    label: 'Draft a Message',
    icon: 'MessageSquare',
    description: 'Compose a message draft from this',
    execute: (data: DataPayload) => {
      sessionStorage.setItem('empire-messages-clipboard', JSON.stringify({
        text: data.text,
        title: data.title,
        from: data.source,
      }))
      handoff(data.source, 'messages', 'messaging')
      openRoute('/app/messages')
      return 'Opened in Messages'
    },
  } as const,

  ASK_CAKRA_TO_ANALYZE: {
    id: 'ask-cakra-analyze',
    label: 'Ask Cakra to Analyze',
    icon: 'Brain',
    description: 'Get AI-powered analysis via chat',
    execute: async (data: DataPayload) => {
      sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
        text: data.text,
        title: data.title,
        from: data.source,
        action: 'analyze',
      }))
      handoff(data.source, 'ai-chat', 'analyzing')
      openRoute('/app/ai-chat')
      return 'Opening Cakra for analysis…'
    },
  } as const,
}

export type AppActionKey = keyof typeof CROSS_APP_ACTIONS

// ─── Smart context injection ────────────────────────────────────

/** Build a prompt for the AI that includes current empire context */
export async function askCakra(question: string, sourceApp: string): Promise<string> {
  try {
    const response = await chat([
      { role: 'user', content: `[From ${sourceApp}] ${question}\n\nContext:\n${getCrossAppContext(sourceApp)}` },
    ])
    emit({ type: 'AI_QUERY', query: question, context: sourceApp, app: sourceApp })
    emit({ type: 'AI_RESPONSE', query: question, response, app: sourceApp })
    return response
  } catch (err: unknown) {
    return `⚠️ Error: ${err instanceof Error ? err.message : String(err)}`
  }
}

/** Gather context from other apps for AI awareness */
function getCrossAppContext(_currentApp: string): string {
  const state = useStore.getState()
  const parts: string[] = []

  if (state.notes.length > 0) {
    parts.push(`\nNotes (${state.notes.length}): ${state.notes.slice(0, 3).map(n => n.title).join(', ')}`)
  }
  if (state.events.length > 0) {
    parts.push(`Events: ${state.events.slice(0, 3).map(e => `${e.title} (${e.date})`).join(', ')}`)
  }
  if (state.learningItems.length > 0) {
    parts.push(`Learning topics: ${state.learningItems.map(l => l.topic).join(', ')}`)
  }

  return parts.join('\n')
}