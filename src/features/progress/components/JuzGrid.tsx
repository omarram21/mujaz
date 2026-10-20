import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import type { JuzStatus } from '@/lib/progress';

export function JuzGrid({ juz }: { juz: JuzStatus[] }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const color: Record<JuzStatus, string> = {
    mastered: colors.success,
    inProgress: colors.goldOnLight,
    notStarted: colors.trackEmpty,
  };
  const legend: JuzStatus[] = ['mastered', 'inProgress', 'notStarted'];
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text size={13} weight="600" accessibilityRole="header">
          {t('progress.juzTitle')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {legend.map((k) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: color[k] }} />
              <Text size={10.5} color="textMuted">
                {t(`progress.juz_${k}`)}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ gap: 5 }}>
        {[0, 1, 2].map((row) => (
          <View key={row} style={{ flexDirection: 'row', gap: 5 }}>
            {juz.slice(row * 10, row * 10 + 10).map((s, i) => (
              <View
                key={i}
                accessible
                accessibilityLabel={t('progress.juzA11y', {
                  n: formatNumber(row * 10 + i + 1, locale),
                  status: t(`progress.juz_${s}`),
                })}
                style={{ flex: 1, aspectRatio: 1, borderRadius: 6, backgroundColor: color[s] }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
