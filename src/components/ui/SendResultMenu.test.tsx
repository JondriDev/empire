import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SendResultMenu } from './SendResultMenu'
import { onAny, clearHistory, type EmpireEvent } from '../../lib/eventBus'

beforeEach(() => {
  clearHistory()
  // The send executors navigate via window.open('_self'); stub it in jsdom.
  vi.spyOn(window, 'open').mockReturnValue(null)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SendResultMenu', () => {
  it('running a menu action emits a HANDOFF whose fromId is the sink app', () => {
    const events: EmpireEvent[] = []
    const off = onAny(e => events.push(e))

    render(<SendResultMenu source="editor" text="const x = 1" label="Send code to…" />)
    // Open the dropdown, then run the "Use as Prompt" action (SEND_TO_PROMPT_GEN).
    fireEvent.click(screen.getByRole('button', { name: 'Send code to…' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Use as Prompt/i }))
    off()

    const handoff = events.find(e => e.type === 'HANDOFF')
    expect(handoff).toBeDefined()
    // The arc is sourced at the sink that re-injected its output — loop closed.
    expect(handoff && handoff.type === 'HANDOFF' && handoff.fromId).toBe('editor')
    expect(handoff && handoff.type === 'HANDOFF' && handoff.toId).toBe('prompt-generator')
  })

  it('never offers to send back to its own app (no self-handoff)', () => {
    // token-counter must not list "Count Tokens" (SEND_TO_TOKEN_COUNTER).
    render(<SendResultMenu source="token-counter" text="hello world" label="Send text to…" />)
    fireEvent.click(screen.getByRole('button', { name: 'Send text to…' }))
    expect(screen.queryByRole('menuitem', { name: /Count Tokens/i })).toBeNull()
    expect(screen.getByRole('menuitem', { name: /Send to Notes/i })).toBeTruthy()
  })

  it('is disabled when there is nothing to send', () => {
    render(<SendResultMenu source="ai-chat" text="   " label="Send reply to…" />)
    const btn = screen.getByRole('button', { name: 'Send reply to…' }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
    // Opening a disabled trigger renders no menu.
    fireEvent.click(btn)
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
