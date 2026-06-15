import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Desktop from './components/Desktop'
import Dashboard from './dashboard/Dashboard'
import AppShell from './dashboard/AppShell'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { appComponents } from './lib/appComponents'

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Desktop OS mode — the primary experience */}
        <Route path="/" element={<Desktop />} />

        {/* Legacy route-based mode — accessible via direct URL */}
        <Route path="/app/:appId" element={<AppShell appMap={appComponents} />} />

        {/* Old dashboard (accessible via /dashboard) */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  )
}
