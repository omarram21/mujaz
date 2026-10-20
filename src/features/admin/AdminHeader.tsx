import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { IconButton, Text } from '@/components';
import { useTheme } from '@/theme';
import { signOut } from '@/features/auth/api';

/** Near-black header used on admin screens. */
export function AdminHeader({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: colors.text,
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {back ? (
        <IconButton
          icon="back"
          tone="dark"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
        />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text size={16} weight="600" color="creamBright" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text size={12} color="textDisabled" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          backgroundColor: '#3A2E12',
          paddingHorizontal: 11,
          paddingVertical: 5,
          borderRadius: 8,
        }}
      >
        <Text size={11} weight="600" color="#E8C867">
          {t('admin.badge')}
        </Text>
      </View>
      {!back ? (
        <IconButton
          icon="logout"
          tone="dark"
          accessibilityLabel={t('account.logout')}
          onPress={() => void signOut()}
        />
      ) : null}
    </View>
  );
}
