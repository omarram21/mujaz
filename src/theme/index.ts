import { createContext, useContext } from 'react';
import { light, dark, type ColorTokens } from './colors';

export * from './colors';
export * from './typography';
export * from './metrics';

export type ThemeMode = 'light' | 'dark';
export interface Theme {
  mode: ThemeMode;
  colors: ColorTokens;
}

export const themes: Record<ThemeMode, Theme> = {
  light: { mode: 'light', colors: light },
  dark: { mode: 'dark', colors: dark },
};

export const ThemeContext = createContext<Theme>(themes.light);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
