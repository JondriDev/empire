/**
 * Cakra Solver — cross-app intents (C-layer).
 *
 * "Make Problem from this" turns any substantive node (note, goal, task,
 * message, learning, event, dataset) into a solver problem, so the whole
 * Empire can feed the solving backlog. "Plan → Tasks" fans a critiqued
 * solution's first actions out as `task` nodes (the Inbox lens picks those
 * up). Registered from main.tsx alongside startCoreSync so the ⚡ menus work
 * before the Solver tab is ever opened.
 */

import { registerIntent } from '../../../lib/core/intents'
import { nodesOfType, useGraph } from '../../../lib/core/graph'
import { emit } from '../../../lib/eventBus'
import { useSolverStore } from './store'

const SOLVER_APP = 'ai-chat'

/** Boundary-crossing handoffs light a synapse arc; in-app derivations don't. */
function announce(fromApp: string, label: string): void {
  if (!fromApp || fromApp === SOLVER_APP) return
  emit({ type: 'HANDOFF', fromId: fromApp, toId: SOLVER_APP, label })
}

let registered = false

export function registerSolverIntents(): void {
  if (registered) return
  registered = true

  registerIntent({
    id: 'make-problem',
    label: 'Make Problem from this',
    icon: '🧩',
    accepts: n => ['note', 'goal', 'task', 'message', 'learning', 'event', 'dataset'].includes(n.type),
    run: n => {
      const store = useSolverStore.getState()
      const content = typeof n.data.content === 'string' ? n.data.content : ''
      const problem = store.addProblem({
        title: n.title,
        blurb: content.slice(0, 280),
        scale: 'personal',
        source: 'intent',
      })
      // The store mirror has already materialised the problem node — link source → problem.
      const g = useGraph.getState()
      const problemNode = nodesOfType('problem').find(pn => pn.data.sourceId === problem.id)
      if (problemNode) g.link(n.id, problemNode.id)
      store.pushLog(`🧩 New problem from ${n.meta.app}: ${problem.title}`)
      announce(n.meta.app, 'make problem')
    },
  })

  registerIntent({
    id: 'solver-plan-to-tasks',
    label: 'Plan → Tasks',
    icon: '✓',
    accepts: n => n.type === 'solution',
    run: n => {
      const { solutions } = useSolverStore.getState()
      const solution = solutions[String(n.data.sourceId)]
      if (!solution || solution.firstActions.length === 0) return
      const g = useGraph.getState()
      for (const action of solution.firstActions) {
        const task = g.addNode({
          type: 'task',
          title: `Do: ${action}`,
          data: { done: false, from: n.id },
          app: SOLVER_APP,
        })
        g.link(n.id, task.id)
      }
    },
  })
}
