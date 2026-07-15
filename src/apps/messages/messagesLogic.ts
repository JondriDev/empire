/**
 * Messages — pure conversation-scoping logic (unit-tested; no React/store).
 *
 * The single source of truth for "which messages belong to the conversation with
 * a given contact". Used by BOTH the thread view and the contact-list preview so
 * they can never diverge.
 */
import type { Message } from '../../lib/store'

/**
 * Messages belonging to the conversation with `contact`, in chronological order.
 *
 * A message is in the thread if it was **received from** that contact
 * (`sender === contact`) or **sent by Me to** that contact
 * (`sender === 'Me' && to === contact`).
 *
 * **Migrate-in-place:** legacy sent messages have no `to` (they predate
 * recipient-scoping). We can't know their recipient, so they surface in every
 * thread — hiding them would lose user data. New sends carry `to`, so they land
 * only in the right conversation.
 */
export function threadFor(messages: Message[], contact: string): Message[] {
  return messages.filter(
    m =>
      m.sender === contact ||
      (m.sender === 'Me' && (m.to === undefined || m.to === contact)),
  )
}

/** The most recent message in the conversation with `contact`, or undefined. */
export function lastInThread(messages: Message[], contact: string): Message | undefined {
  const thread = threadFor(messages, contact)
  return thread[thread.length - 1]
}
