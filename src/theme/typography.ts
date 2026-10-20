import type { TextStyle } from 'react-native';

/** Font family names registered in app/_layout.tsx via expo-font. */
export const fonts = {
  amiri: 'Amiri_400Regular',
  amiriBold: 'Amiri_700Bold',
  plexLight: 'IBMPlexSansArabic_300Light',
  plex: 'IBMPlexSansArabic_400Regular',
  plexMedium: 'IBMPlexSansArabic_500Medium',
  plexSemiBold: 'IBMPlexSansArabic_600SemiBold',
  plexBold: 'IBMPlexSansArabic_700Bold',
} as const;

export const fontSizes = [10, 11, 12, 13, 14, 15, 16, 18, 19, 24, 28, 32, 38, 64] as const;
export type FontSize = (typeof fontSizes)[number] | 11.5 | 12.5 | 13.5 | 17 | 20 | 22 | 27 | 34;

export type FontWeight = '300' | '400' | '500' | '600' | '700';
export type FontFamily = 'ui' | 'display';

/** RN can't synthesise weights for custom fonts, so each weight is its own family. */
export function fontFor(family: FontFamily, weight: FontWeight = '400'): string {
  if (family === 'display')
    return weight === '700' || weight === '600' ? fonts.amiriBold : fonts.amiri;
  switch (weight) {
    case '300':
      return fonts.plexLight;
    case '500':
      return fonts.plexMedium;
    case '600':
      return fonts.plexSemiBold;
    case '700':
      return fonts.plexBold;
    default:
      return fonts.plex;
  }
}

export function lineHeightFor(size: number, family: FontFamily, relaxed = false): number {
  // Arabic script needs generous leading; Amiri more than Plex.
  const ratio = family === 'display' ? (relaxed ? 2 : 1.5) : relaxed ? 1.8 : 1.45;
  return Math.round(size * ratio);
}

export const textStyle = (
  size: number,
  weight: FontWeight = '400',
  family: FontFamily = 'ui',
): TextStyle => ({
  fontSize: size,
  fontFamily: fontFor(family, weight),
  lineHeight: lineHeightFor(size, family),
});
