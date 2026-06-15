/**
 * Shared utility functions for the Empire suite.
 * Extract common logic here to avoid duplication across apps.
 */

/**
 * Format a byte count into a human-readable string (e.g., "1.5 KB", "2.3 MB").
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Type-safe event handler type for addEventListener/removeEventListener
 * that avoids the need for `as any` casts on document event listeners.
 */
export type DocumentEventHandler<E extends Event = Event> = (e: E) => void

/**
 * Clamp a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
