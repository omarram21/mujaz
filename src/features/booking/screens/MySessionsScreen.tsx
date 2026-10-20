import { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { differenceInCalendarDays, differenceInMinutes, endOfWeek } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Avatar, Button, EmptyState, Icon, QueryView, Screen, Tag, Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { formatDate, formatTime, weekdayName } from '@/lib/dates';
import { useViewerTimeZone } from '@/features/profile/useViewerTimeZone';
import { useNow } from '@/lib/useNow';
import {
  bookingErrorKey,
  canJoin,
  canStudentChange,
  useCancelBooking,
  useMyBookings,
  type BookingWithPeople,
} from '../api';
import { PrepLine } from '../components/PrepLine';
import { useReviewedBookings } from '@/features/reviews/api';

type Tab = 'upcoming' | 'past' | 'cancelled';

export function MySessionsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const query = useMyBookings();
  const [tab, setTab] = useState<Tab>('upcoming');
  const now = useNow();

  const groups = useMemo(() => {
    const list = query.data ?? [];
    return {
      upcoming: list.filter((b) => b.status === 'scheduled' && new Date(b.ends_at).getTime() > now),
      past: list
        .filter(
          (b) =>
            b.status === 'completed' ||
            b.status === 'no_show' ||
            (b.status === 'scheduled' && new Date(b.ends_at).getTime() <= now),
        )
        .reverse(),
      cancelled: list.filter((b) => b.status === 'cancelled').reverse(),
    };
  }, [query.data, now]);

  return (
    <Screen
      statusBar="dark"
      header={
        <View
          style={{
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <SafeTop />
          <Text
            size={18}
            weight="600"
            style={{ paddingHorizontal: 20, paddingTop: 6 }}
            accessibilityRole="header"
          >
            {t('sessions.title')}
          </Text>
          <View
            style={{ flexDirection: 'row', paddingHorizontal: 12, marginTop: 8 }}
            accessibilityRole="tablist"
          >
            {(['upcoming', 'past', 'cancelled'] as const).map((k) => {
              const sel = tab === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setTab(k)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: sel }}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 2,
                    borderBottomColor: sel ? colors.ground : 'transparent',
                  }}
                >
                  <Text
                    size={13.5}
                    weight={sel ? '600' : '400'}
                    color={sel ? 'ground' : 'textMuted'}
                  >
                    {t(`sessions.tab_${k}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />
      }
    >
      <QueryView query={query}>
        {() =>
          tab === 'upcoming' ? (
            <UpcomingList
              items={groups.upcoming}
              lastTeacherId={(query.data ?? []).at(-1)?.teacher_id}
            />
          ) : tab === 'past' ? (
            <PastList items={groups.past} />
          ) : (
            <CancelledList items={groups.cancelled} />
          )
        }
      </QueryView>
    </Screen>
  );
}

/** Status bar spacer for the light header. */
function SafeTop() {
  const { top } = useSafeAreaInsets();
  return <View style={{ height: top + 8 }} />;
}

function UpcomingList({
  items,
  lastTeacherId,
}: {
  items: BookingWithPeople[];
  lastTeacherId?: string;
}) {
  const { t } = useTranslation();
  const tz = useViewerTimeZone();
  const locale = useLocale();
  const [next, ...rest] = items;
  if (!next) {
    return (
      <EmptyState
        icon="calendar"
        title={t('sessions.emptyUpcoming')}
        body={t('sessions.emptyUpcomingBody')}
        actionLabel={t('sessions.findTeacher')}
        onAction={() => router.navigate('/teachers')}
      />
    );
  }
  const weekEnd = endOfWeek(toZonedTime(new Date(), tz), { weekStartsOn: 6 }).getTime();
  const thisWeek = rest.filter((b) => toZonedTime(new Date(b.starts_at), tz).getTime() <= weekEnd);
  const later = rest.filter((b) => toZonedTime(new Date(b.starts_at), tz).getTime() > weekEnd);
  return (
    <>
      <Text size={12} color="textMuted">
        {dayHeading(next.starts_at, tz, locale, t)}
      </Text>
      <NextSessionCard b={next} />
      {thisWeek.length ? <SectionLabel text={t('sessions.thisWeek')} /> : null}
      {thisWeek.map((b) => (
        <SessionRow key={b.id} b={b} />
      ))}
      {later.length ? <SectionLabel text={t('sessions.later')} /> : null}
      {later.map((b) => (
        <SessionRow key={b.id} b={b} />
      ))}
      {lastTeacherId ? <BookNextPrompt teacherId={lastTeacherId} /> : null}
    </>
  );
}

function dayHeading(iso: string, tz: string, locale: 'ar' | 'en', t: (k: string) => string) {
  const days = differenceInCalendarDays(
    toZonedTime(new Date(iso), tz),
    toZonedTime(new Date(), tz),
  );
  const prefix = days === 0 ? t('dates.today') : days === 1 ? t('dates.tomorrow') : null;
  const date = formatDate(iso, tz, locale);
  return prefix ? `${prefix} · ${date}` : date;
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text size={13} weight="600" style={{ marginTop: 6 }} accessibilityRole="header">
      {text}
    </Text>
  );
}

function NextSessionCard({ b }: { b: BookingWithPeople }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const tz = useViewerTimeZone();
  const cancel = useCancelBooking();
  const now = useNow(15_000);
  const name = b.teacher?.full_name ?? '';
  const mins = differenceInMinutes(new Date(b.starts_at), now);
  const joinable = canJoin(b, new Date(now));
  const changeable = canStudentChange(b, new Date(now));
  const relative =
    mins <= 0
      ? t('sessions.now')
      : mins < 60
        ? t('sessions.inMinutes', { count: mins, n: formatNumber(mins, locale) })
        : mins < 48 * 60
          ? t('sessions.inHours', {
              count: Math.round(mins / 60),
              n: formatNumber(Math.round(mins / 60), locale),
            })
          : t('sessions.inDays', {
              count: Math.round(mins / 1440),
              n: formatNumber(Math.round(mins / 1440), locale),
            });

  const confirmCancel = () =>
    Alert.alert(t('sessions.cancelTitle'), t('sessions.cancelBody'), [
      { text: t('common.close'), style: 'cancel' },
      {
        text: t('sessions.cancelConfirm'),
        style: 'destructive',
        onPress: () =>
          cancel.mutate(
            { bookingId: b.id },
            { onError: (e) => Alert.alert(t('common.errorTitle'), t(bookingErrorKey(e))) },
          ),
      },
    ]);

  return (
    <View style={{ backgroundColor: colors.ground, borderRadius: 18, padding: 15, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar
          id={b.teacher_id}
          name={name}
          size={48}
          radius={14}
          colors={[colors.cream, colors.ground]}
        />
        <View style={{ flex: 1 }}>
          <Text size={15} weight="600" color="creamBright">
            {name}
          </Text>
          <Text size={12} color="onDarkMuted" style={{ marginTop: 2 }}>
            {`${formatTime(b.starts_at, tz, locale)} · ${t('booking.minutes', { n: formatNumber(b.duration_min, locale) })}${b.is_trial ? ` · ${t('sessions.trial')}` : ''}`}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: colors.groundDeep,
            borderRadius: 10,
            paddingHorizontal: 9,
            paddingVertical: 5,
          }}
        >
          <Text size={11} weight="600" color="gold">
            {relative}
          </Text>
        </View>
      </View>
      <View
        style={{
          backgroundColor: colors.groundDeep,
          borderRadius: 12,
          padding: 10,
          borderWidth: 1,
          borderColor: colors.borderDark,
        }}
      >
        <PrepLine programId={b.program_id} size={12} color="onDarkBody" />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          label={t('sessions.join')}
          variant="gold"
          icon="camera"
          style={{ flex: 1 }}
          height={48}
          disabled={!joinable}
          accessibilityHint={joinable ? undefined : t('sessions.joinHint')}
          onPress={() =>
            router.push({ pathname: '/session/[bookingId]', params: { bookingId: b.id } })
          }
        />
        <Button
          label={t('sessions.reschedule')}
          variant="outlineDark"
          style={{ flex: 1 }}
          height={48}
          disabled={!changeable}
          onPress={() =>
            router.push({
              pathname: '/book/[teacherId]',
              params: {
                teacherId: b.teacher_id,
                reschedule: b.id,
                duration: String(b.duration_min),
              },
            })
          }
        />
      </View>
      {changeable ? (
        <Pressable
          onPress={confirmCancel}
          accessibilityRole="button"
          hitSlop={8}
          style={{ alignSelf: 'center', minHeight: 32, justifyContent: 'center' }}
        >
          <Text size={12} color="onDarkMuted" style={{ textDecorationLine: 'underline' }}>
            {t('sessions.cancel')}
          </Text>
        </Pressable>
      ) : (
        <Text size={11} color="onDarkMuted" align="center">
          {t('sessions.changeClosed')}
        </Text>
      )}
    </View>
  );
}

function DateBox({ iso }: { iso: string }) {
  const { colors } = useTheme();
  const locale = useLocale();
  const tz = useViewerTimeZone();
  const z = toZonedTime(new Date(iso), tz);
  return (
    <View
      style={{
        width: 50,
        height: 54,
        borderRadius: 13,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text size={17} weight="700" color="ground">
        {formatNumber(z.getDate(), locale)}
      </Text>
      <Text size={10} color="textMuted">
        {weekdayName(z.getDay(), locale)}
      </Text>
    </View>
  );
}

function SessionRow({ b, trailing }: { b: BookingWithPeople; trailing?: React.ReactNode }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const tz = useViewerTimeZone();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 12,
      }}
    >
      <DateBox iso={b.starts_at} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text size={14} weight="600" numberOfLines={1}>
          {b.teacher?.full_name ?? b.student?.full_name}
        </Text>
        <Text size={12} color="textMuted">
          {`${formatTime(b.starts_at, tz, locale)} · ${t('booking.minutes', { n: formatNumber(b.duration_min, locale) })}`}
        </Text>
        {b.status === 'cancelled' && b.cancel_reason ? (
          <Text size={11.5} color="textMuted" numberOfLines={1}>
            {b.cancel_reason === 'rescheduled' ? t('sessions.wasRescheduled') : b.cancel_reason}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

function BookNextPrompt({ teacherId }: { teacherId: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#B9B0A0',
        borderRadius: 16,
        padding: 14,
        marginTop: 4,
      }}
    >
      <Icon name="calendarPlus" size={22} color={colors.ground} />
      <Text size={12.5} color="textBody" style={{ flex: 1 }} relaxed>
        {t('sessions.bookNextPrompt')}
      </Text>
      <Button
        label={t('sessions.bookNext')}
        height={40}
        style={{ paddingHorizontal: 18 }}
        onPress={() => router.push({ pathname: '/book/[teacherId]', params: { teacherId } })}
      />
    </View>
  );
}

function PastList({ items }: { items: BookingWithPeople[] }) {
  const { t } = useTranslation();
  const reviewed = useReviewedBookings(items.map((b) => b.id));
  if (!items.length) return <EmptyState icon="book" title={t('sessions.emptyPast')} />;
  return (
    <>
      {items.map((b) => (
        <SessionRow
          key={b.id}
          b={b}
          trailing={
            b.status === 'completed' && reviewed.data && !reviewed.data.has(b.id) ? (
              <Button
                label={t('sessions.rate')}
                variant="secondary"
                height={38}
                style={{ paddingHorizontal: 12 }}
                onPress={() =>
                  router.push({ pathname: '/rate/[bookingId]', params: { bookingId: b.id } })
                }
              />
            ) : b.status === 'completed' ? (
              <Tag label={t('sessions.completed')} />
            ) : (
              <Tag label={t('sessions.awaitingRecord')} tone="gold" />
            )
          }
        />
      ))}
    </>
  );
}

function CancelledList({ items }: { items: BookingWithPeople[] }) {
  const { t } = useTranslation();
  if (!items.length) return <EmptyState icon="calendar" title={t('sessions.emptyCancelled')} />;
  return (
    <>
      {items.map((b) => (
        <SessionRow
          key={b.id}
          b={b}
          trailing={<Tag label={t('sessions.cancelled')} tone="danger" />}
        />
      ))}
    </>
  );
}
