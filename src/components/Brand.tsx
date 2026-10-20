import Svg, { Circle, G, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { hiddenSvg, labelledSvg } from './a11y';

/** Two overlapping squares + circle, gold stroke. */
export function Logo({ size = 82, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const c = color ?? colors.gold;
  return (
    <Svg width={size} height={size} viewBox="0 0 82 82" {...labelledSvg(t('brand.logoLabel'))}>
      <Rect x="16" y="16" width="50" height="50" fill="none" stroke={c} strokeWidth="2" />
      <Rect
        x="16"
        y="16"
        width="50"
        height="50"
        fill="none"
        stroke={c}
        strokeWidth="2"
        transform="rotate(45 41 41)"
      />
      <Circle cx="41" cy="41" r="14" fill="none" stroke={c} strokeWidth="2" />
      <Circle cx="41" cy="41" r="4" fill={c} />
    </Svg>
  );
}

/** Geometric gold pattern for the welcome screen top corner (~16% opacity). */
export function GeometricPattern({
  width = 390,
  opacity = 0.16,
}: {
  width?: number;
  opacity?: number;
}) {
  const { colors } = useTheme();
  return (
    <Svg
      width={width}
      height={(width * 300) / 390}
      viewBox="0 0 390 300"
      style={{ position: 'absolute', top: -40, right: 0, opacity }}
      {...hiddenSvg}
    >
      <G fill="none" stroke={colors.gold} strokeWidth="1">
        <Rect x="40" y="40" width="90" height="90" transform="rotate(45 85 85)" />
        <Rect x="40" y="40" width="90" height="90" />
        <Rect x="180" y="110" width="70" height="70" transform="rotate(45 215 145)" />
        <Rect x="180" y="110" width="70" height="70" />
        <Rect x="280" y="10" width="110" height="110" transform="rotate(45 335 65)" />
        <Rect x="280" y="10" width="110" height="110" />
        <Circle cx="85" cy="85" r="26" />
        <Circle cx="335" cy="65" r="32" />
      </G>
    </Svg>
  );
}

/** Small logo mark for corners (certificate motifs, verify header). */
export function CornerMotif({ size = 46, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const c = color ?? colors.goldOnLight;
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" {...hiddenSvg}>
      <Rect x="9" y="9" width="28" height="28" fill="none" stroke={c} strokeWidth="1.6" />
      <Rect
        x="9"
        y="9"
        width="28"
        height="28"
        fill="none"
        stroke={c}
        strokeWidth="1.6"
        transform="rotate(45 23 23)"
      />
    </Svg>
  );
}
