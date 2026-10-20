import { useMemo, useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { addDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { Button, Chip, IconButton, Input, Notice, Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatDate } from '@/lib/dates';

/** Pick a range of whole days (in the teacher's zone) during which no slots are offered. */
export function BlockDatesSheet({
  visible,
  timeZone,
  onClose,
  onSave,
  saving,
}: {
  visible: boolean;
  timeZone: string;
  onClose: () => void;
  onSave: (startsAt: Date, endsAt: Date, reason: string) => void;
  saving: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const days = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) =>
        formatInTimeZone(addDays(new Date(), i), timeZone, 'yyyy-MM-dd'),
      ),
    [timeZone],
  );
  const label = (key: string) =>
    formatDate(fromZonedTime(`${key}T12:00:00`, timeZone), timeZone, locale);

  const save = () => {
    if (!from) return;
    const last = to && to >= from ? to : from;
    const startsAt = fromZonedTime(`${from}T00:00:00`, timeZone);
    const endsAt = fromZonedTime(
      `${formatInTimeZone(addDays(fromZonedTime(`${last}T12:00:00`, timeZone), 1), timeZone, 'yyyy-MM-dd')}T00:00:00`,
      timeZone,
    );
    onSave(startsAt, endsAt, reason);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }}>
        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: 34,
            gap: 12,
          }}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text size={16} weight="600" accessibilityRole="header">
              {t('availability.blockTitle')}
            </Text>
            <IconButton icon="close" accessibilityLabel={t('common.close')} onPress={onClose} />
          </View>
          <Text size={12} color="textMuted">
            {t('availability.firstDay')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
            {days.map((d) => (
              <Chip
                key={d}
                size="sm"
                label={label(d)}
                selected={from === d}
                onPress={() => setFrom(d)}
              />
            ))}
          </ScrollView>
          <Text size={12} color="textMuted">
            {t('availability.lastDay')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
            {days
              .filter((d) => !from || d >= from)
              .map((d) => (
                <Chip
                  key={d}
                  size="sm"
                  label={label(d)}
                  selected={(to ?? from) === d}
                  onPress={() => setTo(d)}
                />
              ))}
          </ScrollView>
          <Input
            label={t('availability.reason')}
            placeholder={t('availability.reasonPlaceholder')}
            value={reason}
            onChangeText={setReason}
          />
          <Notice text={t('availability.blockNote')} />
          <Button label={t('common.save')} disabled={!from} loading={saving} onPress={save} />
        </View>
      </View>
    </Modal>
  );
}
