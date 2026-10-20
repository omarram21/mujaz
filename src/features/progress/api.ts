import { useQuery } from '@tanstack/react-query';
import { supabase, unwrap } from '@/services/supabase';
import type { Tables } from '@/lib/database.types';
import { TOTAL_PAGES, pageRangeToAyahs, type AyahRef } from '@/lib/quran';
import { useAuthStore } from '@/features/auth/store';

export type SessionRecord = Tables<'session_progress'>;
export type Program = Tables<'ijazah_programs'>;
export type Mistake = Tables<'recitation_mistakes'>;

/** Approved session records of a program (students only see approved ones). */
export function useProgramRecords(programId: string | null | undefined) {
  return useQuery({
    queryKey: ['program-records', programId],
    enabled: !!programId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('session_progress')
          .select('*')
          .eq('program_id', programId!)
          .eq('status', 'approved')
          .order('approved_at', { ascending: true }),
      ),
  });
}

export interface PrepHint {
  fromPage: number;
  toPage: number;
  from: AyahRef;
  to: AyahRef;
}

/** Next pages to prepare: continue after the furthest page, same length as the last session. */
export function prepHint(
  records: readonly Pick<SessionRecord, 'from_page' | 'to_page'>[],
): PrepHint | null {
  if (!records.length) {
    const r = pageRangeToAyahs(1, 3);
    return { fromPage: 1, toPage: 3, ...r };
  }
  const furthest = Math.max(...records.map((r) => r.to_page));
  if (furthest >= TOTAL_PAGES) return null;
  const last = records[records.length - 1]!;
  const len = Math.max(1, Math.min(10, last.to_page - last.from_page + 1));
  const fromPage = furthest + 1;
  const toPage = Math.min(TOTAL_PAGES, fromPage + len - 1);
  return { fromPage, toPage, ...pageRangeToAyahs(fromPage, toPage) };
}

export type ProgramWithPeople = Program & { student_name: string; teacher_name: string };

/** Programs of the signed-in user (as student or teacher), newest first, with both names. */
export function useMyPrograms() {
  const profile = useAuthStore((s) => s.profile);
  return useQuery({
    queryKey: ['programs', profile?.id],
    enabled: !!profile,
    queryFn: async (): Promise<ProgramWithPeople[]> => {
      const asTeacher = profile!.role === 'teacher';
      const rows = unwrap(
        await supabase
          .from('ijazah_programs')
          .select('*')
          .eq(asTeacher ? 'teacher_id' : 'student_id', profile!.id)
          .order('started_at', { ascending: false }),
      );
      const otherIds = [...new Set(rows.map((p) => (asTeacher ? p.student_id : p.teacher_id)))];
      const names = new Map<string, string>();
      if (otherIds.length) {
        const res = asTeacher
          ? await supabase.from('profiles').select('id, full_name').in('id', otherIds)
          : await supabase.from('public_teachers').select('id, full_name').in('id', otherIds);
        for (const p of unwrap(res)) if (p.id) names.set(p.id, p.full_name ?? '');
      }
      return rows.map((p) => ({
        ...p,
        student_name: asTeacher ? (names.get(p.student_id) ?? '') : profile!.full_name,
        teacher_name: asTeacher ? profile!.full_name : (names.get(p.teacher_id) ?? ''),
      }));
    },
  });
}

/** Approved records for several programs at once (teacher dashboard / students list). */
export function useRecordsForPrograms(programIds: string[]) {
  const ids = [...programIds].sort();
  return useQuery({
    queryKey: ['program-records-many', ids],
    enabled: ids.length > 0,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('session_progress')
          .select('program_id, from_page, to_page, approved_at')
          .in('program_id', ids)
          .eq('status', 'approved'),
      ),
  });
}

/** Number of mistakes per booking for a program's sessions. */
export function useMistakeCounts(bookingIds: string[]) {
  const ids = [...bookingIds].sort();
  return useQuery({
    queryKey: ['mistake-counts', ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const rows = unwrap(
        await supabase.from('recitation_mistakes').select('booking_id').in('booking_id', ids),
      );
      const map = new Map<string, number>();
      for (const r of rows) map.set(r.booking_id, (map.get(r.booking_id) ?? 0) + 1);
      return map;
    },
  });
}

/** Consecutive weeks (ending this week or last) with at least one approved session. */
export function weekStreak(dates: readonly Date[], now = new Date()): number {
  const WEEK = 7 * 86_400_000;
  const weekIndex = (d: Date) => Math.floor(d.getTime() / WEEK);
  const weeks = new Set(dates.map(weekIndex));
  let w = weekIndex(now);
  if (!weeks.has(w)) w -= 1;
  let n = 0;
  while (weeks.has(w)) {
    n++;
    w--;
  }
  return n;
}

/** Projected completion date from the pace of the last 60 days; null without enough data. */
export function projectedFinish(
  records: readonly { from_page: number; to_page: number; approved_at: string | null }[],
  pagesDone: number,
  now = new Date(),
): Date | null {
  const windowStart = now.getTime() - 60 * 86_400_000;
  const recent = records.filter(
    (r) => r.approved_at && new Date(r.approved_at).getTime() >= windowStart,
  );
  const pages = recent.reduce((s, r) => s + (r.to_page - r.from_page + 1), 0);
  if (pages < 5) return null;
  const perDay = pages / 60;
  const remaining = TOTAL_PAGES - pagesDone;
  if (remaining <= 0) return now;
  return new Date(now.getTime() + (remaining / perDay) * 86_400_000);
}
