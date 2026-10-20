import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '@/components';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { computeProgress } from '@/lib/progress';
import { TOTAL_PAGES } from '@/lib/quran';
import { useProgramRecords, type ProgramWithPeople } from '@/features/progress/api';
import { useIssueIjazah } from './api';

/** Teacher action on a student's khatmah: issue the Ijazah at 604/604, or open it once issued. */
export function IssueIjazahFooter({ program }: { program: ProgramWithPeople }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const records = useProgramRecords(program.id);
  const issue = useIssueIjazah();
  const done = computeProgress(records.data ?? []).complete;

  if (program.status === 'completed') {
    return (
      <Button
        label={t('ijazah.view')}
        icon="award"
        onPress={() =>
          router.push({ pathname: '/teacher-ijazah/[id]', params: { id: `program-${program.id}` } })
        }
      />
    );
  }
  if (!done) {
    return (
      <>
        <Button label={t('ijazah.issue')} icon="award" disabled />
        <Text size={11} color="textMuted" align="center">
          {t('ijazah.issueWhenComplete', { total: formatNumber(TOTAL_PAGES, locale) })}
        </Text>
      </>
    );
  }
  const confirm = () =>
    Alert.alert(t('ijazah.issueTitle'), t('ijazah.issueBody', { name: program.student_name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('ijazah.issueConfirm'),
        onPress: () =>
          issue.mutate(program.id, {
            onSuccess: (ij) =>
              router.push({ pathname: '/teacher-ijazah/[id]', params: { id: ij.id } }),
            onError: () => Alert.alert(t('common.errorTitle'), t('auth.errors.generic')),
          }),
      },
    ]);
  return (
    <Button label={t('ijazah.issue')} icon="award" loading={issue.isPending} onPress={confirm} />
  );
}
