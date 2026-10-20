export type AppLocale = 'ar' | 'en';

const ARABIC_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** Replace ASCII digits with Arabic-Indic ones (and separators) when the locale is Arabic. */
export function localizeDigits(input: string, locale: AppLocale): string {
  if (locale !== 'ar') return input;
  return input.replace(/[0-9.,%]/g, (ch) => {
    if (ch === '.') return '٫';
    if (ch === ',') return '٬';
    if (ch === '%') return '٪';
    return ARABIC_INDIC[Number(ch)] ?? ch;
  });
}

export interface FormatNumberOptions {
  /** Maximum fraction digits (default 0). */
  decimals?: number;
  /** Keep trailing zeros up to `decimals` (e.g. rating 5.0). */
  fixed?: boolean;
  /** Group thousands (default true). */
  grouping?: boolean;
  percent?: boolean;
}

/**
 * The one number formatter used across the UI. Deterministic (does not depend on the
 * device ICU build), so the output is identical on Hermes, JSC and in tests.
 */
export function formatNumber(
  value: number,
  locale: AppLocale,
  { decimals = 0, fixed = false, grouping = true, percent = false }: FormatNumberOptions = {},
): string {
  if (!Number.isFinite(value)) return localizeDigits('0', locale);
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  let [intPart = '0', frac = ''] = Math.abs(rounded).toFixed(decimals).split('.');
  if (!fixed) frac = frac.replace(/0+$/, '');
  if (grouping) intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let out = (rounded < 0 ? '-' : '') + intPart + (frac ? `.${frac}` : '');
  if (percent) out += '%';
  return localizeDigits(out, locale);
}

/** Price in USD, e.g. "١٢ $" (ar) / "$12" (en). */
export function formatPrice(amount: number, locale: AppLocale): string {
  const n = formatNumber(amount, locale, { decimals: 2 });
  return locale === 'ar' ? `${n} $` : `$${n}`;
}
