import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  LoadingState,
  Notice,
  Screen,
  Text,
} from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { TOTAL_PAGES } from '@/lib/quran';
import { computeProgress, newPagesFrom } from '@/lib/progress';
import { supabase, unwrap } from '@/services/supabase';
import { useBooking } from '@/features/booking/api';
import { useProgramRecords } from '@/features/progress/api';
import { REVIEW_TAGS, useMyReview, useSubmitReview, type ReviewTag } from './api';

const STAR_LABELS = ['rate.star1', 'rate.star2', 'rate.star3', 'rate.star4', 'rate.star5'];

export function RateSessionScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const booking = useBooking(bookingId);
  const existing = useMyReview(bookingId);
  if (booking.isPending || existing.isPending) return <LoadingState />;
  if (booking.isError || existing.isError)
    return <ErrorState onRetry={() => void booking.refetch()} />;
  return <RateForm booking={booking.data} alreadyRated={!!existing.data} />;
}

function RateForm({
  booking,
  alreadyRated,
}: {
  booking: NonNullable<ReturnType<typeof useBooking>['data']>;
  alreadyRated: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const submit = useSubmitReview();
  const records = useProgramRecords(booking.program_id);
  const teacher = useQuery({
    queryKey: ['teacher-name', booking.teacher_id],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('public_teachers')
          .select('full_name')
          .eq('id', booking.teacher_id)
          .single(),
      ).full_name ?? '',
  });
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<ReviewTag[]>([]);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string>();

  const thisRecord = records.data?.find((r) => r.booking_id === booking.id);
  const before = (records.data ?? []).filter((r) => r.booking_id !== booking.id);
  const total = computeProgress(records.data ?? []).pagesCount;
  const added = thisRecord ? newPagesFrom(before, thisRecord) : 0;
  const name = teacher.data ?? '';
  const exit = () => router.replace('/sessions');

  const send = async (thenBook: boolean) => {
    if (!rating) return setError(t('rate.chooseStars'));
    setError(undefined);
    try {
      await submit.mutateAsync({
        bookingId: booking.id,
        teacherId: booking.teacher_id,
        rating,
        tags,
        comment,
      });
      if (thenBook)
        router.replace({
          pathname: '/book/[teacherId]',
          params: { teacherId: booking.teacher_id },
        });
      else exit();
    } catch {
      setError(t('auth.errors.generic'));
    }
  };

  if (alreadyRated) {
    return (
      <Screen>
        <EmptyState
          icon="star"
          title={t('rate.thanksTitle')}
          body={t('rate.thanksBody')}
          actionLabel={t('rate.backToSessions')}
          onAction={exit}
        />
      </Screen>
    );
  }

  return (
    <Screen
      contentStyle={{ paddingHorizontal: 24, gap: 22 }}
      footer={
        <View style={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 26, gap: 10 }}>
          <Button
            label={t('rate.sendAndBook')}
            loading={submit.isPending}
            onPress={() => void send(true)}
          />
          <Button
            label={t('rate.sendOnly')}
            variant="secondary"
            height={48}
            onPress={() => void send(false)}
          />
        </View>
      }
    >
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Pressable
          onPress={exit}
          accessibilityRole="button"
          hitSlop={12}
          style={{ minHeight: 32, justifyContent: 'center' }}
        >
          <Text size={13} color="textMuted">
            {t('rate.skip')}
          </Text>
        </Pressable>
      </View>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Avatar
          id={booking.teacher_id}
          name={name}
          size={68}
          radius={20}
          colors={[colors.ground, colors.gold]}
        />
        <Text size={19} weight="600" accessibilityRole="header">
          {t('rate.title')}
        </Text>
        <Text size={12.5} color="textMuted" relaxed align="center">
          {t('rate.subtitle', { name, minutes: formatNumber(booking.duration_min, locale) })}
        </Text>
      </View>
      <View
        style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}
        accessibilityRole="radiogroup"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setRating(n)}
            accessibilityRole="radio"
            accessibilityState={{ checked: rating === n }}
            accessibilityLabel={t(STAR_LABELS[n - 1]!)}
            hitSlop={4}
            style={{ padding: 2 }}
          >
            <Icon
              name="star"
              size={40}
              color={colors.goldOnLight}
              fill={n <= rating ? colors.goldOnLight : colors.trackEmpty}
            />
          </Pressable>
        ))}
      </View>
      <View>
        <Text size={13} weight="600" style={{ marginBottom: 10 }}>
          {t('rate.whatDidYouLike')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {REVIEW_TAGS.map((tag) => {
            const sel = tags.includes(tag);
            return (
              <Chip
                key={tag}
                label={t(`rate.tag_${tag}`)}
                selected={sel}
                onPress={() => setTags(sel ? tags.filter((x) => x !== tag) : [...tags, tag])}
              />
            );
          })}
        </View>
      </View>
      <Input
        label={t('rate.comment')}
        multiline
        multilineHeight={100}
        value={comment}
        onChangeText={setComment}
        placeholder={t('rate.commentPlaceholder')}
        maxLength={1000}
      />
      <Card
        padding={13}
        radius={15}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            backgroundColor: colors.successSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name={thisRecord ? 'check' : 'clock'}
            size={19}
            color={colors.success}
            strokeWidth={2}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text size={12.5} weight="600">
            {thisRecord ? t('rate.updatedTitle') : t('rate.pendingTitle')}
          </Text>
          <Text size={11} color="textMuted" style={{ marginTop: 2 }}>
            {thisRecord
              ? t('rate.updatedBody', {
                  added: t('progress.pages', { count: added, n: formatNumber(added, locale) }),
                  total: formatNumber(total, locale),
                  of: formatNumber(TOTAL_PAGES, locale),
                })
              : t('rate.pendingBody')}
          </Text>
        </View>
        {thisRecord ? (
          <Pressable
            onPress={() => router.navigate('/progress')}
            accessibilityRole="link"
            hitSlop={10}
          >
            <Text size={12} weight="600" color="ground">
              {t('common.view')}
            </Text>
          </Pressable>
        ) : null}
      </Card>
      {error ? <Notice tone="danger" text={error} /> : null}
    </Screen>
  );
}
