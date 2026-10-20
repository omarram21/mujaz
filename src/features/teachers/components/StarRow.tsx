import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';

export function StarRow({ rating, size = 11 }: { rating: number; size?: number }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <View
      style={{ flexDirection: 'row', gap: 1 }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('teachers.ratingOf', {
        n: formatNumber(rating, locale, { decimals: 1 }),
      })}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          color={colors.goldOnLight}
          fill={i <= Math.round(rating) ? colors.goldOnLight : colors.trackEmpty}
        />
      ))}
    </View>
  );
}
