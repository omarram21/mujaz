import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useAuthStore } from '@/features/auth/store';
import { notificationsSupported, registerPushToken, syncSessionReminders } from './notifications';

/** Mounted while signed in: keeps reminders in sync and opens sessions from notifications. */
export function NotificationsBridge() {
  const role = useAuthStore((s) => s.profile?.role);
  const remindersEnabled = useAuthStore((s) => s.profile?.reminders_enabled);

  useEffect(() => {
    if (!notificationsSupported) return;
    void registerPushToken();
    void syncSessionReminders();
    const appState = AppState.addEventListener('change', (s) => {
      if (s === 'active') void syncSessionReminders();
    });
    const tap = Notifications.addNotificationResponseReceivedListener((res) => {
      const bookingId = res.notification.request.content.data?.bookingId;
      if (typeof bookingId !== 'string') return;
      if (role === 'teacher')
        router.push({ pathname: '/session-notes/[bookingId]', params: { bookingId } });
      else router.push({ pathname: '/session/[bookingId]', params: { bookingId } });
    });
    return () => {
      appState.remove();
      tap.remove();
    };
  }, [role, remindersEnabled]);

  return null;
}
