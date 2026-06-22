/**
 * Task aggregation — the selector seam behind the Inbox / Today view.
 *
 * `task` CoreNodes are graph-only: the `make-task` intent (see core/sync.ts)
 * spawns them with `data.done=false` and `data.from=<sourceNodeId>`, owned by
 * the source's app. Until now they had no home view — they existed in the graph
 * but were invisible. These pure selectors gather every task from a graph
 * snapshot so ONE surface (the Inbox) can list them, regardless of which app
 * created them. Pure + dependency-free so the logic is unit-tested in isolation.
 */

import type { CoreNode } from './graph'

/** A task is "done" when its graph node carries `data.done === true`. */
export function isTaskDone(_n: CoreNode): boolean {
  return _n.data.done === true
}

/** Every `task` node in the snapshot, newest first (by creation time so the
 *  order is stable when a task is toggled done — toggling bumps `updated`). */
export function taskNodes(_nodes: CoreNode[]): CoreNode[] {
  return _nodes
    .filter(n => n.type === 'task')
    .sort((a, b) => b.meta.created - a.meta.created)
}

/** Split the tasks into open (not done) and done buckets, each newest-first. */
export function partitionTasks(_nodes: CoreNode[]): { open: CoreNode[]; done: CoreNode[] } {
  const tasks = taskNodes(_nodes)
  return {
    open: tasks.filter(n => !isTaskDone(n)),
    done: tasks.filter(isTaskDone),
  }
}
