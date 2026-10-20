import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import {
  BottomBar,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  LightHeader,
  LoadingState,
  Notice,
  Screen,
  Text,
} from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber, formatPrice } from '@/lib/formatNumber';
import { cityOfZone } from '@/lib/countries';
import { formatDate, formatTime } from '@/lib/dates';
import { generateSlots, groupByDay } from '@/lib/slots';
import { riwayahName, useRiwayat } from '@/features/riwayat/api';
import { useRequiredProfile } from '@/features/auth/store';
import { useViewerTimeZone } from '@/features/profile/useViewerTimeZone';
import {
  BOOKING_HORIZON_DAYS,
  useTeacher,
  useTeacherAvailability,
  useTrialUsed,
} from '@/features/teachers/api';
import { bookingErrorKey, FREE_CANCEL_HOURS, useBookSession, useReschedule } from '../api';
import { DayStrip, type DayOption } from '../components/DayStrip';
import { SlotGrid, type SlotCell } from '../components/SlotGrid';

export function BookingScreen() {
  const {
    teacherId,
    reschedule,
    duration: durationParam,
  } = useLocalSearchParams<{
    teacherId: string;
    reschedule?: string;
    duration?: string;
  }>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const tz = useViewerTimeZone();
  const profile = useRequiredProfile();
  const teacher = useTeacher(teacherId);
  const availability = useTeacherAvailability([teacherId]);
  const trialUsed = useTrialUsed(teacherId);
  const riwayat = useRiwayat();
  const book = useBookSession();
  const move = useReschedule();
  const isReschedule = !!reschedule;

  const [duration, setDuration] = useState<30 | 60>(durationParam === '60' ? 60 : 30);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [error, setError] = useState<string>();

  const trial = !isReschedule && trialUsed.data === false && duration === 30;
  const entry = availability.data?.byTeacher.get(teacherId);

  const { days, cellsByDay, freeCount } = useMemo(() => {
    const from = new Date();
    const to = addDays(from, BOOKING_HORIZON_DAYS);
    const all = entry ? generateSlots({ rules: entry.rules, from, to, durationMin: duration }) : [];
    const free = entry
      ? generateSlots({ rules: entry.rules, busy: entry.busy, from, to, durationMin: duration })
      : [];
    const freeSet = new Set(free.map((d) => d.getTime()));
    const byDay = groupByDay(all, tz);
    const cells = new Map<string, SlotCell[]>();
    for (const [k, list] of byDay)
      cells.set(
        k,
        list.map((at) => ({ at, taken: !freeSet.has(at.getTime()) })),
      );
    const freeByDay = groupByDay(free, tz);
    const dayList: DayOption[] = Array.from({ length: BOOKING_HORIZON_DAYS }, (_, i) => {
      const date = addDays(from, i);
      const key = formatInTimeZone(date, tz, 'yyyy-MM-dd');
      return { key, date, available: freeByDay.has(key) };
    });
    return { days: dayList, cellsByDay: cells, freeCount: free.length };
  }, [entry, duration, tz]);

  const activeDay = dayKey ?? days.find((d) => d.available)?.key ?? null;
  const cells = (activeDay && cellsByDay.get(activeDay)) || [];
  const selectedSlot = slot && cells.some((c) => c.at.getTime() === slot && !c.taken) ? slot : null;

  if (teacher.isPending || availability.isPending) return <LoadingState />;
  if (teacher.isError || availability.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void teacher.refetch();
          void availability.refetch();
        }}
      />
    );
  }
  const x = teacher.data;
  const price = duration === 30 ? Number(x.price_30 ?? 0) : Number(x.price_60 ?? 0);
  const programRiwayah =
    x.riwayat.find((r) => profile.preferred_riwayat.includes(r)) ?? x.riwayat[0] ?? null;
  const goalLabel = programRiwayah
    ? t(`booking.goal_${profile.goal ?? 'ijazah'}`, {
        riwayah: riwayahName(riwayat.data, programRiwayah, locale),
      })
    : '—';

  const confirm = async () => {
    if (!selectedSlot) return;
    setError(undefined);
    try {
      if (isReschedule)
        await move.mutateAsync({ bookingId: reschedule!, startsAt: new Date(selectedSlot) });
      else await book.mutateAsync({ teacherId, startsAt: new Date(selectedSlot), duration, trial });
      router.dismissTo('/sessions');
    } catch (e) {
      const key = bookingErrorKey(e);
      setError(t(key));
      if (key.endsWith('slot_taken')) {
        setSlot(null);
        void availability.refetch();
      }
    }
  };

  return (
    <Screen
      statusBar="dark"
      header={
        <LightHeader
          title={isReschedule ? t('booking.rescheduleTitle') : t('booking.title')}
          subtitle={`${x.full_name} · ${t('booking.inZone', { city: cityOfZone(tz, locale) })}`}
        />
      }
      contentStyle={{ gap: 18 }}
      footer={
        <BottomBar>
          <Button
            label={isReschedule ? t('booking.confirmReschedule') : t('booking.confirm')}
            disabled={!selectedSlot}
            loading={book.isPending || move.isPending}
            onPress={confirm}
          />
          <Text size={11} color="textMuted" align="center">
            {t('booking.cancelNote', { hours: formatNumber(FREE_CANCEL_HOURS, locale) })}
          </Text>
        </BottomBar>
      }
    >
      {!isReschedule ? (
        <View>
          <Text size={13} weight="600" style={{ marginBottom: 10 }} accessibilityRole="header">
            {t('booking.duration')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }} accessibilityRole="radiogroup">
            {([30, 60] as const).map((d) => {
              const sel = d === duration;
              const p = d === 30 ? Number(x.price_30 ?? 0) : Number(x.price_60 ?? 0);
              return (
                <Pressable
                  key={d}
                  onPress={() => {
                    setDuration(d);
                    setSlot(null);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: sel }}
                  style={{
                    flex: 1,
                    height: 56,
                    borderRadius: 14,
                    borderWidth: sel ? 2 : 1,
                    borderColor: sel ? colors.ground : colors.borderStrong,
                    backgroundColor: sel ? colors.ground : colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                  }}
                >
                  <Text size={15} weight="600" color={sel ? 'cream' : 'text'}>
                    {t('booking.minutes', { n: formatNumber(d, locale) })}
                  </Text>
                  <Text size={11} color={sel ? '#AFC6BA' : 'textMuted'}>
                    {d === 30 && trialUsed.data === false
                      ? t('booking.freeTrial')
                      : formatPrice(p, locale)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {freeCount === 0 ? (
        <EmptyState
          icon="calendar"
          title={t('booking.noSlotsTitle')}
          body={t('booking.noSlotsBody')}
        />
      ) : (
        <>
          <View>
            <Text size={13} weight="600" style={{ marginBottom: 10 }} accessibilityRole="header">
              {t('booking.day')}
            </Text>
            <DayStrip
              days={days}
              selected={activeDay}
              timeZone={tz}
              onSelect={(k) => {
                setDayKey(k);
                setSlot(null);
              }}
            />
          </View>
          <View>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}
            >
              <Text size={13} weight="600" accessibilityRole="header">
                {t('booking.available')}
              </Text>
              <Text size={11} color="textMuted">
                {t('booking.slotCount', {
                  count: cells.filter((c) => !c.taken).length,
                  n: formatNumber(cells.filter((c) => !c.taken).length, locale),
                })}
              </Text>
            </View>
            <SlotGrid
              slots={cells}
              selected={selectedSlot}
              onSelect={(d) => setSlot(d.getTime())}
              timeZone={tz}
            />
          </View>
        </>
      )}

      {selectedSlot ? (
        <Card radius={16} style={{ gap: 9 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text size={12.5} color="textMuted">
              {t('booking.when')}
            </Text>
            <Text size={12.5} weight="600" style={{ flexShrink: 1 }} align="right">
              {`${formatDate(new Date(selectedSlot), tz, locale)} · ${formatTime(new Date(selectedSlot), tz, locale)}`}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text size={12.5} color="textMuted">
              {t('booking.goal')}
            </Text>
            <Text size={12.5} weight="600">
              {goalLabel}
            </Text>
          </View>
          {!isReschedule ? (
            <>
              <Divider />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text size={13} weight="600">
                  {t('booking.total')}
                </Text>
                <Text size={15} weight="700" color={trial ? 'success' : 'ground'}>
                  {trial ? t('booking.freeTrialTotal') : formatPrice(price, locale)}
                </Text>
              </View>
            </>
          ) : null}
        </Card>
      ) : null}

      {/* TODO(payments): collect payment here for paid sessions once a provider is chosen
          (HyperPay / PayTabs / Tap — Stripe isn't available to businesses in Jordan). */}
      {!trial && !isReschedule && selectedSlot ? (
        <Notice icon="card" text={t('booking.paymentNote')} />
      ) : null}
      {error ? <Notice tone="danger" text={error} /> : null}
    </Screen>
  );
}
