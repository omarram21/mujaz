import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '@/components';
import { useRequiredProfile } from '@/features/auth/store';
import { ApplicationStatus } from '@/features/teacher/ApplicationStatus';

export default function DashboardRoute() {
  const { t } = useTranslation();
  const profile = useRequiredProfile();
  if (profile.teacher_status !== 'approved') return <ApplicationStatus />;
  return <PlaceholderScreen title={t('tabs.dashboard')} />;
}
