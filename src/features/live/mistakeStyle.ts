import type { MistakeType } from './api';

/** Colour per mistake type; the four hues also differ in lightness. */
export const MISTAKE_COLORS: Record<MistakeType, string> = {
  tajweed: '#C9A227',
  hifz: '#E5484D',
  harakah: '#4A90C2',
  waqf: '#9B7BD4',
};
