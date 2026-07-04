/**
 * Cakra Solver — world feed loader.
 *
 * public/solver/feed.json is maintained by the World-Solver cloud routine:
 * it web-researches catalog problems into cited briefs and appends fresh
 * problems discovered from current events, then commits to main → GitHub
 * Pages redeploys. The client just fetches the static file (same origin, no
 * CORS) and treats it as read-only reference data — importing a feed problem
 * copies it into the local store.
 */

import type { FeedProblem, WorldBrief, WorldFeed } from './types'

export async function fetchWorldFeed(): Promise<WorldFeed | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}solver/feed.json`, { cache: 'no-cache' })
    if (!res.ok) return null
    const raw: unknown = await res.json()
    if (raw === null || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>

    const problems: FeedProblem[] = Array.isArray(r.problems)
      ? (r.problems as unknown[]).flatMap((item) => {
          const p = item as Record<string, unknown>
          if (!p || typeof p.catalogId !== 'string' || typeof p.title !== 'string') return []
          return [{
            catalogId: p.catalogId,
            title: p.title,
            blurb: typeof p.blurb === 'string' ? p.blurb : '',
            category: typeof p.category === 'string' ? p.category : 'General',
            severity: typeof p.severity === 'number' ? p.severity : 3,
            tractability: typeof p.tractability === 'number' ? p.tractability : 3,
            ...(typeof p.discoveredFrom === 'string' ? { discoveredFrom: p.discoveredFrom } : {}),
          } satisfies FeedProblem]
        })
      : []

    const briefs: Record<string, WorldBrief> = {}
    if (r.briefs && typeof r.briefs === 'object' && !Array.isArray(r.briefs)) {
      for (const [key, val] of Object.entries(r.briefs as Record<string, unknown>)) {
        const b = val as Record<string, unknown>
        if (!b || typeof b.summary !== 'string') continue
        briefs[key] = {
          summary: b.summary,
          interventions: Array.isArray(b.interventions)
            ? (b.interventions as unknown[]).flatMap((iv) => {
                const i = iv as Record<string, unknown>
                if (!i || typeof i.title !== 'string') return []
                return [{
                  title: i.title,
                  evidence: typeof i.evidence === 'string' ? i.evidence : '',
                  actor: typeof i.actor === 'string' ? i.actor : '',
                }]
              })
            : [],
          sources: Array.isArray(b.sources) ? (b.sources as unknown[]).filter((s): s is string => typeof s === 'string') : [],
          updatedAt: typeof b.updatedAt === 'string' ? b.updatedAt : '',
        }
      }
    }

    return {
      generatedAt: typeof r.generatedAt === 'string' ? r.generatedAt : '',
      problems,
      briefs,
    }
  } catch {
    return null
  }
}
