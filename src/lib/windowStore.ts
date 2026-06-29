/**
 * Empire App Stack — the full-screen shell model.
 *
 * First principles: on a phone/DeX you only ever look at ONE app at a time, so
 * floating, draggable, resizable windows are pure skeuomorphic cost. We deleted
 * the window manager. What remains is the irreducible core:
 *   • a list of OPEN apps (most-recent-first) for the recents switcher,
 *   • the ACTIVE app that fills the screen (or `null` = home/launcher).
 *
 * The public method names (`openApp`, `focusWindow`, `closeWindow`,
 * `minimizeWindow`, `closeAllWindows`, `minimizeAllWindows`, `windows`,
 * `activeWindowId`) are preserved so existing callers (Desktop, CommandPalette,
 * ContextMenu, Network) keep working — but each is now keyed by **appId** and
 * carries no geometry.
 */
import { create } from 'zustand'
import { apps, getAppIcon } from './registry'
import { setCakraTab, type CakraTab } from './cakraTab'

/** One open app. `id === appId` (apps are singletons in the stack). */
export interface EmpireWindow {
  id: string        // === appId
  appId: string
  title: string
  icon: string
  color: string
  openedAt: number
}

interface AppStackState {
  /** Open apps, most-recently-focused first (drives the recents switcher). */
  windows: EmpireWindow[]
  /** appId of the foreground (full-screen) app, or null when showing home. */
  activeWindowId: string | null

  /** Open (or focus) an app and bring it to the foreground. Returns its id. */
  openApp: (appId: string, title: string, icon: string, color: string) => string
  /** Bring an already-open app to the foreground. */
  focusWindow: (id: string) => void
  /** Close an app (remove from the stack). */
  closeWindow: (id: string) => void
  /** Send the foreground app to the background — reveals home. (Was "minimize".) */
  minimizeWindow: (id: string) => void
  /** Go home without closing anything. */
  goHome: () => void
  /** Close every open app and show home. */
  closeAllWindows: () => void
  /** Background every app and show home. */
  minimizeAllWindows: () => void
}

/** Move `id` to the front of the stack (most-recent-first ordering). */
function toFront(list: EmpireWindow[], id: string): EmpireWindow[] {
  const found = list.find(w => w.id === id)
  if (!found) return list
  return [found, ...list.filter(w => w.id !== id)]
}

export const useWindowStore = create<AppStackState>()((set, get) => ({
  windows: [],
  activeWindowId: null,

  openApp: (appId, title, icon, color) => {
    const existing = get().windows.find(w => w.id === appId)
    if (existing) {
      set(s => ({ windows: toFront(s.windows, appId), activeWindowId: appId }))
      return appId
    }
    const entry: EmpireWindow = { id: appId, appId, title, icon, color, openedAt: Date.now() }
    set(s => ({ windows: [entry, ...s.windows], activeWindowId: appId }))
    return appId
  },

  focusWindow: (id) => {
    set(s => ({ windows: toFront(s.windows, id), activeWindowId: id }))
  },

  closeWindow: (id) => {
    set(s => {
      const remaining = s.windows.filter(w => w.id !== id)
      const activeWindowId = s.activeWindowId === id
        ? (remaining[0]?.id ?? null)
        : s.activeWindowId
      return { windows: remaining, activeWindowId }
    })
  },

  minimizeWindow: (id) => {
    // "Minimize" in a full-screen shell = send to background, reveal home.
    set(s => (s.activeWindowId === id ? { activeWindowId: null } : {}))
  },

  goHome: () => set({ activeWindowId: null }),

  closeAllWindows: () => set({ windows: [], activeWindowId: null }),

  minimizeAllWindows: () => set({ activeWindowId: null }),
}))

/**
 * Open an app by id, looking up its definition from the registry.
 * Resolves alias apps (e.g. the merged Cakra tools) to their host app.
 * Returns the opened app id, or null if not found.
 */
export function openAppById(appId: string): string | null {
  const def = apps.find(a => a.id === appId)
  if (!def) {
    console.warn(`[appStack] Unknown app id: ${appId}`)
    return null
  }
  const target = def.aliasOf ? apps.find(a => a.id === def.aliasOf!.appId) : def
  if (!target) return null
  if (def.aliasOf) setCakraTab(def.aliasOf.tab as CakraTab)
  void getAppIcon(target.icon) // touch to silence unused-import linters
  return useWindowStore.getState().openApp(target.id, target.name, target.icon, target.color)
}
