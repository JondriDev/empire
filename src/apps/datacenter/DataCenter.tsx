/**
 * Data Center — real tables via server API + eventBus
 * Ask Hermes to analyze data, generate reports, or explain patterns.
 */

import { useState, useEffect } from 'react'
import { Bot, Plus, Trash2, RefreshCw, Table2 } from 'lucide-react'
import { emit } from '../../lib/eventBus'

interface TableRow { id: number; [key: string]: string | number | boolean | null }

const SERVER = 'http://localhost:3001'

export default function DataCenter() {
  const [tables, setTables] = useState<string[]>([])
  const [activeTable, setActiveTable] = useState<string>('users')
  const [rows, setRows] = useState<TableRow[]>([])
  const [loading, setLoading] = useState(false)
  const [newRow, setNewRow] = useState<Record<string, string>>({})

  // Emit APP_OPENED for activity feed tracking
 useEffect(() => {
 emit({ type: 'APP_OPENED', appId: 'datacenter' })
 }, [])

 useEffect(() => { loadTables() }, [])

  const loadTables = async () => {
    try {
      const res = await fetch(`${SERVER}/api/dc/tables`)
      const data = await res.json()
      if (Array.isArray(data)) setTables(data)
    } catch { /* server may not be running */ }
  }

  useEffect(() => {
    if (activeTable) loadRows(activeTable)
  }, [activeTable])

  const loadRows = async (table: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${SERVER}/api/dc/table/${table}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setRows(data)
        emit({ type: 'DATA_TABLE_UPDATED', tableName: table, rowCount: data.length })
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const addRow = async () => {
    try {
      const body: Record<string, string | number | boolean | null> = {}
      const firstRow = rows[0]
      if (firstRow) {
        Object.keys(firstRow).forEach(k => { if (k !== 'id') body[k] = newRow[k] || '' })
      }
      await fetch(`${SERVER}/api/dc/table/${activeTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setNewRow({})
      loadRows(activeTable)
    } catch { /* ignore */ }
  }

  const deleteRow = async (id: number) => {
    try {
      await fetch(`${SERVER}/api/dc/table/${activeTable}/${id}`, { method: 'DELETE' })
      emit({ type: 'DATA_TABLE_UPDATED', tableName: activeTable, rowCount: rows.length - 1 })
      loadRows(activeTable)
    } catch { /* ignore */ }
  }

  const askHermes = () => {
    const tableData = rows.slice(0, 10).map(r => JSON.stringify(r)).join('\n')
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `Data from **${activeTable}** table:\n\n${tableData}${rows.length > 10 ? `\n... and ${rows.length - 10} more rows` : ''}`,
      title: `${activeTable} data analysis`,
      from: 'datacenter',
    }))
    window.location.href = '/app/ai-chat'
  }

  const columns = rows[0] ? Object.keys(rows[0]).filter(k => k !== 'id' && k !== 'created') : []

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div className="w-56 border-r flex flex-col" style={{ borderColor: 'var(--border)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-base font-bold flex items-center gap-2"><Table2 className="w-4 h-4" /> Data Center</h1>
          <p className="text-xs text-gray-400 mt-0.5">{rows.length} rows · {activeTable}</p>
        </div>
        <div className="flex-1 overflow-auto">
          <button onClick={askHermes} className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-cyan-500/10 text-cyan-300 text-sm border-b" style={{ borderColor: 'var(--border)' }}>
            <Bot className="w-3.5 h-3.5" /> Ask Hermes
          </button>
          {tables.map(t => (
            <button
              key={t}
              onClick={() => setActiveTable(t)}
              className={`w-full px-4 py-2.5 text-left text-sm capitalize transition-colors border-b ${activeTable === t ? 'bg-cyan-500/10 text-cyan-200' : 'hover:bg-white/5 text-gray-300'}`}
              style={{ borderColor: 'var(--border)' }}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={loadTables} className="p-3 text-xs text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1 border-t" style={{ borderColor: 'var(--border)' }}>
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <Table2 className="w-4 h-4 text-cyan-300" />
            <span className="font-semibold capitalize">{activeTable}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{rows.length} rows</span>
          </div>
          <button onClick={askHermes} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-200 text-xs hover:bg-cyan-500/30 transition-colors">
            <Bot className="w-3.5 h-3.5" /> Analyze with Hermes
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
 {loading ? (
 <div className="text-center py-12 text-white/40">
 <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full mx-auto mb-2" />
 Loading...
 </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12">
              <Table2 className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-500 text-sm">No data yet. Add a row below.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    {columns.map(col => (
                      <th key={col} className="text-left px-3 py-2 text-xs text-gray-400 font-medium uppercase">{col}</th>
                    ))}
                    <th className="text-right px-3 py-2">
                      <button onClick={addRow} className="text-cyan-300 hover:text-cyan-200 text-xs flex items-center gap-1 ml-auto">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className="border-b hover:bg-white/3 transition-colors" style={{ borderColor: 'var(--border)' }}>
                      {columns.map(col => (
                        <td key={col} className="px-3 py-2.5 text-gray-300">{String(row[col] ?? '—')}</td>
                      ))}
                      <td className="px-3 py-2.5 text-right">
                        <button onClick={() => deleteRow(row.id)} className="text-red-400/50 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}