import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, unwrap } from '@/services/supabase';
import type { Tables } from '@/lib/database.types';
import { useAuthStore } from '@/features/auth/store';
import { syncSessionReminders } from '@/services/notifications';

export type Booking = Tables<'bookings'>;
export interface PersonLite {
  id: string;
  full_name: string;
}
export type BookingWithPeople = Booking & {
  teacher: PersonLite | null;
  student: PersonLite | null;
};

/** Students may cancel or reschedule until this many hours before the start (server enforces it too). */
export const FREE_CANCEL_HOURS = 6;
/** The "join" button opens this many minutes before the start. */
export const JOIN_WINDOW_MIN = 10;

export function canJoin(
  b: Pick<Booking, 'starts_at' | 'ends_at' | 'status'>,
  now = new Date(),
): boolean {
  const start = new Date(b.starts_at).getTime();
  const end = new Date(b.ends_at).getTime();
  return (
    b.status !== 'cancelled' &&
    now.getTime() >= start - JOIN_WINDOW_MIN * 60_000 &&
    now.getTime() < end
  );
}

export function canStudentChange(
  b: Pick<Booking, 'starts_at' | 'status'>,
  now = new Date(),
): boolean {
  return (
    b.status === 'scheduled' &&
    new Date(b.starts_at).getTime() - now.getTime() >= FREE_CANCEL_HOURS * 3_600_000
  );
}

/** Bookings of the signed-in user (as student or teacher) with the other party's name. */
export function useMyBookings() {
  const profile = useAuthStore((s) => s.profile);
  return useQuery({
    queryKey: ['bookings', profile?.id],
    enabled: !!profile,
    queryFn: async () =>
      fetchMyBookings(profile!.id, profile!.role === 'teacher' ? 'teacher' : 'student'),
  });
}

export async function fetchMyBookings(
  userId: string,
  as: 'student' | 'teacher',
): Promise<BookingWithPeople[]> {
  const rows = unwrap(
    await supabase
      .from('bookings')
      .select('*')
      .eq(as === 'student' ? 'student_id' : 'teacher_id', userId)
      .order('starts_at', { ascending: true }),
  );
  const otherIds = [...new Set(rows.map((b) => (as === 'student' ? b.teacher_id : b.student_id)))];
  const names = new Map<string, PersonLite>();
  if (otherIds.length) {
    // Students read teachers through the public directory; teachers may read their students' profiles.
    const res =
      as === 'student'
        ? await supabase.from('public_teachers').select('id, full_name').in('id', otherIds)
        : await supabase.from('profiles').select('id, full_name').in('id', otherIds);
    for (const p of unwrap(res))
      if (p.id) names.set(p.id, { id: p.id, full_name: p.full_name ?? '' });
  }
  return rows.map((b) => ({
    ...b,
    teacher: as === 'student' ? (names.get(b.teacher_id) ?? null) : null,
    student: as === 'teacher' ? (names.get(b.student_id) ?? null) : null,
  }));
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => unwrap(await supabase.from('bookings').select('*').eq('id', id).single()),
  });
}

function useAfterBookingChange() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['bookings'] });
    void qc.invalidateQueries({ queryKey: ['availability'] });
    void qc.invalidateQueries({ queryKey: ['trial-used'] });
    void syncSessionReminders();
  };
}

export function useBookSession() {
  const done = useAfterBookingChange();
  return useMutation({
    mutationFn: async (input: {
      teacherId: string;
      startsAt: Date;
      duration: 30 | 60;
      trial: boolean;
    }) =>
      unwrap(
        await supabase.rpc('book_session', {
          p_teacher_id: input.teacherId,
          p_starts_at: input.startsAt.toISOString(),
          p_duration: input.duration,
          p_is_trial: input.trial,
        }),
      ),
    onSuccess: done,
  });
}

export function useReschedule() {
  const done = useAfterBookingChange();
  return useMutation({
    mutationFn: async (input: { bookingId: string; startsAt: Date }) =>
      unwrap(
        await supabase.rpc('reschedule_booking', {
          p_booking_id: input.bookingId,
          p_new_start: input.startsAt.toISOString(),
        }),
      ),
    onSuccess: done,
  });
}

export function useCancelBooking() {
  const done = useAfterBookingChange();
  return useMutation({
    mutationFn: async (input: { bookingId: string; reason?: string }) =>
      unwrap(
        await supabase.rpc('cancel_booking', {
          p_booking_id: input.bookingId,
          p_reason: input.reason,
        }),
      ),
    onSuccess: done,
  });
}

/** Maps errors raised by the booking RPCs to i18n keys. */
export function bookingErrorKey(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? '';
  const known = [
    'slot_taken',
    'trial_already_used',
    'slot_unavailable',
    'outside_booking_window',
    'teacher_not_accepting',
    'teacher_not_matched',
    'cancellation_window_passed',
    'booking_not_scheduled',
    'booking_started',
  ];
  const hit = known.find((k) => msg.includes(k));
  return hit ? `booking.errors.${hit}` : 'auth.errors.generic';
}
