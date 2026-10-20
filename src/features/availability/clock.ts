import { localizeDigits, type AppLocale } from '@/lib/formatNumber';

/** Minutes from midnight → "٦:٠٠ م" / "6:00 PM". 1440 renders as midnight. */
export function formatClock(minutes: number, locale: AppLocale, withPeriod = true): string {
  const m = minutes % 1440;
  const h24 = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const period = locale === 'ar' ? (h24 < 12 ? 'ص' : 'م') : h24 < 12 ? 'AM' : 'PM';
  return localizeDigits(withPeriod ? `${h12}:${mm} ${period}` : `${h12}:${mm}`, locale);
}

/** "٦:٠٠ — ١٠:٠٠ م" (period once when both ends share it). */
export function formatRange(start: number, end: number, locale: AppLocale): string {
  const samePeriod =
    Math.floor((start % 1440) / 720) === Math.floor(((end - 1) % 1440) / 720) && end < 1440;
  return `${formatClock(start, locale, !samePeriod)} — ${formatClock(end, locale)}`;
}
