import { Pressable, Switch, View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';
import { CheckCircle, Icon, type IconName } from './Icon';

/** Large selectable card with icon, title, subtitle and a check when selected (goal picker). */
export function OptionCard({
  title,
  subtitle,
  icon,
  selected,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={subtitle ? `${title}، ${subtitle}` : title}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.ground : colors.borderStrong,
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: selected ? 12 : 13,
        minHeight: 44,
      }}
    >
      {icon ? (
        <Icon name={icon} size={20} color={selected ? colors.ground : colors.textMuted} />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text size={13.5} weight="600">
          {title}
        </Text>
        {subtitle ? (
          <Text size={11} color="textMuted" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {selected ? <CheckCircle color={colors.ground} /> : null}
    </Pressable>
  );
}

/** Two-or-more equal segments (gender, duration). */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  height = 50,
}: {
  options: readonly { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
  height?: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10 }} accessibilityRole="radiogroup">
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: sel }}
            accessibilityLabel={o.label}
            style={{
              flex: 1,
              height: Math.max(44, height),
              borderRadius: 13,
              borderWidth: sel ? 2 : 1,
              borderColor: sel ? colors.ground : colors.borderStrong,
              backgroundColor: sel ? colors.ground : colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text size={14} weight={sel ? '600' : '400'} color={sel ? 'cream' : 'text'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({
  value,
  onValueChange,
  label,
  disabled,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={label}
      trackColor={{ false: colors.trackEmpty, true: colors.success }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={colors.trackEmpty}
    />
  );
}

/** Stat tile used inside dark headers (rating / ijazahs / years). */
export function StatTile({
  value,
  label,
  tone = 'dark',
}: {
  value: string;
  label: string;
  tone?: 'dark' | 'light';
}) {
  const { colors } = useTheme();
  const dark = tone === 'dark';
  return (
    <View
      accessible
      accessibilityLabel={`${value} ${label}`}
      style={{
        flex: 1,
        backgroundColor: dark ? colors.groundDeep : colors.surface,
        borderWidth: 1,
        borderColor: dark ? colors.borderDark : colors.border,
        borderRadius: 13,
        padding: 10,
        alignItems: 'center',
      }}
    >
      <Text size={17} weight="700" color={dark ? 'gold' : 'ground'}>
        {value}
      </Text>
      <Text
        size={10}
        color={dark ? 'onDarkMuted' : 'textMuted'}
        style={{ marginTop: 2 }}
        align="center"
      >
        {label}
      </Text>
    </View>
  );
}

/** Settings-style row with an icon, label, optional value, and chevron or trailing control. */
export function ListRow({
  icon,
  label,
  value,
  onPress,
  trailing,
  danger,
  last,
}: {
  icon?: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={value ? `${label}، ${value}` : label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 52,
        paddingHorizontal: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.divider,
        backgroundColor: pressed ? colors.bg : 'transparent',
      })}
    >
      {icon ? (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: danger ? colors.dangerSoft : colors.successSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={17} color={danger ? colors.danger : colors.success} />
        </View>
      ) : null}
      <Text size={14} color={danger ? 'danger' : 'text'} style={{ flex: 1 }}>
        {label}
      </Text>
      {value ? (
        <Text size={12.5} color="textMuted">
          {value}
        </Text>
      ) : null}
      {trailing ??
        (onPress ? <Icon name="forward" size={16} color={colors.textNav} strokeWidth={2} /> : null)}
    </Pressable>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
      }}
    >
      <Text size={14} weight="600" accessibilityRole="header">
        {title}
      </Text>
      {action}
    </View>
  );
}

export function Divider({ color }: { color?: string }) {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: color ?? colors.divider }} />;
}
