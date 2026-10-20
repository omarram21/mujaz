import { useMemo } from 'react';
import { Alert, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Button,
  Card,
  DarkHeader,
  EmptyState,
  QueryView,
  Screen,
  Tag,
  Text,
} from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { formatDate, formatTime } from '@/lib/dates';
import { groupByDay } from '@/lib/slots';
import { useViewerTimeZone } from '@/features/profile/useViewerTimeZone';
import { useNow } from '@/lib/useNow';
import { bookingErrorKey, canJoin, useCancelBooking, useMyBookings } from '@/features/booking/api';
import { ApprovedTeacherOnly } from './TeacherOnly';

export function ScheduleScreen() {
  const { t } = useTranslation();
  return (
    <ApprovedTeacherOnly title={t('tabs.schedule')}>
      <Schedule />
    </ApprovedTeacherOnly>
  );
}

function Schedule() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const tz = useViewerTimeZone();
  const query = useMyBookings();
  const cancel = useCancelBooking();
  const now = useNow(15_000);

  const days = useMemo(() => {
    const upcoming = (query.data ?? []).filter(
      (b) => b.status === 'scheduled' && new Date(b.ends_at).getTime() > now,
    );
    const byId = new Map(upcoming.map((b) => [new Date(b.starts_at).getTime(), b]));
    return [
      ...groupByDay(
        upcoming.map((b) => new Date(b.starts_at)),
        tz,
      ),
    ].map(([key, starts]) => ({
      key,
      items: starts.map((s) => byId.get(s.getTime())!).filter(Boolean),
    }));
  }, [query.data, tz, now]);

  const confirmCancel = (id: string) =>
    Alert.alert(t('schedule.cancelTitle'), t('schedule.cancelBody'), [
      { text: t('common.close'), style: 'cancel' },
      {
        text: t('sessions.cancelConfirm'),
        style: 'destructive',
        onPress: () =>
          cancel.mutate(
            { bookingId: id, reason: t('schedule.cancelledByTeacher') },
            { onError: (e) => Alert.alert(t('common.errorTitle'), t(bookingErrorKey(e))) },
          ),
      },
    ]);

  return (
    <Screen
      header={
        <DarkHeader
          title={t('schedule.title')}
          right={
            <Button
              label={t('schedule.editHours')}
              variant="outlineDark"
              icon="clock"
              height={40}
              style={{ paddingHorizontal: 12 }}
              onPress={() => router.push('/availability')}
            />
          }
        />
      }
      refreshControl={
        <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />
      }
    >
      <QueryView
        query={query}
        isEmpty={() => days.length === 0}
        empty={
          <EmptyState
            icon="calendar"
            title={t('schedule.emptyTitle')}
            body={t('schedule.emptyBody')}
            actionLabel={t('schedule.editHours')}
            onAction={() => router.push('/availability')}
          />
        }
      >
        {() =>
          days.map((d) => (
            <View key={d.key} style={{ gap: 8 }}>
              <Text size={13} weight="600" accessibilityRole="header">
                {formatDate(d.items[0]!.starts_at, tz, locale)}
              </Text>
              {d.items.map((b) => {
                const name = b.student?.full_name ?? '';
                return (
                  <Card key={b.id} padding={13} style={{ gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Avatar id={b.student_id} name={name} size={44} radius={13} />
                      <View style={{ flex: 1 }}>
                        <Text size={14} weight="600">
                          {name}
                        </Text>
                        <Text size={12} color="textMuted">
                          {`${formatTime(b.starts_at, tz, locale)} · ${t('booking.minutes', { n: formatNumber(b.duration_min, locale) })}`}
                        </Text>
                      </View>
                      {b.is_trial ? <Tag label={t('sessions.trial')} tone="gold" /> : null}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Button
                        label={t('schedule.start')}
                        icon="camera"
                        height={42}
                        style={{ flex: 1 }}
                        disabled={!canJoin(b, new Date(now))}
                        onPress={() =>
                          router.push({
                            pathname: '/live/[bookingId]',
                            params: { bookingId: b.id },
                          })
                        }
                      />
                      <Button
                        label={t('schedule.record')}
                        variant="secondary"
                        height={42}
                        style={{ flex: 1 }}
                        onPress={() =>
                          router.push({
                            pathname: '/session-notes/[bookingId]',
                            params: { bookingId: b.id },
                          })
                        }
                      />
                      <Button
                        label={t('common.cancel')}
                        variant="ghost"
                        height={42}
                        onPress={() => confirmCancel(b.id)}
                        style={{ paddingHorizontal: 8 }}
                      />
                    </View>
                  </Card>
                );
              })}
            </View>
          ))
        }
      </QueryView>
      <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 4 }} />
    </Screen>
  );
}
