/**
 * Mail drafts — a tiny durable local store (localStorage `empire-mail-drafts`).
 *
 * Mail's compose was ephemeral: closing or reloading lost whatever you'd typed.
 * This store gives drafts real durability (a genuine capability, not just plumbing)
 * AND is the collection Mail mirrors into the Core graph so it becomes graph-legible
 * via the same rail as Crypto/Reader — the last raw-HTML island to join the organism.
 *
 * Pure-ish (localStorage only, no React) so the save→list→delete roundtrip and the
 * upsert-by-id semantics are unit-pinned without a render.
 */

const KEY = 'empire-mail-drafts'

/** One durable Mail draft. `updatedAt` is stamped by the store on every save. */
export interface Draft {
  id: string
  to: string
  subject: string
  body: string
  updatedAt: number
}

/** Mint a fresh draft id (mirrors graph.ts newId — uuid when available). */
export function newDraftId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** All drafts, newest-edited first. Tolerant of a missing / corrupt store. */
export function listDrafts(): Draft[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return (arr as Draft[]).slice().sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

/**
 * Upsert a draft by id (stamps a fresh `updatedAt`) and return the stored record.
 * A matching id replaces in place; a new id is appended.
 */
export function saveDraft(d: Omit<Draft, 'updatedAt'>): Draft {
  const stored: Draft = { ...d, updatedAt: Date.now() }
  const all = listDrafts()
  const idx = all.findIndex(x => x.id === d.id)
  if (idx >= 0) all[idx] = stored
  else all.push(stored)
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* storage full / unavailable — the in-memory caller still has the record */
  }
  return stored
}

/** Remove a draft by id (no-op if it isn't there). */
export function deleteDraft(id: string): void {
  const all = listDrafts().filter(x => x.id !== id)
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* ignore */
  }
}
