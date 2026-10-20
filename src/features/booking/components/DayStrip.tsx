import { Pressable, ScrollView } from 'react-native';
import { toZonedTime } from 'date-fns-tz';
import { Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { formatDate, weekdayName } from '@/lib/dates';

export interface DayOption {
  key: string; // yyyy-MM-dd in viewer zone
  date: Date; // noon of that day, for labels
  available: boolean;
}

export function DayStrip({
  days,
  selected,
  onSelect,
  timeZone,
}: {
  days: DayOption[];
  selected: string | null;
  onSelect: (key: string) => void;
  timeZone: string;
}) {
  const { colors } = useTheme();
  const locale = useLocale();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {days.map((d) => {
        const sel = d.key === selected;
        const z = toZonedTime(d.date, timeZone);
        return (
          <Pressable
            key={d.key}
            disabled={!d.available}
            onPress={() => onSelect(d.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: sel, disabled: !d.available }}
            accessibilityLabel={formatDate(d.date, timeZone, locale)}
            style={{
              width: 62,
              height: 66,
              borderRadius: 14,
              borderWidth: sel ? 2 : 1,
              borderColor: sel ? colors.ground : d.available ? colors.borderStrong : '#EFEADF',
              backgroundColor: sel ? colors.ground : d.available ? colors.surface : '#F4F1E9',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <Text size={10} color={sel ? '#AFC6BA' : d.available ? 'textMuted' : 'textDisabled'}>
              {weekdayName(z.getDay(), locale)}
            </Text>
            <Text
              size={17}
              weight="700"
              color={sel ? 'cream' : d.available ? 'text' : 'textDisabled'}
            >
              {formatNumber(z.getDate(), locale)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
