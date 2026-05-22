/**
 * Web Browser — connected to the Empire eventBus
 * URL navigation, bookmarks, history, and Hermes integration.
 */

import { useState, useEffect } from 'react'
import { Globe, Bookmark, History, Bot, ExternalLink, RefreshCw, Trash2, Star, Search } from 'lucide-react'
import { Card, Button } from '../../components/ui'
import { emit } from '../../lib/eventBus'

const DEFAULT_BOOKMARKS = [
  { name: 'Google', url: 'https://www.google.com' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'OpenRouter', url: 'https://openrouter.ai' },
  { name: 'DeepSeek', url: 'https://chat.deepseek.com' },
]

export default function Browser() {
  const [url, setUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'browse' | 'bookmarks' | 'history'>('browse')
  const [bookmarks, setBookmarks] = useState(DEFAULT_BOOKMARKS)
  const [history, setHistory] = useState<{ url: string; time: string }[]>([])
  const [showHermes, setShowHermes] = useState(false)

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
    const entry = { url: normalized, time: new Date().toISOString() }
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

  const askHermes = () => {
    if (!url.trim()) return
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `URL: ${url}\n\nI want to know about this page or have Hermes analyze this website.`,
      title: `Browser: ${url}`,
      from: 'browser',
    }))
    window.location.href = '/app/ai-chat'
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
          <Globe className="w-6 h-6 text-purple-400" /> Browser
        </h1>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {(['browse', 'bookmarks', 'history'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${
                activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              {tab === 'browse' && <Globe className="w-3 h-3 inline mr-1" />}
              {tab === 'bookmarks' && <Bookmark className="w-3 h-3 inline mr-1" />}
              {tab === 'history' && <History className="w-3 h-3 inline mr-1" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* URL bar */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2" style={{ background: 'var(--card-bg)' }}>
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') navigate(url) }}
            placeholder="Enter URL or search..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: 'var(--text)' }}
          />
          {url && (
            <button onClick={addBookmark}
              className="p-1 rounded hover:bg-yellow-500/20 text-gray-500 hover:text-yellow-400 transition-colors"
              title="Bookmark this URL">
              <Star className="w-4 h-4" />
            </button>
          )}
        </div>
        <button onClick={() => navigate(url)}
          disabled={!url.trim()}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white text-sm transition-colors flex items-center gap-1">
          <ExternalLink className="w-4 h-4" /> Go
        </button>
        <button onClick={askHermes}
          className="p-2 rounded-xl hover:bg-purple-500/20 text-purple-400 transition-colors" title="Ask Hermes about this URL">
          <Bot className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      {activeTab === 'browse' && (
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'var(--card-bg)' }}>
          <div className="flex items-center justify-center h-48 text-gray-500">
            {url ? (
              <div className="text-center">
                <ExternalLink className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">External link ready to open</p>
                <p className="text-xs text-gray-600 mt-1 font-mono">{url}</p>
                <button
                  onClick={() => window.open(url, '_blank')}
                  className="mt-3 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm inline-flex items-center gap-1 transition-colors">
                  <ExternalLink className="w-4 h-4" /> Open in Browser
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Enter a URL above to navigate</p>
                <p className="text-xs text-gray-600 mt-1">Or browse your bookmarks</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bookmarks' && (
        <div className="space-y-2">
          <h3 className="text-sm text-gray-400 flex items-center gap-1">
            <Bookmark className="w-4 h-4" /> {bookmarks.length} Bookmarks
          </h3>
          {bookmarks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">No bookmarks yet. Navigate to a URL and click the star to save.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {bookmarks.map(b => (
                <div key={b.url} className="group flex items-center gap-2 p-3 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer"
                  style={{ background: 'var(--card-bg)' }}
                  onClick={() => { navigate(b.url); setActiveTab('browse') }}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    {b.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{b.name}</div>
                    <div className="text-xs text-gray-500 truncate">{b.url}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeBookmark(b.url) }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all">
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-gray-400 flex items-center gap-1">
              <History className="w-4 h-4" /> {history.length} entries
            </h3>
            {history.length > 0 && (
              <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Clear All
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">No browsing history yet.</div>
          ) : (
            <div className="space-y-1">
              {history.slice(0, 30).map((h, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                  onClick={() => { navigate(h.url); setActiveTab('browse') }}>
                  <Globe className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{h.url}</div>
                    <div className="text-xs text-gray-600">{formatTime(h.time)}</div>
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