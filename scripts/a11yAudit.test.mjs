import { describe, it, expect } from 'vitest';
import { scanA11yViolations } from './a11yAudit.mjs';

const n = (t) => scanA11yViolations(t).count;

describe('scanA11yViolations — keyboard-inoperable click handlers', () => {
  it('flags a <div onClick> with no key handler', () => {
    expect(n('<div onClick={() => select(x)}>row</div>')).toBe(1);
  });
  it('flags a <span onClick> with no key handler', () => {
    expect(n('<span onClick={() => go()}>x</span>')).toBe(1);
  });
  it('flags a multi-line host tag with an arrow handler (tag-boundary robustness)', () => {
    // the `>` of `=>` must NOT be read as the tag close
    expect(n('<div\n  className="row"\n  onClick={() => open(item)}\n>body</div>')).toBe(1);
  });
});

describe('scanA11yViolations — keyboard exemption', () => {
  it('does NOT flag a host with onClick + onKeyDown', () => {
    expect(n('<div onClick={go} onKeyDown={onKey}>x</div>')).toBe(0);
  });
  it('does NOT flag with onKeyUp / onKeyPress either', () => {
    expect(n('<div onClick={go} onKeyUp={k}>x</div>')).toBe(0);
    expect(n('<div onClick={go} onKeyPress={k}>x</div>')).toBe(0);
  });
});

describe('scanA11yViolations — native/primitive exemption', () => {
  it('does NOT flag a native <button>', () => {
    expect(n('<button onClick={go}>Go</button>')).toBe(0);
  });
  it('does NOT flag an <a href> (natively keyboard-actionable)', () => {
    expect(n('<a href="/x" onClick={go}>link</a>')).toBe(0);
  });
  it('DOES flag an <a> WITHOUT href (a host masquerading as a link)', () => {
    expect(n('<a onClick={go}>fake link</a>')).toBe(1);
  });
  it('does NOT flag capitalised primitives (Card/Button add keyboard themselves)', () => {
    expect(n('<Card onClick={go}>x</Card>')).toBe(0);
    expect(n('<Button onClick={go}>x</Button>')).toBe(0);
  });
  it('does NOT flag <label> (forwards its click to the control)', () => {
    expect(n('<label onClick={go}>x</label>')).toBe(0);
  });
});

describe('scanA11yViolations — declared-inert exemption', () => {
  it('does NOT flag aria-hidden decorative elements', () => {
    expect(n('<div aria-hidden="true" onClick={go}>x</div>')).toBe(0);
    expect(n('<div aria-hidden onClick={go}>x</div>')).toBe(0);
  });
  it('does NOT flag role="presentation" / "none"', () => {
    expect(n('<div role="presentation" onClick={go}>x</div>')).toBe(0);
    expect(n('<div role="none" onClick={go}>x</div>')).toBe(0);
  });
});

describe('scanA11yViolations — event-plumbing exemption', () => {
  it('does NOT flag a stopPropagation-only guard', () => {
    expect(n('<div onClick={e => e.stopPropagation()}>x</div>')).toBe(0);
    expect(n('<div onClick={(ev) => ev.stopPropagation()}>x</div>')).toBe(0);
  });
  it('does NOT flag a preventDefault-only guard', () => {
    expect(n('<div onClick={e => e.preventDefault()}>x</div>')).toBe(0);
  });
  it('does NOT flag a stop+prevent combo guard', () => {
    expect(n('<div onClick={e => { e.stopPropagation(); e.preventDefault() }}>x</div>')).toBe(0);
  });
  it('DOES flag when a guard also performs a real action', () => {
    expect(n('<div onClick={e => { e.stopPropagation(); del(x) }}>x</div>')).toBe(1);
  });
});

describe('scanA11yViolations — no false positives', () => {
  it('is 0 for a host with no onClick', () => {
    expect(n('<div className="row">just text</div>')).toBe(0);
  });
  it('does not match a substring tag like <divider>', () => {
    expect(n('<divider onClick={go} />')).toBe(0);
  });
  it('counts multiple independent violations in one file', () => {
    expect(n('<div onClick={a}>1</div>\n<li onClick={b}>2</li>')).toBe(2);
  });
});
