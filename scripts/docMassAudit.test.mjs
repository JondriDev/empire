import { describe, it, expect } from 'vitest';
import { scanDocMass, countLines, DOC_BUDGETS } from './docMassAudit.mjs';

describe('countLines', () => {
  it('counts an empty string as 0 lines', () => {
    expect(countLines('')).toBe(0);
  });
  it('matches wc -l for a newline-terminated file', () => {
    expect(countLines('a\nb\nc\n')).toBe(3);
  });
  it('still counts a final unterminated line (no trailing newline)', () => {
    expect(countLines('a\nb\nc')).toBe(3);
  });
  it('cannot be gamed by dropping the trailing newline', () => {
    expect(countLines('a\nb\nc\n')).toBe(countLines('a\nb\nc'));
  });
  it('counts a single line', () => {
    expect(countLines('just one line')).toBe(1);
  });
});

describe('scanDocMass — overage against budgets', () => {
  it('reports 0 overage when every doc is within budget', () => {
    const r = scanDocMass([
      { path: 'a', lines: 100, budget: 400 },
      { path: 'b', lines: 500, budget: 500 },
    ]);
    expect(r.overage).toBe(0);
  });
  it('sums max(0, lines − budget) across docs', () => {
    const r = scanDocMass([
      { path: 'a', lines: 600, budget: 400 }, // over by 200
      { path: 'b', lines: 700, budget: 500 }, // over by 200
    ]);
    expect(r.overage).toBe(400);
  });
  it('never counts an under-budget doc as negative overage', () => {
    const r = scanDocMass([
      { path: 'a', lines: 50, budget: 400 },  // under → 0, not −350
      { path: 'b', lines: 900, budget: 500 }, // over by 400
    ]);
    expect(r.overage).toBe(400);
  });
  it('exposes the per-doc breakdown (path, lines, budget, over)', () => {
    const r = scanDocMass([{ path: 'docs/CONTEXT.md', lines: 1000, budget: 400 }]);
    expect(r.perDoc).toEqual([
      { path: 'docs/CONTEXT.md', lines: 1000, budget: 400, over: 600 },
    ]);
  });
  it('reports an empty doc set as 0 overage', () => {
    expect(scanDocMass([]).overage).toBe(0);
  });
});

describe('DOC_BUDGETS — the tracked read-every-run working docs', () => {
  it('tracks CONTEXT.md and EPICS.md with positive budgets', () => {
    const paths = DOC_BUDGETS.map((d) => d.path);
    expect(paths).toContain('docs/CONTEXT.md');
    expect(paths).toContain('docs/EPICS.md');
    for (const d of DOC_BUDGETS) expect(d.budget).toBeGreaterThan(0);
  });
});
