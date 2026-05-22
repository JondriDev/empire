import { useState, useEffect, useRef } from 'react'
import { Card, Button } from '../../components/ui'
import { emit } from '../../lib/eventBus'
import {
  Folder, FolderOpen, File, FileText, Image, Film, Music,
  Code, Archive, ChevronRight, ChevronDown, Upload, Download,
  Trash2, Home, Info, Search, RefreshCw, Eye, Edit3,
  Copy, ExternalLink, X
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
  if (entry.isDirectory) return open ? <FolderOpen className="w-4 h-4 text-yellow-400" /> : <Folder className="w-4 h-4 text-yellow-400" />
  const ext = entry.extension.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return <Image className="w-4 h-4 text-green-400" />
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) return <Music className="w-4 h-4 text-pink-400" />
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return <Film className="w-4 h-4 text-purple-400" />
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return <Archive className="w-4 h-4 text-orange-400" />
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'rs', 'go', 'java', 'c', 'cpp', 'h'].includes(ext)) return <Code className="w-4 h-4 text-blue-400" />
  if (['json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg'].includes(ext)) return <Code className="w-4 h-4 text-cyan-400" />
  if (['txt', 'md', 'log', 'readme'].includes(ext)) return <FileText className="w-4 h-4 text-gray-400" />
  return <File className="w-4 h-4 text-gray-400" />
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [breadcrumb, setBreadcrumb] = useState<string[]>([])

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'files' })
    loadDirectory(path)
  }, [path])

  useEffect(() => {
    setBreadcrumb(path.split('/').filter(Boolean))
  }, [path])

  const loadDirectory = async (dirPath: string) => {
    setLoading(true)
    setError('')
    setSelected(null)
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(dirPath)}`)
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
        const res = await fetch(`/api/file/download?path=${encodeURIComponent(entry.path)}`)
        if (res.ok) {
          const text = await res.text()
          setPreviewContent({ name: entry.name, content: text.slice(0, 5000) })
        }
      } catch { /* ignore preview errors */ }
    }
  }

  const downloadFile = async (entry: FileEntry) => {
    window.open(`/api/file/download?path=${encodeURIComponent(entry.path)}`, '_blank')
  }

  const filtered = entries.filter(e =>
    !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-3">
      {/* Header */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Folder className="w-5 h-5" /> File Browser
          </h1>
          <Button onClick={() => loadDirectory(path)} className="text-sm bg-white/10 hover:bg-white/20 ml-auto">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={navigateUp} className={`text-sm bg-white/10 hover:bg-white/20 ${path === '/storage/emulated/0' ? 'opacity-30 cursor-not-allowed' : ''}`}>
            ↑ Up
          </Button>
          <button onClick={() => navigateTo('/storage/emulated/0')} className="text-sm text-white/40 hover:text-white">
            <Home className="w-5 h-5" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-white/60 mb-2 overflow-x-auto">
          <button onClick={() => navigateTo('/storage/emulated/0')} className="hover:text-white flex-shrink-0">storage</button>
          {breadcrumb.map((part, i) => (
            <span key={i} className="flex items-center gap-1 flex-shrink-0">
              <ChevronRight className="w-3 h-3" />
              <button onClick={() => navigateTo('/' + breadcrumb.slice(0, i + 1).join('/'))} className="hover:text-white">
                {part}
              </button>
            </span>
          ))}
        </div>

        {/* Quick paths */}
        <div className="flex gap-1 flex-wrap mb-2">
          {QUICK_PATHS.map(qp => (
            <button key={qp.path} onClick={() => navigateTo(qp.path)} className={`text-xs px-2 py-1 rounded ${path === qp.path ? 'bg-purple-600/40 text-purple-200' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
              {qp.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white/10 border-0 rounded px-3 py-1.5 text-sm"
        />
      </Card>

      {/* Path display */}
      <div className="text-xs text-white/30 px-1 font-mono">{path}</div>

      {/* Content */}
      {loading ? (
        <Card className="p-8 text-center text-white/40">
          <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full mx-auto mb-2" />
          Loading...
        </Card>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-red-400 mb-2">Failed to load directory</p>
          <p className="text-sm text-white/40">{error}</p>
          <Button onClick={() => loadDirectory(path)} className="mt-3 text-sm bg-white/10 hover:bg-white/20">Retry</Button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-white/40">
          <Folder className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>Empty or no matches</p>
        </Card>
      ) : viewMode === 'list' ? (
        <Card className="p-2">
          {filtered.map(entry => (
            <div
              key={entry.path}
              onClick={() => openFile(entry)}
              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer group transition ${selected === entry.name ? 'bg-purple-600/20' : 'hover:bg-white/5'}`}
            >
              {entry.isDirectory ? (
                <button onClick={e => { e.stopPropagation(); toggleDir(entry.path) }} className="text-white/30 hover:text-white">
                  {expandedDirs.has(entry.path) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              ) : <span className="w-3" />}
              {getIcon(entry, expandedDirs.has(entry.path))}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{entry.name}</p>
                <p className="text-xs text-white/30">
                  {entry.isDirectory ? 'Folder' : formatBytes(entry.size)} · {new Date(entry.modified).toLocaleDateString()}
                </p>
              </div>
              {!entry.isDirectory && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={e => { e.stopPropagation(); downloadFile(entry) }} className="p-1.5 text-white/40 hover:text-white">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setPreviewContent(null); openFile(entry) }} className="p-1.5 text-white/40 hover:text-white">
                    <Eye className="w-3.5 h-3.5" />
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
              className={`p-3 rounded-lg cursor-pointer text-center group transition ${selected === entry.name ? 'bg-purple-600/20' : 'hover:bg-white/5'}`}
            >
              <div className="text-3xl mb-1">{entry.isDirectory ? '📁' : '📄'}</div>
              <p className="text-xs truncate">{entry.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {previewContent && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" /> {previewContent.name}
            </h3>
            <Button onClick={() => setPreviewContent(null)} className="text-xs bg-white/10 hover:bg-white/20">
              <X className="w-3 h-3" /> Close
            </Button>
          </div>
          <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto max-h-64 whitespace-pre-wrap font-mono text-white/70">
            {previewContent.content}
          </pre>
        </Card>
      )}
    </div>
  )
}