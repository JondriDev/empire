/**
 * ask — the Reader's bridge to Cakra.
 *
 * Reuses the Empire AI bridge (`streamChat`) and the unified Cakra persona, with
 * a reading-companion system prompt. No new backend: `streamChat` routes through
 * `aiApiUrl('/api/ai/chat')` — the Supabase proxy on the live PWA, same-origin
 * on Termux/dev — so "Ask Cakra" works everywhere with zero setup.
 */
import { streamChat, type ChatMessage } from '../../../lib/ai'
import { CAKRA_SYSTEM_PROMPT } from '../../../lib/cakra'

export interface AskContext {
  bookTitle: string
  author?: string
  /** The passage the reader selected, if any. */
  passage?: string
}

export interface AskTurn { role: 'user' | 'assistant'; content: string }

const READER_PERSONA =
  `${CAKRA_SYSTEM_PROMPT}\n\n` +
  `Right now you are the reader's companion inside the Empire Reader. Help them ` +
  `understand the book they're reading: explain unfamiliar words, ideas, references, ` +
  `history, and context clearly and concisely. When a passage is provided, ground ` +
  `your answer in it and quote sparingly. Prefer short, direct explanations; expand ` +
  `only when asked. Answer in the reader's language.`

/** Build the message list Cakra answers from (system + recent history + question). */
export function buildReaderMessages(ctx: AskContext, history: AskTurn[], question: string): ChatMessage[] {
  const lines = [`Book: "${ctx.bookTitle}"${ctx.author ? ` by ${ctx.author}` : ''}.`]
  if (ctx.passage?.trim()) {
    lines.push(`The reader selected this passage:\n"""\n${ctx.passage.trim().slice(0, 4000)}\n"""`)
  }
  return [
    { role: 'system', content: `${READER_PERSONA}\n\n${lines.join('\n')}` },
    ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ]
}

/** Stream Cakra's answer about the current book/passage. Returns a canceller. */
export function askCakra(
  ctx: AskContext,
  history: AskTurn[],
  question: string,
  onToken: (t: string) => void,
  onDone?: () => void,
  onError?: (e: Error) => void,
): { cancel: () => void } {
  const controller = new AbortController()
  void streamChat(
    buildReaderMessages(ctx, history, question),
    { signal: controller.signal },
    onToken,
    onDone,
    onError,
  )
  return { cancel: () => controller.abort() }
}
