import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { differenceInCalendarDays } from 'date-fns';
import { Avatar, EmptyState, QueryView, Screen, Tag, Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { countryName } from '@/lib/countries';
import { riwayahName, useRiwayat } from '@/features/riwayat/api';
import { usePendingApplications } from '@/features/applications/api';
import { AdminHeader } from './AdminHeader';

export function ApplicationsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const query = usePendingApplications();
  const riwayat = useRiwayat();
  const count = query.data?.length ?? 0;

  return (
    <Screen
      header={
        <AdminHeader
          title={t('admin.title')}
          subtitle={
            query.data
              ? t('admin.pendingCount', { count, n: formatNumber(count, locale) })
              : undefined
          }
        />
      }
      refreshControl={
        <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />
      }
    >
      <QueryView
        query={query}
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState
            icon="shieldCheck"
            title={t('admin.emptyTitle')}
            body={t('admin.emptyBody')}
          />
        }
      >
        {(apps) =>
          apps.map((a) => {
            const days = a.submitted_at
              ? differenceInCalendarDays(new Date(), new Date(a.submitted_at))
              : 0;
            return (
              <Pressable
                key={a.id}
                onPress={() =>
                  router.push({ pathname: '/applications/[id]', params: { id: a.id } })
                }
                accessibilityRole="button"
                accessibilityLabel={a.teacher?.full_name ?? ''}
                style={({ pressed }) => ({
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 18,
                  padding: 15,
                  gap: 12,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar
                    id={a.teacher_id}
                    name={a.teacher?.full_name ?? ''}
                    size={52}
                    radius={15}
                  />
                  <View style={{ flex: 1 }}>
                    <Text size={15} weight="600">
                      {a.teacher?.full_name}
                    </Text>
                    <Text size={11.5} color="textMuted" style={{ marginTop: 2 }}>
                      {`${countryName(a.country, locale)} · ${t('admin.daysWaiting', { count: days, n: formatNumber(days, locale) })}`}
                    </Text>
                  </View>
                  <Tag label={t('admin.statusPending')} tone="gold" />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {a.riwayat.map((r) => (
                    <Tag key={r} label={riwayahName(riwayat.data, r, locale)} />
                  ))}
                </View>
              </Pressable>
            );
          })
        }
      </QueryView>
    </Screen>
  );
}
