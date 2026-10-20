import { useQuery } from '@tanstack/react-query';
import { supabase, unwrap } from '@/services/supabase';

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
