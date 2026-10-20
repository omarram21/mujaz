import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, unwrap, unwrapMaybe } from '@/services/supabase';

/** Which of these bookings the signed-in student has already reviewed. */
export function useReviewedBookings(bookingIds: string[]) {
  const ids = [...bookingIds].sort();
  return useQuery({
    queryKey: ['reviewed', ids],
    enabled: ids.length > 0,
    queryFn: async () =>
      new Set(
        unwrap(await supabase.from('reviews').select('booking_id').in('booking_id', ids)).map(
          (r) => r.booking_id,
        ),
      ),
  });
}

export const REVIEW_TAGS = ['precise', 'patient', 'clearNotes', 'punctual', 'clearVoice'] as const;
export type ReviewTag = (typeof REVIEW_TAGS)[number];

export function useMyReview(bookingId: string) {
  return useQuery({
    queryKey: ['my-review', bookingId],
    queryFn: async () =>
      unwrapMaybe(
        await supabase.from('reviews').select('*').eq('booking_id', bookingId).maybeSingle(),
      ),
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      bookingId: string;
      teacherId: string;
      rating: number;
      tags: ReviewTag[];
      comment: string;
    }) =>
      unwrap(
        await supabase
          .from('reviews')
          .insert({
            booking_id: input.bookingId,
            rating: input.rating,
            tags: input.tags,
            comment: input.comment.trim() || null,
            // The trigger re-derives teacher/student from the booking; this only satisfies the type.
            teacher_id: input.teacherId,
          })
          .select('*')
          .single(),
      ),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['reviewed'] });
      void qc.invalidateQueries({ queryKey: ['my-review', v.bookingId] });
      void qc.invalidateQueries({ queryKey: ['teacher'] });
      void qc.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}
