import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, DarkHeader, Screen, Text } from '@/components';
import { useTheme } from '@/theme';
import { signOut } from '@/features/auth/api';
import { useRequiredProfile } from '@/features/auth/store';

export function AccountScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const profile = useRequiredProfile();
  return (
    <Screen
      header={
        <DarkHeader>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar
              id={profile.id}
              name={profile.full_name}
              size={60}
              colors={[colors.cream, colors.ground]}
            />
            <Text size={18} weight="600" color="cream" style={{ flex: 1 }}>
              {profile.full_name}
            </Text>
          </View>
        </DarkHeader>
      }
    >
      <Button
        label={t('account.logout')}
        variant="dangerOutline"
        icon="logout"
        onPress={() => void signOut()}
      />
    </Screen>
  );
}
