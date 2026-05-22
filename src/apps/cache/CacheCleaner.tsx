import { useState, useEffect, useCallback } from 'react'
import { Card, Button } from '../../components/ui'
import { emit } from '../../lib/eventBus'

interface CacheEntry {
  key: string
  size: number
  type: 'localStorage' | 'sessionStorage'
}

function getStorageEntries(storage: Storage, type: 'localStorage' | 'sessionStorage'): CacheEntry[] {
  const entries: CacheEntry[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (!key) continue
    const value = storage.getItem(key) || ''
    const size = new Blob([value]).size
    entries.push({ key, size, type })
  }
  return entries
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function CacheCleaner() {
  const [entries, setEntries] = useState<CacheEntry[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [freed, setFreed] = useState(0)
  const [loading, setLoading] = useState(true)

  const scan = useCallback(() => {
    setLoading(true)
    try {
      const ls = getStorageEntries(localStorage, 'localStorage')
      const ss = getStorageEntries(sessionStorage, 'sessionStorage')
      setEntries([...ls, ...ss])
      setSelected(new Set())
      setFreed(0)
    } catch (err) {
      console.error('Cache scan failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'cache' })
    scan()
  }, [scan])

  const toggleSelect = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const selectAll = () => {
    const allKeys = new Set(entries.map(e => e.key))
    setSelected(allKeys)
  }

  const clearSelected = () => {
    let bytesFreed = 0
    selected.forEach(key => {
      const entry = entries.find(e => e.key === key)
      if (!entry) return
      try {
        if (entry.type === 'localStorage') localStorage.removeItem(key)
        else sessionStorage.removeItem(key)
        bytesFreed += entry.size
      } catch { /* ignore */ }
    })
    setFreed(bytesFreed)
    emit({ type: 'CALCULATION_RESULT', expression: 'cache cleared', result: `${formatBytes(bytesFreed)} freed` })
    scan()
  }

  const clearAll = () => {
    let bytesFreed = 0
    entries.forEach(entry => {
      try {
        if (entry.type === 'localStorage') localStorage.removeItem(entry.key)
        else sessionStorage.removeItem(entry.key)
        bytesFreed += entry.size
      } catch { /* ignore */ }
    })
    setFreed(bytesFreed)
    emit({ type: 'CALCULATION_RESULT', expression: 'cache cleared', result: `${formatBytes(bytesFreed)} freed` })
    scan()
  }

  const totalSize = entries.reduce((sum, e) => sum + e.size, 0)

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-48" />
          <div className="h-40 bg-white/10 rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cache Cleaner</h1>
        <Button onClick={scan} className="text-sm bg-white/10 hover:bg-white/20">⟳ Rescan</Button>
      </div>

      {freed > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300">
          ✓ Freed {formatBytes(freed)}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-white/60">
          {entries.length} entries · {formatBytes(totalSize)} total · {selected.size} selected
        </div>
        <div className="flex gap-2">
          <Button onClick={selectAll} className="text-xs bg-white/10">Select All</Button>
          <Button onClick={clearSelected} className="text-xs bg-yellow-600 hover:bg-yellow-500" >
            Clear Selected
          </Button>
          <Button onClick={clearAll} className="text-xs bg-red-600 hover:bg-red-500">
            Clear All
          </Button>
        </div>
      </div>

      <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
        {entries.length === 0 ? (
          <div className="text-center py-12 text-white/40">No cache entries found</div>
        ) : (
          entries.map(entry => (
            <label
              key={entry.key}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selected.has(entry.key)}
                onChange={() => toggleSelect(entry.key)}
                className="w-4 h-4 accent-purple-500"
              />
              <span className={`text-xs px-1.5 py-0.5 rounded ${entry.type === 'localStorage' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                {entry.type === 'localStorage' ? 'LS' : 'SS'}
              </span>
              <span className="flex-1 text-sm truncate group-hover:text-white">{entry.key}</span>
              <span className="text-xs text-white/40">{formatBytes(entry.size)}</span>
            </label>
          ))
        )}
      </div>
    </Card>
  )
}
