/**
 * Data Center — local-first tables (localStorage), zero backend.
 *
 * Create tables, edit any cell inline, add/delete rows — it genuinely works
 * everywhere, including the live PWA where there is no server. Ask Cakra to
 * analyze any table. State persists in localStorage under `empire-datacenter`.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Plus, Trash2, Database, X } from 'lucide-react'
import { emit } from '../../lib/eventBus'
import { mirrorCollection } from '../../lib/core/sync'
import { NodeActions } from '../../components/ui/NodeActions'
import { EmptyState } from '../../components/ui/Utility'
import { Button, IconButton, Input } from '../../components/ui'
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
  const navigate = useNavigate()
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
    navigate('/app/ai-chat')
  }

  return (
    <div className="relative flex flex-col md:flex-row h-full" style={{ background: 'var(--bg)' }}>
      {/* Sidebar — a table picker; stacks above the table on compact (capped
          height, its own list scrolls) so it doesn't eat the phone screen. */}
      <div className="w-full md:w-56 border-b md:border-b-0 md:border-r flex flex-col max-h-[40dvh] md:max-h-none" style={{ borderColor: 'var(--border)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-base font-bold flex items-center gap-2">
            <Database className="w-4 h-4" style={{ color: ACCENT }} /> Data Center
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
            {table ? `${table.rows.length} rows · ${activeTable}` : 'No tables'}
          </p>
        </div>
        <div className="flex-1 overflow-auto">
          <Button
            onClick={askCakra}
            disabled={!table}
            variant="ghost"
            icon={<Bot className="w-3.5 h-3.5" />}
            fullWidth
            className="border-b"
            style={{ justifyContent: 'flex-start', padding: '10px 16px', borderColor: 'var(--border)', color: ACCENT }}
          >
            Ask Cakra
          </Button>
          {tableNames.map(t => {
            const active = activeTable === t
            return (
              <div
                key={t}
                className="group flex items-center border-b hover:bg-glass"
                style={{ borderColor: 'var(--border)', background: active ? 'color-mix(in srgb, var(--c-mesin) 14%, transparent)' : undefined }}
              >
                <Button
                  onClick={() => setActiveTable(t)}
                  variant="ghost"
                  className="flex-1 capitalize"
                  style={{ justifyContent: 'flex-start', padding: '10px 16px', color: active ? ACCENT : 'var(--text2)' }}
                >
                  {t}
                </Button>
                <span className="flex items-center pr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <NodeActions type="dataset" sourceId={t} />
                  <IconButton
                    onClick={() => deleteTable(t)}
                    aria-label={`Delete ${t} table`}
                    title={`Delete ${t} table`}
                    size="sm"
                    style={{ color: 'var(--c-danger)' }}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  />
                </span>
              </div>
            )
          })}
        </div>
        <Button
          onClick={() => setShowNewTable(true)}
          variant="ghost"
          icon={<Plus className="w-3.5 h-3.5" />}
          className="border-t"
          style={{ padding: '12px', borderColor: 'var(--border)', color: 'var(--text3)', fontSize: 'var(--text-xs)' }}
        >
          New table
        </Button>
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
            <Button
              onClick={askCakra}
              variant="ghost"
              size="sm"
              icon={<Bot className="w-3.5 h-3.5" />}
              style={{ background: 'color-mix(in srgb, var(--c-mesin) 20%, transparent)', color: ACCENT }}
            >
              Analyze with Cakra
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {!table ? (
            <EmptyState
              accent={ACCENT}
              icon={<Database className="w-6 h-6" />}
              title="No tables yet"
              description="Create a table to store rows locally — every table also becomes a dataset node in The Network."
              action={
                <Button onClick={() => setShowNewTable(true)} variant="ghost" size="sm" style={{ color: ACCENT }}>
                  Create your first table
                </Button>
              }
            />
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
                          <Input
                            seamless
                            aria-label={`${col} value`}
                            value={row[col] ?? ''}
                            onChange={v => updateCell(row.id, col, v)}
                          />
                        </td>
                      ))}
                      <td className="px-2 text-right">
                        <IconButton
                          onClick={() => deleteRow(row.id)}
                          aria-label="Delete row"
                          title="Delete row"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100"
                          style={{ color: 'var(--c-danger)' }}
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      </td>
                    </tr>
                  ))}
                  {/* New-row entry line */}
                  <tr>
                    {table.columns.map((col, i) => (
                      <td key={col} className="px-1 py-0.5">
                        <Input
                          seamless
                          aria-label={`New row ${col}`}
                          value={newRow[col] || ''}
                          onChange={v => setNewRow(prev => ({ ...prev, [col]: v }))}
                          onKeyDown={e => { if (e.key === 'Enter') addRow() }}
                          placeholder={i === 0 ? 'Add a row…' : ''}
                        />
                      </td>
                    ))}
                    <td className="px-2 text-right">
                      <IconButton onClick={addRow} aria-label="Add row" title="Add row" size="sm" style={{ color: ACCENT }} icon={<Plus className="w-4 h-4" />} />
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
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-void/50 backdrop-blur-sm" role="presentation" onClick={() => setShowNewTable(false)}>
          <div
            className="w-full max-w-80 rounded-2xl border p-5"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="New table"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Database className="w-4 h-4" style={{ color: ACCENT }} /> New table
              </h2>
              <IconButton onClick={() => setShowNewTable(false)} aria-label="Close" size="sm" style={{ color: 'var(--text3)' }} icon={<X className="w-4 h-4" />} />
            </div>
            <label htmlFor="dc-new-table-name" className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Table name</label>
            <Input
              id="dc-new-table-name"
              autoFocus
              value={newTableName}
              onChange={setNewTableName}
              placeholder="contacts"
              className="mb-3"
            />
            <label htmlFor="dc-new-table-cols" className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Columns (comma-separated)</label>
            <Input
              id="dc-new-table-cols"
              value={newTableCols}
              onChange={setNewTableCols}
              onKeyDown={e => { if (e.key === 'Enter') createTable() }}
              placeholder="name, email, phone"
              className="mb-4"
            />
            <Button
              onClick={createTable}
              disabled={!newTableName.trim() || !newTableCols.trim()}
              fullWidth
              variant="ghost"
              style={{ background: ACCENT, color: 'var(--void)', fontWeight: 500 }}
            >
              Create table
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
