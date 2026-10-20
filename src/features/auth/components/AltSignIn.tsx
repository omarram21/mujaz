import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '@/components';
import { useTheme } from '@/theme';
import { authFlags, type SignUpRole } from '../api';
import { PhoneAuthModal } from './PhoneAuthModal';

/**
 * "Or" divider + phone and Google buttons. Each stays hidden until its credentials are
 * configured (EXPO_PUBLIC_ENABLE_PHONE_AUTH / EXPO_PUBLIC_ENABLE_GOOGLE_AUTH).
 */
export function AltSignIn({ role, fullName }: { role?: SignUpRole; fullName?: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [phoneOpen, setPhoneOpen] = useState(false);
  if (!authFlags.phone && !authFlags.google) return null;
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.trackEmpty }} />
        <Text size={11.5} color="textMuted">
          {t('common.or')}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.trackEmpty }} />
      </View>
      <View style={{ gap: 10 }}>
        {authFlags.phone ? (
          <Button
            variant="secondary"
            icon="phone"
            label={t('auth.phone')}
            onPress={() => setPhoneOpen(true)}
          />
        ) : null}
        {authFlags.google ? (
          <Button
            variant="secondary"
            icon="google"
            label={t('auth.google')}
            // TODO(google-auth): wire expo-auth-session / native Google Sign-In once client IDs are provided.
            onPress={() => Alert.alert(t('auth.google'), t('common.notConfigured'))}
          />
        ) : null}
      </View>
      <PhoneAuthModal
        visible={phoneOpen}
        onClose={() => setPhoneOpen(false)}
        role={role}
        fullName={fullName}
      />
    </>
  );
}
