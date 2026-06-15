/**
 * Empire Window Component
 * A draggable, resizable window with macOS-like chrome.
 * Supports both mouse and touch events for Android/Termux.
 */
import { useRef, useCallback, useEffect, useState, Suspense } from 'react'
import { X, Minus, Square, Maximize2 } from 'lucide-react'
import { getAppIcon } from '../lib/registry'
import { useWindowStore, type EmpireWindow } from '../lib/windowStore'
import { appComponents } from '../lib/appComponents'
import LoadingSpinner from './ui/LoadingSpinner'
import { ErrorBoundary } from './ErrorBoundary'

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

// Double-click detection threshold. Must be long enough that an accidental
// drag-then-release doesn't trigger it, but short enough to feel responsive.
const DOUBLE_CLICK_MS = 280

export default function Window({ win, isActive }: { win: EmpireWindow; isActive: boolean }) {
  const {
    focusWindow, closeWindow, minimizeWindow,
    maximizeWindow, restoreWindow, moveWindow, resizeWindow,
  } = useWindowStore()

  const windowRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDir, setResizeDir] = useState<ResizeDirection | null>(null)
  const dragStart = useRef({ x: 0, y: 0, winX: 0, winY: 0 })
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, winX: 0, winY: 0 })
  const dragMovedRef = useRef(false)

  const AppComponent = appComponents[win.appId]
  const Icon = getAppIcon(win.icon)

  // ── DRAG ──
  const startDrag = useCallback((clientX: number, clientY: number) => {
    if (win.maximized) return
    dragMovedRef.current = false
    setIsDragging(true)
    dragStart.current = {
      x: clientX, y: clientY,
      winX: win.position.x, winY: win.position.y,
    }
  }, [win.maximized, win.position.x, win.position.y])

  const onDragMove = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - dragStart.current.x
    const dy = clientY - dragStart.current.y
    // Ignore micro-movements (helps dblclick detection)
    if (Math.abs(dx) <  2 && Math.abs(dy) <  2) return
    dragMovedRef.current = true
    moveWindow(win.id, {
      x: Math.max(0, dragStart.current.winX + dx),
      y: Math.max(0, dragStart.current.winY + dy),
    })
  }, [win.id, moveWindow])

  // ── RESIZE ──
  const startResize = useCallback((dir: ResizeDirection, clientX: number, clientY: number) => {
    if (win.maximized) return
    setIsResizing(true)
    setResizeDir(dir)
    resizeStart.current = {
      x: clientX, y: clientY,
      w: win.size.width, h: win.size.height,
      winX: win.position.x, winY: win.position.y,
    }
  }, [win.maximized, win.size, win.position])

  const onResizeMove = useCallback((clientX: number, clientY: number) => {
    if (!resizeDir) return
    const dx = clientX - resizeStart.current.x
    const dy = clientY - resizeStart.current.y
    const { w, h, winX, winY } = resizeStart.current

    let newW = w, newH = h, newX = winX, newY = winY

    if (resizeDir.includes('e')) newW = w + dx
    if (resizeDir.includes('w')) { newW = w - dx; newX = winX + dx }
    if (resizeDir.includes('s')) newH = h + dy
    if (resizeDir.includes('n')) { newH = h - dy; newY = winY + dy }

    newW = Math.max(320, newW)
    newH = Math.max(240, newH)

    resizeWindow(win.id, { width: newW, height: newH })
    if (resizeDir.includes('w') || resizeDir.includes('n')) {
      moveWindow(win.id, { x: newX, y: Math.max(0, newY) })
    }
  }, [win.id, resizeDir, moveWindow, resizeWindow])

  // ── GLOBAL MOUSE/TOUCH MOVE ──
  useEffect(() => {
    if (!isDragging && !isResizing) return

    const onMove = (clientX: number, clientY: number) => {
      if (isDragging) onDragMove(clientX, clientY)
      if (isResizing) onResizeMove(clientX, clientY)
    }

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault()
        onMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }
    const onEnd = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeDir(null)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [isDragging, isResizing, onDragMove, onResizeMove])

  // ── KEYBOARD SHORTCUTS ── Escape closes, Cmd/Ctrl+W closes (only when active+focused)
  useEffect(() => {
    if (!isActive) return
    const onKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl+W — close
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        closeWindow(win.id)
        return
      }
      // Escape — only if this window (or its descendant) is focused
      if (e.key === 'Escape') {
        const node = windowRef.current
        if (node && document.activeElement && node.contains(document.activeElement)) {
          ;(document.activeElement as HTMLElement).blur()
          closeWindow(win.id)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isActive, closeWindow, win.id])

  // ── TITLE BAR EVENTS (drag + dblclick) ──
  const lastClickAt = useRef(0)
  const onTitleMouseDown = useCallback((e: React.MouseEvent) => {
    const now = Date.now()
    if (now - lastClickAt.current < DOUBLE_CLICK_MS) {
      // Double-click → toggle maximize (only if the user didn't drag in between)
      if (!dragMovedRef.current) {
        win.maximized ? restoreWindow(win.id) : maximizeWindow(win.id)
      }
      lastClickAt.current = 0
      return
    }
    lastClickAt.current = now
    startDrag(e.clientX, e.clientY)
  }, [win.id, win.maximized, startDrag, maximizeWindow, restoreWindow])

  const onTitleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY)
    }
  }, [startDrag])

  // ── RESIZE HANDLES ──
  const resizeHandleStyle = (dir: ResizeDirection): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'absolute', zIndex: 10 }
    const size = 8
    switch (dir) {
      case 'n':  return { ...base, top: -size/2, left: size, right: size, height: size, cursor: 'n-resize' }
      case 's':  return { ...base, bottom: -size/2, left: size, right: size, height: size, cursor: 's-resize' }
      case 'e':  return { ...base, right: -size/2, top: size, bottom: size, width: size, cursor: 'e-resize' }
      case 'w':  return { ...base, left: -size/2, top: size, bottom: size, width: size, cursor: 'w-resize' }
      case 'ne': return { ...base, top: -size/2, right: -size/2, width: size*2, height: size*2, cursor: 'ne-resize' }
      case 'nw': return { ...base, top: -size/2, left: -size/2, width: size*2, height: size*2, cursor: 'nw-resize' }
      case 'se': return { ...base, bottom: -size/2, right: -size/2, width: size*2, height: size*2, cursor: 'se-resize' }
      case 'sw': return { ...base, bottom: -size/2, left: -size/2, width: size*2, height: size*2, cursor: 'sw-resize' }
    }
  }

  const handleResizeMouseDown = (dir: ResizeDirection) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startResize(dir, e.clientX, e.clientY)
  }

  const handleResizeTouchStart = (dir: ResizeDirection) => (e: React.TouchEvent) => {
    e.stopPropagation()
    if (e.touches.length === 1) {
      startResize(dir, e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  if (win.minimized) return null

  return (
    <div
      ref={windowRef}
      className={`empire-window ${isActive ? 'empire-window-active' : ''}`}
      style={{
        position: 'absolute',
        left: win.position.x,
        top: win.position.y,
        width: win.maximized ? '100%' : win.size.width,
        height: win.maximized ? 'calc(100vh - 56px)' : win.size.height,
        zIndex: win.zIndex,
        ['--titlebar-accent' as string]: `${win.color}80`,
        ['--window-accent' as string]: win.color,
        ...(isDragging || isResizing ? { transition: 'none' } : {}),
      }}
      onMouseDown={() => focusWindow(win.id)}
      onTouchStart={() => focusWindow(win.id)}
    >
      {/* ── TITLE BAR ── */}
      <div
        className="empire-window-titlebar"
        onMouseDown={onTitleMouseDown}
        onTouchStart={onTitleTouchStart}
        onDoubleClick={(e) => {
          e.preventDefault()
          win.maximized ? restoreWindow(win.id) : maximizeWindow(win.id)
        }}
      >
        {/* Traffic lights */}
        <div className="empire-window-controls">
          <button
            className="empire-window-btn empire-window-btn-close"
            aria-label="Close"
            onClick={(e) => { e.stopPropagation(); closeWindow(win.id) }}
          >
            <X className="w-3 h-3" />
          </button>
          <button
            className="empire-window-btn empire-window-btn-minimize"
            aria-label="Minimize"
            onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id) }}
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            className="empire-window-btn empire-window-btn-maximize"
            aria-label={win.maximized ? 'Restore' : 'Maximize'}
            onClick={(e) => { e.stopPropagation(); win.maximized ? restoreWindow(win.id) : maximizeWindow(win.id) }}
          >
            {win.maximized ? <Maximize2 className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          </button>
        </div>

        {/* App identity */}
        <div className="empire-window-identity">
          <Icon className="w-3.5 h-3.5" style={{ color: win.color }} aria-hidden />
          <span className="empire-window-title">{win.title}</span>
        </div>

        {/* Spacer (balances the traffic lights) */}
        <div className="empire-window-controls-spacer" />
      </div>

      {/* ── APP CONTENT ── */}
      <div className="empire-window-content">
        {AppComponent ? (
          <Suspense fallback={<LoadingSpinner />}>
            <ErrorBoundary>
              <AppComponent />
            </ErrorBoundary>
          </Suspense>
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--text3)' }}>
            App not available
          </div>
        )}
      </div>

      {/* ── RESIZE HANDLES ── */}
      {!win.maximized && (
        <>
          {(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as ResizeDirection[]).map(dir => (
            <div
              key={dir}
              className="empire-resize-handle"
              style={resizeHandleStyle(dir)}
              onMouseDown={handleResizeMouseDown(dir)}
              onTouchStart={handleResizeTouchStart(dir)}
            />
          ))}
        </>
      )}
    </div>
  )
}
