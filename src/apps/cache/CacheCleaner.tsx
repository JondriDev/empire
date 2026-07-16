import { useState, useEffect, useCallback } from 'react'
import { Database } from 'lucide-react'
import { Card, Button } from '../../components/ui'
import { EmptyState } from '../../components/ui/Utility'
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

type PendingClear = 'all' | 'selected' | null

export default function CacheCleaner() {
  const [entries, setEntries] = useState<CacheEntry[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [freed, setFreed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<PendingClear>(null)

  const scan = useCallback(() => {
    setLoading(true)
    try {
      const ls = getStorageEntries(localStorage, 'localStorage')
      const ss = getStorageEntries(sessionStorage, 'sessionStorage')
      setEntries([...ls, ...ss])
      setSelected(new Set())
      setFreed(0)
      setPending(null)
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

  const removeEntries = (toRemove: CacheEntry[]) => {
    let bytesFreed = 0
    toRemove.forEach(entry => {
      try {
        if (entry.type === 'localStorage') localStorage.removeItem(entry.key)
        else sessionStorage.removeItem(entry.key)
        bytesFreed += entry.size
      } catch { /* ignore */ }
    })
    // Refresh the list in place — NOT via scan(), which resets `freed` to 0 and
    // would blow away the "Freed X" confirmation we're about to show.
    const ls = getStorageEntries(localStorage, 'localStorage')
    const ss = getStorageEntries(sessionStorage, 'sessionStorage')
    setEntries([...ls, ...ss])
    setSelected(new Set())
    setPending(null)
    setFreed(bytesFreed)
    emit({ type: 'CALCULATION_RESULT', expression: 'cache cleared', result: `${formatBytes(bytesFreed)} freed` })
  }

  // Clearing is irreversible and wipes every app's saved data, so both destructive
  // actions arm a confirmation first; the second tap (Delete forever) executes.
  const confirmClear = () => {
    if (pending === 'selected') {
      removeEntries(entries.filter(e => selected.has(e.key)))
    } else if (pending === 'all') {
      removeEntries(entries)
    }
  }

  const totalSize = entries.reduce((sum, e) => sum + e.size, 0)
  const pendingEntries = pending === 'selected'
    ? entries.filter(e => selected.has(e.key))
    : pending === 'all'
      ? entries
      : []
  const pendingBytes = pendingEntries.reduce((sum, e) => sum + e.size, 0)

  if (loading) {
    return (
      <Card className="p-6" role="status" aria-label="Scanning cache">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-glass rounded w-48" />
          <div className="h-40 bg-glass rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cache Cleaner</h1>
        <Button onClick={scan} aria-label="Rescan cache" className="text-sm bg-glass hover:bg-glass">
          <span aria-hidden="true">⟳</span> Rescan
        </Button>
      </div>

      {freed > 0 && (
        <div role="status" className="mb-4 p-3 rounded-lg bg-success/20 border border-success/30 text-success">
          <span aria-hidden="true">✓</span> Freed {formatBytes(freed)}
        </div>
      )}

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="text-sm text-muted" aria-live="polite">
          {entries.length} entries · {formatBytes(totalSize)} total · {selected.size} selected
        </div>
        <div className="flex gap-2">
          <Button onClick={selectAll} disabled={entries.length === 0} className="text-xs bg-glass">Select All</Button>
          <Button
            onClick={() => setPending('selected')}
            disabled={selected.size === 0}
            className="text-xs bg-warn hover:bg-warn"
          >
            Clear Selected
          </Button>
          <Button
            onClick={() => setPending('all')}
            disabled={entries.length === 0}
            className="text-xs bg-danger hover:bg-danger"
          >
            Clear All
          </Button>
        </div>
      </div>

      {pending && (
        <div
          role="alertdialog"
          aria-label="Confirm cache deletion"
          className="mb-4 p-4 rounded-lg bg-danger/15 border border-danger/40"
        >
          <p className="text-sm text-fg mb-3">
            Delete {pendingEntries.length} {pendingEntries.length === 1 ? 'entry' : 'entries'}
            {' '}({formatBytes(pendingBytes)})? This clears saved app data and can't be undone.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => setPending(null)} className="text-xs bg-glass">Cancel</Button>
            <Button onClick={confirmClear} className="text-xs bg-danger hover:bg-danger">
              Delete forever
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
        {entries.length === 0 ? (
          <EmptyState
            icon={<Database className="w-6 h-6" aria-hidden="true" />}
            title="Nothing cached"
            description="Storage is clean — no local or session entries to clear right now."
          />
        ) : (
          entries.map(entry => (
            <label
              key={entry.key}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-glass cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selected.has(entry.key)}
                onChange={() => toggleSelect(entry.key)}
                className="w-4 h-4 accent-signal"
              />
              <span className={`text-xs px-1.5 py-0.5 rounded ${entry.type === 'localStorage' ? 'bg-ion/20 text-ion' : 'bg-signal/20 text-signal'}`}>
                {entry.type === 'localStorage' ? 'LS' : 'SS'}
              </span>
              <span className="flex-1 text-sm truncate group-hover:text-fg">{entry.key}</span>
              <span className="text-xs text-faint">{formatBytes(entry.size)}</span>
            </label>
          ))
        )}
      </div>
    </Card>
  )
}
