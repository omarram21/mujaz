import { computeProgress, coveredPages, newPagesFrom } from '../progress';
import {
  firstAyahOfPage,
  juzOfPage,
  juzPages,
  lastAyahOfPage,
  pageOfAyah,
  SURAHS,
  JUZ,
} from '../quran';

describe('quran metadata', () => {
  it('has 114 surahs, 6236 ayahs, 30 juz', () => {
    expect(SURAHS).toHaveLength(114);
    expect(SURAHS.reduce((s, x) => s + x.ayahs, 0)).toBe(6236);
    expect(JUZ).toHaveLength(30);
  });
  it('maps pages and ayahs (Madani mushaf)', () => {
    expect(firstAyahOfPage(1)).toEqual({ surah: 1, ayah: 1 });
    expect(firstAyahOfPage(2)).toEqual({ surah: 2, ayah: 1 });
    expect(lastAyahOfPage(1)).toEqual({ surah: 1, ayah: 7 });
    expect(lastAyahOfPage(604)).toEqual({ surah: 114, ayah: 6 });
    expect(pageOfAyah({ surah: 2, ayah: 255 })).toBe(42);
    expect(pageOfAyah({ surah: 18, ayah: 1 })).toBe(293);
    expect(juzOfPage(182)).toBe(10);
    expect(juzOfPage(604)).toBe(30);
    expect(juzPages(30)).toEqual([582, 604]);
  });
});

describe('khatmah progress', () => {
  it('counts distinct pages and floors the percentage', () => {
    const p = computeProgress([
      { from_page: 1, to_page: 100 },
      { from_page: 50, to_page: 205 },
    ]);
    expect(p.pagesCount).toBe(205);
    expect(p.percent).toBe(33);
    expect(p.complete).toBe(false);
  });

  it('never shows 100% before the last page', () => {
    expect(computeProgress([{ from_page: 1, to_page: 603 }]).percent).toBe(99);
    const full = computeProgress([{ from_page: 1, to_page: 604 }]);
    expect(full.percent).toBe(100);
    expect(full.complete).toBe(true);
    expect(full.juz.every((j) => j === 'mastered')).toBe(true);
  });

  it('clamps out-of-range and reversed ranges', () => {
    expect(coveredPages([{ from_page: 600, to_page: 700 }]).size).toBe(5);
    expect(coveredPages([{ from_page: 10, to_page: 8 }]).size).toBe(3);
  });

  it('classifies each juz', () => {
    const [s, e] = juzPages(2);
    const p = computeProgress([{ from_page: 1, to_page: e - 1 }]);
    expect(p.juz[0]).toBe('mastered');
    expect(p.juz[1]).toBe('inProgress');
    expect(p.juz[2]).toBe('notStarted');
    expect(s).toBe(22);
  });

  it('counts only new pages for a session', () => {
    expect(newPagesFrom([{ from_page: 1, to_page: 10 }], { from_page: 9, to_page: 12 })).toBe(2);
  });

  it('handles no sessions', () => {
    const p = computeProgress([]);
    expect(p.pagesCount).toBe(0);
    expect(p.juz.every((j) => j === 'notStarted')).toBe(true);
  });
});
