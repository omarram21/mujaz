import { JUZ, TOTAL_JUZ, TOTAL_PAGES, juzPages } from './quran';

export interface PageRange {
  from_page: number;
  to_page: number;
}

export type JuzStatus = 'mastered' | 'inProgress' | 'notStarted';

export interface KhatmahProgress {
  covered: Set<number>;
  pagesCount: number;
  /** 0..1 */
  ratio: number;
  /** Whole percent, floored so 603/604 never shows 100%. */
  percent: number;
  juz: JuzStatus[];
  complete: boolean;
}

/** Union of page ranges, clamped to 1..604, duplicates counted once (mirrors program_pages_covered). */
export function coveredPages(ranges: readonly PageRange[]): Set<number> {
  const set = new Set<number>();
  for (const r of ranges) {
    const from = Math.max(1, Math.min(r.from_page, r.to_page));
    const to = Math.min(TOTAL_PAGES, Math.max(r.from_page, r.to_page));
    for (let p = from; p <= to; p++) set.add(p);
  }
  return set;
}

export function computeProgress(ranges: readonly PageRange[]): KhatmahProgress {
  const covered = coveredPages(ranges);
  const pagesCount = covered.size;
  const ratio = pagesCount / TOTAL_PAGES;
  const juz: JuzStatus[] = JUZ.slice(0, TOTAL_JUZ).map((z) => {
    const [start, end] = juzPages(z.n);
    let done = 0;
    for (let p = start; p <= end; p++) if (covered.has(p)) done++;
    if (done === 0) return 'notStarted';
    return done === end - start + 1 ? 'mastered' : 'inProgress';
  });
  return {
    covered,
    pagesCount,
    ratio,
    percent: Math.floor(ratio * 100),
    juz,
    complete: pagesCount === TOTAL_PAGES,
  };
}

/** Pages covered by a session that weren't covered before it (for "+N new pages"). */
export function newPagesFrom(before: readonly PageRange[], session: PageRange): number {
  const prior = coveredPages(before);
  let n = 0;
  for (const p of coveredPages([session])) if (!prior.has(p)) n++;
  return n;
}
