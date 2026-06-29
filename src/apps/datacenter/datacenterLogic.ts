// ── Data Center — pure, storage-agnostic logic ───────────────────────────────
// Extracted so the table CRUD + (de)serialization are unit-testable without a
// DOM or a real storage backend. The component owns React state + effects; this
// module owns the immutable store transforms and the tolerant parse, so a reload
// genuinely restores what the user built. Mirrors `clock/clockLogic.ts`.

export interface TableRow { id: string; [col: string]: string }
export interface DCTable { columns: string[]; rows: TableRow[] }
export type DCStore = Record<string, DCTable>

export const STORAGE_KEY = 'empire-datacenter'

// First-run seed so the table is alive on open instead of an empty void.
export const SEED: DCStore = {
  tasks: {
    columns: ['title', 'status', 'priority'],
    rows: [
      { id: 'r1', title: 'Ship Empire redesign', status: 'in progress', priority: 'high' },
      { id: 'r2', title: 'Wire Open-Meteo weather', status: 'done', priority: 'medium' },
    ],
  },
  ideas: {
    columns: ['idea', 'category'],
    rows: [
      { id: 'r1', idea: 'Voice control for Cakra', category: 'ai' },
      { id: 'r2', idea: 'Offline-first sync layer', category: 'infra' },
    ],
  },
}

/** Stable, collision-resistant row/table id (impure: clock + entropy). */
export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ── Persistence ──────────────────────────────────────────────────────────────

export function serializeStore(store: DCStore): string {
  return JSON.stringify(store)
}

/**
 * Tolerant load: bad JSON, a null payload, or a non-object (array/primitive) all
 * fall back to the SEED, so a corrupt write never strands the user on an empty
 * void. Always returns a render-safe DCStore. Mirrors `deserializeClockState`.
 */
export function deserializeStore(raw: string | null | undefined): DCStore {
  if (!raw) return SEED
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return SEED
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return SEED
  return parsed as DCStore
}

// ── Immutable store transforms (no React) ────────────────────────────────────

/** Append a row to `table`. No-op (returns the same store) if the table is gone. */
export function addRow(store: DCStore, table: string, row: TableRow): DCStore {
  const t = store[table]
  if (!t) return store
  return { ...store, [table]: { ...t, rows: [...t.rows, row] } }
}

/** Update one cell of one row. No-op if the table is gone. */
export function updateCell(store: DCStore, table: string, rowId: string, col: string, value: string): DCStore {
  const t = store[table]
  if (!t) return store
  return { ...store, [table]: { ...t, rows: t.rows.map(r => (r.id === rowId ? { ...r, [col]: value } : r)) } }
}

/** Remove a row by id. No-op if the table is gone. */
export function deleteRow(store: DCStore, table: string, rowId: string): DCStore {
  const t = store[table]
  if (!t) return store
  return { ...store, [table]: { ...t, rows: t.rows.filter(r => r.id !== rowId) } }
}

/**
 * Add an empty table. Returns the store unchanged when the name is blank, already
 * taken, or there are no columns — the same guards the create form enforced inline.
 */
export function addTable(store: DCStore, name: string, columns: string[]): DCStore {
  const clean = columns.map(c => c.trim()).filter(Boolean)
  if (!name || store[name] || clean.length === 0) return store
  return { ...store, [name]: { columns: clean, rows: [] } }
}

/** Drop a table by name. */
export function deleteTable(store: DCStore, name: string): DCStore {
  if (!(name in store)) return store
  const next = { ...store }
  delete next[name]
  return next
}

/** Normalize a free-text table name → a stable key (lowercase, underscores). */
export function normalizeTableName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_')
}
