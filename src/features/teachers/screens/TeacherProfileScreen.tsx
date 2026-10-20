import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  BottomBar,
  Button,
  Card,
  DarkHeader,
  Divider,
  ErrorState,
  Icon,
  LoadingState,
  Notice,
  Screen,
  StatTile,
  Tag,
  Text,
} from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber, formatPrice } from '@/lib/formatNumber';
import { countryName } from '@/lib/countries';
import { riwayahName, useRiwayat } from '@/features/riwayat/api';
import { useTeacher, useTeacherReviews, useTrialUsed } from '../api';
import { StarRow } from '../components/StarRow';

export function TeacherProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const teacher = useTeacher(id);
  const reviews = useTeacherReviews(id);
  const trialUsed = useTrialUsed(id);
  const riwayat = useRiwayat();

  if (teacher.isPending) {
    return (
      <Screen header={<DarkHeader back />}>
        <LoadingState />
      </Screen>
    );
  }
  if (teacher.isError) {
    return (
      <Screen header={<DarkHeader back />}>
        <ErrorState onRetry={() => void teacher.refetch()} />
      </Screen>
    );
  }
  const x = teacher.data;
  const rating = Number(x.rating_avg ?? 0);
  const ratingCount = x.rating_count ?? 0;
  const canTrial = trialUsed.data === false;

  return (
    <Screen
      header={
        <DarkHeader back style={{ gap: 16, paddingBottom: 22 }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Avatar
              id={x.id}
              name={x.full_name}
              size={72}
              radius={20}
              colors={[colors.cream, colors.ground]}
            />
            <View style={{ flex: 1, gap: 6 }}>
              <Text size={19} weight="600" color="creamBright" accessibilityRole="header">
                {x.full_name}
              </Text>
              <Text size={12} color="onDarkMuted">
                {x.headline ?? countryName(x.country, locale)}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  alignSelf: 'flex-start',
                  backgroundColor: colors.success,
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: 20,
                }}
              >
                <Icon
                  name="shield"
                  size={12}
                  color={colors.successOnDark}
                  fill={colors.successOnDark}
                />
                <Text size={11} weight="600" color="successOnDark">
                  {t('teachers.verifiedByMujaz')}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <StatTile
              value={ratingCount ? formatNumber(rating, locale, { decimals: 1, fixed: true }) : '—'}
              label={t('teachers.reviews', {
                count: ratingCount,
                n: formatNumber(ratingCount, locale),
              })}
            />
            <StatTile
              value={formatNumber(x.ijazahs_granted ?? 0, locale)}
              label={t('teachers.ijazahsGranted')}
            />
            <StatTile
              value={formatNumber(x.years_experience ?? 0, locale)}
              label={t('teachers.yearsExperience')}
            />
          </View>
        </DarkHeader>
      }
      footer={
        <BottomBar style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View>
            <Text size={17} weight="700" color="ground">
              {formatPrice(Number(x.price_30 ?? 0), locale)}
            </Text>
            <Text size={10} color="textMuted">
              {t('teachers.per30')}
            </Text>
          </View>
          <Button
            style={{ flex: 1 }}
            label={
              !x.accepting_bookings
                ? t('teachers.notAccepting')
                : canTrial
                  ? t('teachers.bookTrial')
                  : t('teachers.book')
            }
            disabled={!x.accepting_bookings || trialUsed.isPending}
            onPress={() =>
              router.push({
                pathname: '/book/[teacherId]',
                params: { teacherId: x.id, trial: canTrial ? '1' : '0' },
              })
            }
          />
        </BottomBar>
      }
    >
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <Icon name="document" size={17} color={colors.success} strokeWidth={1.9} />
          <Text size={14} weight="600" accessibilityRole="header">
            {t('teachers.sanad')}
          </Text>
        </View>
        <Text family="display" size={15} color="textBody" relaxed>
          {x.sanad_text}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
          {x.riwayat.map((r) => (
            <Tag key={r} label={riwayahName(riwayat.data, r, locale)} />
          ))}
        </View>
      </Card>

      {x.bio ? (
        <Card style={{ gap: 6 }}>
          <Text size={14} weight="600" accessibilityRole="header">
            {t('teachers.about')}
          </Text>
          <Text size={13} color="textMuted" relaxed>
            {x.bio}
          </Text>
        </Card>
      ) : null}

      <Card style={{ gap: 10 }}>
        <Text size={14} weight="600" accessibilityRole="header">
          {t('teachers.studentReviews')}
        </Text>
        {reviews.isPending ? (
          <Text size={12} color="textMuted">
            {t('common.loading')}
          </Text>
        ) : reviews.isError ? (
          <Text size={12} color="textMuted">
            {t('common.errorTitle')}
          </Text>
        ) : reviews.data.length === 0 ? (
          <Text size={12} color="textMuted">
            {t('teachers.noReviews')}
          </Text>
        ) : (
          reviews.data.map((r, i) => (
            <View key={r.id ?? i} style={{ gap: 5 }}>
              {i > 0 ? <Divider /> : null}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  marginTop: i > 0 ? 5 : 0,
                }}
              >
                <Text size={13} weight="600">
                  {r.reviewer_name ?? t('teachers.anonymous')}
                </Text>
                <StarRow rating={r.rating ?? 0} />
              </View>
              {r.comment ? (
                <Text size={12} color="textMuted" relaxed>
                  {r.comment}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </Card>

      <Notice text={t('teachers.ijazahNotice')} />
    </Screen>
  );
}
