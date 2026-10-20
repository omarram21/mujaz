import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { formatNumber } from '@/lib/formatNumber';
import { useLocale } from '@/i18n';

export function ProgressBar({
  value,
  color,
  track,
  height = 6,
  label,
}: {
  /** 0..1 */
  value: number;
  color?: string;
  track?: string;
  height?: number;
  label?: string;
}) {
  const { colors } = useTheme();
  const v = Math.min(1, Math.max(0, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: track ?? colors.trackEmpty,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${v * 100}%`,
          height,
          borderRadius: height / 2,
          backgroundColor: color ?? colors.ground,
        }}
      />
    </View>
  );
}

/** Segmented "step N of M" bar. */
export function StepProgress({ step, total }: { step: number; total: number }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <View
      style={{ flexDirection: 'row', gap: 5 }}
      accessibilityRole="progressbar"
      accessibilityLabel={t('common.stepOf', {
        step: formatNumber(step, locale),
        total: formatNumber(total, locale),
      })}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: i < step ? colors.ground : colors.trackEmpty,
          }}
        />
      ))}
    </View>
  );
}

/** Circular progress ring (stroke-dasharray), e.g. 152px on the khatmah screen. */
export function ProgressRing({
  value,
  size = 152,
  stroke = 12,
  color,
  track,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={track ?? colors.borderDark}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? colors.gold}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c * v} ${c}`}
          strokeLinecap="round"
        />
      </Svg>
      {children}
    </View>
  );
}
