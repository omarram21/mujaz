import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { juzOfPage, pageRangeToAyahs, surahName } from '@/lib/quran';
import type { ReadingPosition } from '../api';

/** "موضع القراءة الآن": surah, ayah range, page range and juz badges. */
export function PositionCard({
  position,
  onEdit,
}: {
  position: ReadingPosition;
  onEdit?: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const n = (v: number) => formatNumber(v, locale);
  const { from, to } = pageRangeToAyahs(position.fromPage, position.toPage);
  const sameSurah = from.surah === to.surah;
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Icon name="bookOpen" size={16} color={colors.gold} />
          <Text size={12.5} color="onDarkSoft">
            {t('live.position')}
          </Text>
        </View>
        {onEdit ? (
          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            hitSlop={12}
            style={{ minHeight: 32, justifyContent: 'center' }}
          >
            <Text size={12} weight="600" color="gold">
              {t('common.edit')}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View
        style={{
          backgroundColor: colors.groundDarkest,
          borderWidth: 1,
          borderColor: colors.borderDarkAlt,
          borderRadius: 14,
          padding: 16,
          alignItems: 'center',
        }}
      >
        <Text family="display" size={24} color="cream" align="center">
          {sameSurah
            ? t('live.surah', { name: surahName(from.surah, locale) })
            : `${surahName(from.surah, locale)} ← ${surahName(to.surah, locale)}`}
        </Text>
        <Text size={12.5} color="onDarkMuted" style={{ marginTop: 6 }}>
          {t('live.ayahRange', { from: n(from.ayah), to: n(to.ayah) })}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <View
            style={{
              backgroundColor: colors.success,
              borderRadius: 8,
              paddingHorizontal: 11,
              paddingVertical: 5,
            }}
          >
            <Text size={11} weight="600" color="successOnDark">
              {t('live.pageRange', { from: n(position.fromPage), to: n(position.toPage) })}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.borderDarkAlt,
              borderRadius: 8,
              paddingHorizontal: 11,
              paddingVertical: 5,
            }}
          >
            <Text size={11} color="onDarkSoft">
              {t('live.juzN', { n: n(juzOfPage(position.fromPage)) })}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
