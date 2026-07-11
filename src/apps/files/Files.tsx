import { useState, useEffect, useRef } from 'react'
import { Card, Button } from '../../components/ui'
import { emit } from '../../lib/eventBus'
import { apiUrl } from '../../lib/apiBase'
import { mirrorCollection } from '../../lib/core/sync'
import { NodeActions } from '../../components/ui/NodeActions'
import { accumulateFiles, fileNodeData, type AccumulatedFile } from './filesGraph'
import {
  Folder, FolderOpen, File, FileText, Image, Film, Music,
  Code, Archive, ChevronRight, ChevronDown, Download,
  Home, RefreshCw, Eye,
  X
} from 'lucide-react'

interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: string
  extension: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getIcon(entry: FileEntry, open?: boolean) {
  if (entry.isDirectory) return open ? <FolderOpen className="w-4 h-4 text-warn" /> : <Folder className="w-4 h-4 text-warn" />
  const ext = entry.extension.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return <Image className="w-4 h-4 text-success" />
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) return <Music className="w-4 h-4 text-danger" />
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return <Film className="w-4 h-4 text-signal" />
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return <Archive className="w-4 h-4 text-ember" />
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'rs', 'go', 'java', 'c', 'cpp', 'h'].includes(ext)) return <Code className="w-4 h-4 text-ion" />
  if (['json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg'].includes(ext)) return <Code className="w-4 h-4 text-signal" />
  if (['txt', 'md', 'log', 'readme'].includes(ext)) return <FileText className="w-4 h-4 text-muted" />
  return <File className="w-4 h-4 text-muted" />
}

const QUICK_PATHS = [
  { label: 'Internal Storage', path: '/storage/emulated/0' },
  { label: 'Documents', path: '/storage/emulated/0/Documents' },
  { label: 'Pictures', path: '/storage/emulated/0/Pictures' },
  { label: 'Downloads', path: '/storage/emulated/0/Download' },
  { label: 'Music', path: '/storage/emulated/0/Music' },
  { label: 'Movies', path: '/storage/emulated/0/Movies' },
]

export default function Files() {
  const [path, setPath] = useState('/storage/emulated/0')
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [previewContent, setPreviewContent] = useState<{ name: string; content: string } | null>(null)
  const [viewMode] = useState<'list' | 'grid'>('list')
  const [breadcrumb, setBreadcrumb] = useState<string[]>([])

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'files' })
    loadDirectory(path)
  }, [path])

  useEffect(() => {
    setBreadcrumb(path.split('/').filter(Boolean))
  }, [path])

  // Mirror files into the Core graph as `file` nodes so they join the organism.
  // The browser shows one directory at a time, but `mirrorCollection` prunes any
  // node not in its batch — so mirroring only the current folder would drop every
  // file the moment you navigate away. Instead we accumulate the union of all
  // files seen across this session (keyed by path) and mirror the whole union, so
  // navigating ADDS to the graph. Held in a ref → bounded to one session and
  // self-cleaning on reload (a fresh mount prunes stale nodes on its first pass).
  const seenFiles = useRef<Map<string, AccumulatedFile>>(new Map())
  useEffect(() => {
    seenFiles.current = accumulateFiles(seenFiles.current, entries)
    mirrorCollection('file', 'files', [...seenFiles.current.values()], {
      id: f => f.path,
      title: f => f.name,
      data: fileNodeData,
    })
  }, [entries])

  const loadDirectory = async (dirPath: string) => {
    setLoading(true)
    setError('')
    setSelected(null)
    try {
      const res = await fetch(apiUrl(`/api/files?path=${encodeURIComponent(dirPath)}`))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.files) throw new Error('Invalid response')
      const sorted = data.files.sort((a: FileEntry, b: FileEntry) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      setEntries(sorted)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  const navigateTo = (newPath: string) => setPath(newPath)

  const navigateUp = () => {
    const parts = path.split('/').filter(Boolean)
    if (parts.length <= 1) return
    parts.pop()
    navigateTo('/' + parts.join('/'))
  }

  const toggleDir = (dirPath: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      next.has(dirPath) ? next.delete(dirPath) : next.add(dirPath)
      return next
    })
  }

  const openFile = async (entry: FileEntry) => {
    if (entry.isDirectory) {
      navigateTo(entry.path)
      return
    }
    setSelected(entry.name)
    emit({ type: 'FILE_OPENED', filePath: entry.path })

    // Try to preview text files
    const textExts = ['txt', 'md', 'json', 'xml', 'yaml', 'yml', 'js', 'ts', 'tsx', 'py', 'html', 'css', 'log', 'ini', 'cfg', 'toml', 'env']
    if (textExts.includes(entry.extension.toLowerCase())) {
      try {
        const res = await fetch(apiUrl(`/api/file/download?path=${encodeURIComponent(entry.path)}`))
        if (res.ok) {
          const text = await res.text()
          setPreviewContent({ name: entry.name, content: text.slice(0, 5000) })
        }
      } catch { /* ignore preview errors */ }
    }
  }

  const downloadFile = async (entry: FileEntry) => {
    window.open(apiUrl(`/api/file/download?path=${encodeURIComponent(entry.path)}`), '_blank')
  }

  const filtered = entries.filter(e =>
    !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const atHome = path === '/storage/emulated/0'

  return (
    <div className="space-y-3">
      {/* Header */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Folder className="w-5 h-5" aria-hidden="true" /> File Browser
          </h1>
          <Button onClick={() => loadDirectory(path)} aria-label="Refresh directory" className="text-sm bg-glass hover:bg-glass ml-auto">
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button onClick={navigateUp} disabled={atHome} aria-label="Go up one folder" className="text-sm bg-glass hover:bg-glass">
            <span aria-hidden="true">↑</span> Up
          </Button>
          <button onClick={() => navigateTo('/storage/emulated/0')} aria-label="Go to internal storage" className="text-sm text-faint hover:text-fg">
            <Home className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Breadcrumb */}
        <nav aria-label="Folder path" className="flex items-center gap-1 text-sm text-muted mb-2 overflow-x-auto">
          <button onClick={() => navigateTo('/storage/emulated/0')} className="hover:text-fg flex-shrink-0">storage</button>
          {breadcrumb.map((part, i) => (
            <span key={i} className="flex items-center gap-1 flex-shrink-0">
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
              <button
                onClick={() => navigateTo('/' + breadcrumb.slice(0, i + 1).join('/'))}
                aria-current={i === breadcrumb.length - 1 ? 'page' : undefined}
                className="hover:text-fg"
              >
                {part}
              </button>
            </span>
          ))}
        </nav>

        {/* Quick paths */}
        <div className="flex gap-1 flex-wrap mb-2">
          {QUICK_PATHS.map(qp => (
            <button key={qp.path} onClick={() => navigateTo(qp.path)} aria-pressed={path === qp.path} className={`text-xs px-2 py-1 rounded ${path === qp.path ? 'bg-signal/40 text-signal' : 'bg-glass text-muted hover:bg-glass'}`}>
              {qp.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search files..."
          aria-label="Search files in this folder"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-glass border-0 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-signal/50"
        />
      </Card>

      {/* Path display */}
      <div className="text-xs text-faint px-1 font-mono">{path}</div>

      {/* Content */}
      {loading ? (
      <Card className="p-8 text-center text-faint" role="status">
      <div className="animate-spin w-6 h-6 border-2 border-hair border-t-white/60 rounded-full mx-auto mb-3" aria-hidden="true" />
      <p className="text-sm">Scanning directory…</p>
      </Card>
      ) : error ? (
        <Card className="p-6 text-center" role="alert">
          <p className="text-danger mb-2">Failed to load directory</p>
          <p className="text-sm text-faint">{error}</p>
          <Button onClick={() => loadDirectory(path)} className="mt-3 text-sm bg-glass hover:bg-glass">Retry</Button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-faint">
          <Folder className="w-12 h-12 mx-auto mb-2 opacity-20" aria-hidden="true" />
          <p>{searchQuery ? 'No files match your search' : 'This folder is empty'}</p>
        </Card>
      ) : viewMode === 'list' ? (
        <Card className="p-2">
          {filtered.map(entry => (
            <div
              key={entry.path}
              onClick={() => openFile(entry)}
              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer group transition ${selected === entry.name ? 'bg-signal/20' : 'hover:bg-glass'}`}
            >
              {entry.isDirectory ? (
                <button
                  onClick={e => { e.stopPropagation(); toggleDir(entry.path) }}
                  aria-label={expandedDirs.has(entry.path) ? `Collapse ${entry.name}` : `Expand ${entry.name}`}
                  aria-expanded={expandedDirs.has(entry.path)}
                  className="text-faint hover:text-fg"
                >
                  {expandedDirs.has(entry.path) ? <ChevronDown className="w-3 h-3" aria-hidden="true" /> : <ChevronRight className="w-3 h-3" aria-hidden="true" />}
                </button>
              ) : <span className="w-3" />}
              {getIcon(entry, expandedDirs.has(entry.path))}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{entry.name}</p>
                <p className="text-xs text-faint">
                  {entry.isDirectory ? 'Folder' : formatBytes(entry.size)} · {new Date(entry.modified).toLocaleDateString()}
                </p>
              </div>
              {!entry.isDirectory && (
                <div className="flex gap-1 items-center opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <NodeActions type="file" sourceId={entry.path} />
                  <button onClick={e => { e.stopPropagation(); downloadFile(entry) }} aria-label={`Download ${entry.name}`} className="p-1.5 text-faint hover:text-fg">
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setPreviewContent(null); openFile(entry) }} aria-label={`Preview ${entry.name}`} className="p-1.5 text-faint hover:text-fg">
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </Card>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {filtered.map(entry => (
            <div
              key={entry.path}
              onClick={() => openFile(entry)}
              className={`p-3 rounded-lg cursor-pointer text-center group transition ${selected === entry.name ? 'bg-signal/20' : 'hover:bg-glass'}`}
            >
              <div className="text-3xl mb-1">{entry.isDirectory ? '📁' : '📄'}</div>
              <p className="text-xs truncate">{entry.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {previewContent && (
        <Card className="p-4" role="region" aria-label={`Preview of ${previewContent.name}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" aria-hidden="true" /> {previewContent.name}
            </h3>
            <Button onClick={() => setPreviewContent(null)} aria-label="Close preview" className="text-xs bg-glass hover:bg-glass">
              <X className="w-3 h-3" aria-hidden="true" /> Close
            </Button>
          </div>
          <pre className="text-xs bg-void/30 rounded p-3 overflow-x-auto max-h-64 whitespace-pre-wrap font-mono text-muted">
            {previewContent.content}
          </pre>
        </Card>
      )}
    </div>
  )
}