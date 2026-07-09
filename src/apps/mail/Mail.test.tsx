import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Mail from './Mail'

/**
 * Mail mount resilience. The boot effect fetches `/api/integrations/status`.
 * In the cloud sandbox (and for any unauthenticated client) that endpoint
 * answers HTTP 401 whose JSON body has NO `providers` key. The provider-status
 * strip must guard on `status?.providers`, not merely `status` — otherwise
 * `Object.entries(undefined)` throws and the whole app drops into the error
 * boundary. These tests stub fetch to return a providers-less body and assert
 * the header still renders, then confirm the happy path lights the strip.
 */
describe('Mail — mount is resilient to a providers-less status body (401)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  function stubStatus(body: unknown) {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ json: () => Promise.resolve(body) } as Response)),
    )
  }

  it('renders without crashing when the status body has no providers key', async () => {
    // Mirrors the 401 shape: a truthy object, but `providers` is absent.
    stubStatus({ error: 'unauthorized' })
    render(<Mail />)
    // The header controls render regardless of the status response.
    expect(await screen.findByText('Refresh')).toBeTruthy()
    // Let the mount fetch settle, then confirm the provider strip stayed hidden
    // (no crash, no ✓/· glyphs) because `status.providers` was undefined.
    await waitFor(() => expect(screen.queryByText(/=✓|=·/)).toBeNull())
  })

  it('renders the provider strip when the status body carries providers', async () => {
    stubStatus({ providers: { himalaya: { configured: true }, agentmail: { configured: false } } })
    render(<Mail />)
    await waitFor(() =>
      expect(
        screen.getByText((c) => c.includes('himalaya=✓') && c.includes('agentmail=·')),
      ).toBeTruthy(),
    )
  })
})
