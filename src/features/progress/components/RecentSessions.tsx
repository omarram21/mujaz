import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { toZonedTime } from 'date-fns-tz';
import { Tag, Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { monthName } from '@/lib/dates';
import { pageRangeToAyahs, surahName } from '@/lib/quran';
import { useViewerTimeZone } from '@/features/profile/useViewerTimeZone';
import type { SessionRecord } from '../api';

export function ayahSpanLabel(fromPage: number, toPage: number, locale: 'ar' | 'en'): string {
  const { from, to } = pageRangeToAyahs(fromPage, toPage);
  const n = (v: number) => formatNumber(v, locale);
  return from.surah === to.surah
    ? `${surahName(from.surah, locale)} ${n(from.ayah)} ← ${n(to.ayah)}`
    : `${surahName(from.surah, locale)} ${n(from.ayah)} ← ${surahName(to.surah, locale)} ${n(to.ayah)}`;
}

export function RecentSessions({
  records,
  mistakeCounts,
  limit = 5,
}: {
  records: SessionRecord[];
  mistakeCounts: Map<string, number> | undefined;
  limit?: number;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const tz = useViewerTimeZone();
  const recent = [...records].reverse().slice(0, limit);
  if (!recent.length) {
    return (
      <Text size={12.5} color="textMuted">
        {t('progress.noSessions')}
      </Text>
    );
  }
  return (
    <View style={{ gap: 9 }}>
      {recent.map((r) => {
        const z = toZonedTime(new Date(r.approved_at ?? r.created_at), tz);
        const pages = r.to_page - r.from_page + 1;
        const mistakes = mistakeCounts?.get(r.booking_id) ?? 0;
        const good = r.quality === 'excellent' || r.quality === 'good';
        return (
          <View
            key={r.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 11,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 15,
              padding: 12,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: colors.successSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text size={13} weight="700" color="success" style={{ lineHeight: 16 }}>
                {formatNumber(z.getDate(), locale)}
              </Text>
              <Text size={8.5} color="success" style={{ lineHeight: 12 }}>
                {monthName(z.getMonth(), locale)}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text size={13} weight="600" numberOfLines={1}>
                {ayahSpanLabel(r.from_page, r.to_page, locale)}
              </Text>
              <Text size={11} color="textMuted" style={{ marginTop: 2 }}>
                {[
                  t('progress.pages', { count: pages, n: formatNumber(pages, locale) }),
                  t('progress.mistakes', { count: mistakes, n: formatNumber(mistakes, locale) }),
                  r.quality ? t('progress.rated', { q: t(`quality.${r.quality}`) }) : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            {r.quality ? (
              <Tag
                label={good ? t(`quality.${r.quality}`) : t('progress.review')}
                tone={good ? 'success' : 'gold'}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
