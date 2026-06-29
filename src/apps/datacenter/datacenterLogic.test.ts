import { describe, it, expect } from 'vitest'
import {
  SEED,
  serializeStore,
  deserializeStore,
  addRow,
  updateCell,
  deleteRow,
  addTable,
  deleteTable,
  normalizeTableName,
  type DCStore,
} from './datacenterLogic'

const base: DCStore = {
  tasks: {
    columns: ['title', 'done'],
    rows: [{ id: 'r1', title: 'first', done: 'no' }],
  },
}

describe('addTable', () => {
  it('adds an empty table with trimmed columns', () => {
    const next = addTable(base, 'contacts', [' name ', 'email', ' '])
    expect(next.contacts).toEqual({ columns: ['name', 'email'], rows: [] })
    expect(base.contacts).toBeUndefined() // immutable — original untouched
  })
  it('refuses a blank name, a duplicate, or no columns', () => {
    expect(addTable(base, '', ['a'])).toBe(base)
    expect(addTable(base, 'tasks', ['a'])).toBe(base) // already exists
    expect(addTable(base, 'empty', ['  ', ''])).toBe(base) // no real columns
  })
})

describe('row CRUD', () => {
  it('appends a row immutably', () => {
    const next = addRow(base, 'tasks', { id: 'r2', title: 'second', done: 'yes' })
    expect(next.tasks.rows).toHaveLength(2)
    expect(next.tasks.rows[1]).toEqual({ id: 'r2', title: 'second', done: 'yes' })
    expect(base.tasks.rows).toHaveLength(1)
  })
  it('updates a single cell of a single row', () => {
    const next = updateCell(base, 'tasks', 'r1', 'done', 'yes')
    expect(next.tasks.rows[0].done).toBe('yes')
    expect(next.tasks.rows[0].title).toBe('first') // other cells untouched
    expect(base.tasks.rows[0].done).toBe('no')
  })
  it('deletes a row by id', () => {
    const next = deleteRow(base, 'tasks', 'r1')
    expect(next.tasks.rows).toHaveLength(0)
    expect(base.tasks.rows).toHaveLength(1)
  })
  it('is a no-op when the table is gone', () => {
    expect(addRow(base, 'ghost', { id: 'x' })).toBe(base)
    expect(updateCell(base, 'ghost', 'r1', 'a', 'b')).toBe(base)
    expect(deleteRow(base, 'ghost', 'r1')).toBe(base)
  })
})

describe('deleteTable', () => {
  it('drops a table by name', () => {
    const next = deleteTable(base, 'tasks')
    expect(next.tasks).toBeUndefined()
    expect(base.tasks).toBeDefined()
  })
  it('is a no-op for an unknown table', () => {
    expect(deleteTable(base, 'ghost')).toBe(base)
  })
})

describe('normalizeTableName', () => {
  it('lowercases and underscores whitespace', () => {
    expect(normalizeTableName('  My Cool  Table ')).toBe('my_cool_table')
  })
})

describe('serialize / deserialize round-trip', () => {
  it('survives a full round-trip unchanged', () => {
    const built = addRow(
      addTable(base, 'people', ['name']),
      'people',
      { id: 'p1', name: 'Ada' },
    )
    expect(deserializeStore(serializeStore(built))).toEqual(built)
  })
  it('falls back to SEED on corrupt JSON', () => {
    expect(deserializeStore('{not json')).toBe(SEED)
  })
  it('falls back to SEED on null / undefined / empty', () => {
    expect(deserializeStore(null)).toBe(SEED)
    expect(deserializeStore(undefined)).toBe(SEED)
    expect(deserializeStore('')).toBe(SEED)
  })
  it('falls back to SEED on a non-object payload (array / primitive)', () => {
    expect(deserializeStore('[1,2,3]')).toBe(SEED)
    expect(deserializeStore('42')).toBe(SEED)
    expect(deserializeStore('null')).toBe(SEED)
  })
})
