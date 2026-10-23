import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button, GeometricPattern, Icon, Logo, Text, type IconName } from '@/components';
import { useTheme } from '@/theme';

/** Set by test builds (CI) so testers can tell which version is installed. */
const BUILD_ID = process.env.EXPO_PUBLIC_BUILD_ID?.slice(0, 12);

export function WelcomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const values: { icon: IconName; text: string }[] = [
    { icon: 'shieldCheck', text: t('welcome.valueVerified') },
    { icon: 'grid', text: t('welcome.valuePages') },
    { icon: 'award', text: t('welcome.valueIjazah') },
  ];
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.ground,
        overflow: 'hidden',
        paddingTop: insets.top,
      }}
    >
      <StatusBar style="light" />
      <GeometricPattern />
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 18,
          paddingHorizontal: 32,
        }}
      >
        <Logo size={82} />
        <Text
          family="display"
          weight="700"
          size={64}
          color="cream"
          letterSpacing={2}
          accessibilityRole="header"
          style={{ lineHeight: 96 }}
        >
          {t('brand.name')}
        </Text>
        <Text family="display" size={20} color="gold" align="center" relaxed>
          {t('brand.tagline')}
        </Text>
        <Text
          size={14}
          color="onDarkSoft"
          align="center"
          relaxed
          style={{ maxWidth: 290, marginTop: 4 }}
        >
          {t('brand.intro')}
        </Text>
      </View>

      <View style={{ gap: 14, paddingHorizontal: 32, paddingBottom: 20 }}>
        {values.map((v) => (
          <View key={v.icon} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name={v.icon} size={22} color={colors.gold} />
            <Text size={14} color="onDarkBody" style={{ flex: 1 }}>
              {v.text}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={{ gap: 10, paddingHorizontal: 24, paddingBottom: Math.max(34, insets.bottom + 16) }}
      >
        <Button
          label={t('welcome.start')}
          variant="gold"
          height={54}
          onPress={() => router.push({ pathname: '/sign-up', params: { role: 'student' } })}
        />
        <Button
          label={t('welcome.applySheikh')}
          variant="outlineDark"
          height={54}
          onPress={() => router.push({ pathname: '/sign-up', params: { role: 'teacher' } })}
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
            marginTop: 6,
          }}
        >
          <Text size={13} color="onDarkMuted">
            {t('welcome.haveAccount')}
          </Text>
          <Pressable onPress={() => router.push('/sign-in')} accessibilityRole="link" hitSlop={12}>
            <Text size={13} weight="600" color="gold">
              {t('welcome.signIn')}
            </Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => router.push('/verify')}
          accessibilityRole="link"
          hitSlop={8}
          style={{ alignSelf: 'center', minHeight: 32, justifyContent: 'center' }}
        >
          <Text size={12} color="onDarkMuted" style={{ textDecorationLine: 'underline' }}>
            {t('welcome.verify')}
          </Text>
        </Pressable>
        {BUILD_ID ? (
          <Text size={10} color="onDarkMuted" align="center" style={{ opacity: 0.6 }}>
            {`build ${BUILD_ID}`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
