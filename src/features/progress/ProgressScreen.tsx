import { useState } from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Chip, DarkHeader, EmptyState, ErrorState, LoadingState, Screen } from '@/components';
import { useMyPrograms } from './api';
import { CertificateButton, KhatmahView } from './KhatmahView';

/** Student "ختمتي" tab: the most recent active program, with a switcher when there are several. */
export function ProgressScreen() {
  const { t } = useTranslation();
  const programs = useMyPrograms();
  const [selected, setSelected] = useState<string | null>(null);

  if (programs.isPending || programs.isError || programs.data.length === 0) {
    return (
      <Screen header={<DarkHeader title={t('progress.title')} />}>
        {programs.isPending ? (
          <LoadingState />
        ) : programs.isError ? (
          <ErrorState onRetry={() => void programs.refetch()} />
        ) : (
          <EmptyState
            icon="book"
            title={t('progress.emptyTitle')}
            body={t('progress.emptyBody')}
            actionLabel={t('sessions.findTeacher')}
            onAction={() => router.navigate('/teachers')}
          />
        )}
      </Screen>
    );
  }

  const list = programs.data;
  const program =
    list.find((p) => p.id === selected) ?? list.find((p) => p.status === 'active') ?? list[0]!;

  return (
    <KhatmahView
      program={program}
      role="student"
      switcher={
        list.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {list.map((p) => (
              <Chip
                key={p.id}
                size="sm"
                label={p.teacher_name}
                selected={p.id === program.id}
                onPress={() => setSelected(p.id)}
              />
            ))}
          </ScrollView>
        ) : undefined
      }
      footer={<CertificateButton programId={program.id} />}
    />
  );
}
