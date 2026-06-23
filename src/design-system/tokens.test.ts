import { describe, it, expect } from 'vitest';
import { PALETTE, cssVar, tint, type TokenName } from './tokens';

describe('design tokens', () => {
  it('cssVar wraps a token name in a CSS var() reference', () => {
    expect(cssVar('signal')).toBe('var(--signal)');
    expect(cssVar('c-danger')).toBe('var(--c-danger)');
  });

  it('tint builds a color-mix expression with no raw rgb/hex', () => {
    const t = tint('signal', 12);
    expect(t).toBe('color-mix(in srgb, var(--signal) 12%, transparent)');
    // The whole point: a tint must never reintroduce a metric violation.
    expect(t).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(t).not.toMatch(/\brgba?\(/);
  });

  it('tint rounds and clamps the percentage to [0, 100]', () => {
    expect(tint('void', 150)).toContain(' 100%');
    expect(tint('void', -5)).toContain(' 0%');
    expect(tint('xenon', 3.4)).toContain(' 3%');
  });

  it('PALETTE exposes every token name and only hex colours', () => {
    for (const [name, value] of Object.entries(PALETTE)) {
      expect(cssVar(name as TokenName)).toBe(`var(--${name})`);
      expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
