import { useRequiredProfile } from '@/features/auth/store';
import { ApplicationStatus } from '@/features/teacher/ApplicationStatus';
import { DashboardScreen } from '@/features/teacher/DashboardScreen';

export default function DashboardRoute() {
  const profile = useRequiredProfile();
  return profile.teacher_status === 'approved' ? <DashboardScreen /> : <ApplicationStatus />;
}
