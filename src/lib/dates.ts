import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { localizeDigits, type AppLocale } from './formatNumber';

export { fromZonedTime, toZonedTime, formatInTimeZone };

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const AR_WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const EN_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const AR_WEEKDAYS_SHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const EN_WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const AR_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];
const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function weekdayName(weekday: number, locale: AppLocale, short = false): string {
  const list =
    locale === 'ar'
      ? short
        ? AR_WEEKDAYS_SHORT
        : AR_WEEKDAYS
      : short
        ? EN_WEEKDAYS_SHORT
        : EN_WEEKDAYS;
  return list[((weekday % 7) + 7) % 7] ?? '';
}

export function monthName(month: number, locale: AppLocale): string {
  return (locale === 'ar' ? AR_MONTHS : EN_MONTHS)[month] ?? '';
}

/** "٨:٣٠ م" / "8:30 PM" in the given zone. */
export function formatTime(date: Date | string, timeZone: string, locale: AppLocale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const h24 = Number(formatInTimeZone(d, timeZone, 'H'));
  const mm = formatInTimeZone(d, timeZone, 'mm');
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const suffix = locale === 'ar' ? (h24 < 12 ? 'ص' : 'م') : h24 < 12 ? 'AM' : 'PM';
  return localizeDigits(`${h12}:${mm} ${suffix}`, locale);
}

/** "الثلاثاء ٢١ أكتوبر" / "Tuesday 21 October" in the given zone. */
export function formatDate(
  date: Date | string,
  timeZone: string,
  locale: AppLocale,
  { weekday = true, year = false }: { weekday?: boolean; year?: boolean } = {},
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const z = toZonedTime(d, timeZone);
  const parts = [
    weekday ? weekdayName(z.getDay(), locale) : null,
    String(z.getDate()),
    monthName(z.getMonth(), locale),
    year ? String(z.getFullYear()) : null,
  ].filter(Boolean);
  return localizeDigits(parts.join(' '), locale);
}

/** Calendar date key (yyyy-MM-dd) of an instant in a zone. */
export function dateKey(date: Date, timeZone: string): string {
  return formatInTimeZone(date, timeZone, 'yyyy-MM-dd');
}

/** Hijri date via Intl (Umm al-Qura), with a Gregorian fallback where Intl lacks the calendar. */
export function formatHijri(date: Date | string, locale: AppLocale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    const out = new Intl.DateTimeFormat(
      `${locale === 'ar' ? 'ar' : 'en'}-u-ca-islamic-umalqura-nu-latn`,
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      },
    ).format(d);
    return localizeDigits(out, locale);
  } catch {
    return formatDate(d, 'UTC', locale, { weekday: false, year: true });
  }
}

/** Seconds → "mm:ss" or "h:mm:ss". */
export function formatDuration(totalSeconds: number, locale: AppLocale): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return localizeDigits(h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`, locale);
}

/** UTC offset label for a zone, e.g. "UTC+3". */
export function utcOffsetLabel(timeZone: string, at: Date = new Date()): string {
  const off = formatInTimeZone(at, timeZone, 'xxx'); // +03:00
  const sign = off.startsWith('-') ? '-' : '+';
  const [hh = '0', mm = '00'] = off.slice(1).split(':');
  const h = String(Number(hh));
  return `UTC${sign}${h}${mm !== '00' ? `:${mm}` : ''}`;
}
