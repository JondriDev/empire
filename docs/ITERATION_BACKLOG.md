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

- [ ] Wire **Goals** (`src/apps/goals/`) into the graph as `goal` nodes
      (`mirrorCollection`) and add `<NodeActions type="goal" .../>` to each goal row.
- [ ] Wire **Artifacts** (`src/apps/artifacts/`) board items as `artifact` nodes
      + `<NodeActions type="artifact" .../>` on each card.
- [ ] Wire **DataCenter** (`src/apps/datacenter/`) records as `dataset` nodes
      + `<NodeActions type="dataset" .../>`.
- [ ] Wire **Files** (`src/apps/files/`) entries as `file` nodes
      + `<NodeActions type="file" .../>`.
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
