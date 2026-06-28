// ── Media store — durable blobs for Music & Video ────────────────────────────
// The bug this fixes: Music/Video persisted their playlist (with
// `URL.createObjectURL(file)` blob URLs) to localStorage. Blob URLs are
// SESSION-SCOPED — invalid after a reload — so the "restored" library was a list
// of unplayable ghosts. Real fix: keep the actual file `Blob`s in IndexedDB keyed
// by id, persist ONLY metadata (no src) in localStorage, and rebuild a fresh
// object URL on mount. The IDB glue here is intentionally thin and tolerant
// (graceful no-op when IndexedDB is unavailable, e.g. private mode or jsdom); the
// testable substance lives in the pure transforms below.

// ── Pure transforms (unit-tested; no DOM, no IDB) ────────────────────────────

/** Per-blob cap. Blobs larger than this are NOT persisted (to avoid blowing the
 *  IDB quota); the app keeps them session-only and flags them `ephemeral`. */
export const MEDIA_SIZE_CAP = 75 * 1024 * 1024 // 75 MB

/** A media item the apps render: carries a (volatile) blob `src` and an id. */
export interface MediaRecord {
  id: string
  src: string
  /** session-only — too large to persist, won't survive a reload. */
  ephemeral?: boolean
}

export type StoredMeta<T extends MediaRecord> = Omit<T, 'src' | 'ephemeral'>

/** True iff a blob of this size is small enough to persist to IndexedDB. */
export function shouldPersistBlob(size: number): boolean {
  return Number.isFinite(size) && size >= 0 && size <= MEDIA_SIZE_CAP
}

/** Strip the volatile blob `src` and drop session-only (`ephemeral`) items before
 *  writing metadata to localStorage — so the persisted record can never contain a
 *  dead blob URL or a ghost that has no backing blob to rehydrate from. */
export function toStorableMeta<T extends MediaRecord>(items: T[]): Array<StoredMeta<T>> {
  const out: Array<StoredMeta<T>> = []
  for (const item of items) {
    if (item.ephemeral) continue
    const { src: _src, ephemeral: _ephemeral, ...rest } = item
    out.push(rest as StoredMeta<T>)
  }
  return out
}

/** Rebuild a playable library from persisted metadata: attach a fresh object URL
 *  for every id whose blob was recovered, and DROP any whose blob is missing (the
 *  ghost case) so the UI never shows an unplayable row. This is the inverse of
 *  `toStorableMeta` + IDB recovery — the heart of "survives a reload". */
export function rehydrateMedia<T extends MediaRecord>(
  stored: Array<StoredMeta<T>>,
  urlForId: (id: string) => string | null | undefined,
): T[] {
  const out: T[] = []
  for (const meta of stored) {
    const url = urlForId(meta.id)
    if (!url) continue
    out.push({ ...(meta as unknown as T), src: url })
  }
  return out
}

// ── IndexedDB glue (thin, tolerant; no-ops when IDB is absent) ────────────────

const DB_NAME = 'empire-media'
const STORE = 'blobs'
const DB_VERSION = 1

function idbAvailable(): boolean {
  return typeof indexedDB !== 'undefined' && indexedDB !== null
}

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (!idbAvailable()) return Promise.resolve(null)
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

/** Store a file blob under `id`. Resolves false if IDB is unavailable or the
 *  write fails (e.g. quota exceeded) — callers keep the item session-only then. */
export async function putMedia(id: string, blob: Blob): Promise<boolean> {
  const db = await openDb()
  if (!db) return false
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(blob, id)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
      tx.onabort = () => resolve(false)
    } catch {
      resolve(false)
    }
  })
}

/** Recover the stored blob for `id`, or null if absent / IDB unavailable. */
export async function getMedia(id: string): Promise<Blob | null> {
  const db = await openDb()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(id)
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

/** Remove a stored blob (best-effort; silent no-op if absent / unavailable). */
export async function deleteMedia(id: string): Promise<void> {
  const db = await openDb()
  if (!db) return
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    } catch {
      resolve()
    }
  })
}

/** Every id currently held in the store (for orphan cleanup / diagnostics). */
export async function allMediaIds(): Promise<string[]> {
  const db = await openDb()
  if (!db) return []
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).getAllKeys()
      req.onsuccess = () => resolve((req.result as unknown[]).map(String))
      req.onerror = () => resolve([])
    } catch {
      resolve([])
    }
  })
}

/** Fetch each id's blob and mint a fresh object URL. Ids with no stored blob are
 *  simply absent from the returned map (callers drop them as ghosts). */
export async function loadMediaUrls(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  await Promise.all(
    ids.map(async (id) => {
      const blob = await getMedia(id)
      if (blob) map.set(id, URL.createObjectURL(blob))
    }),
  )
  return map
}
