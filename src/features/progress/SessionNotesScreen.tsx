import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BottomBar,
  Button,
  Card,
  ErrorState,
  Icon,
  Input,
  LightHeader,
  LoadingState,
  Notice,
  Screen,
  Text,
} from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { formatDate } from '@/lib/dates';
import { TOTAL_PAGES, juzOfPage, pageRangeToAyahs } from '@/lib/quran';
import { supabase, unwrap, unwrapMaybe } from '@/services/supabase';
import { useViewerTimeZone } from '@/features/profile/useViewerTimeZone';
import { useBooking } from '@/features/booking/api';
import {
  useAddMistake,
  useDeleteMistake,
  useLiveMistakes,
  useLiveStore,
} from '@/features/live/api';
import { MistakeItem } from '@/features/live/components/MistakeItem';
import { AddMistakeSheet } from '@/features/live/components/AddMistakeSheet';
import { prepHint, useProgramRecords, type SessionRecord } from './api';
import { ayahSpanLabel } from './components/RecentSessions';

const QUALITIES = ['excellent', 'good', 'acceptable', 'repeat'] as const;
type Quality = (typeof QUALITIES)[number];

export function SessionNotesScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const booking = useBooking(bookingId);
  const record = useQuery({
    queryKey: ['session-record', bookingId],
    queryFn: async () =>
      unwrapMaybe(
        await supabase
          .from('session_progress')
          .select('*')
          .eq('booking_id', bookingId)
          .maybeSingle(),
      ),
  });
  const student = useQuery({
    queryKey: ['student-name', booking.data?.student_id],
    enabled: !!booking.data,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', booking.data!.student_id)
          .single(),
      ).full_name,
  });
  const programRecords = useProgramRecords(booking.data?.program_id);

  if (
    booking.isPending ||
    record.isPending ||
    (booking.data?.program_id && programRecords.isPending)
  ) {
    return <LoadingState />;
  }
  if (booking.isError || record.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void booking.refetch();
          void record.refetch();
        }}
      />
    );
  }
  return (
    <NotesForm
      booking={booking.data}
      existing={record.data}
      studentName={student.data ?? ''}
      previous={(programRecords.data ?? []).filter((r) => r.booking_id !== bookingId)}
    />
  );
}

function NotesForm({
  booking,
  existing,
  studentName,
  previous,
}: {
  booking: NonNullable<ReturnType<typeof useBooking>['data']>;
  existing: SessionRecord | null;
  studentName: string;
  previous: SessionRecord[];
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const tz = useViewerTimeZone();
  const qc = useQueryClient();
  const live = useLiveStore((s) => s.positions[booking.id]);
  const hint = prepHint(previous);
  const initial = existing
    ? { from: existing.from_page, to: existing.to_page }
    : live
      ? { from: live.fromPage, to: live.toPage }
      : { from: hint?.fromPage ?? 1, to: hint?.toPage ?? 1 };
  const [from, setFrom] = useState(String(initial.from));
  const [to, setTo] = useState(String(initial.to));
  const [quality, setQuality] = useState<Quality | null>(
    (existing?.quality as Quality | null) ?? null,
  );
  const [note, setNote] = useState(existing?.note ?? '');
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string>();
  const mistakes = useLiveMistakes(booking.id);
  const addMistake = useAddMistake(booking);
  const deleteMistake = useDeleteMistake(booking.id);
  const locked = existing?.status === 'approved';

  const f = Number(from);
  const tt = Number(to);
  const validPages =
    Number.isInteger(f) && Number.isInteger(tt) && f >= 1 && tt <= TOTAL_PAGES && tt >= f;

  const save = useMutation({
    mutationFn: async (status: 'draft' | 'approved') => {
      const span = pageRangeToAyahs(f, tt);
      return unwrap(
        await supabase
          .from('session_progress')
          .upsert(
            {
              booking_id: booking.id,
              teacher_id: booking.teacher_id,
              student_id: booking.student_id,
              program_id: booking.program_id,
              from_page: f,
              to_page: tt,
              from_surah: span.from.surah,
              from_ayah: span.from.ayah,
              to_surah: span.to.surah,
              to_ayah: span.to.ayah,
              quality,
              note: note.trim() || null,
              status,
            },
            { onConflict: 'booking_id' },
          )
          .select('*')
          .single(),
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['session-record', booking.id] });
      void qc.invalidateQueries({ queryKey: ['program-records'] });
      void qc.invalidateQueries({ queryKey: ['program-records-many'] });
      void qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const submit = async (status: 'draft' | 'approved') => {
    setError(undefined);
    if (!validPages) return setError(t('sessionNotes.errors.pages'));
    if (status === 'approved' && !quality) return setError(t('sessionNotes.errors.quality'));
    try {
      await save.mutateAsync(status);
      if (status === 'approved') router.replace('/dashboard');
      else setError(undefined);
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? '';
      setError(
        msg.includes('session_not_started')
          ? t('sessionNotes.errors.notStarted')
          : t('auth.errors.generic'),
      );
    }
  };

  const pages = validPages ? tt - f + 1 : 0;

  return (
    <Screen
      statusBar="dark"
      header={
        <LightHeader
          title={t('sessionNotes.title')}
          subtitle={t('sessionNotes.subtitle', {
            name: studentName,
            date: formatDate(booking.starts_at, tz, locale, { weekday: false }),
          })}
        />
      }
      contentStyle={{ gap: 16 }}
      footer={
        locked ? undefined : (
          <BottomBar style={{ flexDirection: 'row' }}>
            <Button
              label={t('sessionNotes.saveDraft')}
              variant="secondary"
              style={{ width: 120, paddingHorizontal: 8 }}
              height={52}
              loading={save.isPending && save.variables === 'draft'}
              onPress={() => void submit('draft')}
            />
            <Button
              label={t('sessionNotes.approve')}
              style={{ flex: 1 }}
              loading={save.isPending && save.variables === 'approved'}
              onPress={() => void submit('approved')}
            />
          </BottomBar>
        )
      }
    >
      {locked ? <Notice tone="success" icon="check" text={t('sessionNotes.lockedNotice')} /> : null}
      {save.isSuccess && save.data.status === 'draft' ? (
        <Notice tone="success" text={t('sessionNotes.draftSaved')} />
      ) : null}

      <Card radius={16}>
        <Text size={13} weight="600" style={{ marginBottom: 12 }} accessibilityRole="header">
          {t('sessionNotes.whatWasRead')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Input
              label={t('sessionNotes.fromPage')}
              keyboardType="number-pad"
              localizedDigits
              maxLength={3}
              value={from}
              onChangeText={setFrom}
              editable={!locked}
              ltr
              style={{ backgroundColor: colors.bg, minHeight: 44, fontSize: 15 }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label={t('sessionNotes.toPage')}
              keyboardType="number-pad"
              localizedDigits
              maxLength={3}
              value={to}
              onChangeText={setTo}
              editable={!locked}
              ltr
              style={{ backgroundColor: colors.bg, minHeight: 44, fontSize: 15 }}
            />
          </View>
        </View>
        <Text size={11.5} color={validPages ? 'success' : 'danger'} style={{ marginTop: 10 }}>
          {validPages
            ? `${ayahSpanLabel(f, tt, locale)} · ${t('progress.pages', { count: pages, n: formatNumber(pages, locale) })} · ${t('live.juzN', { n: formatNumber(juzOfPage(f), locale) })}`
            : t('sessionNotes.errors.pages')}
        </Text>
      </Card>

      <View>
        <Text size={13} weight="600" style={{ marginBottom: 10 }} accessibilityRole="header">
          {t('sessionNotes.quality')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 7 }} accessibilityRole="radiogroup">
          {QUALITIES.map((q) => {
            const sel = quality === q;
            return (
              <Pressable
                key={q}
                disabled={locked}
                onPress={() => setQuality(q)}
                accessibilityRole="radio"
                accessibilityState={{ checked: sel, disabled: locked }}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  borderWidth: sel ? 2 : 1,
                  borderColor: sel ? colors.success : colors.borderStrong,
                  backgroundColor: sel ? colors.success : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text size={12.5} weight={sel ? '600' : '400'} color={sel ? '#FFFFFF' : 'text'}>
                  {t(`quality.${q}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text size={13} weight="600" accessibilityRole="header">
            {t('sessionNotes.mistakes')}
          </Text>
          {!locked ? (
            <Pressable
              onPress={() => setAddOpen(true)}
              accessibilityRole="button"
              hitSlop={10}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32 }}
            >
              <Icon name="plus" size={15} color={colors.ground} strokeWidth={2} />
              <Text size={12.5} weight="600" color="ground">
                {t('availability.add')}
              </Text>
            </Pressable>
          ) : null}
        </View>
        {(mistakes.data ?? []).length === 0 ? (
          <Text size={12} color="textMuted">
            {t('sessionNotes.noMistakes')}
          </Text>
        ) : (
          (mistakes.data ?? []).map((m) => (
            <MistakeItem
              key={m.id}
              m={m}
              tone="light"
              onDelete={locked ? undefined : () => deleteMistake.mutate(m.id)}
            />
          ))
        )}
      </View>

      <Input
        label={t('sessionNotes.note')}
        multiline
        multilineHeight={96}
        value={note}
        onChangeText={setNote}
        editable={!locked}
        placeholder={t('sessionNotes.notePlaceholder')}
      />
      {error ? <Notice tone="danger" text={error} /> : null}

      {addOpen ? (
        <AddMistakeSheet
          position={{ fromPage: validPages ? f : 1, toPage: validPages ? tt : 1 }}
          saving={addMistake.isPending}
          onClose={() => setAddOpen(false)}
          onSave={(m) => addMistake.mutate(m, { onSuccess: () => setAddOpen(false) })}
        />
      ) : null}
    </Screen>
  );
}
