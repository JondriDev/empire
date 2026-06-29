/**
 * EPUB renderer (epub.js) — reflowable, paginated, with text selection wired to
 * "Ask Cakra", CFI-based position, and day/sepia/night reading themes applied to
 * the book's iframe (which our page CSS can't reach).
 */
import ePub from 'epubjs'
import type { BookRenderer, ReaderHandle, MountOptions } from '../types'

const THEME_STYLES: Record<string, Record<string, Record<string, string>>> = {
  day:   { body: { color: '#1a1a1a', background: '#ffffff' } },
  sepia: { body: { color: '#4b3a26', background: '#f4ecd8' } },
  night: { body: { color: '#cdd6e3', background: '#0b1020' } },
}

export const epubRenderer: BookRenderer = {
  async mount(container: HTMLElement, blob: Blob, opts: MountOptions): Promise<ReaderHandle> {
    const buf = await blob.arrayBuffer()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const book: any = ePub(buf)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rendition: any = book.renderTo(container, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      spread: 'none',
      allowScriptedContent: false,
    })

    const theme = opts.theme || 'night'
    rendition.themes.register('reader', { body: THEME_STYLES[theme]?.body || THEME_STYLES.night.body })
    rendition.themes.select('reader')
    rendition.themes.fontSize(`${Math.round(100 * (opts.fontScale ?? 1))}%`)

    await rendition.display(opts.position || undefined)

    rendition.on('relocated', (loc: { start?: { cfi?: string; percentage?: number } }) => {
      const cfi = loc?.start?.cfi
      if (cfi) opts.onPosition?.(cfi, loc.start?.percentage ?? 0)
    })
    rendition.on('selected', (cfiRange: string) => {
      book.getRange(cfiRange).then((range: Range | null) => {
        const text = range?.toString() ?? ''
        if (text.trim()) opts.onSelect?.(text)
      }).catch(() => { /* ignore */ })
    })

    // Better progress %: generate locations in the background (non-blocking).
    book.ready.then(() => book.locations.generate(1600)).catch(() => { /* ignore */ })

    const onResize = () => { try { rendition.resize() } catch { /* ignore */ } }
    const ro = new ResizeObserver(onResize)
    ro.observe(container)

    return {
      destroy() {
        ro.disconnect()
        try { rendition.destroy() } catch { /* ignore */ }
        try { book.destroy() } catch { /* ignore */ }
      },
      getSelection() {
        try { return rendition.getContents()?.[0]?.window?.getSelection?.()?.toString() ?? '' }
        catch { return '' }
      },
      next() { rendition.next() },
      prev() { rendition.prev() },
      goto(position: string) { rendition.display(position) },
      setTheme(t) {
        const b = THEME_STYLES[t]?.body || THEME_STYLES.night.body
        try { rendition.themes.override('color', b.color); rendition.themes.override('background', b.background) }
        catch { /* ignore */ }
      },
      setFontScale(s) { try { rendition.themes.fontSize(`${Math.round(100 * s)}%`) } catch { /* ignore */ } },
    }
  },
}

/** Pull title/author/cover from an EPUB at import time (best-effort). */
export async function extractEpubMeta(blob: Blob): Promise<{ title?: string; author?: string; cover?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const book: any = ePub(await blob.arrayBuffer())
    await book.ready
    const meta = await book.loaded.metadata
    let cover: string | undefined
    try {
      const url = await book.coverUrl()
      if (url) cover = url
    } catch { /* no cover */ }
    const out = { title: meta?.title || undefined, author: meta?.creator || undefined, cover }
    return out
  } catch {
    return {}
  }
}
