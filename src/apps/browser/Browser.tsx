/**
 * Web Browser — connected to the Empire eventBus
 * URL navigation, bookmarks, history, and Cakra integration.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, Bookmark, History, Bot, ExternalLink, Trash2, Star, Search } from 'lucide-react'
import { Button, IconButton, Input, Segmented } from '../../components/ui'
import { EmptyState } from '../../components/ui/Utility'
import { emit } from '../../lib/eventBus'

const DEFAULT_BOOKMARKS = [
  { name: 'Google', url: 'https://www.google.com' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'OpenRouter', url: 'https://openrouter.ai' },
  { name: 'DeepSeek', url: 'https://chat.deepseek.com' },
]

export default function Browser() {
  const routerNavigate = useNavigate()
  const [url, setUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'browse' | 'bookmarks' | 'history'>('browse')
  const [bookmarks, setBookmarks] = useState(DEFAULT_BOOKMARKS)
  const [history, setHistory] = useState<{ url: string; time: string; id: string }[]>([])

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'browser' })
    try {
      const b = localStorage.getItem('empire-browser-bookmarks')
      if (b) setBookmarks(JSON.parse(b))
      const h = localStorage.getItem('empire-browser-history')
      if (h) setHistory(JSON.parse(h))
    } catch { /* ignore */ }
  }, [])

  const navigate = (targetUrl: string) => {
    const normalized = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`
    setUrl(normalized)
    const entry = { url: normalized, time: new Date().toISOString(), id: Date.now().toString() }
    const newHistory = [entry, ...history].slice(0, 50)
    setHistory(newHistory)
    localStorage.setItem('empire-browser-history', JSON.stringify(newHistory))
    emit({ type: 'FILE_OPENED', filePath: normalized })
  }

  const addBookmark = () => {
    if (!url.trim()) return
    const name = url.replace(/https?:\/\//, '').split('/')[0] || url
    if (bookmarks.find(b => b.url === url)) return
    const updated = [...bookmarks, { name, url }]
    setBookmarks(updated)
    localStorage.setItem('empire-browser-bookmarks', JSON.stringify(updated))
  }

  const removeBookmark = (urlToRemove: string) => {
    const updated = bookmarks.filter(b => b.url !== urlToRemove)
    setBookmarks(updated)
    localStorage.setItem('empire-browser-bookmarks', JSON.stringify(updated))
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('empire-browser-history')
  }

  const askCakra = () => {
    if (!url.trim()) return
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `URL: ${url}\n\nI want to know about this page or have Cakra analyze this website.`,
      title: `Browser: ${url}`,
      from: 'browser',
    }))
    routerNavigate('/app/ai-chat')
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="w-6 h-6 text-signal" /> Browser
        </h1>
        <Segmented
          value={activeTab}
          onChange={v => setActiveTab(v as 'browse' | 'bookmarks' | 'history')}
          ariaLabel="Browser section"
          items={[
            { value: 'browse', label: 'Browse', icon: <Globe className="w-3 h-3" /> },
            { value: 'bookmarks', label: 'Bookmarks', icon: <Bookmark className="w-3 h-3" /> },
            { value: 'history', label: 'History', icon: <History className="w-3 h-3" /> },
          ]}
        />
      </div>

      {/* URL bar */}
      <div className="flex gap-2 items-center">
        <Input
          className="flex-1"
          value={url}
          onChange={setUrl}
          onKeyDown={e => { if (e.key === 'Enter') navigate(url) }}
          placeholder="Enter URL or search..."
          aria-label="URL or search query"
          icon={<Search className="w-4 h-4" />}
        />
        {url && (
          <IconButton
            onClick={addBookmark}
            aria-label="Bookmark this URL"
            icon={<Star className="w-4 h-4" />}
            style={{ color: 'var(--c-warn)' }}
          />
        )}
        <Button variant="primary" onClick={() => navigate(url)} disabled={!url.trim()} icon={<ExternalLink className="w-4 h-4" />}>
          Go
        </Button>
        <IconButton
          onClick={askCakra}
          aria-label="Ask Cakra about this URL"
          icon={<Bot className="w-5 h-5" />}
          style={{ color: 'var(--signal)' }}
        />
      </div>

      {/* Content */}
      {activeTab === 'browse' && (
        <div className="rounded-2xl border border-hair overflow-hidden" style={{ background: 'var(--card-bg)' }}>
          <div className="flex items-center justify-center h-48 text-faint">
            {url ? (
              <div className="text-center">
                <ExternalLink className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">External link ready to open</p>
                <p className="text-xs text-faint mt-1 font-mono">{url}</p>
                <div className="mt-3 inline-flex">
                  <Button variant="primary" onClick={() => window.open(url, '_blank')} icon={<ExternalLink className="w-4 h-4" />}>
                    Open in Browser
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Enter a URL above to navigate</p>
                <p className="text-xs text-faint mt-1">Or browse your bookmarks</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bookmarks' && (
        <div className="space-y-2">
          <h3 className="text-sm text-muted flex items-center gap-1">
            <Bookmark className="w-4 h-4" /> {bookmarks.length} Bookmarks
          </h3>
          {bookmarks.length === 0 ? (
            <EmptyState
              size="sm"
              icon={<Bookmark className="w-5 h-5" />}
              title="No bookmarks yet"
              description="Navigate to a URL and click the star to save."
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {bookmarks.map(b => (
                <div key={b.url} className="group flex items-center gap-2 p-3 rounded-xl border border-hair hover:border-signal/30 transition-all cursor-pointer"
                  style={{ background: 'var(--card-bg)' }}
                  onClick={() => { navigate(b.url); setActiveTab('browse') }}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ion to-ion flex items-center justify-center text-fg text-xs font-bold">
                    {b.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{b.name}</div>
                    <div className="text-xs text-faint truncate">{b.url}</div>
                  </div>
                  <IconButton
                    onClick={e => { e.stopPropagation(); removeBookmark(b.url) }}
                    aria-label={`Remove bookmark ${b.name}`}
                    size="sm"
                    className="opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                    icon={<Trash2 className="w-3 h-3" />}
                    style={{ color: 'var(--c-danger)' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-muted flex items-center gap-1">
              <History className="w-4 h-4" /> {history.length} entries
            </h3>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory} icon={<Trash2 className="w-3 h-3" />} style={{ color: 'var(--c-danger)' }}>
                Clear All
              </Button>
            )}
          </div>
          {history.length === 0 ? (
            <EmptyState
              size="sm"
              icon={<History className="w-5 h-5" />}
              title="No browsing history yet"
              description="Pages you visit will appear here."
            />
          ) : (
            <div className="space-y-1">
              {history.slice(0, 30).map((h) => (
              <div key={h.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-glass cursor-pointer"
                  onClick={() => { navigate(h.url); setActiveTab('browse') }}>
                  <Globe className="w-3.5 h-3.5 text-faint flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{h.url}</div>
                    <div className="text-xs text-faint">{formatTime(h.time)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}