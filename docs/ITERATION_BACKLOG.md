# Empire Iteration Backlog

Living queue for the autonomous loop. The loop always takes the **topmost
unchecked `[ ]` item**. Check off (`[x]`) when done and append follow-ups.
See [ITERATION_PROTOCOL.md](./ITERATION_PROTOCOL.md) for how one cycle runs.

Wiring reference (already done — copy these patterns):
- `src/apps/notes/Notes.tsx`, `calendar/Calendar.tsx`, `learning-tracker/LearningTracker.tsx`
- An app joins the organism in ~3 lines: `mirrorCollection(type, app, items, {id,title,data})`
  in a `useEffect` on the data, plus `<NodeActions type="<type>" sourceId={item.id} />`
  in each item row. Helpers live in `src/lib/core/sync.ts` + `src/components/ui/NodeActions.tsx`.

---

## P0 — Finish the core "organism" (active thread)

- [x] Wire **Goals** (`src/apps/goals/`) into the graph as `goal` nodes
      (`mirrorCollection`) and add `<NodeActions type="goal" .../>` to each goal row.
      _(also added `goal` to make-task's `accepts` so the ⚡ menu is non-empty)_
- [x] Wire **Artifacts** (`src/apps/artifacts/`) board items as `artifact` nodes
      + `<NodeActions type="artifact" .../>` on each card.
      _(done on the Kanban board as `kanban` nodes — the board's cards are the
      graph-worthy entity; Artifacts is otherwise a launcher of mini-tools.
      `kanban` added to make-task accepts.)_
- [x] Wire **DataCenter** (`src/apps/datacenter/`) records as `dataset` nodes
      + `<NodeActions type="dataset" .../>`.
      _(mirrored each **table** as a `dataset` node — tables, not individual
      server rows, are the graph-worthy entity; rows only load for the active
      table and would flood the graph. `<NodeActions type="dataset"/>` on each
      sidebar table row; `dataset` added to make-task accepts.)_
- [x] Wire **Files** (`src/apps/files/`) entries as `file` nodes
      + `<NodeActions type="file" .../>`.
      _(mirrored each non-folder entry of the **current directory** as a `file`
      node keyed by path; folders are navigation, not graph-worthy. Navigating
      reconciles the graph to the new directory. `<NodeActions type="file"/>` on
      each file row; `file` added to make-task accepts.)_
- [ ] Wire **Photos** (`src/apps/photos/`) items as `photo` nodes
      + `<NodeActions type="photo" .../>`.
- [ ] Wire **prompt-generator** (`src/apps/prompt-generator/`) history as
      `prompt` nodes + `<NodeActions type="prompt" .../>`.
- [ ] Add a per-message ⚡ menu to **Messages** (`src/apps/messages/`) — it is
      already mirrored centrally but has no `<NodeActions>` on bubbles yet.
- [ ] Enrich `src/lib/core/intents.ts`: add a `make-note-from` intent (any node →
      new `note` node, linked) and `add-to-learning` (note/message → `learning`).

## P1 — QA hardening (keep it green, grow coverage)

- [ ] Unit-test `src/lib/core/graph.ts`: addNode/updateNode/deleteNode (cascades
      edges), link/unlink, and `nodesOfType`/`neighbors` selectors.
- [ ] Unit-test `src/lib/core/sync.ts` `reconcile`/`mirrorCollection`:
      add → node appears, edit → node updates, delete → node + edges vanish.
- [ ] Unit-test `src/lib/core/intents.ts`: registerIntent / intentsFor (filters
      by `accepts`) / runIntent.
- [ ] Ensure `npm run lint` is clean; fix any new warnings introduced by wiring.

## P2 — UI/UX polish

- [ ] `NodeActions` ⚡ menu: use motion tokens (`--dur-fast`, `--ease-spring`),
      `.gp` glass primitive, full keyboard nav + `aria-*`, and `Esc` to close.
- [ ] `Network` app: type-colored nodes from design tokens, legible edge labels,
      and hover highlight of a node's neighbors.
- [ ] Consistent empty-states for every newly-wired app list (icon + hint).
- [ ] Honor `prefers-reduced-motion` for all newly added animations.

## P3 — New features

- [ ] Global "⚡ Send to…" entry in the command palette that surfaces intents for
      the currently focused node across all apps.
- [ ] An "Inbox / Today" view aggregating open `task` nodes from the graph.
- [ ] Search/filter in `Network` (by node type and title substring).

---

## Discovered follow-ups
<!-- The loop appends newly found tasks here, then promotes them above. -->

- [ ] DataCenter `dataset` nodes only carry a `rows` count for the *active*
      table (others are `undefined` until selected). Consider fetching per-table
      row counts on `loadTables` so every dataset node has a stable count.
- [ ] Files `file` nodes only reflect the *current* directory (reconcile drops
      other dirs' file nodes on navigate). Acceptable for now, but a "pinned" or
      cross-directory file graph would need a persistent registry instead of the
      per-directory reconcile.
