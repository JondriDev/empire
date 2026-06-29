/**
 * bookStore — durable library for the Reader.
 *
 * Reuses the tested IndexedDB blob rail from `src/lib/mediaStore.ts` (books are
 * stored as Blobs keyed `book:<id>`), and keeps lightweight metadata (title,
 * author, format, cover, reading position, highlights) in localStorage. This
 * mirrors how Music/Video/Photos persist large files without blowing the
 * localStorage quota.
 */
import { putMedia, getMedia, deleteMedia } from '../../../lib/mediaStore'
import type { BookMeta, BookFormat, Highlight } from './types'

const META_KEY = 'empire-books'
const blobKey = (id: string) => `book:${id}`

function uid(): string {
  return `bk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function listBooks(): BookMeta[] {
  try {
    const raw = localStorage.getItem(META_KEY)
    const arr = raw ? (JSON.parse(raw) as BookMeta[]) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function writeBooks(books: BookMeta[]): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(books))
  } catch {
    /* quota — non-fatal; books still readable this session via IDB */
  }
}

export function getBook(id: string): BookMeta | undefined {
  return listBooks().find(b => b.id === id)
}

/** Persist a freshly-imported file: store the blob in IDB, save its metadata. */
export async function addBook(
  file: File,
  format: BookFormat,
  extra: { title?: string; author?: string; cover?: string } = {},
): Promise<BookMeta> {
  const id = uid()
  await putMedia(blobKey(id), file)
  const meta: BookMeta = {
    id,
    title: extra.title || file.name.replace(/\.[^.]+$/, ''),
    author: extra.author,
    format,
    cover: extra.cover,
    size: file.size,
    addedAt: Date.now(),
    highlights: [],
  }
  const books = listBooks()
  books.unshift(meta)
  writeBooks(books)
  return meta
}

/** Recover the stored file blob for a book (null if evicted / unavailable). */
export function getBookBlob(id: string): Promise<Blob | null> {
  return getMedia(blobKey(id))
}

export function updateBook(id: string, patch: Partial<BookMeta>): void {
  const books = listBooks()
  const i = books.findIndex(b => b.id === id)
  if (i === -1) return
  books[i] = { ...books[i], ...patch }
  writeBooks(books)
}

export async function deleteBook(id: string): Promise<void> {
  await deleteMedia(blobKey(id))
  writeBooks(listBooks().filter(b => b.id !== id))
}

export function addHighlight(id: string, h: Omit<Highlight, 'id' | 'createdAt'>): Highlight {
  const hl: Highlight = { ...h, id: `hl-${Date.now().toString(36)}`, createdAt: Date.now() }
  const books = listBooks()
  const i = books.findIndex(b => b.id === id)
  if (i !== -1) {
    books[i] = { ...books[i], highlights: [hl, ...(books[i].highlights || [])] }
    writeBooks(books)
  }
  return hl
}

export function removeHighlight(id: string, highlightId: string): void {
  const books = listBooks()
  const i = books.findIndex(b => b.id === id)
  if (i === -1) return
  books[i] = { ...books[i], highlights: (books[i].highlights || []).filter(h => h.id !== highlightId) }
  writeBooks(books)
}
