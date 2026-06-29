/**
 * Data Center — local-first tables (localStorage), zero backend.
 *
 * Create tables, edit any cell inline, add/delete rows — it genuinely works
 * everywhere, including the live PWA where there is no server. Ask Cakra to
 * analyze any table. State persists in localStorage under `empire-datacenter`.
 */

import { useState, useEffect } from 'react'
import { Bot, Plus, Trash2, Database, X } from 'lucide-react'
import { emit } from '../../lib/eventBus'
import { mirrorCollection } from '../../lib/core/sync'
import { NodeActions } from '../../components/ui/NodeActions'
import {
  STORAGE_KEY, type DCStore, type DCTable, type TableRow,
  deserializeStore, serializeStore, newId,
  addRow as addRowTo, updateCell as updateCellIn, deleteRow as deleteRowFrom,
  addTable, deleteTable as deleteTableFrom, normalizeTableName,
} from './datacenterLogic'

const ACCENT = 'var(--c-mesin)' // DS atmos-pale token — Data Center's accent

function loadStore(): DCStore {
  return deserializeStore(localStorage.getItem(STORAGE_KEY))
}

export default function DataCenter() {
  const [store, setStore] = useState<DCStore>(() => loadStore())
  const [activeTable, setActiveTable] = useState<string>(() => Object.keys(loadStore())[0] || '')
  const [newRow, setNewRow] = useState<Record<string, string>>({})
  const [showNewTable, setShowNewTable] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [newTableCols, setNewTableCols] = useState('')

  const tableNames = Object.keys(store)
  const table: DCTable | undefined = store[activeTable]

  useEffect(() => { emit({ type: 'APP_OPENED', appId: 'datacenter' }) }, [])

  // Persist on every change — this is the single source of truth.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, serializeStore(store)) } catch { /* ignore */ }
  }, [store])

  // If the active table disappears (deleted), fall back to the first one.
  useEffect(() => {
    if (activeTable && !store[activeTable]) setActiveTable(Object.keys(store)[0] || '')
  }, [store, activeTable])

  // Announce row count for the activity feed when the view changes.
  useEffect(() => {
    if (table) emit({ type: 'DATA_TABLE_UPDATED', tableName: activeTable, rowCount: table.rows.length })
  }, [activeTable, table])

  // Mirror each table into the Core graph as a `dataset` node so it joins the
  // organism. Tables (not individual rows) are the graph-worthy entity.
  useEffect(() => {
    mirrorCollection('dataset', 'datacenter', Object.keys(store), {
      id: t => t,
      title: t => t,
      data: t => ({ rows: store[t]?.rows.length ?? 0 }),
    })
  }, [store])

  const addRow = () => {
    if (!table) return
    const row: TableRow = { id: newId() }
    table.columns.forEach(c => { row[c] = (newRow[c] || '').trim() })
    if (table.columns.every(c => !row[c])) return // don't add an all-blank row
    setStore(prev => addRowTo(prev, activeTable, row))
    setNewRow({})
  }

  const updateCell = (rowId: string, col: string, value: string) => {
    setStore(prev => updateCellIn(prev, activeTable, rowId, col, value))
  }

  const deleteRow = (rowId: string) => {
    setStore(prev => deleteRowFrom(prev, activeTable, rowId))
  }

  const createTable = () => {
    const name = normalizeTableName(newTableName)
    const columns = newTableCols.split(',')
    if (!name || store[name] || columns.every(c => !c.trim())) return
    setStore(prev => addTable(prev, name, columns))
    setActiveTable(name)
    setNewTableName('')
    setNewTableCols('')
    setShowNewTable(false)
  }

  const deleteTable = (name: string) => {
    setStore(prev => deleteTableFrom(prev, name))
  }

  const askCakra = () => {
    if (!table) return
    const head = table.columns.join(' | ')
    const body = table.rows.slice(0, 12).map(r => table.columns.map(c => r[c] ?? '').join(' | ')).join('\n')
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `Data from **${activeTable}** table:\n\n${head}\n${body}${table.rows.length > 12 ? `\n… and ${table.rows.length - 12} more rows` : ''}`,
      title: `${activeTable} data analysis`,
      from: 'datacenter',
    }))
    window.location.href = '/app/ai-chat'
  }

  return (
    <div className="relative flex h-full" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div className="w-56 border-r flex flex-col" style={{ borderColor: 'var(--border)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-base font-bold flex items-center gap-2">
            <Database className="w-4 h-4" style={{ color: ACCENT }} /> Data Center
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
            {table ? `${table.rows.length} rows · ${activeTable}` : 'No tables'}
          </p>
        </div>
        <div className="flex-1 overflow-auto">
          <button
            onClick={askCakra}
            disabled={!table}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm border-b disabled:opacity-40 hover:bg-glass"
            style={{ borderColor: 'var(--border)', color: ACCENT }}
          >
            <Bot className="w-3.5 h-3.5" /> Ask Cakra
          </button>
          {tableNames.map(t => {
            const active = activeTable === t
            return (
              <div
                key={t}
                className="group flex items-center border-b hover:bg-glass"
                style={{ borderColor: 'var(--border)', background: active ? 'color-mix(in srgb, var(--c-mesin) 14%, transparent)' : undefined }}
              >
                <button
                  onClick={() => setActiveTable(t)}
                  className="flex-1 px-4 py-2.5 text-left text-sm capitalize transition-colors"
                  style={{ color: active ? ACCENT : 'var(--text2)' }}
                >
                  {t}
                </button>
                <span className="flex items-center pr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <NodeActions type="dataset" sourceId={t} />
                  <button
                    onClick={() => deleteTable(t)}
                    className="p-1 rounded hover:bg-danger/20 text-danger/50 hover:text-danger transition-colors"
                    title={`Delete ${t} table`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              </div>
            )
          })}
        </div>
        <button
          onClick={() => setShowNewTable(true)}
          className="p-3 text-xs hover:opacity-80 transition-opacity flex items-center justify-center gap-1.5 border-t"
          style={{ borderColor: 'var(--border)', color: 'var(--text3)' }}
        >
          <Plus className="w-3.5 h-3.5" /> New table
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="font-semibold capitalize">{activeTable || '—'}</span>
            {table && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-glass" style={{ color: 'var(--text3)' }}>
                {table.rows.length} rows
              </span>
            )}
          </div>
          {table && (
            <button
              onClick={askCakra}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{ background: 'color-mix(in srgb, var(--c-mesin) 20%, transparent)', color: ACCENT }}
            >
              <Bot className="w-3.5 h-3.5" /> Analyze with Cakra
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {!table ? (
            <div className="text-center py-12">
              <Database className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text3)' }} />
              <p className="text-sm" style={{ color: 'var(--text2)' }}>No tables yet.</p>
              <button onClick={() => setShowNewTable(true)} className="mt-3 text-sm" style={{ color: ACCENT }}>
                Create your first table
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    {table.columns.map(col => (
                      <th key={col} className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
                        {col}
                      </th>
                    ))}
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map(row => (
                    <tr key={row.id} className="border-b group hover:bg-glass/[0.03] transition-colors" style={{ borderColor: 'var(--border)' }}>
                      {table.columns.map(col => (
                        <td key={col} className="px-1 py-0.5">
                          <input
                            value={row[col] ?? ''}
                            onChange={e => updateCell(row.id, col, e.target.value)}
                            className="w-full bg-transparent px-2 py-1.5 rounded focus:outline-none focus:bg-glass"
                            style={{ color: 'var(--text2)' }}
                          />
                        </td>
                      ))}
                      <td className="px-2 text-right">
                        <button
                          onClick={() => deleteRow(row.id)}
                          className="opacity-0 group-hover:opacity-100 text-danger/50 hover:text-danger transition"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* New-row entry line */}
                  <tr>
                    {table.columns.map((col, i) => (
                      <td key={col} className="px-1 py-0.5">
                        <input
                          value={newRow[col] || ''}
                          onChange={e => setNewRow(prev => ({ ...prev, [col]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') addRow() }}
                          placeholder={i === 0 ? 'Add a row…' : ''}
                          className="w-full bg-transparent px-2 py-1.5 rounded focus:outline-none focus:bg-glass placeholder:text-[var(--text3)]"
                          style={{ color: 'var(--text)' }}
                        />
                      </td>
                    ))}
                    <td className="px-2 text-right">
                      <button onClick={addRow} className="transition-colors" style={{ color: ACCENT }} title="Add row">
                        <Plus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New-table modal */}
      {showNewTable && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-void/50 backdrop-blur-sm" onClick={() => setShowNewTable(false)}>
          <div
            className="w-80 rounded-2xl border p-5"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Database className="w-4 h-4" style={{ color: ACCENT }} /> New table
              </h2>
              <button onClick={() => setShowNewTable(false)} className="hover:opacity-70" style={{ color: 'var(--text3)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Table name</label>
            <input
              autoFocus
              value={newTableName}
              onChange={e => setNewTableName(e.target.value)}
              placeholder="contacts"
              className="w-full mb-3 px-3 py-2 rounded-lg bg-glass text-sm focus:outline-none focus:bg-glass"
              style={{ color: 'var(--text)' }}
            />
            <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Columns (comma-separated)</label>
            <input
              value={newTableCols}
              onChange={e => setNewTableCols(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createTable() }}
              placeholder="name, email, phone"
              className="w-full mb-4 px-3 py-2 rounded-lg bg-glass text-sm focus:outline-none focus:bg-glass"
              style={{ color: 'var(--text)' }}
            />
            <button
              onClick={createTable}
              disabled={!newTableName.trim() || !newTableCols.trim()}
              className="w-full py-2 rounded-lg text-sm font-medium disabled:opacity-40 transition-opacity"
              style={{ background: ACCENT, color: 'var(--void)' }}
            >
              Create table
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
