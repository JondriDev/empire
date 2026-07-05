import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Desktop from './components/Desktop'
import AppShell from './components/AppShell'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { appComponents } from './lib/appComponents'

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Desktop OS mode — the primary experience */}
        <Route path="/" element={<Desktop />} />

        {/* Route-based mode — direct URL / deep links */}
        <Route path="/app/:appId" element={<AppShell appMap={appComponents} />} />
      </Routes>
    </Suspense>
  )
}
