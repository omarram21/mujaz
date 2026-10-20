import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import {
  useTheme,
  fontFor,
  lineHeightFor,
  type ColorTokens,
  type FontFamily,
  type FontWeight,
} from '@/theme';

export interface TextProps extends RNTextProps {
  size?: number;
  weight?: FontWeight;
  family?: FontFamily;
  /** Theme token name or a raw colour. */
  color?: keyof ColorTokens | (string & {});
  align?: TextStyle['textAlign'];
  relaxed?: boolean;
  letterSpacing?: number;
}

export function Text({
  size = 14,
  weight = '400',
  family = 'ui',
  color = 'text',
  align,
  relaxed,
  letterSpacing,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  const resolved = (colors as Record<string, string>)[color] ?? color;
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[
        {
          fontSize: size,
          fontFamily: fontFor(family, weight),
          lineHeight: lineHeightFor(size, family, relaxed),
          color: resolved,
          textAlign: align,
          letterSpacing,
          writingDirection: 'auto',
        },
        style,
      ]}
    />
  );
}
