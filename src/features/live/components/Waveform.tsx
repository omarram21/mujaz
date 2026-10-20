import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useTheme } from '@/theme';

const HEIGHTS = [10, 20, 26, 14, 22, 8, 17];

/** Seven gold bars; they move while `active` (the other participant is speaking). */
export function Waveform({ active, label }: { active: boolean; label: string }) {
  const { colors } = useTheme();
  const [values] = useState(() => HEIGHTS.map(() => new Animated.Value(0.35)));

  useEffect(() => {
    if (!active) {
      values.forEach((v) => v.setValue(0.35));
      return;
    }
    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: 260 + i * 40,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0.3,
            duration: 240 + i * 30,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active, values]);

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 26 }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      {HEIGHTS.map((h, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            height: h,
            borderRadius: 2,
            backgroundColor: colors.gold,
            opacity: active ? 1 : 0.45,
            transform: [{ scaleY: values[i]! }],
          }}
        />
      ))}
    </View>
  );
}
