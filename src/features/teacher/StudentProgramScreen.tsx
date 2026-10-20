import { useLocalSearchParams } from 'expo-router';
import { DarkHeader, ErrorState, LoadingState, Screen } from '@/components';
import { useMyPrograms } from '@/features/progress/api';
import { KhatmahView } from '@/features/progress/KhatmahView';
import { IssueIjazahFooter } from '@/features/ijazah/IssueIjazahFooter';

export function StudentProgramScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const programs = useMyPrograms();
  const program = programs.data?.find((p) => p.id === programId);
  if (programs.isPending) return <LoadingState />;
  if (programs.isError || !program) {
    return (
      <Screen header={<DarkHeader back />}>
        <ErrorState onRetry={() => void programs.refetch()} />
      </Screen>
    );
  }
  return (
    <KhatmahView
      program={program}
      role="teacher"
      footer={<IssueIjazahFooter program={program} />}
    />
  );
}
