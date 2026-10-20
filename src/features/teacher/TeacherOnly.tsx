import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DarkHeader, EmptyState, Screen } from '@/components';
import { useRequiredProfile } from '@/features/auth/store';

/** Renders children only for approved teachers; otherwise an explanatory empty state. */
export function ApprovedTeacherOnly({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();
  const profile = useRequiredProfile();
  if (profile.teacher_status === 'approved') return <>{children}</>;
  return (
    <Screen header={<DarkHeader title={title} />}>
      <EmptyState
        icon="shieldCheck"
        title={t('teacherHome.afterApprovalTitle')}
        body={t('teacherHome.afterApprovalBody')}
      />
    </Screen>
  );
}
