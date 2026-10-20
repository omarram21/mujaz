import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatTime } from '@/lib/dates';

export interface SlotCell {
  at: Date;
  taken: boolean;
}

export function SlotGrid({
  slots,
  selected,
  onSelect,
  timeZone,
}: {
  slots: SlotCell[];
  selected: number | null;
  onSelect: (at: Date) => void;
  timeZone: string;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
      {slots.map((s) => {
        const sel = s.at.getTime() === selected;
        const label = formatTime(s.at, timeZone, locale);
        return (
          <Pressable
            key={s.at.getTime()}
            disabled={s.taken}
            onPress={() => onSelect(s.at)}
            accessibilityRole="button"
            accessibilityState={{ selected: sel, disabled: s.taken }}
            accessibilityLabel={s.taken ? t('booking.slotTaken', { time: label }) : label}
            style={{
              width: '31.5%',
              height: 46,
              borderRadius: 12,
              borderWidth: sel ? 2 : 1,
              borderColor: sel ? colors.ground : s.taken ? '#EFEADF' : colors.borderStrong,
              backgroundColor: sel ? colors.ground : s.taken ? '#F4F1E9' : colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              size={13.5}
              weight={sel ? '600' : '400'}
              color={sel ? 'cream' : s.taken ? 'textDisabled' : 'text'}
              style={s.taken ? { textDecorationLine: 'line-through' } : undefined}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
