import meta from './quran-meta.json';
import type { AppLocale } from '../formatNumber';

export const TOTAL_PAGES = 604;
export const TOTAL_JUZ = 30;

export interface Surah {
  n: number;
  ar: string;
  en: string;
  meaning: string;
  ayahs: number;
  startPage: number;
  type: 'meccan' | 'medinan';
}
export interface Juz {
  n: number;
  surah: number;
  ayah: number;
  startPage: number;
}
export interface AyahRef {
  surah: number;
  ayah: number;
}

export const SURAHS = meta.surahs as Surah[];
export const JUZ = meta.juz as Juz[];
/** PAGES[i] = first ayah on page i + 1 (Madani mushaf). */
const PAGES = meta.pages as [number, number][];

export function getSurah(n: number): Surah | undefined {
  return SURAHS[n - 1];
}

export function surahName(n: number, locale: AppLocale): string {
  const s = getSurah(n);
  return s ? (locale === 'ar' ? s.ar : s.en) : '';
}

export function isValidPage(p: number): boolean {
  return Number.isInteger(p) && p >= 1 && p <= TOTAL_PAGES;
}

const cmp = (a: AyahRef, b: AyahRef) => a.surah - b.surah || a.ayah - b.ayah;

export function firstAyahOfPage(page: number): AyahRef {
  const [surah, ayah] = PAGES[page - 1] ?? [1, 1];
  return { surah, ayah };
}

export function lastAyahOfPage(page: number): AyahRef {
  if (page >= TOTAL_PAGES) return { surah: 114, ayah: 6 };
  const next = firstAyahOfPage(page + 1);
  if (next.ayah > 1) return { surah: next.surah, ayah: next.ayah - 1 };
  const prev = getSurah(next.surah - 1);
  return { surah: next.surah - 1, ayah: prev?.ayahs ?? 1 };
}

export function pageOfAyah(ref: AyahRef): number {
  let lo = 0;
  let hi = PAGES.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const [s, a] = PAGES[mid] ?? [1, 1];
    if (cmp({ surah: s, ayah: a }, ref) <= 0) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

export function juzOfPage(page: number): number {
  let j = 1;
  for (const z of JUZ) if (z.startPage <= page) j = z.n;
  return j;
}

/** Pages assigned to a juz for progress purposes (by the page its first ayah starts on). */
export function juzPages(juz: number): [number, number] {
  const start = JUZ[juz - 1]?.startPage ?? 1;
  const nextStart = JUZ[juz]?.startPage ?? TOTAL_PAGES + 1;
  return [start, Math.max(start, nextStart - 1)];
}

/** Surah/ayah span read across a page range: first ayah of fromPage → last ayah of toPage. */
export function pageRangeToAyahs(fromPage: number, toPage: number): { from: AyahRef; to: AyahRef } {
  return { from: firstAyahOfPage(fromPage), to: lastAyahOfPage(toPage) };
}
