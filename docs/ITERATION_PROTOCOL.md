# Empire Iteration Protocol

The contract for **one autonomous iteration**. Both the in-session `/loop` and
the headless `scripts/empire-auto-loop.sh` follow this exactly.
**One iteration = one small, verified, committed improvement.**

## Procedure (one cycle)

1. **Pick** the single highest-priority unchecked `[ ]` item in
   [ITERATION_BACKLOG.md](./ITERATION_BACKLOG.md). Top of the file = highest
   priority. Do the topmost unchecked item.
2. **Implement** the *smallest coherent change* that completes that item.
   One focused improvement — do not bundle unrelated edits.
3. **Verify** — run `npm run build` (`tsc -b && vite build`). It **MUST pass**.
   - If the touched area has tests, also run `npm test`.
   - If the build fails and the fix is quick, fix it.
   - If you cannot make it green, **`git checkout -- .`** to revert the change,
     then pick a simpler item. **Never commit a red build.**
4. **Commit** on branch `auto/iteration` with a clear conventional message
   (`feat:` / `fix:` / `refactor:` / `test:` …). **Never push.**
5. **Update the backlog** — flip the item's `[ ]` to `[x]`, and append any
   follow-up tasks you discovered to the appropriate priority section.

## Hard rules

- Stay on the **`auto/iteration`** branch. Never commit to `main`. Never push.
- **Green builds only** — the build is the gate. A red build is never committed.
- One item per iteration. Keep diffs small and independently revertable.
- Don't `npm install` new dependencies unless the item explicitly calls for it.
  If you must, say so in the commit body.
- Never touch secrets, `.env`, user data (`data/`, `logs/`), or `server.js`
  request handling unless the item is specifically about it.
- This sandbox **cannot screenshot** (headless Chromium fails in PRoot). The
  green build is the verification; the user reviews visuals on-device.

## Stop when

- The backlog has no unchecked items — print/reply **`BACKLOG-EMPTY`**, or
- the build cannot be made green even after a revert, or
- the user stops it (`touch logs/.stop-auto-loop` halts the headless loop).
