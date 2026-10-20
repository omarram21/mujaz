import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BottomBar,
  Button,
  Card,
  ErrorState,
  Icon,
  IconButton,
  LightHeader,
  LoadingState,
  Notice,
  Screen,
  Tag,
  Text,
  Toggle,
} from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatDate, utcOffsetLabel, weekdayName } from '@/lib/dates';
import { cityOfZone } from '@/lib/countries';
import { updateProfile } from '@/features/auth/api';
import { useRequiredProfile } from '@/features/auth/store';
import {
  toMinutes,
  useAddException,
  useDeleteException,
  useMyExceptions,
  useMyRules,
  useSaveRules,
  type RuleDraft,
} from './api';
import { formatRange } from './clock';
import { DayEditor } from './DayEditor';
import { BlockDatesSheet } from './BlockDatesSheet';

// Week starts on Saturday in most of the Arab world, Sunday elsewhere.
const WEEK_AR = [6, 0, 1, 2, 3, 4, 5];
const WEEK_EN = [0, 1, 2, 3, 4, 5, 6];

export function AvailabilityScreen() {
  const rules = useMyRules();
  const exceptions = useMyExceptions();
  if (rules.isPending || exceptions.isPending) return <LoadingState />;
  if (rules.isError || exceptions.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void rules.refetch();
          void exceptions.refetch();
        }}
      />
    );
  }
  return (
    <AvailabilityEditor
      initial={rules.data.map((r) => ({
        weekday: r.weekday,
        start: toMinutes(r.start_time),
        end: toMinutes(r.end_time),
      }))}
      exceptions={exceptions.data}
    />
  );
}

function AvailabilityEditor({
  initial,
  exceptions,
}: {
  initial: RuleDraft[];
  exceptions: { id: string; starts_at: string; ends_at: string; reason: string | null }[];
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const profile = useRequiredProfile();
  const tz = profile.timezone;
  const [draft, setDraft] = useState<RuleDraft[]>(initial);
  const [editing, setEditing] = useState<number | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [accepting, setAccepting] = useState(profile.accepting_bookings);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string }>();
  const save = useSaveRules();
  const addException = useAddException();
  const deleteException = useDeleteException();
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);

  const onSave = async () => {
    setMessage(undefined);
    try {
      await save.mutateAsync({ rules: draft, timezone: tz });
      setMessage({ tone: 'success', text: t('availability.saved') });
    } catch {
      setMessage({ tone: 'danger', text: t('auth.errors.generic') });
    }
  };

  const toggleAccepting = async (v: boolean) => {
    setAccepting(v);
    try {
      await updateProfile({ accepting_bookings: v });
    } catch {
      setAccepting(!v);
    }
  };

  return (
    <Screen
      statusBar="dark"
      header={
        <LightHeader
          title={t('availability.title')}
          subtitle={t('availability.zone', {
            city: cityOfZone(tz, locale),
            offset: utcOffsetLabel(tz),
          })}
          back={() => (router.canGoBack() ? router.back() : router.replace('/schedule'))}
        />
      }
      contentStyle={{ gap: 16 }}
      footer={
        <BottomBar>
          <Button
            label={t('availability.save')}
            disabled={!dirty}
            loading={save.isPending}
            onPress={onSave}
          />
        </BottomBar>
      }
    >
      <Card padding={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text size={13.5} weight="600">
            {t('availability.accepting')}
          </Text>
          <Text size={11.5} color="textMuted" style={{ marginTop: 2 }}>
            {t('availability.acceptingHint')}
          </Text>
        </View>
        <Toggle
          label={t('availability.accepting')}
          value={accepting}
          onValueChange={(v) => void toggleAccepting(v)}
        />
      </Card>

      <View style={{ gap: 8 }}>
        <Text size={13} weight="600" accessibilityRole="header">
          {t('availability.weekly')}
        </Text>
        {(locale === 'ar' ? WEEK_AR : WEEK_EN).map((d) => {
          const ranges = draft.filter((r) => r.weekday === d).sort((a, b) => a.start - b.start);
          const off = ranges.length === 0;
          return (
            <View
              key={d}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 11,
                backgroundColor: off ? '#F7F4ED' : colors.surface,
                borderWidth: 1,
                borderColor: off ? '#EFEADF' : colors.border,
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: 13,
              }}
            >
              <Text
                size={13}
                weight={off ? '400' : '600'}
                color={off ? 'textDisabled' : 'text'}
                style={{ width: 62 }}
              >
                {weekdayName(d, locale)}
              </Text>
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {off ? (
                  <Text size={12} color="textDisabled">
                    {t('availability.dayOff')}
                  </Text>
                ) : (
                  ranges.map((r) => (
                    <Tag key={`${r.start}`} label={formatRange(r.start, r.end, locale)} />
                  ))
                )}
              </View>
              <IconButton
                icon="edit"
                size={30}
                accessibilityLabel={t('availability.editDay', { day: weekdayName(d, locale) })}
                onPress={() => setEditing(d)}
              />
            </View>
          );
        })}
      </View>

      <View style={{ gap: 8 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text size={13} weight="600" accessibilityRole="header">
            {t('availability.blocked')}
          </Text>
          <Pressable
            onPress={() => setBlockOpen(true)}
            accessibilityRole="button"
            hitSlop={10}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32 }}
          >
            <Icon name="plus" size={15} color={colors.ground} strokeWidth={2} />
            <Text size={12.5} weight="600" color="ground">
              {t('availability.add')}
            </Text>
          </Pressable>
        </View>
        {exceptions.length === 0 ? (
          <Text size={12} color="textMuted">
            {t('availability.noBlocked')}
          </Text>
        ) : (
          exceptions.map((e) => (
            <Card
              key={e.id}
              padding={12}
              radius={14}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}
            >
              <View style={{ flex: 1 }}>
                <Text size={13} weight="600">
                  {`${formatDate(e.starts_at, tz, locale, { weekday: false })} — ${formatDate(
                    new Date(new Date(e.ends_at).getTime() - 1),
                    tz,
                    locale,
                    { weekday: false },
                  )}`}
                </Text>
                <Text size={11} color="textMuted" style={{ marginTop: 2 }}>
                  {[e.reason, t('availability.noSlotsShown')].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <IconButton
                icon="trash"
                size={30}
                iconColor={colors.danger}
                accessibilityLabel={t('availability.removeBlock')}
                onPress={() => deleteException.mutate(e.id)}
              />
            </Card>
          ))
        )}
      </View>

      <Notice tone="success" icon="globe" text={t('availability.tzNote')} />
      {message ? <Notice tone={message.tone} text={message.text} /> : null}

      {editing !== null ? (
        <DayEditor
          weekday={editing}
          ranges={draft.filter((r) => r.weekday === editing)}
          onClose={() => setEditing(null)}
          onSave={(d, list) => {
            setDraft((all) => [...all.filter((r) => r.weekday !== d), ...list]);
            setEditing(null);
          }}
        />
      ) : null}
      <BlockDatesSheet
        visible={blockOpen}
        timeZone={tz}
        saving={addException.isPending}
        onClose={() => setBlockOpen(false)}
        onSave={(startsAt, endsAt, reason) =>
          addException.mutate(
            { startsAt, endsAt, reason },
            { onSuccess: () => setBlockOpen(false) },
          )
        }
      />
    </Screen>
  );
}
