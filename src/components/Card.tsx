import { View, type ViewProps } from 'react-native';
import { useTheme, radii } from '@/theme';

export interface CardProps extends ViewProps {
  padding?: number;
  radius?: number;
  tone?: 'surface' | 'dark' | 'warning' | 'success';
}

export function Card({
  padding = 14,
  radius = radii.card,
  tone = 'surface',
  style,
  ...rest
}: CardProps) {
  const { colors } = useTheme();
  const tones = {
    surface: { backgroundColor: colors.surface, borderColor: colors.border },
    dark: { backgroundColor: colors.ground, borderColor: colors.ground },
    warning: { backgroundColor: colors.warningBg, borderColor: colors.warningBorder },
    success: { backgroundColor: colors.successSoft, borderColor: '#CFE3D8' },
  } as const;
  return (
    <View
      {...rest}
      style={[{ borderWidth: 1, borderRadius: radius, padding }, tones[tone], style]}
    />
  );
}
