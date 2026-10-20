import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';

/** Amber (warning) or green (success) info strip, as on the teacher profile and apply screens. */
export function Notice({
  text,
  tone = 'warning',
  icon = 'info',
  title,
}: {
  text: string;
  tone?: 'warning' | 'success' | 'danger';
  icon?: IconName;
  title?: string;
}) {
  const { colors } = useTheme();
  const t = {
    warning: {
      bg: colors.warningBg,
      border: colors.warningBorder,
      fg: colors.warningText,
      icon: colors.goldText,
    },
    success: {
      bg: colors.successSoft,
      border: '#CFE3D8',
      fg: colors.success,
      icon: colors.success,
    },
    danger: { bg: colors.dangerSoft, border: '#EBC5C6', fg: colors.danger, icon: colors.danger },
  }[tone];
  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        alignItems: title ? 'flex-start' : 'center',
        gap: 10,
        backgroundColor: t.bg,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
      }}
    >
      <Icon name={icon} size={20} color={t.icon} strokeWidth={1.9} />
      <View style={{ flex: 1, gap: 2 }}>
        {title ? (
          <Text size={13} weight="600" color={t.fg}>
            {title}
          </Text>
        ) : null}
        <Text size={11.5} color={t.fg} relaxed>
          {text}
        </Text>
      </View>
    </View>
  );
}
