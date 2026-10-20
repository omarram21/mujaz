import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Button, ErrorState, Icon, LoadingState, Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatDuration } from '@/lib/dates';
import { useNow } from '@/lib/useNow';
import { supabase, unwrap } from '@/services/supabase';
import { CallVideo } from '@/services/calls';
import { canJoin, JOIN_WINDOW_MIN, useBooking } from '@/features/booking/api';
import { prepHint, useProgramRecords } from '@/features/progress/api';
import {
  isPositionMessage,
  useAddMistake,
  useDeleteMistake,
  useLiveMistakes,
  useLiveStore,
  type ReadingPosition,
} from './api';
import { useCall } from './useCall';
import { MistakeItem } from './components/MistakeItem';
import { Waveform } from './components/Waveform';
import { PositionCard } from './components/PositionCard';
import { PositionSheet } from './components/PositionSheet';
import { AddMistakeSheet } from './components/AddMistakeSheet';

export function LiveSessionScreen({ role }: { role: 'student' | 'teacher' }) {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const booking = useBooking(bookingId);
  if (booking.isPending)
    return (
      <DarkShell>
        <LoadingState tone="dark" />
      </DarkShell>
    );
  if (booking.isError) {
    return (
      <DarkShell>
        <ErrorState onRetry={() => void booking.refetch()} />
      </DarkShell>
    );
  }
  return <Live role={role} booking={booking.data} key={booking.data.id} />;
}

function DarkShell({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.groundDarkest,
        paddingTop: insets.top,
        justifyContent: 'center',
      }}
    >
      <StatusBar style="light" />
      {children}
    </View>
  );
}

type BookingRow = NonNullable<ReturnType<typeof useBooking>['data']>;

function useCounterpartName(role: 'student' | 'teacher', b: BookingRow) {
  return useQuery({
    queryKey: ['counterpart', role, b.id],
    queryFn: async () => {
      const res =
        role === 'student'
          ? await supabase
              .from('public_teachers')
              .select('full_name')
              .eq('id', b.teacher_id)
              .single()
          : await supabase.from('profiles').select('full_name').eq('id', b.student_id).single();
      return unwrap(res).full_name ?? '';
    },
  });
}

function Live({ role, booking }: { role: 'student' | 'teacher'; booking: BookingRow }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const joinable = canJoin(booking, new Date(now));
  const name = useCounterpartName(role, booking);
  const records = useProgramRecords(booking.program_id);
  const mistakes = useLiveMistakes(booking.id);
  const addMistake = useAddMistake(booking);
  const deleteMistake = useDeleteMistake(booking.id);
  const stored = useLiveStore((s) => s.positions[booking.id]);
  const setStored = useLiveStore((s) => s.setPosition);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [editPos, setEditPos] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const call = useCall(booking.id, joinable, (d) => {
    // Students follow the reading position broadcast by the teacher.
    if (role === 'student' && isPositionMessage(d))
      setStored(booking.id, { fromPage: d.fromPage, toPage: d.toPage });
  });
  const remote = call.state.participants.find((p) => !p.isLocal);
  const local = call.state.participants.find((p) => p.isLocal);
  const remoteSpeaking = !!remote && call.state.activeSpeakerId === remote.id && remote.audioOn;

  const position: ReadingPosition = useMemo(() => {
    if (stored) return stored;
    const hint = records.data ? prepHint(records.data) : null;
    return hint ? { fromPage: hint.fromPage, toPage: hint.toPage } : { fromPage: 1, toPage: 1 };
  }, [stored, records.data]);

  // The teacher (re)sends the position whenever it changes or the student (re)joins.
  const remoteId = remote?.id;
  const { send } = call.controls;
  useEffect(() => {
    if (role === 'teacher' && remoteId) send({ type: 'position', ...position });
  }, [role, remoteId, position, send]);

  const end = () =>
    Alert.alert(
      t('live.endTitle'),
      role === 'teacher' ? t('live.endBodyTeacher') : t('live.endBodyStudent'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('live.end'),
          style: 'destructive',
          onPress: async () => {
            await call.controls.leave();
            if (role === 'teacher')
              router.replace({
                pathname: '/session-notes/[bookingId]',
                params: { bookingId: booking.id },
              });
            else
              router.replace({ pathname: '/rate/[bookingId]', params: { bookingId: booking.id } });
          },
        },
      ],
    );

  if (!joinable) {
    const startsIn = Math.max(
      0,
      Math.round((new Date(booking.starts_at).getTime() - JOIN_WINDOW_MIN * 60_000 - now) / 1000),
    );
    const over = now >= new Date(booking.ends_at).getTime() || booking.status === 'cancelled';
    return (
      <DarkShell>
        <View style={{ alignItems: 'center', gap: 14, padding: 28 }}>
          <Icon name="clock" size={40} color={colors.gold} />
          <Text size={17} weight="600" color="creamBright" align="center">
            {over ? t('live.overTitle') : t('live.waitTitle')}
          </Text>
          <Text size={13} color="onDarkMuted" align="center" relaxed>
            {over ? t('live.overBody') : t('live.waitBody')}
          </Text>
          {!over ? (
            <Text family="display" weight="700" size={32} color="gold" letterSpacing={1}>
              {formatDuration(startsIn, locale)}
            </Text>
          ) : null}
          <Button
            label={t('common.back')}
            variant="outlineDark"
            onPress={() => router.back()}
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      </DarkShell>
    );
  }

  if (call.joinError) {
    const key = [
      'permissions',
      'daily_not_configured',
      'too_early',
      'session_over',
      'unsupported',
    ].includes(call.joinError)
      ? `live.errors.${call.joinError}`
      : 'live.errors.generic';
    return (
      <DarkShell>
        <View style={{ alignItems: 'center', gap: 14, padding: 28 }}>
          <Icon name="wifiOff" size={40} color={colors.dangerBright} />
          <Text size={16} weight="600" color="creamBright" align="center">
            {t('live.errors.title')}
          </Text>
          <Text size={13} color="onDarkMuted" align="center" relaxed>
            {t(key)}
          </Text>
          <Button
            label={t('common.retry')}
            variant="gold"
            onPress={call.retry}
            style={{ alignSelf: 'stretch' }}
          />
          <Button
            label={t('common.back')}
            variant="outlineDark"
            onPress={() => router.back()}
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      </DarkShell>
    );
  }

  const elapsed = call.joinedAt ? Math.floor((now - call.joinedAt) / 1000) : 0;
  const counterpart = name.data ?? '';
  const otherId = role === 'student' ? booking.teacher_id : booking.student_id;

  return (
    <View style={{ flex: 1, backgroundColor: colors.groundDarkest, paddingTop: insets.top }}>
      <StatusBar style="light" />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dangerBright }}
          />
          <Text size={12} color="onDarkBody">
            {call.state.status === 'joined' ? t('live.live') : t('live.connecting')}
          </Text>
        </View>
        <Text
          family="display"
          weight="700"
          size={20}
          color="gold"
          letterSpacing={1}
          accessibilityLabel={t('live.elapsed')}
        >
          {formatDuration(elapsed, locale)}
        </Text>
        <View style={{ width: 70, alignItems: 'flex-end' }}>
          {!remote && call.state.status === 'joined' ? (
            <Text size={11} color="onDarkMuted">
              {t('live.waitingOther')}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={{
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 16,
        }}
      >
        {remote?.videoOn ? (
          <CallVideo
            participant={remote}
            style={{ width: '100%', height: 220, borderRadius: 24, overflow: 'hidden' }}
          />
        ) : (
          <View
            style={{
              borderRadius: 38,
              padding: 6,
              backgroundColor: remoteSpeaking ? 'rgba(212,175,90,0.28)' : 'rgba(212,175,90,0.12)',
            }}
          >
            <Avatar
              id={otherId}
              name={counterpart}
              size={104}
              radius={32}
              colors={[colors.cream, colors.ground]}
            />
          </View>
        )}
        <Text size={16} weight="600" color="creamBright">
          {counterpart}
        </Text>
        <Waveform
          active={remoteSpeaking}
          label={remoteSpeaking ? t('live.speaking', { name: counterpart }) : t('live.silent')}
        />
        {local?.videoOn ? (
          <View
            style={{
              position: 'absolute',
              top: 12,
              end: 20,
              width: 84,
              height: 112,
              borderRadius: 14,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.borderDarkAlt,
            }}
          >
            <CallVideo participant={local} mirror style={{ width: 84, height: 112 }} />
          </View>
        ) : null}
      </View>

      <View
        style={{
          flex: 1,
          marginHorizontal: 20,
          backgroundColor: '#0C2A22',
          borderWidth: 1,
          borderColor: colors.borderDarkAlt,
          borderRadius: 20,
          padding: 16,
        }}
      >
        <ScrollView contentContainerStyle={{ gap: 14 }}>
          <PositionCard
            position={position}
            onEdit={role === 'teacher' ? () => setEditPos(true) : undefined}
          />
          <View style={{ gap: 9 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text size={12} color="onDarkSoft">
                {t('live.notes')}
              </Text>
              {role === 'teacher' ? (
                <Pressable
                  onPress={() => setAddOpen(true)}
                  accessibilityRole="button"
                  hitSlop={12}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 }}
                >
                  <Icon name="plus" size={14} color={colors.gold} strokeWidth={2} />
                  <Text size={12} weight="600" color="gold">
                    {t('live.addMistake')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {(mistakes.data ?? []).length === 0 ? (
              <Text size={12} color="onDarkMuted">
                {t('live.noMistakes')}
              </Text>
            ) : (
              (mistakes.data ?? []).map((m) => (
                <MistakeItem
                  key={m.id}
                  m={m}
                  onDelete={role === 'teacher' ? () => deleteMistake.mutate(m.id) : undefined}
                />
              ))
            )}
          </View>
        </ScrollView>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          paddingTop: 22,
          paddingBottom: Math.max(30, insets.bottom + 12),
        }}
      >
        <ControlButton
          icon={mic ? 'mic' : 'micOff'}
          label={mic ? t('live.mute') : t('live.unmute')}
          active={mic}
          onPress={() => {
            call.controls.setMic(!mic);
            setMic(!mic);
          }}
        />
        <ControlButton
          icon={cam ? 'camera' : 'cameraOff'}
          label={cam ? t('live.cameraOff') : t('live.cameraOn')}
          active={cam}
          onPress={() => {
            call.controls.setCamera(!cam);
            setCam(!cam);
          }}
        />
        <Pressable
          onPress={end}
          accessibilityRole="button"
          accessibilityLabel={t('live.end')}
          style={({ pressed }) => ({
            width: 70,
            height: 54,
            borderRadius: 27,
            backgroundColor: colors.dangerBright,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Icon name="phoneHangup" size={24} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>

      {editPos ? (
        <PositionSheet
          value={position}
          onClose={() => setEditPos(false)}
          onSave={(p) => {
            setStored(booking.id, p);
            setEditPos(false);
          }}
        />
      ) : null}
      {addOpen ? (
        <AddMistakeSheet
          position={position}
          saving={addMistake.isPending}
          onClose={() => setAddOpen(false)}
          onSave={(m) =>
            addMistake.mutate(m, {
              onSuccess: () => setAddOpen(false),
              onError: () => Alert.alert(t('common.errorTitle'), t('auth.errors.generic')),
            })
          }
        />
      ) : null}
    </View>
  );
}

function ControlButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: 'mic' | 'micOff' | 'camera' | 'cameraOff';
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => ({
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 1,
        borderColor: colors.borderDarkAlt,
        backgroundColor: active ? '#0C2A22' : colors.creamBright,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon name={icon} size={22} color={active ? colors.onDarkBody : colors.ground} />
    </Pressable>
  );
}
