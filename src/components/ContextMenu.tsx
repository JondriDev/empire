/**
 * Empire Context Menu
 * Right-click / long-press menu for the desktop.
 */
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useWindowStore } from '../lib/windowStore'
import { apps, getAppIcon } from '../lib/registry'
import { Button } from './ui'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
}

export default function ContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 })
  const { openApp, closeAllWindows, minimizeAllWindows } = useWindowStore()
  const menuRef = useRef<HTMLDivElement>(null)

  // Show on right-click (desktop only)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Only trigger on the desktop background, not on windows/apps
      const target = e.target as HTMLElement
      if (target.closest('.empire-apphost') || target.closest('.empire-homebar') || target.closest('.empire-context-menu')) {
        return
      }
      e.preventDefault()
      setMenu({ visible: true, x: e.clientX, y: e.clientY })
    }

    // Long-press for touch
    let longPressTimer: number | null = null
    let longPressPos = { x: 0, y: 0 }

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.empire-apphost') || target.closest('.empire-homebar')) return
      if (e.touches.length === 1) {
        longPressPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        longPressTimer = window.setTimeout(() => {
          setMenu({ visible: true, x: longPressPos.x, y: longPressPos.y })
        }, 600)
      }
    }

    const handleTouchMove = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
    }

    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  // Close on click outside
  useEffect(() => {
    if (!menu.visible) return
    const close = () => setMenu(m => ({ ...m, visible: false }))
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close()
      }
    }
    // Close after a short delay to allow menu item clicks
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown)
      document.addEventListener('touchstart', handleMouseDown as any, { passive: true })
    }, 50)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('touchstart', handleMouseDown as any)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menu.visible])

  // Clamp menu to viewport using its measured size (offsetWidth/Height ignore
  // the entrance scale transform), before paint so there is no jump. The menu
  // itself scrolls if taller than the viewport (short landscape screens).
  useLayoutEffect(() => {
    const el = menuRef.current
    if (!menu.visible || !el) return
    el.style.left = `${Math.max(8, Math.min(menu.x, window.innerWidth - el.offsetWidth - 8))}px`
    el.style.top = `${Math.max(8, Math.min(menu.y, window.innerHeight - el.offsetHeight - 8))}px`
  }, [menu])

  if (!menu.visible) return null

  return (
    <div
      ref={menuRef}
      className="empire-context-menu"
      style={{
        position: 'fixed',
        left: menu.x,
        top: menu.y,
        zIndex: 'var(--z-context)' as unknown as number,
      }}
    >
      {/* Quick apps section */}
      <div className="empire-context-menu-section">
        <div className="empire-context-menu-label">Open App</div>
        {apps.slice(0, 8).map(app => {
          const Icon = getAppIcon(app.icon)
          return (
            <Button
              key={app.id}
              variant="ghost"
              fullWidth
              className="empire-context-menu-item"
              style={{ padding: '7px 10px', justifyContent: 'flex-start', borderRadius: 'var(--radius-sm)' }}
              onClick={() => {
                openApp(app.id, app.name, app.icon, app.color)
                setMenu(m => ({ ...m, visible: false }))
              }}
              icon={<Icon className="w-3.5 h-3.5" style={{ color: app.color }} />}
            >
              <span>{app.name}</span>
            </Button>
          )
        })}
      </div>

      <div className="empire-context-menu-divider" />

      {/* Desktop actions */}
      <div className="empire-context-menu-section">
        <div className="empire-context-menu-label">Desktop</div>
        <Button
          variant="ghost"
          fullWidth
          className="empire-context-menu-item"
          style={{ padding: '7px 10px', justifyContent: 'flex-start', borderRadius: 'var(--radius-sm)' }}
          onClick={() => {
            minimizeAllWindows()
            setMenu(m => ({ ...m, visible: false }))
          }}
        >
          <span>Minimize All</span>
        </Button>
        <Button
          variant="ghost"
          fullWidth
          className="empire-context-menu-item"
          style={{ padding: '7px 10px', justifyContent: 'flex-start', borderRadius: 'var(--radius-sm)' }}
          onClick={() => {
            closeAllWindows()
            setMenu(m => ({ ...m, visible: false }))
          }}
        >
          <span>Close All Windows</span>
        </Button>
      </div>
    </div>
  )
}
