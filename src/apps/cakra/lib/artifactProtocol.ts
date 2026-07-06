/**
 * Artifact protocol — how Cakra emits Claude-style artifacts in chat.
 *
 * The model wraps an artifact in a FOUR-backtick fence:
 *
 *   ````artifact type=html title="Pomodoro Timer"
 *   <!doctype html>…
 *   ````
 *
 * Four outer backticks let markdown artifacts safely nest ordinary
 * three-backtick code fences (CommonMark: a close run must be ≥ the open
 * run). `parseArtifactSegments` is a line-anchored scanner over the
 * accumulated streamed content, so it is safe to call on every stream
 * tick: an unclosed fence yields `complete: false` (render a
 * "Building artifact…" card), and an unknown type passes through as
 * plain text — malformed output can never break the transcript.
 */

export type ArtifactType = 'html' | 'svg' | 'markdown'

export interface ArtifactSpec {
  type: ArtifactType
  title: string
  content: string
  /** False while the fence is still open (mid-stream or interrupted). */
  complete: boolean
}

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'artifact'; artifact: ArtifactSpec }

/** ````artifact … — 3+ backticks so a sloppy 3-tick emission still parses. */
const OPEN_RE = /^(`{3,})artifact\b(.*)$/
/** key=value pairs; value is bare-word or double-quoted (may hold spaces). */
const ATTR_RE = /(\w+)=(?:"([^"]*)"|(\S+))/g

const TYPE_ALIASES: Record<string, ArtifactType> = {
  html: 'html',
  svg: 'svg',
  markdown: 'markdown',
  md: 'markdown',
}

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  for (const m of raw.matchAll(ATTR_RE)) attrs[m[1]] = m[2] ?? m[3]
  return attrs
}

/**
 * Split a (possibly still-streaming) assistant message into text and
 * artifact segments. Never throws; anything it can't parse stays text.
 */
export function parseArtifactSegments(content: string): Segment[] {
  const segments: Segment[] = []
  // Split keeping content byte-exact; handle CRLF by trimming \r per line.
  const lines = content.split('\n')
  let text: string[] = []

  const flushText = () => {
    if (text.length === 0) return
    const joined = text.join('\n')
    if (joined.trim() !== '') segments.push({ kind: 'text', text: joined })
    text = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '')
    const open = OPEN_RE.exec(line)
    if (!open) {
      text.push(lines[i])
      continue
    }

    const attrs = parseAttrs(open[2])
    const type = TYPE_ALIASES[(attrs.type ?? '').toLowerCase()]
    if (!type) {
      // Unknown/missing type: leave the whole fence as plain text.
      text.push(lines[i])
      continue
    }

    // Scan for the closing run: ≥ as many backticks as the opener, alone
    // on its line (CommonMark close rule). No close ⇒ still streaming.
    const fenceLen = open[1].length
    const body: string[] = []
    let closed = false
    let j = i + 1
    for (; j < lines.length; j++) {
      const l = lines[j].replace(/\r$/, '')
      if (/^`{3,}\s*$/.test(l) && l.trim().length >= fenceLen) {
        closed = true
        break
      }
      body.push(l)
    }

    flushText()
    segments.push({
      kind: 'artifact',
      artifact: {
        type,
        title: attrs.title || 'Untitled artifact',
        content: body.join('\n'),
        complete: closed,
      },
    })
    i = closed ? j : lines.length
  }

  flushText()
  return segments
}

/** True if the message contains (or has started) at least one artifact. */
export function hasArtifacts(content: string): boolean {
  return parseArtifactSegments(content).some(s => s.kind === 'artifact')
}

/**
 * Appended at runtime to Cakra's chat/agent/orchestrator system prompts
 * (never persisted into the user-editable CAKRA_SYSTEM_PROMPT).
 */
export const ARTIFACT_SYSTEM_PROMPT = `

## Artifacts
When the user asks you to build something visual or interactive (a page, widget, diagram, document), emit it as an artifact — a fenced block opened AND closed with exactly four backticks:

\`\`\`\`artifact type=html title="Short Name"
…entire content here…
\`\`\`\`

Rules:
- type is one of: html (interactive pages/apps), svg (static graphics), markdown (documents).
- html artifacts must be ONE self-contained document: inline <style> and <script>, vanilla JS only. No CDN, imports, fetch, or network of any kind — the sandbox blocks all requests.
- localStorage, cookies and other storage APIs are unavailable inside artifacts (sandboxed opaque origin) — keep state in JS variables.
- Prefer markdown for prose/docs, svg for static graphics, html only when interactivity is needed.
- Don't repeat the artifact's code outside the block; briefly say what it does instead.`
