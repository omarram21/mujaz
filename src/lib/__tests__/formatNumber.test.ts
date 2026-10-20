import { formatNumber, formatPrice, localizeDigits } from '../formatNumber';

describe('formatNumber', () => {
  it('uses Arabic-Indic digits in Arabic', () => {
    expect(formatNumber(604, 'ar')).toBe('٦٠٤');
    expect(formatNumber(205, 'en')).toBe('205');
  });

  it('formats decimals with the Arabic decimal separator', () => {
    expect(formatNumber(4.9, 'ar', { decimals: 1 })).toBe('٤٫٩');
    expect(formatNumber(5, 'ar', { decimals: 1, fixed: true })).toBe('٥٫٠');
    expect(formatNumber(5, 'ar', { decimals: 1 })).toBe('٥');
  });

  it('groups thousands', () => {
    expect(formatNumber(12345, 'en')).toBe('12,345');
    expect(formatNumber(12345, 'ar')).toBe('١٢٬٣٤٥');
    expect(formatNumber(12345, 'en', { grouping: false })).toBe('12345');
  });

  it('formats percentages and negatives', () => {
    expect(formatNumber(34, 'ar', { percent: true })).toBe('٣٤٪');
    expect(formatNumber(-3, 'en')).toBe('-3');
  });

  it('handles non-finite input', () => {
    expect(formatNumber(Number.NaN, 'ar')).toBe('٠');
  });

  it('formats USD prices per locale', () => {
    expect(formatPrice(12, 'ar')).toBe('١٢ $');
    expect(formatPrice(12.5, 'en')).toBe('$12.5');
  });

  it('localizes digits inside arbitrary strings', () => {
    expect(localizeDigits('8:30 PM', 'ar')).toBe('٨:٣٠ PM');
  });
});

describe('toAsciiDigits', () => {
  it('parses Arabic-Indic and Persian digits', () => {
    const { toAsciiDigits } = jest.requireActual(
      '../formatNumber',
    ) as typeof import('../formatNumber');
    expect(toAsciiDigits('١٩٦')).toBe('196');
    expect(toAsciiDigits('۱۲')).toBe('12');
    expect(toAsciiDigits('12٫5')).toBe('12.5');
  });
});
