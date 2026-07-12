/**
 * Cakra — the single AI surface for The Empire.
 *
 * Cakra both *chats* and *acts*. The model calls take one of two routes, and
 * which one is reliable depends on how Cakra reaches its LLM:
 *
 *   • **AIChat** (default) — the server-proxied chat: every model call goes
 *     through the Empire proxy (`/api/ai/chat` → server.js locally, or the
 *     hosted Cakra proxy on the live PWA), so it's powered by the server-side
 *     `.env` NVIDIA NIM key and works in ANY browser (local Termux or github.io)
 *     with zero setup. NIM sends no CORS headers, so this is the only path that
 *     works browser-side with a NIM key. Now includes **Cakra Auto** multi-model
 *     orchestration + a live reasoning trace.
 *
 *   • **AgentSurface** — the full tool-calling agent (files, shell, web search,
 *     code exec, Workspace panel). It calls the model provider *directly*, which
 *     only works where CORS isn't enforced (a native APK webview) or against a
 *     CORS-friendly backend. So we only mount it when the user has deliberately
 *     pointed Cakra at a backend/proxy (Agent → Settings → "Backend server").
 *
 * The app keeps id `ai-chat` + route `/app/ai-chat` so every existing
 * handoff/event/automation keeps working. Both children emit APP_OPENED
 * themselves, so this wrapper must not.
 */
import { useEffect, useState } from 'react'
import { getApiBase, checkBackend } from '../../lib/apiBase'
import AgentSurface from './AgentSurface'
import AIChat from './AIChat'

export default function Cakra() {
  // Only the explicitly-configured "Backend server" override unlocks the direct
  // tool-calling agent; otherwise use the proxy chat (which the .env NIM key
  // powers and which works in every browser). First paint mirrors this guess.
  const [tools, setTools] = useState(() => !!getApiBase())

  useEffect(() => {
    if (!getApiBase()) { setTools(false); return }
    let alive = true
    // Confirm the configured backend actually answers before showing the agent.
    checkBackend(2000).then((ok) => { if (alive) setTools(ok) }).catch(() => { if (alive) setTools(false) })
    return () => { alive = false }
  }, [])

  return tools ? <AgentSurface /> : <AIChat />
}
