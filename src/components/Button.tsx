import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme, layout, radii } from '@/theme';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';

export type ButtonVariant =
  'primary' | 'secondary' | 'gold' | 'outlineDark' | 'danger' | 'dangerOutline' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  height,
  style,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.ground, fg: colors.cream },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.borderStrong },
    gold: { bg: colors.gold, fg: colors.ground },
    outlineDark: { bg: 'transparent', fg: colors.cream, border: colors.borderDarkStrong },
    danger: { bg: colors.danger, fg: '#FFFFFF' },
    dangerOutline: { bg: colors.surface, fg: colors.danger, border: '#E8C6C7' },
    ghost: { bg: 'transparent', fg: colors.ground },
  };
  const p = palette[variant];
  const isDisabled = disabled || loading;
  const h =
    height ?? (variant === 'secondary' ? layout.buttonHeightSecondary : layout.buttonHeight);
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        {
          height: Math.max(h, layout.minTouch),
          backgroundColor: p.bg,
          borderColor: p.border ?? 'transparent',
          borderWidth: p.border ? 1 : 0,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={18} color={p.fg} /> : null}
          <Text size={15} weight={variant === 'secondary' ? '500' : '600'} color={p.fg}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export interface IconButtonProps {
  icon: IconName;
  /** Required: icon-only buttons must be labelled for screen readers. */
  accessibilityLabel: string;
  onPress?: () => void;
  tone?: 'light' | 'dark' | 'darkFilled' | 'plain';
  size?: number;
  iconColor?: string;
  disabled?: boolean;
}

/** 36–40px visual box, padded via hitSlop to the 44px minimum touch target. */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  tone = 'light',
  size = 36,
  iconColor,
  disabled,
}: IconButtonProps) {
  const { colors } = useTheme();
  const tones = {
    light: { bg: colors.surface, border: colors.borderStrong, fg: colors.text },
    dark: { bg: 'transparent', border: colors.borderDark, fg: colors.cream },
    darkFilled: { bg: colors.groundDeep, border: colors.borderDark, fg: colors.gold },
    plain: { bg: 'transparent', border: 'transparent', fg: colors.text },
  } as const;
  const t = tones[tone];
  const slop = Math.max(0, (layout.minTouch - size) / 2);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size >= 40 ? 12 : 11,
        borderWidth: 1,
        borderColor: t.border,
        backgroundColor: t.bg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} size={size >= 40 ? 20 : 18} color={iconColor ?? t.fg} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
