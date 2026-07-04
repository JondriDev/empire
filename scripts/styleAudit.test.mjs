import { describe, it, expect } from 'vitest';
import { scanStyleViolations } from './styleAudit.mjs';

const scan = (t) => scanStyleViolations(t);

describe('scanStyleViolations — radii', () => {
  it('flags a raw px border-radius (CSS)', () => {
    expect(scan('.x { border-radius: 4px; }').radii).toBe(1);
  });
  it('flags a raw px/rem borderRadius (JS style object)', () => {
    expect(scan("{ borderRadius: '5px' }").radii).toBe(1);
    expect(scan("{ borderRadius: '0.5rem' }").radii).toBe(1);
  });
  it('flags a unitless JS radius (React treats as px)', () => {
    expect(scan('{ borderRadius: 6 }').radii).toBe(1);
  });
  it('flags a multi-value radius shorthand once', () => {
    expect(scan("{ borderRadius: '0 3px 3px 0' }").radii).toBe(1);
  });
  it('does NOT flag a tokenized radius', () => {
    expect(scan('.x { border-radius: var(--radius-md); }').radii).toBe(0);
  });
  it('does NOT flag semantic circles (50%) or pills (9999px)', () => {
    expect(scan("{ borderRadius: '50%' }").radii).toBe(0);
    expect(scan('.x { border-radius: 9999px; }').radii).toBe(0);
  });
});

describe('scanStyleViolations — type', () => {
  it('flags a raw px/rem font-size', () => {
    expect(scan('.x { font-size: 13px; }').type).toBe(1);
    expect(scan("{ fontSize: '0.75rem' }").type).toBe(1);
  });
  it('flags a unitless JS fontSize', () => {
    expect(scan('{ fontSize: 14 }').type).toBe(1);
  });
  it('does NOT flag a tokenized font-size', () => {
    expect(scan("{ fontSize: 'var(--text-sm)' }").type).toBe(0);
  });
  it('does NOT flag relative em / % sizing', () => {
    expect(scan('.x { font-size: 1.1em; }').type).toBe(0);
    expect(scan('.x { font-size: 90%; }').type).toBe(0);
  });
});

describe('scanStyleViolations — motion', () => {
  it('flags a raw cubic-bezier', () => {
    expect(scan("{ transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)' }").motion).toBe(1);
  });
  it('flags a raw easing keyword', () => {
    expect(scan("{ animation: 'pulse 1.5s ease-in-out infinite' }").motion).toBe(1);
    expect(scan("{ transition: 'color 0.2s ease-out' }").motion).toBe(1);
  });
  it('does NOT flag a tokenized easing reference', () => {
    expect(scan("{ transition: 'all var(--dur-base) var(--ease-out)' }").motion).toBe(0);
    expect(scan("{ transition: 'width var(--dur-slow) var(--ease-spring)' }").motion).toBe(0);
  });
  it('does NOT confuse linear-gradient for an easing keyword', () => {
    expect(scan('{ background: linear-gradient(90deg, #000, #fff) }').motion).toBe(0);
  });
});

describe('scanStyleViolations — total', () => {
  it('sums the three dimensions', () => {
    const t = scan(
      ".a { border-radius: 4px; font-size: 12px; transition: opacity 0.2s ease-out; }"
    );
    expect(t).toEqual({ radii: 1, type: 1, motion: 1, total: 3 });
  });
  it('is 0 for fully tokenized style', () => {
    const t = scan(
      ".a { border-radius: var(--radius-md); font-size: var(--text-base); transition: all var(--dur-fast) var(--ease-out); }"
    );
    expect(t.total).toBe(0);
  });
});
