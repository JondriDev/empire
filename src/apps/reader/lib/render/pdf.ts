/**
 * PDF renderer (pdf.js v6) — lazily renders page canvases in a scroll column,
 * with a transparent text layer over each page so the reader can select text and
 * "Ask Cakra". Position is the current page; progress is page / total.
 */
import { getDocument, GlobalWorkerOptions, Util } from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { BookRenderer, ReaderHandle, MountOptions } from '../types'

GlobalWorkerOptions.workerSrc = workerUrl

async function renderPage(page: PDFPageProxy, host: HTMLElement, scale: number): Promise<void> {
  if (host.dataset.rendered === '1') return
  host.dataset.rendered = '1'
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const ratio = window.devicePixelRatio || 1
  canvas.width = Math.floor(viewport.width * ratio)
  canvas.height = Math.floor(viewport.height * ratio)
  canvas.style.width = '100%'
  canvas.style.height = 'auto'
  host.appendChild(canvas)
  await (page as any).render({ canvasContext: ctx, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined }).promise

  // Transparent, selectable text layer.
  try {
    const textContent = await page.getTextContent()
    const layer = document.createElement('div')
    layer.className = 'reader-pdf-textlayer'
    Object.assign(layer.style, {
      position: 'absolute', inset: '0', overflow: 'hidden', lineHeight: '1',
      color: 'transparent', userSelect: 'text',
    } as CSSStyleDeclaration)
    const scaleX = 1 / viewport.width * 100
    const scaleY = 1 / viewport.height * 100
    for (const item of textContent.items as any[]) {
      if (!item.str) continue
      const tx = Util.transform(viewport.transform, item.transform)
      const fontHeight = Math.hypot(tx[2], tx[3])
      const span = document.createElement('span')
      span.textContent = item.str
      Object.assign(span.style, {
        position: 'absolute',
        left: `${tx[4] * scaleX}%`,
        top: `${(tx[5] - fontHeight) * scaleY}%`,
        fontSize: `${fontHeight}px`,
        whiteSpace: 'pre',
        transformOrigin: '0% 0%',
      } as CSSStyleDeclaration)
      layer.appendChild(span)
    }
    host.appendChild(layer)
  } catch { /* text layer is best-effort; reading still works without it */ }
}

export const pdfRenderer: BookRenderer = {
  async mount(container: HTMLElement, blob: Blob, opts: MountOptions): Promise<ReaderHandle> {
    const data = new Uint8Array(await blob.arrayBuffer())
    const loadingTask = getDocument({ data })
    const pdf: PDFDocumentProxy = await loadingTask.promise
    const total = pdf.numPages
    const scale = 1.4

    const col = document.createElement('div')
    col.className = 'reader-pdf-col'
    container.appendChild(col)

    const hosts: HTMLElement[] = []
    for (let n = 1; n <= total; n++) {
      const host = document.createElement('div')
      host.className = 'reader-pdf-page'
      host.style.position = 'relative'
      host.dataset.page = String(n)
      col.appendChild(host)
      hosts.push(host)
    }

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const n = Number((e.target as HTMLElement).dataset.page)
          pdf.getPage(n).then(p => renderPage(p, e.target as HTMLElement, scale)).catch(() => {})
        }
      }
    }, { root: container, rootMargin: '600px 0px' })
    hosts.forEach(h => io.observe(h))

    const gotoPage = (n: number) => {
      const host = hosts[Math.max(0, Math.min(total - 1, n - 1))]
      host?.scrollIntoView({ block: 'start' })
    }
    if (opts.position) {
      const n = parseInt(opts.position.replace(/^p:/, ''), 10)
      if (Number.isFinite(n)) requestAnimationFrame(() => gotoPage(n))
    }

    // Track current page (most visible) for position + progress.
    let current = 1
    let scrollTimer: number | undefined
    const computeCurrent = () => {
      const mid = container.scrollTop + container.clientHeight / 2
      let best = 1
      for (const h of hosts) {
        if (h.offsetTop <= mid) best = Number(h.dataset.page)
        else break
      }
      if (best !== current) {
        current = best
        opts.onPosition?.(`p:${current}`, current / total)
      }
    }
    const onScroll = () => { window.clearTimeout(scrollTimer); scrollTimer = window.setTimeout(computeCurrent, 180) }
    container.addEventListener('scroll', onScroll, { passive: true })

    const reportSelection = () => {
      const text = window.getSelection()?.toString() ?? ''
      if (text.trim()) opts.onSelect?.(text)
    }
    container.addEventListener('mouseup', reportSelection)
    container.addEventListener('touchend', reportSelection)

    return {
      destroy() {
        io.disconnect()
        container.removeEventListener('scroll', onScroll)
        container.removeEventListener('mouseup', reportSelection)
        container.removeEventListener('touchend', reportSelection)
        window.clearTimeout(scrollTimer)
        try { loadingTask.destroy() } catch { /* ignore */ }
        col.remove()
      },
      getSelection: () => window.getSelection()?.toString() ?? '',
      next() { gotoPage(current + 1) },
      prev() { gotoPage(current - 1) },
      goto(position: string) {
        const n = parseInt(position.replace(/^p:/, ''), 10)
        if (Number.isFinite(n)) gotoPage(n)
      },
    }
  },
}
