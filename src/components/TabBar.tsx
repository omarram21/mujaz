import { Pressable, View } from 'react-native';
import type { ComponentProps } from 'react';
import type { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';

export type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** 4-tab bottom nav as drawn: icon + 10px label, active tab in `ground`. */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
        paddingTop: 10,
        paddingBottom: Math.max(20, insets.bottom + 6),
      }}
    >
      {state.routes.map((route, index) => {
        const options = (descriptors[route.key]?.options ?? {}) as {
          title?: string;
          tabBarIconName?: IconName;
        };
        const focused = state.index === index;
        const label = options.title ?? route.name;
        const icon = options.tabBarIconName ?? 'home';
        const color = focused ? colors.ground : colors.textNav;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented)
                navigation.navigate(route.name, route.params);
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 4,
              minHeight: 44,
              justifyContent: 'center',
            }}
          >
            <Icon name={icon} size={22} color={color} strokeWidth={focused ? 1.9 : 1.8} />
            <Text size={10} weight={focused ? '600' : '400'} color={color}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
