/**
 * Empire Desktop — full-screen app shell (no windows).
 *
 * Layers (bottom to top):
 *  0. background wash (planetary --grad)
 *  1. home launcher (the app grid) — revealed when no app is active
 *  2. AppHost — the active app, full-bleed
 *  3. context menu / search palette / recents switcher
 *  4. HomeBar (always on top): Home · Recents · Search · Theme · Lang · Clock
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useWindowStore, openAppById } from '../lib/windowStore'
import { apps, launcherApps, getAppIcon } from '../lib/registry'
import { useStore } from '../lib/store'
import { useLang } from '../lib/i18n'
import AppHost from './AppHost'
import Bridge from './Bridge'
import Recents from './Recents'
import ContextMenu from './ContextMenu'
import CommandPalette from './CommandPalette'
import { ToastViewport } from './ui/Toast'
import {
  Search, Sun, Moon, House, LayoutGrid,
  ArrowUp, ArrowDown, CornerDownLeft,
} from 'lucide-react'
import { tint } from '../design-system/tokens'

export default function Desktop() {
  const { theme, toggleTheme } = useStore()
  const { t, lang, toggleLang } = useLang()
  const appLabel = useCallback((a: typeof apps[number]) => t(`app.${a.id}.name`, a.name), [t])

  const windows = useWindowStore(s => s.windows)
  const activeWindowId = useWindowStore(s => s.activeWindowId)
  const goHome = useWindowStore(s => s.goHome)

  const [showSearch, setShowSearch] = useState(false)
  const [showRecents, setShowRecents] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSelected, setSearchSelected] = useState(0)
  const [clock, setClock] = useState(new Date())
  const searchInputRef = useRef<HTMLInputElement>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)

  // Restore focus when the palette closes (WCAG 2.4.3 focus order).
  useEffect(() => {
    if (!showSearch && prevFocusRef.current) {
      prevFocusRef.current.focus?.()
      prevFocusRef.current = null
    }
  }, [showSearch])

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Ctrl+Space → app launcher search · ⌘/Ctrl+Shift+F → summon global entity
  // Search (distinct from ⌘K's focused-node palette) · Escape → close overlays
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault()
        setShowSearch(v => {
          if (!v) prevFocusRef.current = document.activeElement as HTMLElement
          return !v
        })
        setSearchQuery('')
        setSearchSelected(0)
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        // Open the Search app full-screen and (re)focus its field from anywhere.
        e.preventDefault()
        openAppById('search')
        window.dispatchEvent(new CustomEvent('empire:summon-search'))
      }
      if (e.key === 'Escape') {
        if (showSearch) { setShowSearch(false); return }
        if (showRecents) { setShowRecents(false); return }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showSearch, showRecents])

  const handleAppOpen = useCallback((appId: string) => {
    openAppById(appId) // resolves merge-aliases (e.g. editor → Cakra tab)
    setShowSearch(false)
    setShowRecents(false)
  }, [])

  // Search across every app (incl. merged tools), not just launcher tiles.
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return launcherApps
    const pool = apps.filter(a => !a.hidden || a.aliasOf)
    const q = searchQuery.toLowerCase()
    return pool.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q)
    )
  }, [searchQuery])

  useEffect(() => { setSearchSelected(0) }, [searchQuery])

  const isLight = theme === 'light'
  const atHome = !activeWindowId

  return (
    <div className="empire-desktop" style={{ color: 'var(--text)' }}>
      {/* Layer 0 — planetary background wash */}
      <div className="empire-desktop-bg starfield" aria-hidden="true" />

      {/* Layer 1 — home: The Bridge (living telemetry) over the app grid */}
      <div className="empire-launcher" aria-hidden={!atHome}>
        <div className="empire-home-wrap">
          <Bridge />
          <div className="empire-app-grid">
            {launcherApps.map((app, i) => {
              const Icon = getAppIcon(app.icon)
              const isRunning = windows.some(w => w.appId === app.id)
              return (
                <button
                  key={app.id}
                  className="empire-desktop-icon app-card"
                  style={{ ['--app-color' as string]: app.color, animationDelay: `${Math.min(i * 35, 700)}ms` }}
                  onClick={() => handleAppOpen(app.id)}
                  title={app.description || app.name}
                  aria-label={appLabel(app)}
                >
                  <div className="empire-desktop-icon-img app-icon" style={{ background: `${app.color}15` }}>
                    <Icon className="w-7 h-7" style={{ color: app.color }} />
                    {isRunning && (
                      <span
                        aria-label="Running"
                        style={{
                          position: 'absolute', bottom: 3, right: 3, width: 7, height: 7,
                          borderRadius: '50%', background: app.color,
                          boxShadow: `0 0 8px ${app.color}, 0 0 0 1.5px ${tint('void', 60)}`,
                        }}
                      />
                    )}
                  </div>
                  <span className="empire-desktop-icon-label">{appLabel(app)}</span>
                </button>
              )
            })}
            </div>
        </div>
      </div>

      {/* Layer 2 — the active app, full-bleed */}
      <AppHost onRecents={() => setShowRecents(true)} />

      {/* Layer 3 — overlays */}
      <ContextMenu />
      <Recents open={showRecents} onClose={() => setShowRecents(false)} />

      {showSearch && (
        <div className="empire-search-overlay" onClick={() => setShowSearch(false)}>
          <div className="empire-search-panel" onClick={e => e.stopPropagation()}>
            <div className="empire-search-input-wrap">
              <Search className="w-5 h-5" style={{ color: 'var(--text3)' }} />
              <input
                ref={searchInputRef}
                className="empire-search-input"
                type="text"
                placeholder={t('shell.search', 'Search apps, commands…')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setSearchSelected(s => Math.min(s + 1, searchResults.length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setSearchSelected(s => Math.max(s - 1, 0))
                  } else if (e.key === 'Enter' && searchResults[searchSelected]) {
                    handleAppOpen(searchResults[searchSelected].id)
                  }
                }}
              />
              <span className="empire-search-kbd">ESC</span>
            </div>

            <div className="empire-search-results">
              {searchResults.length === 0 ? (
                <div className="empire-search-empty">
                  <div className="empire-search-empty-icon"><Search className="w-4 h-4" /></div>
                  <div>No apps match "{searchQuery}"</div>
                </div>
              ) : (
                searchResults.map((app, idx) => {
                  const Icon = getAppIcon(app.icon)
                  const isSelected = idx === searchSelected
                  return (
                    <button
                      key={app.id}
                      className="empire-search-result"
                      data-selected={isSelected || undefined}
                      onClick={() => handleAppOpen(app.id)}
                      onMouseEnter={() => setSearchSelected(idx)}
                      style={{ ['--app-color' as string]: app.color }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--radius-lg)',
                        background: `${app.color}1A`, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', border: `1px solid ${app.color}30`, flexShrink: 0,
                      }}>
                        <Icon className="w-4 h-4" style={{ color: app.color }} />
                      </div>
                      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                        <div className="empire-search-result-name">{appLabel(app)}</div>
                        {app.description && <div className="empire-search-result-desc">{app.description}</div>}
                      </div>
                      {isSelected && (
                        <span className="empire-search-kbd"><CornerDownLeft className="w-2.5 h-2.5" /></span>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '8px 14px',
              borderTop: `1px solid ${tint('xenon', 5)}`, background: tint('void', 15),
              fontSize: 'var(--text-xs)', color: 'var(--text3)',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUp className="w-2.5 h-2.5" /><ArrowDown className="w-2.5 h-2.5" /> navigate
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CornerDownLeft className="w-2.5 h-2.5" /> open
              </span>
              <span style={{ marginLeft: 'auto' }}>
                {searchResults.length} {searchResults.length === 1 ? 'app' : 'apps'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Layer 4 — HomeBar (always on top) */}
      <div className="empire-homebar">
        <div className="empire-homebar-nav">
          <button
            className={`empire-homebar-btn ${atHome ? 'is-active' : ''}`}
            onClick={goHome}
            title="Home"
            aria-label="Home"
          >
            <House className="w-5 h-5" />
          </button>
          <button
            className="empire-homebar-btn"
            onClick={() => setShowRecents(true)}
            title="Recent apps"
            aria-label="Recent apps"
          >
            <LayoutGrid className="w-5 h-5" />
            {windows.length > 0 && <span className="empire-homebar-badge">{windows.length}</span>}
          </button>
          <button
            className="empire-homebar-btn"
            onClick={() => {
              setShowSearch(v => {
                if (!v) prevFocusRef.current = document.activeElement as HTMLElement
                return !v
              })
              setSearchSelected(0)
            }}
            title="Search (Ctrl+Space)"
            aria-label="Search apps (Ctrl+Space)"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        <div className="empire-homebar-tray">
          <button
            className="empire-homebar-btn"
            onClick={toggleTheme}
            title={isLight ? 'Dark mode' : 'Light mode'}
            aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            className="empire-homebar-btn empire-homebar-lang"
            onClick={toggleLang}
            title={`${t('shell.language', 'Language')}: ${lang === 'en' ? 'English' : 'Bahasa Indonesia'}`}
            aria-label={`${t('shell.language', 'Language')}: ${lang === 'en' ? 'English' : 'Bahasa Indonesia'}`}
          >
            {lang.toUpperCase()}
          </button>
          <div className="empire-homebar-clock" title={clock.toLocaleString()}>
            <span className="empire-homebar-time">
              {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="empire-homebar-date">
              {clock.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Command palette (⌘/Ctrl-K) + toasts */}
      <CommandPalette />
      <ToastViewport />
    </div>
  )
}
