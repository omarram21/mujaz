import { useAuthStore } from '@/features/auth/store';
import { deviceTimeZone } from '@/lib/dates';

/** Times are shown in the profile's zone (set at onboarding), falling back to the device zone. */
export function useViewerTimeZone(): string {
  const tz = useAuthStore((s) => s.profile?.timezone);
  return tz && tz !== 'UTC' ? tz : deviceTimeZone();
}
