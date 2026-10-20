import { Platform } from 'react-native';

/** Props that hide a decorative SVG from screen readers on each platform. */
export const hiddenSvg =
  Platform.OS === 'web'
    ? ({ 'aria-hidden': true } as const)
    : ({
        importantForAccessibility: 'no-hide-descendants',
        accessibilityElementsHidden: true,
      } as const);

/** Props that expose an SVG as a labelled image. */
export function labelledSvg(label: string | undefined) {
  if (!label) return hiddenSvg;
  return Platform.OS === 'web'
    ? ({ role: 'img', 'aria-label': label } as const)
    : ({ accessible: true, accessibilityLabel: label, accessibilityRole: 'image' } as const);
}
