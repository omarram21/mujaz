import { useMemo } from 'react';
import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BottomBar, Button, ErrorState, LoadingState, Notice, Screen, Text } from '@/components';
import { useLocale } from '@/i18n';
import { computeProgress } from '@/lib/progress';
import { useNow } from '@/lib/useNow';
import { riwayahName, useRiwayat } from '@/features/riwayat/api';
import {
  projectedFinish,
  useMistakeCounts,
  useProgramRecords,
  weekStreak,
  type ProgramWithPeople,
} from './api';
import { KhatmahHeader } from './components/KhatmahHeader';
import { JuzGrid } from './components/JuzGrid';
import { RecentSessions } from './components/RecentSessions';

/** Progress of one khatmah program; used by the student tab and the teacher's student view. */
export function KhatmahView({
  program,
  role,
  switcher,
  footer,
}: {
  program: ProgramWithPeople;
  role: 'student' | 'teacher';
  switcher?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const now = useNow(60_000);
  const riwayat = useRiwayat();
  const records = useProgramRecords(program.id);
  const counts = useMistakeCounts((records.data ?? []).map((r) => r.booking_id));

  const stats = useMemo(() => {
    const list = records.data ?? [];
    const progress = computeProgress(list);
    const dates = list.map((r) => new Date(r.approved_at ?? r.created_at));
    return {
      progress,
      sessions: list.length,
      streak: weekStreak(dates, new Date(now)),
      finish: projectedFinish(list, progress.pagesCount, new Date(now)),
    };
  }, [records.data, now]);

  const title = role === 'student' ? t('progress.title') : program.student_name;
  const subtitle = `${riwayahName(riwayat.data, program.riwayah, locale)}${role === 'student' ? ` · ${program.teacher_name}` : ''}`;

  return (
    <Screen
      header={
        <KhatmahHeader
          title={title}
          subtitle={subtitle}
          progress={stats.progress}
          sessions={stats.sessions}
          streakWeeks={stats.streak}
          finish={stats.finish}
          back={role === 'teacher'}
        />
      }
      footer={footer ? <BottomBar>{footer}</BottomBar> : undefined}
      refreshControl={
        <RefreshControl
          refreshing={records.isRefetching}
          onRefresh={() => void records.refetch()}
        />
      }
      contentStyle={{ gap: 16 }}
    >
      {switcher}
      {records.isPending ? (
        <LoadingState />
      ) : records.isError ? (
        <ErrorState onRetry={() => void records.refetch()} />
      ) : (
        <>
          {program.status === 'completed' ? (
            <Notice tone="success" icon="award" text={t('progress.completedNotice')} />
          ) : null}
          <JuzGrid juz={stats.progress.juz} />
          <View style={{ gap: 9 }}>
            <Text size={13} weight="600" accessibilityRole="header">
              {t('progress.recent')}
            </Text>
            <RecentSessions records={records.data} mistakeCounts={counts.data} />
          </View>
        </>
      )}
    </Screen>
  );
}

export function goToCertificate(programId: string) {
  router.push({ pathname: '/ijazah/[id]', params: { id: `program-${programId}` } });
}

export function CertificateButton({ programId }: { programId: string }) {
  const { t } = useTranslation();
  return (
    <Button
      label={t('progress.previewCertificate')}
      variant="secondary"
      icon="award"
      onPress={() => goToCertificate(programId)}
    />
  );
}
