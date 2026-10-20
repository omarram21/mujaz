import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { t } from 'i18next';
import { supabase } from './supabase';
import { useAuthStore } from '@/features/auth/store';
import { formatTime } from '@/lib/dates';

const PREFIX = 'mujaz-booking-';
const OFFSETS_MIN = [24 * 60, 15]; // a day before and 15 minutes before

export const notificationsSupported = Platform.OS !== 'web';

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensurePermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sessions', {
      name: t('notifications.channel'),
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Stores the Expo push token for future server-sent notifications (needs an EAS project id). */
export async function registerPushToken(): Promise<void> {
  const uid = useAuthStore.getState().session?.user.id;
  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!uid || !projectId || !Device.isDevice || !(await ensurePermission())) return;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.from('push_tokens').upsert({
      token,
      user_id: uid,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Push is optional in v1; local reminders still work.
  }
}

/** Re-schedules local reminders for the user's upcoming sessions. Idempotent. */
export async function syncSessionReminders(): Promise<void> {
  if (!notificationsSupported) return;
  const { profile } = useAuthStore.getState();
  if (!profile) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ours = scheduled.filter((n) => n.identifier.startsWith(PREFIX));
  await Promise.all(ours.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  if (!profile.reminders_enabled || !(await ensurePermission())) return;

  const column = profile.role === 'teacher' ? 'teacher_id' : 'student_id';
  const { data } = await supabase
    .from('bookings')
    .select('id, starts_at')
    .eq(column, profile.id)
    .eq('status', 'scheduled')
    .gt('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(20);
  const locale = profile.locale === 'en' ? 'en' : 'ar';
  const now = Date.now();
  for (const b of data ?? []) {
    for (const offset of OFFSETS_MIN) {
      const fireAt = new Date(b.starts_at).getTime() - offset * 60_000;
      if (fireAt <= now) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}${b.id}-${offset}`,
        content: {
          title: t(offset >= 60 ? 'notifications.tomorrowTitle' : 'notifications.soonTitle'),
          body: t('notifications.body', {
            time: formatTime(b.starts_at, profile.timezone, locale),
          }),
          data: { bookingId: b.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(fireAt),
          channelId: 'sessions',
        },
      });
    }
  }
}
