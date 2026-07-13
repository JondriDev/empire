// The Empire — doc-mass conformance audit (the fleet eats its own dog food).
//
// The design-system trilogy (colour · tokens · shell) and the a11y axis all lock
// how the PRODUCT behaves. This axis turns the same measure→drive-to-0→lock ratchet
// on the FLEET ITSELF. The scarcest resource across an 8-routine fleet is per-run
// context budget, and its biggest spend is reading its own working memory. Ratified
// in docs/rfc/iteration-plan-musk.md (Step 3): "Make doc mass a measured gradient —
// add a `docMass` row to scripts/metrics.mjs: line counts of the read-every-run docs
// (CONTEXT.md, EPICS.md) against their budgets."
//
// CONTEXT.md's own header says stale memory is worse than none, and both files carry
// mostly HISTORY — which already lives in git and ROUTINE-LOG.md. Every line over
// budget is context every routine re-reads every run instead of spending it on the
// change. So the honest signal is the OVERAGE: how many lines the read-every-run
// working docs exceed their budgets by. Target 0 = every tracked doc within budget
// (working memory, not an archaeology dig) — driveable to 0 and lockable in
// --assert-zero exactly as offSystemUtilities / offSystemStyle / offShellControls /
// keyboardA11y were.
//
// Pure & dependency-free: `scanDocMass(docs)` takes an array of measured docs and
// returns the overage + per-doc breakdown, so it is unit-pinned in
// docMassAudit.test.mjs and reused by scripts/metrics.mjs (which reads the files and
// counts their lines). `countLines` is exported for the same reason.

// The read-every-run working-memory docs and their line budgets. These two are the
// files every routine's orient phase reads in full (see each routine in
// docs/routines/*.md). The chronological journal (ROUTINE-LOG.md) and the reference
// docs (ARCHITECTURE/SPEC/…) are NOT read every run, so they are NOT budgeted here —
// budgeting a doc no routine reads every run would measure nothing.
export const DOC_BUDGETS = [
  { path: 'docs/CONTEXT.md', budget: 400 },
  { path: 'docs/EPICS.md', budget: 500 },
];

// Count content lines. Matches `wc -l` for the normal case (file ends in a newline)
// while still counting a final unterminated line, so a doc can't shave a line off
// its measured mass by dropping its trailing newline.
export function countLines(text) {
  if (text === '') return 0;
  const n = text.split('\n').length;
  return text.endsWith('\n') ? n - 1 : n;
}

// Per-doc-set scan → { overage, perDoc }. `docs` is [{ path, lines, budget }].
// `overage` = Σ max(0, lines − budget) across all tracked docs (LOWER is better;
// 0 = every doc within budget). `perDoc` carries the breakdown for the offenders list.
export function scanDocMass(docs) {
  let overage = 0;
  const perDoc = docs.map((d) => {
    const over = Math.max(0, d.lines - d.budget);
    overage += over;
    return { path: d.path, lines: d.lines, budget: d.budget, over };
  });
  return { overage, perDoc };
}
