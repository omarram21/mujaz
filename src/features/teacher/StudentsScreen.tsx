import { useMemo } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  DarkHeader,
  EmptyState,
  ProgressBar,
  QueryView,
  Screen,
  Tag,
  Text,
} from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { computeProgress } from '@/lib/progress';
import { riwayahName, useRiwayat } from '@/features/riwayat/api';
import { useMyPrograms, useRecordsForPrograms } from '@/features/progress/api';
import { ApprovedTeacherOnly } from './TeacherOnly';

export function StudentsScreen() {
  const { t } = useTranslation();
  return (
    <ApprovedTeacherOnly title={t('tabs.students')}>
      <Students />
    </ApprovedTeacherOnly>
  );
}

function Students() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const programs = useMyPrograms();
  const riwayat = useRiwayat();
  const records = useRecordsForPrograms((programs.data ?? []).map((p) => p.id));
  const rows = useMemo(() => {
    const by = new Map<string, { from_page: number; to_page: number }[]>();
    for (const r of records.data ?? []) {
      if (!r.program_id) continue;
      by.set(r.program_id, [...(by.get(r.program_id) ?? []), r]);
    }
    return (programs.data ?? []).map((p) => ({
      p,
      progress: computeProgress(by.get(p.id) ?? []),
      sessions: by.get(p.id)?.length ?? 0,
    }));
  }, [programs.data, records.data]);

  return (
    <Screen
      header={<DarkHeader title={t('students.title')} />}
      refreshControl={
        <RefreshControl
          refreshing={programs.isRefetching}
          onRefresh={() => void programs.refetch()}
        />
      }
    >
      <QueryView
        query={programs}
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState
            icon="users"
            title={t('students.emptyTitle')}
            body={t('students.emptyBody')}
          />
        }
      >
        {() =>
          rows.map(({ p, progress, sessions }) => (
            <Pressable
              key={p.id}
              onPress={() =>
                router.push({ pathname: '/student/[programId]', params: { programId: p.id } })
              }
              accessibilityRole="button"
              accessibilityLabel={p.student_name}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 13,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar id={p.student_id} name={p.student_name} size={44} radius={13} />
                <View style={{ flex: 1 }}>
                  <Text size={14} weight="600">
                    {p.student_name}
                  </Text>
                  <Text size={11.5} color="textMuted">
                    {`${riwayahName(riwayat.data, p.riwayah, locale)} · ${t('students.sessions', { count: sessions, n: formatNumber(sessions, locale) })}`}
                  </Text>
                </View>
                {p.status === 'completed' ? (
                  <Tag label={t('students.completed')} />
                ) : (
                  <Text size={13} weight="700" color="success">
                    {formatNumber(progress.percent, locale, { percent: true })}
                  </Text>
                )}
              </View>
              <ProgressBar value={progress.ratio} color={colors.success} label={p.student_name} />
            </Pressable>
          ))
        }
      </QueryView>
    </Screen>
  );
}
