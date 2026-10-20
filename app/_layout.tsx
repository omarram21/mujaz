import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import {
  IBMPlexSansArabic_300Light,
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initI18n } from '@/i18n';
import { ThemeContext, themes } from '@/theme';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { useAuthStore } from '@/features/auth/store';
import { NotificationsBridge } from '@/services/notificationsBridge';
import { ErrorState } from '@/components';

void SplashScreen.preventAutoHideAsync();

/** Last-resort screen if rendering throws (Expo Router error boundary). */
export function ErrorBoundary({ retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: themes.light.colors.bg,
      }}
    >
      <ErrorState onRetry={() => void retry()} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
    IBMPlexSansArabic_300Light,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    void initI18n().finally(() => setI18nReady(true));
  }, []);

  const ready = (fontsLoaded || !!fontError) && i18nReady;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeContext.Provider value={themes.light}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              {ready ? (
                <RootNavigator />
              ) : (
                <View style={{ flex: 1, backgroundColor: themes.light.colors.ground }} />
              )}
            </AuthProvider>
          </QueryClientProvider>
        </ThemeContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') return null;

  const signedIn = status === 'signedIn' && !!profile;
  const role = profile?.role;
  const isStudent = signedIn && role === 'student';
  const needsSetup = isStudent && !profile?.onboarded;

  return (
    <>
      {signedIn ? <NotificationsBridge /> : null}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: themes.light.colors.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Protected guard={!signedIn || needsSetup}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isStudent && !needsSetup}>
          <Stack.Screen name="(student)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && role === 'teacher'}>
          <Stack.Screen name="(teacher)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && role === 'admin'}>
          <Stack.Screen name="(admin)" />
        </Stack.Protected>
        {/* Public: reachable while signed out (QR codes deep-link here). */}
        <Stack.Screen name="verify" />
      </Stack>
    </>
  );
}
