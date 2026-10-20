import { useTranslation } from 'react-i18next';
import { Text, type TextProps } from '@/components';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { surahName } from '@/lib/quran';
import { prepHint, useProgramRecords } from '@/features/progress/api';

/** "المطلوب تحضيره: التوبة ٣٤ ← ٥٩ · صفحة ١٩٦ ← ١٩٨" */
export function PrepLine({ programId, ...props }: { programId: string | null } & TextProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const records = useProgramRecords(programId);
  if (!programId || !records.data) return null;
  const hint = prepHint(records.data);
  if (!hint) return null;
  const n = (v: number) => formatNumber(v, locale);
  const ayahs =
    hint.from.surah === hint.to.surah
      ? `${surahName(hint.from.surah, locale)} ${n(hint.from.ayah)} ← ${n(hint.to.ayah)}`
      : `${surahName(hint.from.surah, locale)} ${n(hint.from.ayah)} ← ${surahName(hint.to.surah, locale)} ${n(hint.to.ayah)}`;
  return (
    <Text {...props}>
      {t('sessions.prepare', { ayahs, from: n(hint.fromPage), to: n(hint.toPage) })}
    </Text>
  );
}
