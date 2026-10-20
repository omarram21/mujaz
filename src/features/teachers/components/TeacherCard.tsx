import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Avatar, Icon, Text, VerifiedBadge } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber, formatPrice } from '@/lib/formatNumber';
import { countryName } from '@/lib/countries';
import { riwayahName, type Riwayah } from '@/features/riwayat/api';
import type { PublicTeacher } from '../api';
import { useRelativeSlotLabel } from '../useRelativeSlotLabel';

export function TeacherCard({
  teacher,
  riwayat,
  next,
  availabilityLoading,
  onPress,
}: {
  teacher: PublicTeacher;
  riwayat: Riwayah[] | undefined;
  next: Date | null;
  availabilityLoading: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const slotLabel = useRelativeSlotLabel();
  const rating = Number(teacher.rating_avg ?? 0);
  const count = teacher.rating_count ?? 0;
  const years = teacher.years_experience ?? 0;
  const subtitle = [
    ...teacher.riwayat.slice(0, 2).map((r) => riwayahName(riwayat, r, locale)),
    countryName(teacher.country, locale),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${teacher.full_name}، ${subtitle}`}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 14,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Avatar id={teacher.id} name={teacher.full_name} size={56} radius={16} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text size={15} weight="600" numberOfLines={1} style={{ flexShrink: 1 }}>
              {teacher.full_name}
            </Text>
            <VerifiedBadge color={colors.success} label={t('teachers.verifiedSanad')} />
          </View>
          <Text size={12} color="textMuted" numberOfLines={1}>
            {subtitle}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {count > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Icon name="star" size={13} color={colors.goldOnLight} fill={colors.goldOnLight} />
                <Text size={12} weight="600" color="goldText">
                  {formatNumber(rating, locale, { decimals: 1, fixed: true })}
                </Text>
              </View>
            ) : null}
            <Text size={12} color="textMuted">
              {count > 0
                ? t('teachers.reviews', { count, n: formatNumber(count, locale) })
                : t('teachers.newTeacher')}
            </Text>
            <Text size={12} color="textMuted">
              ·
            </Text>
            <Text size={12} color="textMuted">
              {t('teachers.years', { count: years, n: formatNumber(years, locale) })}
            </Text>
          </View>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
          paddingTop: 11,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
        }}
      >
        <Text size={12} weight="600" color={next ? 'success' : 'goldText'}>
          {availabilityLoading
            ? t('common.loading')
            : next
              ? t('teachers.nextSlot', { when: slotLabel(next) })
              : teacher.accepting_bookings
                ? t('teachers.noSlots')
                : t('teachers.notAccepting')}
        </Text>
        <Text size={14} weight="700" color="ground">
          {formatPrice(Number(teacher.price_30 ?? 0), locale)}{' '}
          <Text size={11} color="textMuted">
            {t('teachers.perSession')}
          </Text>
        </Text>
      </View>
    </Pressable>
  );
}
