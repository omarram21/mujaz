import type { AppLocale } from './formatNumber';

export interface Country {
  code: string;
  ar: string;
  en: string;
  /** Default IANA zone; the device zone wins when it belongs to the country. */
  tz: string;
  zones?: string[];
}

export const COUNTRIES: readonly Country[] = [
  { code: 'JO', ar: 'الأردن', en: 'Jordan', tz: 'Asia/Amman' },
  { code: 'SA', ar: 'السعودية', en: 'Saudi Arabia', tz: 'Asia/Riyadh' },
  { code: 'EG', ar: 'مصر', en: 'Egypt', tz: 'Africa/Cairo' },
  { code: 'AE', ar: 'الإمارات', en: 'United Arab Emirates', tz: 'Asia/Dubai' },
  { code: 'KW', ar: 'الكويت', en: 'Kuwait', tz: 'Asia/Kuwait' },
  { code: 'QA', ar: 'قطر', en: 'Qatar', tz: 'Asia/Qatar' },
  { code: 'BH', ar: 'البحرين', en: 'Bahrain', tz: 'Asia/Bahrain' },
  { code: 'OM', ar: 'عُمان', en: 'Oman', tz: 'Asia/Muscat' },
  { code: 'YE', ar: 'اليمن', en: 'Yemen', tz: 'Asia/Aden' },
  { code: 'IQ', ar: 'العراق', en: 'Iraq', tz: 'Asia/Baghdad' },
  { code: 'SY', ar: 'سوريا', en: 'Syria', tz: 'Asia/Damascus' },
  { code: 'LB', ar: 'لبنان', en: 'Lebanon', tz: 'Asia/Beirut' },
  {
    code: 'PS',
    ar: 'فلسطين',
    en: 'Palestine',
    tz: 'Asia/Hebron',
    zones: ['Asia/Hebron', 'Asia/Gaza'],
  },
  { code: 'SD', ar: 'السودان', en: 'Sudan', tz: 'Africa/Khartoum' },
  { code: 'LY', ar: 'ليبيا', en: 'Libya', tz: 'Africa/Tripoli' },
  { code: 'TN', ar: 'تونس', en: 'Tunisia', tz: 'Africa/Tunis' },
  { code: 'DZ', ar: 'الجزائر', en: 'Algeria', tz: 'Africa/Algiers' },
  { code: 'MA', ar: 'المغرب', en: 'Morocco', tz: 'Africa/Casablanca' },
  { code: 'MR', ar: 'موريتانيا', en: 'Mauritania', tz: 'Africa/Nouakchott' },
  { code: 'SO', ar: 'الصومال', en: 'Somalia', tz: 'Africa/Mogadishu' },
  { code: 'TR', ar: 'تركيا', en: 'Türkiye', tz: 'Europe/Istanbul' },
  { code: 'PK', ar: 'باكستان', en: 'Pakistan', tz: 'Asia/Karachi' },
  { code: 'IN', ar: 'الهند', en: 'India', tz: 'Asia/Kolkata' },
  { code: 'BD', ar: 'بنغلاديش', en: 'Bangladesh', tz: 'Asia/Dhaka' },
  {
    code: 'ID',
    ar: 'إندونيسيا',
    en: 'Indonesia',
    tz: 'Asia/Jakarta',
    zones: ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'],
  },
  { code: 'MY', ar: 'ماليزيا', en: 'Malaysia', tz: 'Asia/Kuala_Lumpur' },
  { code: 'NG', ar: 'نيجيريا', en: 'Nigeria', tz: 'Africa/Lagos' },
  { code: 'GB', ar: 'المملكة المتحدة', en: 'United Kingdom', tz: 'Europe/London' },
  { code: 'DE', ar: 'ألمانيا', en: 'Germany', tz: 'Europe/Berlin' },
  { code: 'FR', ar: 'فرنسا', en: 'France', tz: 'Europe/Paris' },
  { code: 'NL', ar: 'هولندا', en: 'Netherlands', tz: 'Europe/Amsterdam' },
  { code: 'SE', ar: 'السويد', en: 'Sweden', tz: 'Europe/Stockholm' },
  {
    code: 'US',
    ar: 'الولايات المتحدة',
    en: 'United States',
    tz: 'America/New_York',
    zones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
  },
  {
    code: 'CA',
    ar: 'كندا',
    en: 'Canada',
    tz: 'America/Toronto',
    zones: ['America/Toronto', 'America/Winnipeg', 'America/Edmonton', 'America/Vancouver'],
  },
  {
    code: 'AU',
    ar: 'أستراليا',
    en: 'Australia',
    tz: 'Australia/Sydney',
    zones: ['Australia/Sydney', 'Australia/Perth'],
  },
];

export function findCountry(code: string | null | undefined): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function countryName(code: string | null | undefined, locale: AppLocale): string {
  const c = findCountry(code);
  return c ? c[locale] : (code ?? '');
}

/** Pick the zone to store for a country, preferring the device zone if it belongs to it. */
export function zoneForCountry(country: Country, deviceZone: string): string {
  const zones = country.zones ?? [country.tz];
  return zones.includes(deviceZone) ? deviceZone : country.tz;
}

const CITY_AR: Record<string, string> = {
  'Asia/Amman': 'عمّان',
  'Asia/Riyadh': 'الرياض',
  'Africa/Cairo': 'القاهرة',
  'Asia/Dubai': 'دبي',
  'Asia/Kuwait': 'الكويت',
  'Asia/Qatar': 'الدوحة',
  'Asia/Bahrain': 'المنامة',
  'Asia/Muscat': 'مسقط',
  'Asia/Aden': 'عدن',
  'Asia/Baghdad': 'بغداد',
  'Asia/Damascus': 'دمشق',
  'Asia/Beirut': 'بيروت',
  'Asia/Hebron': 'الخليل',
  'Asia/Gaza': 'غزة',
  'Africa/Khartoum': 'الخرطوم',
  'Africa/Tripoli': 'طرابلس',
  'Africa/Tunis': 'تونس',
  'Africa/Algiers': 'الجزائر',
  'Africa/Casablanca': 'الدار البيضاء',
  'Africa/Nouakchott': 'نواكشوط',
  'Africa/Mogadishu': 'مقديشو',
  'Europe/Istanbul': 'إسطنبول',
  'Asia/Karachi': 'كراتشي',
  'Asia/Kolkata': 'كولكاتا',
  'Asia/Dhaka': 'دكا',
  'Asia/Jakarta': 'جاكرتا',
  'Asia/Makassar': 'مكاسر',
  'Asia/Jayapura': 'جايابورا',
  'Asia/Kuala_Lumpur': 'كوالالمبور',
  'Africa/Lagos': 'لاغوس',
  'Europe/London': 'لندن',
  'Europe/Berlin': 'برلين',
  'Europe/Paris': 'باريس',
  'Europe/Amsterdam': 'أمستردام',
  'Europe/Stockholm': 'ستوكهولم',
  'America/New_York': 'نيويورك',
  'America/Chicago': 'شيكاغو',
  'America/Denver': 'دنفر',
  'America/Los_Angeles': 'لوس أنجلوس',
  'America/Toronto': 'تورونتو',
  'America/Winnipeg': 'وينيبيغ',
  'America/Edmonton': 'إدمونتون',
  'America/Vancouver': 'فانكوفر',
  'Australia/Sydney': 'سيدني',
  'Australia/Perth': 'بيرث',
};

/** "Asia/Amman" → "عمّان" / "Amman" (display only). */
export function cityOfZone(tz: string, locale: AppLocale = 'en'): string {
  if (locale === 'ar' && CITY_AR[tz]) return CITY_AR[tz];
  return (tz.split('/').pop() ?? tz).replace(/_/g, ' ');
}
