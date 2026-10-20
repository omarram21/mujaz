import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, layout } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Header rendered above the scroll area (e.g. DarkHeader), extends under the status bar. */
  header?: ReactNode;
  /** Sticky bottom bar (BottomBar). */
  footer?: ReactNode;
  scroll?: boolean;
  background?: string;
  /** Status bar text colour: light for dark headers. */
  statusBar?: 'light' | 'dark';
  contentStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
  refreshControl?: React.ComponentProps<typeof ScrollView>['refreshControl'];
}

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  background,
  statusBar,
  contentStyle,
  padded = true,
  refreshControl,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bg = background ?? colors.bg;
  const body = [
    {
      paddingHorizontal: padded ? layout.screenGutter : 0,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 14,
    },
    contentStyle,
  ];
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar style={statusBar ?? (header ? 'light' : 'dark')} />
      {header ?? <View style={{ height: insets.top }} />}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={body}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, body]}>{children}</View>
        )}
        {footer}
      </KeyboardAvoidingView>
    </View>
  );
}

/** Sticky bottom area on `surface` with a top border. */
export function BottomBar({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView
      edges={[]}
      style={[
        {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: layout.screenGutter,
          paddingTop: 12,
          paddingBottom: Math.max(layout.bottomBarPadding, insets.bottom + 8),
          gap: 10,
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
