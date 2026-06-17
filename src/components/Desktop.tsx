/**
 * Empire Desktop — Full Web OS Shell
 *
 * Layers (bottom to top):
 * 1. Desktop background (starfield + wallpaper)
 * 2. Desktop icons (app grid on the desktop)
 * 3. Windows (draggable, resizable)
 * 4. Context menu
 * 5. Search overlay (command palette with keyboard nav)
 * 6. Taskbar (always on top)
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useWindowStore } from '../lib/windowStore'
import { apps, getAppIcon } from '../lib/registry'
import { useStore } from '../lib/store'
import { useLang } from '../lib/i18n'
import WindowComponent from './Window'
import ContextMenu from './ContextMenu'
import HeroHud from './HeroHud'
import { ToastViewport } from './ui/Toast'
import {
  Search, Sun, Moon, Volume2,
  Command, Sparkles, ArrowUp, ArrowDown,
  CornerDownLeft
} from 'lucide-react'

// Categories used in the start menu grouping
const CATEGORY_ORDER = ['AI & Intelligence', 'Productivity & Data', 'Media & Files', 'Utilities'] as const

function categorizeApp(name: string): typeof CATEGORY_ORDER[number] {
  const lower = name.toLowerCase()
  if (
    name.includes('Hermes') || name === 'AI Chat' || name === 'Prompt Gen' ||
    name === 'Token Counter' || name === 'Goals' || name === 'Grammar Fix' ||
    lower.includes('agent')
  ) return 'AI & Intelligence'
  if (
    name === 'Notes' || name === 'Calendar' || name === 'Calculator' ||
    name === 'Data Center' || name === 'Maps' || name === 'Clock'
  ) return 'Productivity & Data'
  if (
    name === 'Music' || name === 'Video' || name === 'Photos' ||
    name === 'Files' || name === 'Browser'
  ) return 'Media & Files'
  return 'Utilities'
}

function groupApps() {
  const groups: Record<string, typeof apps> = {}
  for (const cat of CATEGORY_ORDER) groups[cat] = []
  for (const a of apps) groups[categorizeApp(a.name)]?.push(a)
  return groups
}

export default function Desktop() {
  const { theme, toggleTheme } = useStore()
  const { t, lang, toggleLang } = useLang()
  // Localised display name for an app (registry English stays canonical).
  const appLabel = useCallback((a: typeof apps[number]) => t(`app.${a.id}.name`, a.name), [t])
  const {
  windows, openApp, minimizeWindow,
  focusWindow, activeWindowId
  } = useWindowStore()
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSelected, setSearchSelected] = useState(0)
  const [showStartMenu, setShowStartMenu] = useState(false)
  const [clock, setClock] = useState(new Date())
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Keyboard shortcut: Ctrl+Space for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault()
        setShowSearch(v => !v)
        setSearchQuery('')
        setSearchSelected(0)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setShowStartMenu(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleAppOpen = useCallback((appId: string) => {
  const appDef = apps.find(a => a.id === appId)
  if (!appDef) return
  // Check if already open — if so, focus it
  const existing = windows.find(w => w.appId === appId)
  if (existing) {
  if (existing.minimized) {
  minimizeWindow(existing.id)
  }
  focusWindow(existing.id)
  } else {
  openApp(appId, appDef.name, appDef.icon, appDef.color)
  }
  setShowSearch(false)
  setShowStartMenu(false)
  }, [windows, openApp, minimizeWindow, focusWindow])

  // Filtered apps for search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return apps
    const q = searchQuery.toLowerCase()
    return apps.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q)
    )
  }, [searchQuery])

  // Reset selected when results change
  useEffect(() => {
    setSearchSelected(0)
  }, [searchQuery])

  const isLight = theme === 'light'
  const grouped = useMemo(() => groupApps(), [])

  return (
    <div className="empire-desktop" style={{ color: 'var(--text)' }}>
      {/* Layer 0: Starfield Background */}
      <div className="empire-desktop-bg starfield">
        <div className="stars-layer-1" />
        <div className="stars-layer-2" />
        <div className="stars-layer-3" />
        <div className="nebula-layer" />
        {/* Command-center HUD ambience */}
        <div className="empire-hud-glow" />
        <div className="empire-hud-grid" />
        <div className="empire-hud-horizon" />
        <div className="empire-hud-frame">
          <span className="hud-corner hud-corner-tl" />
          <span className="hud-corner hud-corner-tr" />
          <span className="hud-corner hud-corner-bl" />
          <span className="hud-corner hud-corner-br" />
        </div>
        {/* Telemetry rails fill the wide void with command-center density */}
        <div className="empire-rail empire-rail-left">
          <span className="rail-label">SYS·TELEMETRY</span>
          <div className="rail-bars">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="rail-bar" style={{ ['--i' as string]: String(i) }} />
            ))}
          </div>
          <span className="rail-readout">PWR ▰▰▰▰▱</span>
          <span className="rail-readout">NET ▰▰▰▱▱</span>
          <span className="rail-readout">MEM ▰▰▰▰▰</span>
        </div>
        <div className="empire-rail empire-rail-right">
          <span className="rail-label">HERMES·LINK</span>
          <div className="rail-ticks">
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className="rail-tick" style={{ ['--i' as string]: String(i) }} />
            ))}
          </div>
          <span className="rail-readout">UPLINK·OK</span>
          <span className="rail-readout">LAT 14ms</span>
          <span className="rail-readout">v2.0.1</span>
        </div>
      </div>

      {/* Layer 1: Launcher (HUD centerpiece + balanced app grid) */}
      <div className="empire-launcher">
        <HeroHud
          clock={clock}
          appCount={apps.length}
          runningCount={windows.length}
        />
        <div className="empire-app-grid">
        {apps.map(app => {
          const Icon = getAppIcon(app.icon)
          const isRunning = windows.some(w => w.appId === app.id)
          return (
            <button
              key={app.id}
              className="empire-desktop-icon"
              style={{
                ['--app-color' as any]: app.color,
              }}
              onDoubleClick={() => handleAppOpen(app.id)}
              onClick={() => handleAppOpen(app.id)}
              title={app.description || app.name}
            >
              <div
                className="empire-desktop-icon-img"
                style={{ background: `${app.color}15` }}
              >
                <Icon className="w-7 h-7" style={{ color: app.color }} />
                {isRunning && (
                  <span
                    aria-label="Running"
                    style={{
                      position: 'absolute',
                      bottom: 3,
                      right: 3,
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: app.color,
                      boxShadow: `0 0 8px ${app.color}, 0 0 0 1.5px rgba(0,0,0,0.6)`,
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

      {/* Layer 2: Windows */}
      <div className="empire-windows-layer">
        {windows.map(win => {
        return (
        <WindowComponent
        key={win.id}
        win={win}
        isActive={win.id === activeWindowId}
        />
        )
        })}
      </div>

      {/* Layer 3: Context Menu */}
      <ContextMenu />

      {/* Layer 4: Search Overlay (Command Palette) */}
      {showSearch && (
        <div
          className="empire-search-overlay"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="empire-search-panel"
            onClick={e => e.stopPropagation()}
          >
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
                  <div className="empire-search-empty-icon">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>No apps match "{searchQuery}"</div>
                  <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                    Try the app name like "calc" or "notes"
                  </div>
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
                      style={{
                        ['--app-color' as any]: app.color,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-lg)',
                          background: `${app.color}1A`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${app.color}30`,
                          flexShrink: 0,
                        }}
                      >
                        <Icon className="w-4 h-4" style={{ color: app.color }} />
                      </div>
                      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                        <div className="empire-search-result-name">{appLabel(app)}</div>
                        {app.description && (
                          <div className="empire-search-result-desc">{app.description}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {app.hermesEnabled && (
                          <span title="Hermes-powered" style={{ display: 'flex' }}>
                            <Sparkles className="w-3.5 h-3.5" style={{ color: app.color }} />
                          </span>
                        )}
                        {isSelected && (
                          <span className="empire-search-kbd">
                            <CornerDownLeft className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer hints */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '8px 14px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.15)',
                fontSize: '10px',
                color: 'var(--text3)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUp className="w-2.5 h-2.5" />
                <ArrowDown className="w-2.5 h-2.5" />
                navigate
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CornerDownLeft className="w-2.5 h-2.5" />
                open
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span className="empire-search-kbd" style={{ fontSize: '9px' }}>Ctrl+Space</span>
                toggle
              </span>
              <span style={{ marginLeft: 'auto' }}>
                {searchResults.length} {searchResults.length === 1 ? 'app' : 'apps'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Layer 5: Start Menu (pop-up from taskbar) */}
      {showStartMenu && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 8999,
          }}
          onClick={() => setShowStartMenu(false)}
        >
          <div
            className="empire-start-menu"
            style={{
              position: 'absolute',
              bottom: 64,
              left: 8,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Start menu header */}
            <div className="empire-start-menu-header">
              <div
                style={{
                  width: 28, height: 28, borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--color-cyan-5), var(--color-teal-5))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'var(--glow-teal)',
                }}
              >
                <Command className="w-4 h-4 text-white" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                  The Empire
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text3)', fontWeight: 500 }}>
                  {apps.length} apps · {windows.length} running
                </span>
              </div>
            </div>

            {/* Apps by category */}
            <div className="empire-start-menu-grid">
              {CATEGORY_ORDER.map(cat => {
                const groupApps = grouped[cat]
                if (!groupApps || groupApps.length === 0) return null
                return (
                  <div
                    key={cat}
                    style={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      paddingTop: '4px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--text3)',
                        padding: '4px 6px 2px',
                      }}
                    >
                      {cat}
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '4px',
                      }}
                    >
                      {groupApps.map(app => {
                        const Icon = getAppIcon(app.icon)
                        return (
                          <button
                            key={app.id}
                            className="empire-start-menu-item"
                            onClick={() => handleAppOpen(app.id)}
                            title={app.description || app.name}
                            style={{
                              ['--app-color' as any]: app.color,
                            }}
                          >
                            <div
                              className="empire-start-menu-icon"
                              style={{ background: `${app.color}1A` }}
                            >
                              <Icon className="w-5 h-5" style={{ color: app.color }} />
                              {app.hermesEnabled && (
                                <span
                                  style={{
                                    position: 'absolute',
                                    top: -3,
                                    right: -3,
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    background: 'var(--color-cyan-5)',
                                    border: '1.5px solid rgba(13, 18, 36, 1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Sparkles className="w-2 h-2 text-white" strokeWidth={3} />
                                </span>
                              )}
                            </div>
                            <span className="line-clamp-2" style={{
                              fontSize: '10px',
                              fontWeight: 500,
                              color: 'var(--text2)',
                              textAlign: 'center',
                              lineHeight: 1.25,
                              width: '100%',
                              transition: 'color var(--dur-fast)',
                            }}>
                              {appLabel(app)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="empire-start-menu-footer">
              <button
                onClick={toggleTheme}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'var(--text2)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  transition: 'all var(--dur-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = 'var(--text)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text2)'
                }}
              >
                {isLight ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                {isLight ? 'Dark' : 'Light'}
              </button>
              <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
                {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Layer 6: Taskbar (always on top) */}
      <div className="empire-taskbar" style={{ height: 56 }}>
        {/* Start / Empire button */}
        <button
          className="empire-start-btn"
          onClick={() => setShowStartMenu(v => !v)}
          title="Start Menu"
          style={{ ['--app-color' as any]: 'var(--color-cyan-3)' }}
        >
          <Command className="w-5 h-5" style={{ color: 'var(--color-teal-3)' }} />
        </button>

        {/* Running apps */}
        <div className="empire-taskbar-apps">
          {windows.map(win => {
            const appDef = apps.find(a => a.id === win.appId)
            if (!appDef) return null
            const Icon = getAppIcon(appDef.icon)
            const isActive = win.id === activeWindowId
            return (
              <button
                key={win.id}
                className={`empire-taskbar-app ${isActive ? 'empire-taskbar-app-active' : ''}`}
                data-tooltip={appLabel(appDef)}
                onClick={() => {
                  // focusWindow already handles minimize-restore + bring-to-front.
                  // Toggle minimization when clicking the already-active window's taskbar entry.
                  if (win.id === activeWindowId && !win.minimized) {
                    minimizeWindow(win.id)
                    return
                  }
                  focusWindow(win.id)
                }}
                style={{
                  ['--app-color' as string]: appDef.color,
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: isActive ? appDef.color : 'var(--text3)' }}
                />
                <span
                  className="empire-taskbar-indicator"
                  style={{
                    width: isActive ? 8 : 4,
                    height: isActive ? 2 : 4,
                    borderRadius: isActive ? '1px' : '50%',
                    opacity: isActive ? 1 : 0.4,
                  }}
                />
              </button>
            )
          })}
        </div>

        {/* System tray */}
        <div className="empire-taskbar-tray">
          {/* Search */}
          <button
            className="empire-taskbar-tray-btn"
            onClick={() => { setShowSearch(v => !v); setSearchSelected(0) }}
            title="Search (Ctrl+Space)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme toggle */}
          <button
            className="empire-taskbar-tray-btn"
            onClick={toggleTheme}
            title={isLight ? 'Dark mode' : 'Light mode'}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Language toggle (EN / ID) */}
          <button
            className="empire-taskbar-tray-btn"
            onClick={toggleLang}
            title={`${t('shell.language', 'Language')}: ${lang === 'en' ? 'English' : 'Bahasa Indonesia'}`}
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}
          >
            {lang.toUpperCase()}
          </button>

          {/* Volume (decorative) */}
          <button className="empire-taskbar-tray-btn" title="Volume">
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Clock */}
          <div className="empire-taskbar-clock" title={clock.toLocaleString()}>
            <span
              className="empire-taskbar-clock-row"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--text2)',
                fontVariantNumeric: 'tabular-nums',
                transition: 'color var(--dur-fast)',
              }}
            >
              {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span
              style={{
                fontSize: '10px',
                color: 'var(--text3)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {clock.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Layer 7: Toast Viewport (persistent) */}
      <ToastViewport />
    </div>
  )
}
