/** Reader — shared types for books, highlights, and renderers. */

export type BookFormat = 'epub' | 'pdf' | 'txt' | 'md' | 'docx'

export interface Highlight {
  id: string
  text: string
  note?: string
  /** Format-specific anchor: epub CFI, or `p:<n>` for pdf, or `o:<offset>` for text. */
  anchor?: string
  createdAt: number
  color?: string
}

export interface BookMeta {
  id: string
  title: string
  author?: string
  format: BookFormat
  /** Small data-URL cover for the library grid (optional). */
  cover?: string
  size: number
  addedAt: number
  /** Serialized reading position (format-specific: CFI string, page number, or scroll fraction). */
  position?: string
  /** 0..1 reading progress for the library bar. */
  progress?: number
  /** Last time the book was opened (for sort + resume). */
  lastReadAt?: number
  highlights: Highlight[]
}

/** A live reading surface mounted into a container. One per open book. */
export interface ReaderHandle {
  /** Tear down listeners / object URLs / iframes. */
  destroy(): void
  /** The currently-selected text in the reading surface ('' if none). */
  getSelection(): string
  /** Paginated formats: turn the page (no-op for scrolled formats). */
  next(): void
  prev(): void
  /** Jump to a previously-saved position. */
  goto(position: string): void
  /** Live reading-theme change without a re-mount (iframe/paginated formats).
   *  Omitted by formats the page CSS can already restyle (text, pdf). */
  setTheme?(theme: 'day' | 'sepia' | 'night'): void
  setFontScale?(scale: number): void
}

export interface MountOptions {
  /** Restore to this saved position on mount. */
  position?: string
  /** Reading typography (applied where the format allows it). */
  fontScale?: number
  /** Reading theme: day / sepia / night (independent of the OS theme). */
  theme?: 'day' | 'sepia' | 'night'
  /** Called as the reader moves, to persist position + progress. */
  onPosition?: (position: string, progress: number) => void
  /** Called when the user selects text (for the "Ask Cakra" affordance). */
  onSelect?: (text: string) => void
}

/** Every format renderer implements this. Lazy-loaded so heavy libs (pdf/epub)
 *  stay out of the initial bundle. */
export interface BookRenderer {
  mount(container: HTMLElement, blob: Blob, opts: MountOptions): Promise<ReaderHandle>
}

/** Detect a book format from a filename + mime type. */
export function detectFormat(name: string, mime?: string): BookFormat | null {
  const ext = (name.split('.').pop() || '').toLowerCase()
  if (ext === 'epub' || mime === 'application/epub+zip') return 'epub'
  if (ext === 'pdf' || mime === 'application/pdf') return 'pdf'
  if (ext === 'md' || ext === 'markdown') return 'md'
  if (ext === 'txt' || ext === 'text' || mime === 'text/plain') return 'txt'
  if (ext === 'docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx'
  return null
}

export const FORMAT_LABEL: Record<BookFormat, string> = {
  epub: 'EPUB', pdf: 'PDF', txt: 'Text', md: 'Markdown', docx: 'Word',
}

/** Accept attribute for the import file picker. */
export const READER_ACCEPT = '.epub,.pdf,.txt,.md,.markdown,.docx,application/epub+zip,application/pdf,text/plain'
