import { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { addDays } from 'date-fns';
import { Chip, DarkHeader, EmptyState, Icon, QueryView, Screen, Text } from '@/components';
import { useTheme, fontFor } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { useRiwayat } from '@/features/riwayat/api';
import { useRequiredProfile } from '@/features/auth/store';
import { nextSlot, useTeacherAvailability, useTeachers } from '../api';
import { TeacherCard } from '../components/TeacherCard';
import { FilterSheet, type TeacherFilters } from '../components/FilterSheet';

export function TeachersScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const profile = useRequiredProfile();
  const riwayat = useRiwayat();
  const [riwayah, setRiwayah] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<TeacherFilters>({
    sort: 'rating',
    availableThisWeek: false,
  });

  const teachers = useTeachers({ riwayah, search: deferredSearch });
  const ids = useMemo(() => (teachers.data ?? []).map((x) => x.id), [teachers.data]);
  const availability = useTeacherAvailability(ids);

  const rows = useMemo(() => {
    const list = (teachers.data ?? []).map((teacher) => ({
      teacher,
      next: teacher.accepting_bookings
        ? nextSlot(availability.data?.byTeacher.get(teacher.id))
        : null,
    }));
    const weekEnd = addDays(new Date(), 7).getTime();
    const filtered = filters.availableThisWeek
      ? list.filter((r) => r.next && r.next.getTime() <= weekEnd)
      : list;
    const sorted = [...filtered];
    if (filters.sort === 'price')
      sorted.sort((a, b) => Number(a.teacher.price_30) - Number(b.teacher.price_30));
    if (filters.sort === 'soonest')
      sorted.sort((a, b) => (a.next?.getTime() ?? Infinity) - (b.next?.getTime() ?? Infinity));
    return sorted;
  }, [teachers.data, availability.data, filters]);

  // Chips: "all" plus the riwayat the student chose first, then the rest.
  const chipRiwayat = useMemo(() => {
    const list = riwayat.data ?? [];
    const pref = new Set(profile.preferred_riwayat);
    return [...list].sort(
      (a, b) => Number(pref.has(b.code)) - Number(pref.has(a.code)) || a.sort - b.sort,
    );
  }, [riwayat.data, profile.preferred_riwayat]);

  return (
    <Screen
      padded={false}
      contentStyle={{ paddingTop: 0, gap: 0 }}
      refreshControl={
        <RefreshControl
          refreshing={teachers.isRefetching}
          onRefresh={() => {
            void teachers.refetch();
            void availability.refetch();
          }}
        />
      }
      header={
        <DarkHeader subtitle={t('teachers.greeting')} title={t('teachers.title')}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              height: 46,
              paddingHorizontal: 14,
              borderRadius: 13,
              backgroundColor: colors.groundDeep,
              borderWidth: 1,
              borderColor: colors.borderDark,
            }}
          >
            <Icon name="search" size={18} color={colors.onDarkMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('teachers.searchPlaceholder')}
              placeholderTextColor={colors.onDarkMuted}
              accessibilityLabel={t('teachers.searchLabel')}
              returnKeyType="search"
              style={{
                flex: 1,
                color: colors.onDarkBody,
                fontFamily: fontFor('ui'),
                fontSize: 14,
                textAlign: locale === 'ar' ? 'right' : 'left',
              }}
            />
          </View>
        </DarkHeader>
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 }}
      >
        <Chip
          size="sm"
          label={t('teachers.all')}
          selected={riwayah === null}
          onPress={() => setRiwayah(null)}
        />
        {chipRiwayat.map((r) => (
          <Chip
            key={r.code}
            size="sm"
            label={locale === 'ar' ? r.name_ar : r.name_en}
            selected={riwayah === r.code}
            onPress={() => setRiwayah(riwayah === r.code ? null : r.code)}
          />
        ))}
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingBottom: 10,
        }}
      >
        <Text size={12} color="textMuted">
          {teachers.data
            ? t('teachers.count', { count: rows.length, n: formatNumber(rows.length, locale) })
            : ' '}
        </Text>
        <Pressable
          onPress={() => setFiltersOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('teachers.filter')}
          hitSlop={10}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 }}
        >
          <Icon name="filter" size={16} color={colors.ground} />
          <Text size={13} weight="600" color="ground">
            {t('teachers.filter')}
          </Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 12, paddingBottom: 12 }}>
        <QueryView
          query={teachers}
          isEmpty={() => rows.length === 0}
          empty={
            <EmptyState
              icon="search"
              title={t('teachers.emptyTitle')}
              body={
                profile.female_teachers_only
                  ? t('teachers.emptyBodyFemale')
                  : t('teachers.emptyBody')
              }
            />
          }
        >
          {() =>
            rows.map(({ teacher, next }) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                riwayat={riwayat.data}
                next={next}
                availabilityLoading={availability.isPending}
                onPress={() =>
                  router.push({ pathname: '/teacher/[id]', params: { id: teacher.id } })
                }
              />
            ))
          }
        </QueryView>
      </View>

      <FilterSheet
        visible={filtersOpen}
        value={filters}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </Screen>
  );
}
