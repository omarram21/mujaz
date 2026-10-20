import ar from '../ar.json';
import en from '../en.json';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v as object, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('translations', () => {
  it('Arabic and English define the same keys', () => {
    const a = new Set(keys(ar));
    const e = new Set(keys(en));
    expect([...a].filter((k) => !e.has(k))).toEqual([]);
    expect([...e].filter((k) => !a.has(k))).toEqual([]);
  });

  it('has no empty strings', () => {
    const empty = (o: object): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        typeof v === 'string' ? (v.trim() ? [] : [k]) : empty(v as object),
      );
    expect(empty(ar)).toEqual([]);
    expect(empty(en)).toEqual([]);
  });
});
