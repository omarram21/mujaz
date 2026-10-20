import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, unwrap, unwrapMaybe } from '@/services/supabase';
import type { Tables } from '@/lib/database.types';
import { useAuthStore } from '@/features/auth/store';

export type Rule = Tables<'availability_rules'>;
export type Exception = Tables<'availability_exceptions'>;
export interface RuleDraft {
  weekday: number;
  start: number; // minutes from midnight
  end: number;
}

export function useMyRules() {
  const uid = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['my-rules', uid],
    enabled: !!uid,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('availability_rules')
          .select('*')
          .eq('teacher_id', uid!)
          .order('weekday')
          .order('start_time'),
      ),
  });
}

export function useMyExceptions() {
  const uid = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['my-exceptions', uid],
    enabled: !!uid,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('availability_exceptions')
          .select('*')
          .eq('teacher_id', uid!)
          .gte('ends_at', new Date().toISOString())
          .order('starts_at'),
      ),
  });
}

const hhmm = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const toMinutes = (t: string) => {
  const [h = '0', m = '0'] = t.split(':');
  return Number(h) * 60 + Number(m);
};

/** Merge overlapping/adjacent ranges per weekday so the stored rules stay minimal. */
export function normalizeRules(rules: RuleDraft[]): RuleDraft[] {
  const out: RuleDraft[] = [];
  for (let d = 0; d < 7; d++) {
    const day = rules
      .filter((r) => r.weekday === d && r.end > r.start)
      .sort((a, b) => a.start - b.start);
    for (const r of day) {
      const last = out[out.length - 1];
      if (last && last.weekday === d && r.start <= last.end) last.end = Math.max(last.end, r.end);
      else out.push({ ...r });
    }
  }
  return out;
}

/** Replaces the teacher's weekly schedule. */
export function useSaveRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rules, timezone }: { rules: RuleDraft[]; timezone: string }) => {
      const uid = useAuthStore.getState().session?.user.id;
      if (!uid) throw new Error('not signed in');
      unwrapMaybe(await supabase.from('availability_rules').delete().eq('teacher_id', uid));
      const rows = normalizeRules(rules).map((r) => ({
        teacher_id: uid,
        weekday: r.weekday,
        start_time: hhmm(r.start),
        end_time: hhmm(Math.min(r.end, 1440)), // '24:00' is valid for Postgres time
        timezone,
      }));
      if (rows.length) unwrapMaybe(await supabase.from('availability_rules').insert(rows));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-rules'] });
      void qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useAddException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { startsAt: Date; endsAt: Date; reason?: string }) => {
      const uid = useAuthStore.getState().session?.user.id;
      if (!uid) throw new Error('not signed in');
      unwrapMaybe(
        await supabase.from('availability_exceptions').insert({
          teacher_id: uid,
          starts_at: input.startsAt.toISOString(),
          ends_at: input.endsAt.toISOString(),
          reason: input.reason?.trim() || null,
        }),
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-exceptions'] });
      void qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useDeleteException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrapMaybe(await supabase.from('availability_exceptions').delete().eq('id', id));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-exceptions'] });
      void qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
