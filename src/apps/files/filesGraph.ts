/**
 * Files → Core graph: session-accumulating mirror logic (pure, testable).
 *
 * The Files browser shows ONE directory at a time, but `mirrorCollection` has
 * exact/prune semantics — it deletes every `file` node whose id isn't in the
 * batch it's handed. Mirroring only the current directory therefore *dropped*
 * every file from previously-visited folders the moment you navigated, so the
 * organism's graph never saw more than a single directory.
 *
 * The fix: accumulate the files seen across every directory visited in this
 * session into a union, keyed by path, and mirror the whole union. Navigating
 * now ADDS to the graph instead of resetting it; re-visiting a directory updates
 * its entries in place (dedupe by path). The union is held in component state
 * (a ref) so it is naturally bounded to one session and self-cleans on reload —
 * a fresh mount starts empty, and the first `mirrorCollection` prunes any stale
 * `file` nodes left in the persisted graph from a prior session.
 *
 * Folders are NOT graph-worthy (only real files join the organism), so they are
 * excluded here, exactly as the previous inline filter did.
 */

/** The minimal shape of a directory entry this module needs. */
export interface FileLike {
  name: string
  path: string
  size: number
  extension: string
  isDirectory: boolean
}

/** A graph-worthy file accumulated across the session, keyed by its path. */
export interface AccumulatedFile {
  name: string
  path: string
  size: number
  extension: string
  /** Parent directory the file was discovered in (its `dir` in the node data). */
  dir: string
}

/** The parent directory of a path (`/a/b/c.txt` → `/a/b`; root-safe). */
export function dirOf(path: string): string {
  const i = path.lastIndexOf('/')
  if (i <= 0) return '/'
  return path.slice(0, i)
}

/**
 * Merge a directory listing into the running session union.
 *
 * Returns a NEW map (immutable — never mutates `prev`) containing every file
 * already accumulated PLUS the real files in `entries`. Directories are skipped.
 * A file whose path is already known is replaced with its latest metadata
 * (size/extension can change between visits), so re-listing a directory updates
 * in place rather than duplicating.
 */
export function accumulateFiles(
  prev: Map<string, AccumulatedFile>,
  entries: FileLike[],
): Map<string, AccumulatedFile> {
  const next = new Map(prev)
  for (const e of entries) {
    if (e.isDirectory) continue
    next.set(e.path, {
      name: e.name,
      path: e.path,
      size: e.size,
      extension: e.extension,
      dir: dirOf(e.path),
    })
  }
  return next
}

/** The graph-node `data` payload for one accumulated file. */
export function fileNodeData(f: AccumulatedFile): Record<string, unknown> {
  return { path: f.path, size: f.size, extension: f.extension, dir: f.dir }
}
