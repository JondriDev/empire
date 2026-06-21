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
      window.open('/app/editor', '_self')
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
      window.open('/app/token-counter', '_self')
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
      window.open('/app/prompt-generator', '_self')
      return 'Opened in Prompt Generator'
    },
  } as const,

  SEND_TO_AI_CHAT: {
    id: 'send-to-ai',
    label: 'Ask Hermes',
    icon: 'Sparkles',
    description: 'Send to AI Chat for analysis',
    execute: (data: DataPayload) => {
      sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
        text: data.text,
        title: data.title,
        from: data.source,
      }))
      handoff(data.source, 'ai-chat', 'asking')
      window.open('/app/ai-chat', '_self')
      return 'Opening AI Chat...'
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
      })
      // Carry the source so the Network mesh can light the source→learning arc
      // (this transfer stays in place — no navigation — so a single tagged event
      // is cleaner than a separate HANDOFF that would double the ticker row).
      emit({ type: 'LEARNING_LOGGED', topic: data.title || data.text.substring(0, 50), learned: data.text, from: data.source })
      return 'Added to Learning Tracker!'
    },
  } as const,

  ASK_HERMES_TO_ANALYZE: {
    id: 'ask-hermes-analyze',
    label: 'Ask Hermes to Analyze',
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
      window.open('/app/ai-chat', '_self')
      return 'Opening AI Chat for analysis...'
    },
  } as const,
}

export type AppActionKey = keyof typeof CROSS_APP_ACTIONS

// ─── Smart context injection ────────────────────────────────────

/** Build a prompt for the AI that includes current empire context */
export async function askHermes(question: string, sourceApp: string): Promise<string> {
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