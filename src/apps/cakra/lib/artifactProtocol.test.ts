import { describe, expect, it } from 'vitest'
import {
  parseArtifactSegments,
  hasArtifacts,
  ARTIFACT_SYSTEM_PROMPT,
  type Segment,
} from './artifactProtocol'

const FENCE = '````'

function artifactsOf(segments: Segment[]) {
  return segments.filter(s => s.kind === 'artifact').map(s => s.artifact)
}

describe('parseArtifactSegments', () => {
  it('returns a single text segment for plain messages', () => {
    const segs = parseArtifactSegments('Hello, just words.\nTwo lines.')
    expect(segs).toEqual([{ kind: 'text', text: 'Hello, just words.\nTwo lines.' }])
  })

  it('parses a complete html artifact with surrounding text', () => {
    const msg = [
      'Here you go:',
      `${FENCE}artifact type=html title="Pomodoro Timer"`,
      '<!doctype html>',
      '<h1>Tick</h1>',
      FENCE,
      'Enjoy!',
    ].join('\n')
    const segs = parseArtifactSegments(msg)
    expect(segs.map(s => s.kind)).toEqual(['text', 'artifact', 'text'])
    const [art] = artifactsOf(segs)
    expect(art).toEqual({
      type: 'html',
      title: 'Pomodoro Timer',
      content: '<!doctype html>\n<h1>Tick</h1>',
      complete: true,
    })
  })

  it('marks an unclosed fence as incomplete (mid-stream)', () => {
    const msg = `Building…\n${FENCE}artifact type=html title="WIP"\n<div>half`
    const [art] = artifactsOf(parseArtifactSegments(msg))
    expect(art.complete).toBe(false)
    expect(art.content).toBe('<div>half')
  })

  it('keeps nested 3-backtick fences inside a markdown artifact body', () => {
    const msg = [
      `${FENCE}artifact type=markdown title="Guide"`,
      '# Setup',
      '```js',
      'console.log(1)',
      '```',
      'Done.',
      FENCE,
    ].join('\n')
    const [art] = artifactsOf(parseArtifactSegments(msg))
    expect(art.complete).toBe(true)
    expect(art.content).toContain('```js')
    expect(art.content).toContain('console.log(1)')
    expect(art.content.endsWith('Done.')).toBe(true)
  })

  it('parses multiple artifacts in one message', () => {
    const msg = [
      'First:',
      `${FENCE}artifact type=svg title="Logo"`,
      '<svg></svg>',
      FENCE,
      'Second:',
      `${FENCE}artifact type=markdown title="Notes"`,
      'hello',
      FENCE,
    ].join('\n')
    const arts = artifactsOf(parseArtifactSegments(msg))
    expect(arts.map(a => a.type)).toEqual(['svg', 'markdown'])
    expect(arts.every(a => a.complete)).toBe(true)
  })

  it('handles CRLF line endings', () => {
    const msg = `intro\r\n${FENCE}artifact type=html title="CRLF"\r\n<p>hi</p>\r\n${FENCE}\r\nafter`
    const segs = parseArtifactSegments(msg)
    const [art] = artifactsOf(segs)
    expect(art.complete).toBe(true)
    expect(art.content).toBe('<p>hi</p>')
  })

  it('accepts bare-word and quoted attribute values, md alias, and defaults', () => {
    const bare = artifactsOf(parseArtifactSegments(`${FENCE}artifact type=md title=Notes\nx\n${FENCE}`))[0]
    expect(bare.type).toBe('markdown')
    expect(bare.title).toBe('Notes')
    const untitled = artifactsOf(parseArtifactSegments(`${FENCE}artifact type=svg\n<svg/>\n${FENCE}`))[0]
    expect(untitled.title).toBe('Untitled artifact')
  })

  it('passes unknown or missing type through as plain text', () => {
    const msg = `${FENCE}artifact type=python title="Nope"\nprint(1)\n${FENCE}`
    const segs = parseArtifactSegments(msg)
    expect(segs).toHaveLength(1)
    expect(segs[0].kind).toBe('text')
    expect(hasArtifacts(msg)).toBe(false)
  })

  it('does not close a 4-tick fence on a shorter backtick run', () => {
    const msg = `${FENCE}artifact type=markdown title="Open"\n\`\`\`\nstill body\n`
    const [art] = artifactsOf(parseArtifactSegments(msg))
    expect(art.complete).toBe(false)
    expect(art.content).toContain('still body')
  })

  it('drops whitespace-only text segments around artifacts', () => {
    const msg = `\n${FENCE}artifact type=html title="Solo"\n<p/>\n${FENCE}\n  \n`
    const segs = parseArtifactSegments(msg)
    expect(segs).toHaveLength(1)
    expect(segs[0].kind).toBe('artifact')
  })
})

describe('ARTIFACT_SYSTEM_PROMPT', () => {
  it('teaches the four-backtick fence and the three types', () => {
    expect(ARTIFACT_SYSTEM_PROMPT).toContain('````artifact')
    for (const t of ['html', 'svg', 'markdown']) expect(ARTIFACT_SYSTEM_PROMPT).toContain(t)
  })
})
