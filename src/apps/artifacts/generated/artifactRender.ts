/**
 * artifactRender — turns UNTRUSTED generated artifact content into a srcDoc
 * for the sandboxed preview iframe (ArtifactFrame).
 *
 * Security model (must hold for every artifact type):
 *  • The returned document always carries a CSP <meta> that denies all
 *    network fetches (`default-src 'none'`) — only inline script/style and
 *    data:/blob: images may run.
 *  • svg and markdown are sanitized with DOMPurify before embedding, so
 *    script tags / event handlers never survive even inside the sandbox.
 *  • html is embedded as-is (that's the point of an interactive artifact) —
 *    it is contained solely by the iframe `sandbox="allow-scripts"` +
 *    this CSP; it never touches the app document.
 *
 * The shell styles below use CSS *system* colors (Canvas/CanvasText via
 * `color-scheme`) and relative `em` sizing on purpose: the iframe is an
 * opaque origin and cannot resolve the app's design tokens, and system
 * colors keep this file clean under scripts/metrics.mjs conformance.
 */
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { ArtifactType } from '../../cakra/lib/artifactProtocol'

export const ARTIFACT_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:;"

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${ARTIFACT_CSP}">`

const BASE_CSS =
  ':root{color-scheme:dark light}' +
  'body{margin:0;font-family:system-ui,sans-serif;background:Canvas;color:CanvasText}'

const MARKDOWN_CSS =
  'main{max-width:42em;margin:0 auto;padding:1.5em 1.25em;line-height:1.65;overflow-wrap:break-word}' +
  'h1{font-size:1.6em}h2{font-size:1.35em}h3{font-size:1.15em}' +
  'pre{overflow-x:auto;padding:1em;background:color-mix(in srgb,CanvasText 8%,Canvas)}' +
  'code{font-family:ui-monospace,monospace;font-size:0.92em}' +
  'img{max-width:100%}a{color:LinkText}' +
  'table{border-collapse:collapse}th,td{border:1px solid color-mix(in srgb,CanvasText 25%,Canvas);padding:0.4em 0.6em}' +
  'blockquote{border-left:3px solid color-mix(in srgb,CanvasText 30%,Canvas);margin:1em 0;padding:0 0 0 1em;opacity:0.9}'

const SVG_CSS =
  'body{display:grid;place-items:center;min-height:100vh;padding:1em;box-sizing:border-box}' +
  'svg{max-width:100%;max-height:90vh;height:auto}'

/** Wrap a trusted-by-now body in a minimal document that carries the CSP. */
function shell(body: string, extraCss = ''): string {
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    CSP_META +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<style>${BASE_CSS}${extraCss}</style></head><body>${body}</body></html>`
  )
}

/**
 * Force the CSP meta into model-authored HTML. It must precede any script,
 * so it goes right after <head> when present, otherwise right after the
 * doctype/<html> opener (the HTML parser hoists leading metadata into the
 * implied head), otherwise the fragment is wrapped in our shell.
 */
function injectCsp(html: string): string {
  const head = /<head[^>]*>/i.exec(html)
  if (head) {
    const at = head.index + head[0].length
    return html.slice(0, at) + CSP_META + html.slice(at)
  }
  const opener = /<!doctype[^>]*>|<html[^>]*>/i.exec(html)
  if (opener) {
    const at = opener.index + opener[0].length
    return html.slice(0, at) + CSP_META + html.slice(at)
  }
  return shell(html)
}

/** Build the complete iframe srcDoc for an artifact. Never throws. */
export function buildArtifactSrcDoc(artifact: { type: ArtifactType; content: string }): string {
  switch (artifact.type) {
    case 'html':
      return injectCsp(artifact.content)
    case 'svg': {
      const clean = DOMPurify.sanitize(artifact.content, {
        USE_PROFILES: { svg: true, svgFilters: true },
      })
      return shell(clean, SVG_CSS)
    }
    case 'markdown': {
      const html = marked.parse(artifact.content, { async: false }) as string
      return shell(`<main>${DOMPurify.sanitize(html)}</main>`, MARKDOWN_CSS)
    }
  }
}
