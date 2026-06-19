/**
 * apiBase — single source of truth for the *optional* Empire backend.
 *
 * Most Empire apps run fully client-side (localStorage / Zustand persist).
 * A handful (DataCenter, the AI proxy, agent tools, Files, Hermes) talk to
 * the Express backend in `server.js`. When the app is packaged as a PWA or
 * Android APK with no local server, those calls must degrade gracefully —
 * and may optionally be pointed at a remote server the user runs (e.g. a PC
 * or the Termux box on the same Wi-Fi).
 *
 *   default ''  → same-origin  (Termux local server, or the dev proxy)
 *   override    → e.g. 'http://192.168.1.10:3001'  (a machine running server.js)
 *
 * Power users can set it from the console:  empireBackend.set('http://host:3001')
 * or via Agent → Settings → "Backend server".
 */

const KEY = 'empire-backend-url'

export type BackendStatus = 'unknown' | 'online' | 'offline'

let backendStatus: BackendStatus = 'unknown'
const listeners = new Set<(s: BackendStatus) => void>()

function notify(): void {
  for (const l of listeners) l(backendStatus)
}

/** Configured backend origin, or '' for same-origin. Never has a trailing slash. */
export function getApiBase(): string {
  try {
    return (localStorage.getItem(KEY) || '').replace(/\/+$/, '')
  } catch {
    return ''
  }
}

/** Set (or clear, with '') the backend origin. Resets the cached status. */
export function setApiBase(url: string): void {
  try {
    const clean = url.trim().replace(/\/+$/, '')
    if (clean) localStorage.setItem(KEY, clean)
    else localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  backendStatus = 'unknown'
  notify()
}

/** Resolve an absolute URL for an `/api/...` path against the configured base. */
export function apiUrl(path: string): string {
  const base = getApiBase()
  if (!base) return path // same-origin
  return base + (path.startsWith('/') ? path : '/' + path)
}

export function getBackendStatus(): BackendStatus {
  return backendStatus
}

/** Subscribe to backend status changes. Fires immediately with the current value. */
export function onBackendStatus(fn: (s: BackendStatus) => void): () => void {
  listeners.add(fn)
  fn(backendStatus)
  return () => {
    listeners.delete(fn)
  }
}

/** Probe `/api/health`. Updates + returns the cached online/offline status. */
export async function checkBackend(timeoutMs = 3000): Promise<boolean> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(apiUrl('/api/health'), { signal: ctrl.signal })
    backendStatus = res.ok ? 'online' : 'offline'
  } catch {
    backendStatus = 'offline'
  } finally {
    clearTimeout(timer)
  }
  notify()
  return backendStatus === 'online'
}

// Console helper for power users (no UI needed to point at a remote server).
interface EmpireBackendApi {
  get: typeof getApiBase
  set: typeof setApiBase
  check: typeof checkBackend
  status: typeof getBackendStatus
}
try {
  ;(globalThis as unknown as { empireBackend?: EmpireBackendApi }).empireBackend = {
    get: getApiBase,
    set: setApiBase,
    check: checkBackend,
    status: getBackendStatus,
  }
} catch {
  /* ignore */
}
