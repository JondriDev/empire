import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// ── Hermes Empire: AI Connector auto-init ────────────────────────────────────
// Import order matters: automation must init before any component renders
import './lib/automation'

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