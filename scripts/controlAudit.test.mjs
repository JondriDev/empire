import { describe, it, expect } from 'vitest';
import { scanControlViolations } from './controlAudit.mjs';

const scan = (t) => scanControlViolations(t);

describe('scanControlViolations — button', () => {
  it('flags a bare lowercase <button>', () => {
    expect(scan('<button onClick={x}>Go</button>').button).toBe(1);
  });
  it('flags a self-closing / attribute-only bare button', () => {
    expect(scan('<button\n  className="x"\n>Go</button>').button).toBe(1);
  });
  it('does NOT flag the capitalised <Button> primitive', () => {
    expect(scan('<Button onClick={x}>Go</Button>').button).toBe(0);
    expect(scan('<IconButton aria-label="x" />').button).toBe(0);
  });
  it('does NOT flag a substring like <buttonish>', () => {
    expect(scan('<buttonish>').button).toBe(0);
  });
});

describe('scanControlViolations — input', () => {
  it('flags a bare text <input>', () => {
    expect(scan('<input value={v} onChange={e => set(e.target.value)} />').input).toBe(1);
  });
  it('flags an input with an arrow-function handler before type (tag-boundary robustness)', () => {
    // the `>` of `=>` must NOT be read as the tag close
    expect(scan('<input onChange={e => set(e)} type="search" />').input).toBe(1);
  });
  it('does NOT flag type=file / checkbox / radio (no text-field primitive home)', () => {
    expect(scan('<input type="file" />').input).toBe(0);
    expect(scan("<input type='checkbox' checked={c} />").input).toBe(0);
    expect(scan('<input type="radio" name="g" />').input).toBe(0);
  });
  it('does NOT flag the capitalised <Input> primitive', () => {
    expect(scan('<Input value={v} onChange={set} />').input).toBe(0);
  });
  it('flags an explicit non-exempt type (number/range/etc.)', () => {
    expect(scan('<input type="range" min={0} max={10} />').input).toBe(1);
    expect(scan('<input type="number" />').input).toBe(1);
  });
});

describe('scanControlViolations — select / textarea', () => {
  it('flags a bare <select>', () => {
    expect(scan('<select value={v} onChange={c}><option/></select>').select).toBe(1);
  });
  it('flags a bare <textarea>', () => {
    expect(scan('<textarea value={v} onChange={c} />').textarea).toBe(1);
  });
  it('does NOT flag the capitalised <Select> / <TextArea> primitives', () => {
    expect(scan('<Select value={v} onChange={c} options={o} />').select).toBe(0);
    expect(scan('<TextArea value={v} onChange={c} />').textarea).toBe(0);
  });
});

describe('scanControlViolations — total', () => {
  it('sums the dimensions and a clean file scores 0', () => {
    const r = scan('<button>a</button><input /><select></select><textarea />');
    expect(r).toEqual({ button: 1, input: 1, select: 1, textarea: 1, total: 4 });
    expect(scan('<Button>a</Button><Input /><Select /><TextArea />').total).toBe(0);
  });
});
