import { forwardRef } from 'react';
import { Platform, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme, fontFor, layout, radii } from '@/theme';
import { Text } from './Text';
import i18n from 'i18next';
import { isRTLLayout } from '@/lib/direction';
import { localizeDigits, toAsciiDigits } from '@/lib/formatNumber';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Force left-to-right content (email, codes, phone). */
  ltr?: boolean;
  multilineHeight?: number;
  family?: 'ui' | 'display';
  tone?: 'light' | 'dark';
  /** Show Arabic-Indic digits in Arabic and hand ASCII digits back to onChangeText. */
  localizedDigits?: boolean;
}

/**
 * Native RN swaps textAlign left/right under RTL, so physical-left needs 'right' there.
 * Web doesn't swap.
 */
export const physicalLeft = (): 'left' | 'right' =>
  Platform.OS !== 'web' && isRTLLayout() ? 'right' : 'left';

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    ltr,
    multilineHeight,
    family = 'ui',
    tone = 'light',
    style,
    multiline,
    localizedDigits,
    value,
    onChangeText,
    ...rest
  },
  ref,
) {
  const { colors } = useTheme();
  const dark = tone === 'dark';
  return (
    <View>
      {label ? (
        <Text size={12} color={dark ? 'onDarkMuted' : 'textMuted'} style={{ marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        accessibilityLabel={label ?? rest.placeholder}
        placeholderTextColor={dark ? colors.onDarkMuted : colors.textDisabled}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...rest}
        value={
          localizedDigits && value != null
            ? localizeDigits(value, i18n.language === 'en' ? 'en' : 'ar')
            : value
        }
        onChangeText={
          localizedDigits && onChangeText ? (v) => onChangeText(toAsciiDigits(v)) : onChangeText
        }
        style={[
          {
            minHeight: multiline ? (multilineHeight ?? 110) : layout.inputHeight,
            borderRadius: radii.input,
            borderWidth: 1,
            borderColor: error ? colors.danger : dark ? colors.borderDark : colors.borderStrong,
            backgroundColor: dark ? colors.groundDeep : colors.surface,
            paddingHorizontal: 14,
            paddingVertical: multiline ? 12 : 0,
            fontFamily: fontFor(family, '400'),
            fontSize: family === 'display' ? 16 : 14,
            lineHeight: multiline ? (family === 'display' ? 30 : 24) : undefined,
            color: dark ? colors.onDarkBody : colors.text,
            textAlign: ltr
              ? physicalLeft()
              : Platform.OS === 'web'
                ? isRTLLayout()
                  ? 'right'
                  : 'left'
                : 'left',
            writingDirection: ltr ? 'ltr' : 'auto',
          },
          style,
        ]}
      />
      {error ? (
        <Text size={11.5} color="danger" style={{ marginTop: 5 }} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
