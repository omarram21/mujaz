import { View } from 'react-native';
import { avatarPalette } from '@/theme';
import { Text } from './Text';

/** Two initials: first letter of the first two meaningful words, skipping honorifics. */
const HONORIFICS = new Set([
  'الشيخ',
  'الشيخة',
  'الأستاذ',
  'الأستاذة',
  'د.',
  'Sheikh',
  'Shaykh',
  'Dr.',
  'Ustadh',
  'Ustadha',
]);

export function initials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => w && !HONORIFICS.has(w));
  const pick = (w?: string) => {
    if (!w) return '';
    // "عبدالرحمن" → ع ; strip a leading definite article "ال" for family names
    const core = w.startsWith('ال') && w.length > 3 ? w.slice(2) : w;
    return Array.from(core)[0] ?? '';
  };
  const first = pick(words[0]);
  const second = pick(words.length > 1 ? words[words.length - 1] : undefined);
  return [first, second].filter(Boolean).join(' ');
}

export function paletteFor(id: string): readonly [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return avatarPalette[h % avatarPalette.length] ?? ['#0D3B2E', '#D4AF5A'];
}

export interface AvatarProps {
  id: string;
  name: string;
  size?: number;
  radius?: number;
  /** Override colours (e.g. cream avatar on a dark header). */
  colors?: readonly [string, string];
}

export function Avatar({ id, name, size = 56, radius, colors }: AvatarProps) {
  const [bg, fg] = colors ?? paletteFor(id);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? Math.round(size * 0.28),
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        family="display"
        size={Math.round(size * 0.39)}
        color={fg}
        style={{ lineHeight: Math.round(size * 0.6) }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}
