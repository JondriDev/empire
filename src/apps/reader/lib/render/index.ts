/**
 * Renderer dispatch — lazily imports the right format renderer so the heavy
 * libs (pdf.js, epub.js, mammoth) stay out of the initial bundle and only load
 * when a book of that format is actually opened.
 */
import type { BookRenderer, BookFormat } from '../types'

export async function getRenderer(format: BookFormat): Promise<BookRenderer> {
  switch (format) {
    case 'epub': return (await import('./epub')).epubRenderer
    case 'pdf':  return (await import('./pdf')).pdfRenderer
    case 'txt':
    case 'md':
    case 'docx': return (await import('./text')).makeTextRenderer(format)
  }
}

/** Best-effort title/author/cover for the library, extracted at import time. */
export async function extractMeta(
  blob: Blob,
  format: BookFormat,
  fileName: string,
): Promise<{ title?: string; author?: string; cover?: string }> {
  const fallbackTitle = fileName.replace(/\.[^.]+$/, '')
  if (format === 'epub') {
    const { extractEpubMeta } = await import('./epub')
    const meta = await extractEpubMeta(blob)
    return { title: meta.title || fallbackTitle, author: meta.author, cover: meta.cover }
  }
  return { title: fallbackTitle }
}
