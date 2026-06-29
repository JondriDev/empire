/**
 * Text surface — renders TXT, Markdown, and DOCX into a scrollable article.
 * Markdown via `marked`, DOCX via `mammoth`, all sanitized with DOMPurify.
 * Selection + scroll position are reported back for "Ask Cakra" + resume.
 */
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { BookRenderer, ReaderHandle, MountOptions, BookFormat } from '../types'

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ))
}

async function toHtml(blob: Blob, format: BookFormat): Promise<string> {
  if (format === 'docx') {
    const mammoth = await import('mammoth')
    const { value } = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() })
    return DOMPurify.sanitize(value)
  }
  const text = await blob.text()
  if (format === 'md') {
    const html = marked.parse(text, { async: false }) as string
    return DOMPurify.sanitize(html)
  }
  // txt — preserve paragraphs, escape everything
  const paras = text.split(/\n{2,}/).map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
  return paras.join('\n')
}

export function makeTextRenderer(format: BookFormat): BookRenderer {
  return {
    async mount(container: HTMLElement, blob: Blob, opts: MountOptions): Promise<ReaderHandle> {
      const html = await toHtml(blob, format)
      const article = document.createElement('article')
      article.className = 'reader-prose'
      article.innerHTML = html
      container.appendChild(article)

      // Restore scroll position (stored as a 0..1 fraction).
      if (opts.position) {
        const frac = parseFloat(opts.position)
        if (Number.isFinite(frac)) {
          requestAnimationFrame(() => {
            container.scrollTop = frac * (container.scrollHeight - container.clientHeight)
          })
        }
      }

      const reportPosition = () => {
        const max = container.scrollHeight - container.clientHeight
        const frac = max > 0 ? container.scrollTop / max : 0
        opts.onPosition?.(String(frac), Math.max(0, Math.min(1, frac)))
      }
      const reportSelection = () => {
        const sel = window.getSelection()
        const text = sel?.toString() ?? ''
        if (text.trim()) opts.onSelect?.(text)
      }

      let scrollTimer: number | undefined
      const onScroll = () => {
        window.clearTimeout(scrollTimer)
        scrollTimer = window.setTimeout(reportPosition, 200)
      }
      container.addEventListener('scroll', onScroll, { passive: true })
      container.addEventListener('mouseup', reportSelection)
      container.addEventListener('touchend', reportSelection)

      return {
        destroy() {
          container.removeEventListener('scroll', onScroll)
          container.removeEventListener('mouseup', reportSelection)
          container.removeEventListener('touchend', reportSelection)
          window.clearTimeout(scrollTimer)
          article.remove()
        },
        getSelection: () => window.getSelection()?.toString() ?? '',
        next() { container.scrollBy({ top: container.clientHeight * 0.9, behavior: 'smooth' }) },
        prev() { container.scrollBy({ top: -container.clientHeight * 0.9, behavior: 'smooth' }) },
        goto(position: string) {
          const frac = parseFloat(position)
          if (Number.isFinite(frac)) {
            container.scrollTop = frac * (container.scrollHeight - container.clientHeight)
          }
        },
      }
    },
  }
}
