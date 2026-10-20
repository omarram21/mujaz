import ar from '../ar.json';
import en from '../en.json';

const PLURAL = /_(zero|one|two|few|many|other)$/;
const AR_FORMS = ['zero', 'one', 'two', 'few', 'many', 'other'];

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v as object, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}
const base = (k: string) => k.replace(PLURAL, '');

describe('translations', () => {
  it('Arabic and English define the same base keys', () => {
    const a = new Set(keys(ar).map(base));
    const e = new Set(keys(en).map(base));
    expect([...a].filter((k) => !e.has(k))).toEqual([]);
    expect([...e].filter((k) => !a.has(k))).toEqual([]);
  });

  it('Arabic plurals define all six CLDR forms', () => {
    const all = new Set(keys(ar));
    const plurals = new Set(
      keys(ar)
        .filter((k) => PLURAL.test(k))
        .map(base),
    );
    const missing = [...plurals].flatMap((b) =>
      AR_FORMS.filter((f) => !all.has(`${b}_${f}`)).map((f) => `${b}_${f}`),
    );
    expect(missing).toEqual([]);
  });

  it('English plurals define one and other', () => {
    const all = new Set(keys(en));
    const plurals = new Set(
      keys(en)
        .filter((k) => PLURAL.test(k))
        .map(base),
    );
    const missing = [...plurals].flatMap((b) =>
      ['one', 'other'].filter((f) => !all.has(`${b}_${f}`)),
    );
    expect(missing).toEqual([]);
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
