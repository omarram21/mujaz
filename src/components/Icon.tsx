import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { ReactNode } from 'react';
import { isRTLLayout } from '@/lib/direction';
import { hiddenSvg, labelledSvg } from './a11y';

/**
 * Inline stroke icons, drawn from the design files (24×24 grid, stroke 1.8–2).
 * Decorative by default; give `label` when the icon carries meaning on its own.
 */
const ICONS = {
  back: () => <Path d="M9 5l7 7-7 7" />,
  forward: () => <Path d="M15 5l-7 7 7 7" />,
  chevronDown: () => <Path d="M6 9l6 6 6-6" />,
  search: () => (
    <>
      <Circle cx="11" cy="11" r="7" />
      <Path d="M20 20l-3.5-3.5" />
    </>
  ),
  bell: () => (
    <>
      <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  filter: () => <Path d="M4 6h16M7 12h10M10 18h4" />,
  shieldCheck: () => (
    <>
      <Path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3z" />
      <Path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  shield: () => <Path d="M12 2l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V5l7-3z" />,
  grid: () => (
    <>
      <Rect x="4" y="4" width="16" height="16" rx="2" />
      <Path d="M4 9h16M9 4v16" />
    </>
  ),
  award: () => (
    <>
      <Circle cx="12" cy="9" r="5" />
      <Path d="M8.5 13.5L7 21l5-2.3L17 21l-1.5-7.5" />
    </>
  ),
  calendar: () => (
    <>
      <Rect x="3" y="5" width="18" height="16" rx="2" />
      <Path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  calendarPlus: () => (
    <>
      <Rect x="3" y="5" width="18" height="16" rx="2" />
      <Path d="M3 10h18M8 3v4M16 3v4M12 14v4M10 16h4" />
    </>
  ),
  book: () => (
    <>
      <Path d="M4 5h7v14H4zM13 5h7v14h-7z" />
      <Path d="M4 9h7M13 9h7" />
    </>
  ),
  bookOpen: () => <Path d="M4 5h7v14H4zM13 5h7v14h-7z" />,
  user: () => (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4.5 20c1.3-3.6 4-5.5 7.5-5.5s6.2 1.9 7.5 5.5" />
    </>
  ),
  users: () => (
    <>
      <Circle cx="9" cy="8" r="3.5" />
      <Path d="M3 20c1-3.3 3.3-5 6-5s5 1.7 6 5" />
      <Path d="M16 8h5M16 12h5" />
    </>
  ),
  bookmark: () => <Path d="M6 4h12v17l-6-4-6 4z" />,
  star: () => <Path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9L6.7 19.6l1.1-6L3.4 9.4l6-.8z" />,
  document: () => (
    <>
      <Path d="M6 4h9l4 4v12H6z" />
      <Path d="M15 4v4h4M9 13h6M9 17h4" />
    </>
  ),
  info: () => (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 8v5M12 16h.01" />
    </>
  ),
  mail: () => (
    <>
      <Rect x="3" y="5" width="18" height="14" rx="2" />
      <Path d="M3 7l9 6 9-6" />
    </>
  ),
  phone: () => (
    <>
      <Rect x="7" y="3" width="10" height="18" rx="2" />
      <Path d="M11 18h2" />
    </>
  ),
  google: () => (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 8v8M8 12h8" />
    </>
  ),
  globe: () => (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M3 12h18M12 3c2.5 2.7 2.5 15 0 18-2.5-3-2.5-15.3 0-18" />
    </>
  ),
  cap: () => (
    <>
      <Path d="M3 7l9-4 9 4-9 4z" />
      <Path d="M7 10v5c0 1.7 2.2 3 5 3s5-1.3 5-3v-5" />
    </>
  ),
  sheikh: () => (
    <>
      <Path d="M6 4h9l4 4v12H6z" />
      <Path d="M15 4v4h4M9 13h6" />
    </>
  ),
  tajweed: () => (
    <>
      <Path d="M12 6v13M5 9c0-2 3-3 7-3s7 1 7 3" />
      <Path d="M5 9v9c0 2 3 3 7 3s7-1 7-3V9" />
    </>
  ),
  plus: () => <Path d="M12 5v14M5 12h14" />,
  edit: () => <Path d="M5 19h14M8 16l10-10 2 2-10 10h-2z" />,
  trash: () => <Path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" />,
  more: () => (
    <>
      <Circle cx="12" cy="5" r="1.7" />
      <Circle cx="12" cy="12" r="1.7" />
      <Circle cx="12" cy="19" r="1.7" />
    </>
  ),
  mic: () => (
    <>
      <Rect x="9" y="3" width="6" height="11" rx="3" />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  micOff: () => (
    <>
      <Rect x="9" y="3" width="6" height="11" rx="3" />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16" />
    </>
  ),
  camera: () => (
    <>
      <Rect x="3" y="6" width="12" height="12" rx="2" />
      <Path d="M15 10l6-3v10l-6-3z" />
    </>
  ),
  cameraOff: () => (
    <>
      <Rect x="3" y="6" width="12" height="12" rx="2" />
      <Path d="M15 10l6-3v10l-6-3zM3 3l18 18" />
    </>
  ),
  phoneHangup: () => <Path d="M3 10c6-4 12-4 18 0v4l-4 .5-1-3c-2.7-1-5.3-1-8 0l-1 3L3 14z" />,
  chart: () => <Path d="M4 18l5-5 4 4 3-3 4 4" />,
  home: () => <Path d="M4 11l8-7 8 7v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />,
  card: () => (
    <>
      <Rect x="3" y="5" width="18" height="14" rx="2" />
      <Path d="M3 10h18M9 15l6 0" />
    </>
  ),
  qr: () => (
    <>
      <Rect x="3" y="3" width="7" height="7" />
      <Rect x="14" y="3" width="7" height="7" />
      <Rect x="3" y="14" width="7" height="7" />
      <Path d="M14 14h3v3M21 14v.01M14 21h7v-4" />
    </>
  ),
  download: () => <Path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  link: () => (
    <>
      <Path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <Path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  check: () => <Path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: () => <Path d="M6 6l12 12M18 6L6 18" />,
  clock: () => (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  flag: () => <Path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  logout: () => <Path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  help: () => (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" />
    </>
  ),
  language: () => (
    <Path d="M4 6h9M8.5 4v2M6 6c0 4 3 7 6 8M11 6c0 4-3 7-6 8M13 20l4-9 4 9M14.5 17h5" />
  ),
  upload: () => <Path d="M12 16V5M7 10l5-5 5 5M5 20h14" />,
  eye: () => (
    <>
      <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <Circle cx="12" cy="12" r="3" />
    </>
  ),
  refresh: () => <Path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4" />,
  wifiOff: () => (
    <Path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M19 13a10 10 0 0 0-2.3-1.7M12 20h.01" />
  ),
} satisfies Record<string, () => ReactNode>;

export type IconName = keyof typeof ICONS;

/** Icons whose direction must mirror in LTR (the designs are drawn for RTL). */
const DIRECTIONAL: ReadonlySet<IconName> = new Set(['back', 'forward']);

export interface IconProps {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
  /** Fill instead of stroke (stars, badges). */
  fill?: string;
  label?: string;
}

export function Icon({ name, size = 22, color, strokeWidth = 1.8, fill, label }: IconProps) {
  const mirror = DIRECTIONAL.has(name) && !isRTLLayout();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ?? 'none'}
      stroke={fill ? 'none' : color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={mirror ? { transform: [{ scaleX: -1 }] } : undefined}
      {...labelledSvg(label)}
    >
      {ICONS[name]()}
    </Svg>
  );
}

/** Filled shield with a white tick: the "verified sanad" badge. */
export function VerifiedBadge({
  size = 15,
  color,
  label,
}: {
  size?: number;
  color: string;
  label?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...labelledSvg(label)}>
      <Path d="M12 2l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V5l7-3z" fill={color} />
      <Path d="M8.6 11.8l2.3 2.3 4.4-4.6" fill="none" stroke="#fff" strokeWidth={1.8} />
    </Svg>
  );
}

/** Filled circle with a tick, used on selected option cards. */
export function CheckCircle({ size = 18, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...hiddenSvg}>
      <Circle cx="12" cy="12" r="10" fill={color} />
      <Path d="M8 12.5l2.5 2.5 5.5-5.5" fill="none" stroke="#fff" strokeWidth={2} />
    </Svg>
  );
}
