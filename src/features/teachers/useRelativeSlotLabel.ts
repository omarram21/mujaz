import { useTranslation } from 'react-i18next';
import { differenceInCalendarDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useLocale } from '@/i18n';
import { formatTime, weekdayName } from '@/lib/dates';
import { useViewerTimeZone } from '@/features/profile/useViewerTimeZone';

/** "اليوم ٨:٣٠ م" / "غدًا ١٠:٠٠ ص" / "الخميس ٦:٠٠ م" in the viewer's zone. */
export function useRelativeSlotLabel() {
  const { t } = useTranslation();
  const locale = useLocale();
  const tz = useViewerTimeZone();
  return (d: Date) => {
    const days = differenceInCalendarDays(toZonedTime(d, tz), toZonedTime(new Date(), tz));
    const day =
      days === 0
        ? t('dates.today')
        : days === 1
          ? t('dates.tomorrow')
          : weekdayName(toZonedTime(d, tz).getDay(), locale);
    return `${day} ${formatTime(d, tz, locale)}`;
  };
}
