import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { IconButton } from './Button';
import { Text } from './Text';

export interface DarkHeaderProps {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  back?: boolean | (() => void);
  right?: ReactNode;
  background?: string;
  style?: StyleProp<ViewStyle>;
}

/** The `ground` header used on most screens; extends under the status bar. */
export function DarkHeader({
  children,
  title,
  subtitle,
  back,
  right,
  background,
  style,
}: DarkHeaderProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const onBack =
    typeof back === 'function'
      ? back
      : () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View
      style={[
        {
          backgroundColor: background ?? colors.ground,
          paddingTop: insets.top + 14,
          paddingHorizontal: 20,
          paddingBottom: 18,
          gap: 14,
        },
        style,
      ]}
    >
      {back || title || right ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {back ? (
            <IconButton
              icon="back"
              tone="dark"
              accessibilityLabel={t('common.back')}
              onPress={onBack}
            />
          ) : null}
          <View style={{ flex: 1 }}>
            {subtitle ? (
              <Text size={12} color="onDarkMuted">
                {subtitle}
              </Text>
            ) : null}
            {title ? (
              <Text size={18} weight="600" color="cream" accessibilityRole="header">
                {title}
              </Text>
            ) : null}
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Light header with back button and title (forms, setup screens). */
export function LightHeader({
  title,
  subtitle,
  back = true,
  right,
  children,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean | (() => void);
  right?: ReactNode;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const onBack =
    typeof back === 'function'
      ? back
      : () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingTop: insets.top + 14,
        paddingHorizontal: 20,
        paddingBottom: 14,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {back ? (
          <IconButton icon="back" accessibilityLabel={t('common.back')} onPress={onBack} />
        ) : null}
        <View style={{ flex: 1 }}>
          {title ? (
            <Text size={16} weight="600" accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text size={12} color="textMuted">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}
