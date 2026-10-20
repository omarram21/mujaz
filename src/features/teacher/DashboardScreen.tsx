import { useMemo } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { differenceInCalendarDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
  Avatar,
  Button,
  Card,
  DarkHeader,
  Icon,
  ProgressBar,
  Screen,
  StatTile,
  Tag,
  Text,
} from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber, localizeDigits } from '@/lib/formatNumber';
import { formatInTimeZone } from '@/lib/dates';
import { computeProgress } from '@/lib/progress';
import { useNow } from '@/lib/useNow';
import { useRequiredProfile } from '@/features/auth/store';
import { useViewerTimeZone } from '@/features/profile/useViewerTimeZone';
import { canJoin, useMyBookings, type BookingWithPeople } from '@/features/booking/api';
import { useMyPrograms, useRecordsForPrograms } from '@/features/progress/api';
import { useQuery } from '@tanstack/react-query';
import { supabase, unwrap } from '@/services/supabase';

export function DashboardScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const tz = useViewerTimeZone();
  const now = useNow(30_000);
  const profile = useRequiredProfile();
  const bookings = useMyBookings();
  const programs = useMyPrograms();
  const active = (programs.data ?? []).filter((p) => p.status === 'active');
  const records = useRecordsForPrograms(active.map((p) => p.id));

  const recorded = useQuery({
    queryKey: ['recorded-bookings', profile.id, bookings.data?.length],
    enabled: !!bookings.data,
    queryFn: async () =>
      new Set(
        unwrap(
          await supabase
            .from('session_progress')
            .select('booking_id')
            .eq('teacher_id', profile.id)
            .eq('status', 'approved'),
        ).map((r) => r.booking_id),
      ),
  });

  const view = useMemo(() => {
    const all = bookings.data ?? [];
    const todayKey = formatInTimeZone(new Date(now), tz, 'yyyy-MM-dd');
    const today = all.filter(
      (b) =>
        b.status !== 'cancelled' &&
        formatInTimeZone(new Date(b.starts_at), tz, 'yyyy-MM-dd') === todayKey,
    );
    const awaiting = all
      .filter(
        (b) =>
          b.status === 'scheduled' &&
          new Date(b.ends_at).getTime() < now &&
          !recorded.data?.has(b.id),
      )
      .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
    const nextToday = today.find(
      (b) => b.status === 'scheduled' && new Date(b.ends_at).getTime() > now,
    );
    const byProgram = new Map<string, { from_page: number; to_page: number }[]>();
    for (const r of records.data ?? []) {
      if (!r.program_id) continue;
      const list = byProgram.get(r.program_id) ?? [];
      list.push(r);
      byProgram.set(r.program_id, list);
    }
    const studentsProgress = active
      .map((p) => ({ program: p, progress: computeProgress(byProgram.get(p.id) ?? []) }))
      .sort((a, b) => b.progress.ratio - a.progress.ratio);
    return { today, awaiting, nextToday, studentsProgress };
  }, [bookings.data, records.data, recorded.data, active, now, tz]);

  const firstName = profile.full_name.split(' ').slice(0, 2).join(' ');

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={bookings.isRefetching}
          onRefresh={() => {
            void bookings.refetch();
            void programs.refetch();
            void records.refetch();
            void recorded.refetch();
          }}
        />
      }
      header={
        <DarkHeader style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar
              id={profile.id}
              name={profile.full_name}
              size={52}
              radius={15}
              colors={[colors.cream, colors.ground]}
            />
            <View style={{ flex: 1 }}>
              <Text size={12} color="onDarkMuted">
                {t('dashboard.welcome')}
              </Text>
              <Text size={17} weight="600" color="creamBright">
                {firstName}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: colors.success,
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 20,
              }}
            >
              <Icon
                name="shield"
                size={12}
                color={colors.successOnDark}
                fill={colors.successOnDark}
              />
              <Text size={11} weight="600" color="successOnDark">
                {t('dashboard.verified')}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <StatTile
              value={formatNumber(view.today.length, locale)}
              label={t('dashboard.sessionsToday')}
            />
            <StatTile
              value={formatNumber(active.length, locale)}
              label={t('dashboard.activeStudents')}
            />
            <StatTile
              value={formatNumber(profile.ijazahs_granted, locale)}
              label={t('teachers.ijazahsGranted')}
            />
          </View>
        </DarkHeader>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text size={14} weight="600" accessibilityRole="header">
          {t('dashboard.today')}
        </Text>
        <Pressable
          onPress={() => router.navigate('/schedule')}
          accessibilityRole="link"
          hitSlop={10}
        >
          <Text size={12.5} weight="600" color="ground">
            {t('dashboard.viewAll')}
          </Text>
        </Pressable>
      </View>
      {view.today.length === 0 ? (
        <Card>
          <Text size={12.5} color="textMuted">
            {t('dashboard.noSessionsToday')}
          </Text>
        </Card>
      ) : (
        view.today.map((b) => (
          <TodayRow key={b.id} b={b} highlighted={b.id === view.nextToday?.id} now={now} tz={tz} />
        ))
      )}

      {view.awaiting.length > 0 ? (
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/session-notes/[bookingId]',
              params: { bookingId: view.awaiting[0]!.id },
            })
          }
          accessibilityRole="button"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: colors.warningBg,
            borderWidth: 1,
            borderColor: colors.warningBorder,
            borderRadius: 16,
            padding: 13,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.goldOnLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text size={16} weight="700" color="#FFFFFF">
              {formatNumber(view.awaiting.length, locale)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text size={12} weight="600" color="warningText">
              {t('dashboard.awaitingRecord')}
            </Text>
            <Text size={12.5} weight="600" color="warningText" style={{ marginTop: 1 }}>
              {`${view.awaiting[0]!.student?.full_name ?? ''} — ${relativeDay(view.awaiting[0]!.starts_at, now, tz, t)}`}
            </Text>
            <Text size={11} color="warningText" style={{ marginTop: 1 }}>
              {t('dashboard.awaitingHint')}
            </Text>
          </View>
          <Icon name="forward" size={18} color={colors.goldText} />
        </Pressable>
      ) : null}

      <Text size={14} weight="600" style={{ marginTop: 4 }} accessibilityRole="header">
        {t('dashboard.closest')}
      </Text>
      <Card style={{ gap: 12 }}>
        {view.studentsProgress.length === 0 ? (
          <Text size={12.5} color="textMuted">
            {t('dashboard.noStudents')}
          </Text>
        ) : (
          view.studentsProgress.slice(0, 5).map(({ program, progress }) => (
            <Pressable
              key={program.id}
              onPress={() =>
                router.push({ pathname: '/student/[programId]', params: { programId: program.id } })
              }
              accessibilityRole="button"
              style={{ gap: 6 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text size={13} weight="500">
                  {program.student_name}
                </Text>
                <Text size={12.5} weight="700" color="success">
                  {formatNumber(progress.percent, locale, { percent: true })}
                </Text>
              </View>
              <ProgressBar
                value={progress.ratio}
                color={colors.success}
                label={program.student_name}
              />
            </Pressable>
          ))
        )}
      </Card>
    </Screen>
  );
}

function relativeDay(iso: string, now: number, tz: string, t: (k: string) => string) {
  const d = differenceInCalendarDays(
    toZonedTime(new Date(now), tz),
    toZonedTime(new Date(iso), tz),
  );
  return d === 0
    ? t('dates.today')
    : d === 1
      ? t('dates.yesterday')
      : formatInTimeZone(new Date(iso), tz, 'dd/MM');
}

function TodayRow({
  b,
  highlighted,
  now,
  tz,
}: {
  b: BookingWithPeople;
  highlighted: boolean;
  now: number;
  tz: string;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const h24 = Number(formatInTimeZone(new Date(b.starts_at), tz, 'H'));
  const clock = localizeDigits(
    `${h24 % 12 === 0 ? 12 : h24 % 12}:${formatInTimeZone(new Date(b.starts_at), tz, 'mm')}`,
    locale,
  );
  const period = h24 < 12 ? t('dashboard.am') : t('dashboard.pm');
  const done = b.status === 'completed' || new Date(b.ends_at).getTime() < now;
  const fg = highlighted ? 'creamBright' : 'text';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: highlighted ? colors.ground : colors.surface,
        borderWidth: highlighted ? 0 : 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 12,
      }}
    >
      <View
        style={{
          width: 52,
          alignItems: 'center',
          borderEndWidth: 1,
          borderEndColor: highlighted ? colors.borderDark : colors.divider,
          paddingEnd: 10,
        }}
      >
        <Text size={15} weight="700" color={highlighted ? 'gold' : 'ground'}>
          {clock}
        </Text>
        <Text size={10} color={highlighted ? 'onDarkMuted' : 'textMuted'}>
          {period}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text size={14} weight="600" color={fg}>
          {b.student?.full_name}
        </Text>
        <Text size={11.5} color={highlighted ? 'onDarkMuted' : 'textMuted'}>
          {`${t('booking.minutes', { n: formatNumber(b.duration_min, locale) })}${b.is_trial ? ` · ${t('sessions.trial')}` : ''}`}
        </Text>
      </View>
      {highlighted ? (
        <Button
          label={t('schedule.start')}
          variant="gold"
          height={40}
          style={{ paddingHorizontal: 16 }}
          disabled={!canJoin(b, new Date(now))}
          onPress={() =>
            router.push({ pathname: '/live/[bookingId]', params: { bookingId: b.id } })
          }
        />
      ) : done ? (
        <Tag
          label={b.status === 'completed' ? t('sessions.completed') : t('sessions.awaitingRecord')}
          tone={b.status === 'completed' ? 'success' : 'gold'}
        />
      ) : (
        <Tag label={t('dashboard.upcoming')} tone="neutral" />
      )}
    </View>
  );
}
