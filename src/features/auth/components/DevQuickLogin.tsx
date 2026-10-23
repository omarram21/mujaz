import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Icon, ListRow, Text } from '@/components';
import { useTheme } from '@/theme';
import { authFlags, signInWithEmail } from '../api';
import { authErrorKey } from '../schema';

// Seeded demo accounts (supabase/seed.sql). Shown only when
// EXPO_PUBLIC_ENABLE_DEV_LOGIN=true; never enable it in a store build.
const DEMO_PASSWORD = 'Password123!';
const ACCOUNTS = [
  { email: 'admin@mujaz.test', role: 'admin' },
  { email: 'abdulrahman@mujaz.test', role: 'teacher' },
  { email: 'umm.anas@mujaz.test', role: 'teacher' },
  { email: 'yasir@mujaz.test', role: 'teacher' },
  { email: 'hamza@mujaz.test', role: 'applicant' },
  { email: 'ahmad@mujaz.test', role: 'student' },
  { email: 'sara@mujaz.test', role: 'student' },
  { email: 'yusuf@mujaz.test', role: 'student' },
] as const;

export function DevQuickLogin({ onError }: { onError: (message: string | undefined) => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string>();

  if (!authFlags.devLogin) return null;

  const signIn = async (email: string) => {
    onError(undefined);
    setBusy(email);
    try {
      await signInWithEmail(email, DEMO_PASSWORD);
    } catch (e) {
      onError(t(authErrorKey(e)));
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <Card padding={0} radius={14} style={{ overflow: 'hidden', borderStyle: 'dashed' }}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 }}
      >
        <View style={{ flex: 1 }}>
          <Text size={14} weight="600" color="ground">
            {t('auth.devLoginTitle')}
          </Text>
          <Text size={11.5} color="textMuted">
            {t('auth.devLoginHint')}
          </Text>
        </View>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Icon name="chevronDown" size={18} color={colors.textMuted} />
        </View>
      </Pressable>
      {open
        ? ACCOUNTS.map((a, i) => (
            <ListRow
              key={a.email}
              label={t(`auth.devRole_${a.role}`)}
              value={a.email}
              onPress={busy ? undefined : () => void signIn(a.email)}
              trailing={busy === a.email ? <ActivityIndicator color={colors.ground} /> : undefined}
              last={i === ACCOUNTS.length - 1}
            />
          ))
        : null}
    </Card>
  );
}
