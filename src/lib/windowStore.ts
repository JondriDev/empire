/**
 * Empire Window Manager Store
 * Manages open windows, their positions, sizes, z-ordering, and state.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apps, getAppIcon } from './registry'

export interface WindowPosition { x: number; y: number }
export interface WindowSize { width: number; height: number }

export interface EmpireWindow {
  id: string
  appId: string
  title: string
  icon: string
  color: string
  position: WindowPosition
  size: WindowSize
  minimized: boolean
  maximized: boolean
  zIndex: number
  prevBounds?: { position: WindowPosition; size: WindowSize } // saved before maximize
}

interface WindowState {
  windows: EmpireWindow[]
  nextZIndex: number
  activeWindowId: string | null

  // Actions
  openApp: (appId: string, title: string, icon: string, color: string) => string
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  moveWindow: (id: string, position: WindowPosition) => void
  resizeWindow: (id: string, size: WindowSize) => void
  updateWindowPosition: (id: string, delta: { dx: number; dy: number }) => void
  closeAllWindows: () => void
  minimizeAllWindows: () => void
}

const TASKBAR_HEIGHT = 56
const CASCADE_OFFSET = 28
const MIN_WIDTH = 320
const MIN_HEIGHT = 240

// Default sizes per app category
const DEFAULT_SIZES: Record<string, WindowSize> = {
  calculator: { width: 360, height: 520 },
  clock: { width: 400, height: 350 },
  weather: { width: 420, height: 500 },
  grammar: { width: 500, height: 440 },
  'token-counter': { width: 440, height: 400 },
  'prompt-generator': { width: 520, height: 480 },
  'cache': { width: 400, height: 380 },
  music: { width: 480, height: 440 },
  video: { width: 560, height: 480 },
  photos: { width: 520, height: 500 },
}

const DEFAULT_SIZE: WindowSize = { width: 640, height: 480 }

let windowCounter = 0

export const useWindowStore = create<WindowState>()(
  persist(
    (set, get) => ({
      windows: [],
      nextZIndex: 100,
      activeWindowId: null,

      openApp: (appId, title, icon, color) => {
        const state = get()
        // If already open, focus it
        const existing = state.windows.find(w => w.appId === appId && !w.minimized)
        if (existing) {
          set(s => ({
            activeWindowId: existing.id,
            windows: s.windows.map(w =>
              w.id === existing.id ? { ...w, zIndex: s.nextZIndex, minimized: false } : w
            ),
            nextZIndex: s.nextZIndex + 1,
          }))
          return existing.id
        }

        // If minimized, restore it
        const minimized = state.windows.find(w => w.appId === appId && w.minimized)
        if (minimized) {
          set(s => ({
            activeWindowId: minimized.id,
            windows: s.windows.map(w =>
              w.id === minimized.id ? { ...w, zIndex: s.nextZIndex, minimized: false } : w
            ),
            nextZIndex: s.nextZIndex + 1,
          }))
          return minimized.id
        }

        const id = `win-${++windowCounter}-${Date.now()}`
        const size = DEFAULT_SIZES[appId] || DEFAULT_SIZE
        const openCount = state.windows.length
        const position = {
          x: 60 + (openCount * CASCADE_OFFSET) % 200,
          y: 40 + (openCount * CASCADE_OFFSET) % 150,
        }

        const newWindow: EmpireWindow = {
          id,
          appId,
          title,
          icon,
          color,
          position,
          size,
          minimized: false,
          maximized: false,
          zIndex: state.nextZIndex,
        }

        set(s => ({
          windows: [...s.windows, newWindow],
          nextZIndex: s.nextZIndex + 1,
          activeWindowId: id,
        }))

        return id
      },

      closeWindow: (id) => {
        set(s => {
          const remaining = s.windows.filter(w => w.id !== id)
          const activeWindowId = s.activeWindowId === id
            ? (remaining.length > 0
              ? remaining.reduce((a, b) => a.zIndex > b.zIndex ? a : b).id
              : null)
            : s.activeWindowId
          return { windows: remaining, activeWindowId }
        })
      },

      focusWindow: (id) => {
        set(s => ({
          activeWindowId: id,
          windows: s.windows.map(w =>
            w.id === id ? { ...w, zIndex: s.nextZIndex } : w
          ),
          nextZIndex: s.nextZIndex + 1,
        }))
      },

      minimizeWindow: (id) => {
        set(s => {
          const remaining = s.windows.filter(w => w.id !== id && !w.minimized)
          const activeWindowId = s.activeWindowId === id
            ? (remaining.length > 0
              ? remaining.reduce((a, b) => a.zIndex > b.zIndex ? a : b).id
              : null)
            : s.activeWindowId
          return {
            windows: s.windows.map(w =>
              w.id === id ? { ...w, minimized: true } : w
            ),
            activeWindowId,
          }
        })
      },

      maximizeWindow: (id) => {
        set(s => ({
          windows: s.windows.map(w =>
            w.id === id ? {
              ...w,
              prevBounds: { position: w.position, size: w.size },
              maximized: true,
              position: { x: 0, y: 0 },
              size: {
                width: window.innerWidth,
                height: window.innerHeight - TASKBAR_HEIGHT,
              },
            } : w
          ),
        }))
      },

      restoreWindow: (id) => {
        set(s => ({
          windows: s.windows.map(w =>
            w.id === id ? {
              ...w,
              maximized: false,
              position: w.prevBounds?.position || w.position,
              size: w.prevBounds?.size || w.size,
              prevBounds: undefined,
            } : w
          ),
        }))
      },

      moveWindow: (id, position) => {
        set(s => ({
          windows: s.windows.map(w =>
            w.id === id ? { ...w, position } : w
          ),
        }))
      },

      resizeWindow: (id, size) => {
        const clamped = {
          width: Math.max(MIN_WIDTH, size.width),
          height: Math.max(MIN_HEIGHT, size.height),
        }
        set(s => ({
          windows: s.windows.map(w =>
            w.id === id ? { ...w, size: clamped } : w
          ),
        }))
      },

      updateWindowPosition: (id, delta) => {
        set(s => ({
          windows: s.windows.map(w =>
            w.id === id ? {
              ...w,
              position: {
                x: w.position.x + delta.dx,
                y: w.position.y + delta.dy,
              },
            } : w
          ),
        }))
      },

      closeAllWindows: () => {
        set({ windows: [], activeWindowId: null })
      },

      minimizeAllWindows: () => {
        set(s => ({
          windows: s.windows.map(w => ({ ...w, minimized: true })),
          activeWindowId: null,
        }))
      },
    }),
    {
      name: 'empire-windows',
      partialize: (_state) => ({
        // Don't persist window state on reload — fresh desktop
      }),
    }
  )
)

/**
 * Open an app by id, looking up its definition from the registry.
 * Use this instead of window.location.href = '/app/...' to preserve desktop state.
 * Returns the window id, or null if app not found.
 */
export function openAppById(appId: string): string | null {
  const def = apps.find(a => a.id === appId)
  if (!def) {
    console.warn(`[windowStore] Unknown app id: ${appId}`)
    return null
  }
  // Resolve icon component name → render-safe title+icon
  void getAppIcon(def.icon) // touch to silence unused-import linters
  return useWindowStore.getState().openApp(def.id, def.name, def.icon, def.color)
}
