import { useQuery } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import { supabase, unwrap, unwrapMaybe } from '@/services/supabase';
import type { Tables } from '@/lib/database.types';
import { generateSlots, type AvailabilityRule, type Interval } from '@/lib/slots';
import { useAuthStore } from '@/features/auth/store';

export type PublicTeacher = Tables<'public_teachers'> & {
  id: string;
  full_name: string;
  riwayat: string[];
};
export type PublicReview = Tables<'public_reviews'>;

/** Days ahead shown to students when booking. */
export const BOOKING_HORIZON_DAYS = 14;

export function useTeachers(filters: { riwayah: string | null; search: string }) {
  const search = filters.search.trim();
  return useQuery({
    queryKey: ['teachers', filters.riwayah, search],
    queryFn: async () =>
      unwrap(
        await supabase.rpc('list_teachers', {
          p_riwayah: filters.riwayah ?? undefined,
          p_search: search || undefined,
        }),
      ) as PublicTeacher[],
  });
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: ['teacher', id],
    queryFn: async () =>
      unwrap(
        await supabase.from('public_teachers').select('*').eq('id', id).single(),
      ) as PublicTeacher,
  });
}

export function useTeacherReviews(id: string, limit = 5) {
  return useQuery({
    queryKey: ['teacher', id, 'reviews', limit],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('public_reviews')
          .select('*')
          .eq('teacher_id', id)
          .order('created_at', { ascending: false })
          .limit(limit),
      ),
  });
}

/** Weekly rules + busy intervals for a set of teachers over the booking horizon. */
export function useTeacherAvailability(teacherIds: string[]) {
  const ids = [...teacherIds].sort();
  return useQuery({
    queryKey: ['availability', ids],
    enabled: ids.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const from = new Date();
      const to = addDays(from, BOOKING_HORIZON_DAYS + 1);
      const [rules, busy] = await Promise.all([
        supabase
          .from('availability_rules')
          .select('teacher_id, weekday, start_time, end_time, timezone')
          .in('teacher_id', ids),
        supabase.rpc('teacher_busy', {
          p_teacher_ids: ids,
          p_from: from.toISOString(),
          p_to: to.toISOString(),
        }),
      ]);
      const r = unwrap(rules);
      const b = unwrap(busy);
      const byTeacher = new Map<string, { rules: AvailabilityRule[]; busy: Interval[] }>();
      for (const id of ids) byTeacher.set(id, { rules: [], busy: [] });
      for (const x of r) byTeacher.get(x.teacher_id)?.rules.push(x);
      for (const x of b) byTeacher.get(x.teacher_id)?.busy.push(x);
      return { byTeacher, fetchedAt: from };
    },
  });
}

export function nextSlot(
  entry: { rules: AvailabilityRule[]; busy: Interval[] } | undefined,
): Date | null {
  if (!entry || entry.rules.length === 0) return null;
  const from = new Date();
  const slots = generateSlots({
    rules: entry.rules,
    busy: entry.busy,
    from,
    to: addDays(from, BOOKING_HORIZON_DAYS),
    durationMin: 30,
  });
  return slots[0] ?? null;
}

/** Whether the signed-in student already used the free trial with this teacher. */
export function useTrialUsed(teacherId: string) {
  const uid = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['trial-used', uid, teacherId],
    enabled: !!uid,
    queryFn: async () =>
      !!unwrapMaybe(
        await supabase
          .from('bookings')
          .select('id')
          .eq('student_id', uid!)
          .eq('teacher_id', teacherId)
          .eq('is_trial', true)
          .neq('status', 'cancelled')
          .limit(1)
          .maybeSingle(),
      ),
  });
}
