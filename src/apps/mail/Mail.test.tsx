import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Mail from './Mail'

/**
 * Mail mount resilience + inbound handoff (EPIC-13 S2).
 *
 * (1) The boot effect fetches `/api/integrations/status`. In the cloud sandbox
 * (and any unauthenticated client) that endpoint answers HTTP 401 whose JSON
 * body has NO `providers` key. The provider toggle must guard on
 * `status?.providers`, not merely `status` — otherwise the ✓/· indicators throw
 * on `undefined`. (2) Mail is a handoff RECEIVER: a seeded
 * `empire-mail-clipboard` payload must open the composer prefilled and render a
 * dismissible ProvenanceChip.
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
    // Provider buttons still render (fixed labels)…
    expect(screen.getByRole('button', { name: /Himalaya/ })).toBeTruthy()
    // …but with no ✓/· configured indicator, since `status.providers` was absent.
    await waitFor(() => expect(screen.queryByText('✓')).toBeNull())
  })

  it('shows a configured indicator on each provider when the status carries providers', async () => {
    stubStatus({ providers: { himalaya: { configured: true }, agentmail: { configured: false } } })
    render(<Mail />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Himalaya\s*✓/ })).toBeTruthy(),
    )
    expect(screen.getByRole('button', { name: /AgentMail\s*·/ })).toBeTruthy()
  })
})

describe('Mail — inbound handoff opens the composer prefilled (INBOUND-LANDS)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reads empire-mail-clipboard on mount → composer prefilled + ProvenanceChip', async () => {
    // The status fetch is irrelevant here; stub it so the mount effect settles.
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ json: () => Promise.resolve({}) } as Response)))
    // setup.ts mocks sessionStorage as a bare vi.fn() (nothing persists), so we
    // must spy getItem to seed the handoff the way SEND_TO_MAIL would write it.
    vi.spyOn(window.sessionStorage, 'getItem').mockImplementation((k: string) =>
      k === 'empire-mail-clipboard'
        ? JSON.stringify({ subject: 'Q3 report', body: 'Please review the Q3 report', from: 'notes' })
        : null,
    )

    render(<Mail />)

    // Composer opens and prefills from the payload (RED without useInboundHandoff).
    await waitFor(() => expect((screen.getByPlaceholderText('subject') as HTMLInputElement).value).toBe('Q3 report'))
    expect((screen.getByPlaceholderText('body') as HTMLTextAreaElement).value).toBe('Please review the Q3 report')
    // Provenance is honest and visible.
    expect(screen.getByLabelText('Received from Notes')).toBeTruthy()
  })
})
