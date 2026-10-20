import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Chip, IconButton, Notice, Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { weekdayName } from '@/lib/dates';
import { formatClock, formatRange } from './clock';
import type { RuleDraft } from './api';

const TIMES = Array.from({ length: 49 }, (_, i) => i * 30); // 00:00 … 24:00

/** Edit the time ranges of one weekday. */
export function DayEditor({
  weekday,
  ranges,
  onSave,
  onClose,
}: {
  weekday: number | null;
  ranges: RuleDraft[];
  onSave: (weekday: number, ranges: RuleDraft[]) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const [list, setList] = useState<RuleDraft[]>(ranges);
  const [start, setStart] = useState<number | null>(null);
  const [end, setEnd] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  if (weekday === null) return null;

  const add = () => {
    if (start === null || end === null || end <= start)
      return setError(t('availability.errors.range'));
    setList((l) => [...l, { weekday, start, end }].sort((a, b) => a.start - b.start));
    setStart(null);
    setEnd(null);
    setError(undefined);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }}>
        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: 34,
            gap: 14,
            maxHeight: '90%',
          }}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text size={16} weight="600" accessibilityRole="header">
              {weekdayName(weekday, locale)}
            </Text>
            <IconButton icon="close" accessibilityLabel={t('common.close')} onPress={onClose} />
          </View>
          {list.length === 0 ? (
            <Text size={13} color="textMuted">
              {t('availability.dayOff')}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {list.map((r, i) => (
                <Chip
                  key={`${r.start}-${r.end}`}
                  label={formatRange(r.start, r.end, locale)}
                  icon="close"
                  onPress={() => setList((l) => l.filter((_, j) => j !== i))}
                />
              ))}
            </View>
          )}
          <Text size={13} weight="600">
            {t('availability.addRange')}
          </Text>
          <Text size={12} color="textMuted">
            {t('availability.from')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
            {TIMES.slice(0, -1).map((m) => (
              <Chip
                key={m}
                size="sm"
                label={formatClock(m, locale)}
                selected={start === m}
                onPress={() => setStart(m)}
              />
            ))}
          </ScrollView>
          <Text size={12} color="textMuted">
            {t('availability.to')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
            {TIMES.filter((m) => start === null || m > start).map((m) => (
              <Chip
                key={m}
                size="sm"
                label={formatClock(m, locale)}
                selected={end === m}
                onPress={() => setEnd(m)}
              />
            ))}
          </ScrollView>
          <Button
            label={t('availability.addThisRange')}
            variant="secondary"
            icon="plus"
            onPress={add}
            disabled={start === null || end === null}
          />
          {error ? <Notice tone="danger" text={error} /> : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              label={t('availability.markDayOff')}
              variant="secondary"
              style={{ flex: 1 }}
              height={52}
              onPress={() => setList([])}
            />
            <Button
              label={t('common.done')}
              style={{ flex: 1 }}
              onPress={() => onSave(weekday, list)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
