import { useQuery } from '@tanstack/react-query';
import { supabase, unwrap } from '@/services/supabase';
import type { Tables } from '@/lib/database.types';
import { TOTAL_PAGES, pageRangeToAyahs, type AyahRef } from '@/lib/quran';

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
