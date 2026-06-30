/**
 * Cakra — the single AI surface for The Empire.
 *
 * Cakra both *chats* and *acts*, but what it can do depends on where it runs:
 *
 *   • Native runtime (Termux `server.js`, a configured remote backend, or an
 *     APK pointed at one) → the full tool-calling **AgentSurface**: files,
 *     shell, web search, code execution, with a live Workspace panel. Model
 *     calls go direct to the user's chosen provider with their key.
 *
 *   • Live web PWA (github.io, no backend) → the proxy-routed **AIChat**:
 *     zero-setup chat through the Cakra Supabase proxy (NIM is CORS-blocked
 *     when called direct), with full Empire context + handoff. Shell/file
 *     tools can't run in a browser, so we don't pretend to offer them.
 *
 * The app keeps id `ai-chat` + route `/app/ai-chat` so every existing
 * handoff/event/automation keeps working. Both children emit APP_OPENED
 * themselves, so this wrapper must not.
 */
import { useEffect, useState } from 'react'
import { isLocalRuntime, checkBackend } from '../../lib/apiBase'
import AgentSurface from './AgentSurface'
import AIChat from './AIChat'

export default function Cakra() {
  // Synchronous best-guess for first paint: render the full agent only where a
  // backend is plausibly reachable (avoids a flash of chat on Termux).
  const [native, setNative] = useState(() => isLocalRuntime())

  useEffect(() => {
    // On the live web PWA there's no backend to probe — stay on proxy chat.
    if (!isLocalRuntime()) return
    let alive = true
    // Confirm server.js actually answers; downgrade to proxy chat if not.
    checkBackend(2000).then((ok) => { if (alive) setNative(ok) }).catch(() => { if (alive) setNative(false) })
    return () => { alive = false }
  }, [])

  return native ? <AgentSurface /> : <AIChat />
}
