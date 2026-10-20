import { Stack } from 'expo-router';
import { useAuthStore } from '@/features/auth/store';

export default function AuthLayout() {
  const signedIn = useAuthStore((s) => s.status === 'signedIn');
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="profile-setup" />
      </Stack.Protected>
    </Stack>
  );
}
