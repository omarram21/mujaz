import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
  icon?: IconName;
  disabled?: boolean;
}

/** Selectable pill (filters, riwayah choice). Visual height 34–36, padded to 44 touch. */
export function Chip({ label, selected, onPress, size = 'md', icon, disabled }: ChipProps) {
  const { colors } = useTheme();
  const h = size === 'sm' ? 34 : 36;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      hitSlop={{ top: (44 - h) / 2, bottom: (44 - h) / 2 }}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        height: h,
        paddingHorizontal: 14,
        borderRadius: h / 2,
        borderWidth: selected ? 0 : 1,
        borderColor: colors.borderChip,
        backgroundColor: selected ? colors.ground : colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
      })}
    >
      {icon ? (
        <Icon name={icon} size={14} color={selected ? colors.cream : colors.textMuted} />
      ) : null}
      <Text
        size={size === 'sm' ? 13 : 12.5}
        weight={selected ? '600' : '400'}
        color={selected ? 'cream' : 'textBody'}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Static tag (riwayah labels on cards). */
export function Tag({
  label,
  tone = 'success',
}: {
  label: string;
  tone?: 'success' | 'gold' | 'neutral' | 'danger' | 'info' | 'dark';
}) {
  const { colors } = useTheme();
  const t = {
    success: { bg: colors.successSoft, fg: colors.success },
    gold: { bg: colors.warningBg, fg: colors.goldText },
    neutral: { bg: '#F1EEE6', fg: colors.textMuted },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    info: { bg: colors.infoSoft, fg: colors.info },
    dark: { bg: colors.groundDeep, fg: colors.gold },
  }[tone];
  return (
    <View
      style={{
        backgroundColor: t.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
      }}
    >
      <Text size={11} weight="600" color={t.fg}>
        {label}
      </Text>
    </View>
  );
}
