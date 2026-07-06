import { describe, expect, it } from 'vitest'
import { ARTIFACT_CSP, buildArtifactSrcDoc } from './artifactRender'

const CSP_NEEDLE = 'http-equiv="Content-Security-Policy"'

describe('buildArtifactSrcDoc — html', () => {
  it('injects the CSP meta inside an existing <head>', () => {
    const doc = buildArtifactSrcDoc({
      type: 'html',
      content: '<!doctype html><html><head><title>x</title></head><body>hi</body></html>',
    })
    expect(doc).toContain(CSP_NEEDLE)
    expect(doc.indexOf(CSP_NEEDLE)).toBeLessThan(doc.indexOf('<title>'))
    // Original content is preserved verbatim (html is sandbox-contained, not sanitized).
    expect(doc).toContain('<body>hi</body>')
  })

  it('injects the CSP right after the doctype when there is no <head>', () => {
    const doc = buildArtifactSrcDoc({
      type: 'html',
      content: '<!doctype html>\n<h1>bare</h1><script>1</script>',
    })
    expect(doc).toContain(CSP_NEEDLE)
    expect(doc.indexOf(CSP_NEEDLE)).toBeLessThan(doc.indexOf('<script>'))
  })

  it('wraps a bare fragment in a full document carrying the CSP', () => {
    const doc = buildArtifactSrcDoc({ type: 'html', content: '<button>go</button>' })
    expect(doc.startsWith('<!doctype html>')).toBe(true)
    expect(doc).toContain(CSP_NEEDLE)
    expect(doc).toContain('<button>go</button>')
  })

  it('CSP denies all network by default', () => {
    expect(ARTIFACT_CSP).toContain("default-src 'none'")
    expect(ARTIFACT_CSP).not.toContain('http')
  })
})

describe('buildArtifactSrcDoc — svg', () => {
  it('strips script tags and event handlers but keeps the drawing', () => {
    const doc = buildArtifactSrcDoc({
      type: 'svg',
      content:
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script>' +
        '<circle cx="5" cy="5" r="4" onclick="alert(2)"/></svg>',
    })
    expect(doc).toContain(CSP_NEEDLE)
    expect(doc).toContain('<circle')
    expect(doc).not.toContain('<script>')
    expect(doc).not.toContain('onclick')
    expect(doc).not.toContain('alert')
  })
})

describe('buildArtifactSrcDoc — markdown', () => {
  it('renders markdown to sanitized html in a shell with the CSP', () => {
    const doc = buildArtifactSrcDoc({
      type: 'markdown',
      content: '# Title\n\nSome *emphasis* and <script>alert(1)</script>.',
    })
    expect(doc).toContain(CSP_NEEDLE)
    expect(doc).toContain('<h1>Title</h1>')
    expect(doc).toContain('<em>emphasis</em>')
    expect(doc).not.toContain('<script>')
  })

  it('keeps fenced code blocks as <pre><code>', () => {
    const doc = buildArtifactSrcDoc({
      type: 'markdown',
      content: '```js\nconsole.log(1)\n```',
    })
    expect(doc).toContain('<pre>')
    expect(doc).toContain('console.log(1)')
  })
})
