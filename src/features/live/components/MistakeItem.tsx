import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconButton, Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import type { Mistake } from '../api';
import { MISTAKE_COLORS } from '../mistakeStyle';

export function MistakeItem({
  m,
  tone = 'dark',
  onDelete,
}: {
  m: Pick<Mistake, 'id' | 'type' | 'ayah' | 'page' | 'description'>;
  tone?: 'dark' | 'light';
  onDelete?: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const dark = tone === 'dark';
  const where = [
    m.ayah ? t('live.ayahN', { n: formatNumber(m.ayah, locale) }) : null,
    !dark && m.page ? t('live.pageN', { n: formatNumber(m.page, locale) }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        backgroundColor: dark ? colors.groundDarkest : colors.surface,
        borderWidth: dark ? 0 : 1,
        borderColor: colors.border,
        borderStartWidth: 3,
        borderStartColor: MISTAKE_COLORS[m.type],
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text size={12} weight={dark ? '400' : '600'} color={dark ? 'creamBright' : 'text'}>
          {dark && where ? `${m.description} — ${where}` : m.description}
        </Text>
        <Text size={11} color={dark ? 'onDarkMuted' : 'textMuted'} style={{ marginTop: 2 }}>
          {dark ? t(`mistakes.${m.type}`) : where}
        </Text>
      </View>
      {!dark ? (
        <View
          style={{
            paddingHorizontal: 9,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: `${MISTAKE_COLORS[m.type]}22`,
          }}
        >
          <Text
            size={11}
            weight="600"
            color={MISTAKE_COLORS[m.type] === '#C9A227' ? colors.goldText : MISTAKE_COLORS[m.type]}
          >
            {t(`mistakes.${m.type}`)}
          </Text>
        </View>
      ) : null}
      {onDelete ? (
        <IconButton
          icon="trash"
          size={30}
          tone={dark ? 'dark' : 'light'}
          iconColor={colors.dangerBright}
          accessibilityLabel={t('live.deleteMistake')}
          onPress={onDelete}
        />
      ) : null}
    </View>
  );
}
