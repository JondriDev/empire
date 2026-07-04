import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// ── Cakra Empire: AI Connector auto-init ────────────────────────────────────
// Import order matters: automation must init before any component renders
import './lib/automation'

// ── Core organism: mirror store-backed apps into the graph + register intents ─
import { startCoreSync } from './lib/core/sync'
startCoreSync()

// ── Cakra Solver: "Make Problem from this" intents + problem/solution mirror ──
import { registerSolverIntents } from './apps/cakra/solver/solverIntents'
registerSolverIntents()

// ── Focus: keep a global "current node" pointer for the ⌘K command palette ────
import { startFocusTracking } from './lib/core/focus'
startFocusTracking()

// ── Provenance: remember every real app→app transfer durably (EPIC-6 memory) ──
import { startProvenanceTracking } from './lib/core/provenance'
startProvenanceTracking()

// Apply saved theme immediately (before React hydration) to prevent flash
try {
  const saved = localStorage.getItem('empire-store')
  if (saved) {
    const parsed = JSON.parse(saved)
    if (parsed.state?.theme) {
      document.documentElement.setAttribute('data-theme', parsed.state.theme)
    }
  }
} catch { /* ignore */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* basename must mirror Vite's `base` so routes resolve under a sub-path.
        On GitHub Pages the app is served from /empire/, so without this the
        router matches '/empire/' against '/' and renders nothing (blank page).
        import.meta.env.BASE_URL is '/empire/' on Pages and '/' for the Termux
        server, DeX desktop and the Capacitor APK — correct in every target. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>
)