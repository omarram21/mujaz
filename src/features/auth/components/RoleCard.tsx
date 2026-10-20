import { Pressable } from 'react-native';
import { Icon, Text, type IconName } from '@/components';
import { useTheme } from '@/theme';

export function RoleCard({
  icon,
  title,
  hint,
  selected,
  onPress,
}: {
  icon: IconName;
  title: string;
  hint: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}، ${hint}`}
      style={{
        flex: 1,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.ground : colors.borderStrong,
        backgroundColor: selected ? colors.ground : colors.surface,
        borderRadius: 15,
        paddingVertical: 14,
        paddingHorizontal: 12,
      }}
    >
      <Icon name={icon} size={22} color={selected ? colors.gold : colors.ground} />
      <Text
        size={14}
        weight="600"
        color={selected ? 'creamBright' : 'text'}
        style={{ marginTop: 9 }}
      >
        {title}
      </Text>
      <Text size={11} color={selected ? 'onDarkMuted' : 'textMuted'} style={{ marginTop: 3 }}>
        {hint}
      </Text>
    </Pressable>
  );
}
