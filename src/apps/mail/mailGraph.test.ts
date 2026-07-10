import { describe, it, expect } from 'vitest'
import { draftNodeData } from './mailGraph'
import type { Draft } from './lib/draftStore'

const draft = (over: Partial<Draft> = {}): Draft => ({
  id: 'd1', to: 'a@b.co', subject: 'Q3 report', body: 'body text', updatedAt: 1,
  ...over,
})

describe('draftNodeData', () => {
  it('carries durable metadata only (subject + recipient)', () => {
    expect(draftNodeData(draft())).toEqual({ subject: 'Q3 report', to: 'a@b.co' })
  })

  it('does NOT leak the body into the node payload (it rides the store/title)', () => {
    expect(draftNodeData(draft({ body: 'secret long body' }))).not.toHaveProperty('body')
  })

  it('preserves an empty subject / recipient verbatim', () => {
    expect(draftNodeData(draft({ subject: '', to: '' }))).toEqual({ subject: '', to: '' })
  })
})
