import { initials, paletteFor } from '@/components/Avatar';

describe('avatar initials', () => {
  it('skips honorifics and the definite article', () => {
    expect(initials('الشيخ عبدالرحمن الحسيني')).toBe('ع ح');
    expect(initials('الشيخة أم أنس القحطاني')).toBe('أ ق');
    expect(initials('Sheikh Yasir Baghdadi')).toBe('Y B');
  });
  it('handles single names', () => {
    expect(initials('أحمد')).toBe('أ');
  });
  it('picks a stable palette per id', () => {
    expect(paletteFor('abc')).toEqual(paletteFor('abc'));
  });
});
