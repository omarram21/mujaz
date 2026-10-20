import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/store';
import { refreshProfile, signOut } from '@/features/auth/api';
import { Button, ErrorState } from '@/components';
import { useTheme } from '@/theme';

/** Entry point: sends each user to the home of their role. */
export default function Index() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const status = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);

  if (status === 'loading') return <View style={{ flex: 1, backgroundColor: colors.ground }} />;
  if (status === 'signedOut') return <Redirect href="/welcome" />;
  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}>
        <ErrorState onRetry={() => void refreshProfile()} />
        <Button label={t('account.logout')} variant="ghost" onPress={() => void signOut()} />
      </View>
    );
  }
  switch (profile.role) {
    case 'admin':
      return <Redirect href="/applications" />;
    case 'teacher':
      return <Redirect href="/dashboard" />;
    default:
      return <Redirect href={profile.onboarded ? '/teachers' : '/profile-setup'} />;
  }
}
