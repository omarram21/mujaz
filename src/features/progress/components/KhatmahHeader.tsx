import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DarkHeader, ProgressRing, StatTile, Text } from '@/components';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { monthName } from '@/lib/dates';
import { TOTAL_PAGES } from '@/lib/quran';
import type { KhatmahProgress } from '@/lib/progress';

export function KhatmahHeader({
  title,
  subtitle,
  progress,
  sessions,
  streakWeeks,
  finish,
  back,
  right,
}: {
  title: string;
  subtitle: string;
  progress: KhatmahProgress;
  sessions: number;
  streakWeeks: number;
  finish: Date | null;
  back?: boolean;
  right?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <DarkHeader
      back={back}
      right={right}
      style={{ alignItems: 'stretch', gap: 16, paddingBottom: 20 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text size={16} weight="600" color="creamBright" accessibilityRole="header">
          {title}
        </Text>
        <Text size={11.5} color="onDarkMuted">
          {subtitle}
        </Text>
      </View>
      <View style={{ alignItems: 'center' }}>
        <ProgressRing value={progress.ratio} size={152} stroke={12}>
          <View
            accessible
            accessibilityLabel={t('progress.ringA11y', {
              percent: formatNumber(progress.percent, locale),
              done: formatNumber(progress.pagesCount, locale),
            })}
            style={{ alignItems: 'center' }}
          >
            <Text family="display" weight="700" size={38} color="cream" style={{ lineHeight: 48 }}>
              {formatNumber(progress.percent, locale, { percent: true })}
            </Text>
            <Text size={11.5} color="onDarkMuted">
              {t('progress.pagesOf', {
                done: formatNumber(progress.pagesCount, locale),
                total: formatNumber(TOTAL_PAGES, locale),
              })}
            </Text>
          </View>
        </ProgressRing>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatTile value={formatNumber(sessions, locale)} label={t('progress.sessionsDone')} />
        <StatTile value={formatNumber(streakWeeks, locale)} label={t('progress.weekStreak')} />
        <StatTile
          value={
            progress.complete
              ? t('progress.done')
              : finish
                ? monthName(finish.getMonth(), locale)
                : '—'
          }
          label={t('progress.expectedFinish')}
        />
      </View>
    </DarkHeader>
  );
}
