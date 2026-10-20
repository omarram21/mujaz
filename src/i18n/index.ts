import i18n from 'i18next';
/* eslint-disable import/no-named-as-default-member -- i18next's default instance API */
import { initReactI18next, useTranslation } from 'react-i18next';
import { DevSettings, I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import ar from './ar.json';
import en from './en.json';
import type { AppLocale } from '@/lib/formatNumber';

const STORAGE_KEY = 'mujaz.locale';
export const DEFAULT_LOCALE: AppLocale = 'ar';

export const resources = { ar: { translation: ar }, en: { translation: en } } as const;

export function isRTL(locale: AppLocale): boolean {
  return locale === 'ar';
}

let initialised = false;

export async function initI18n(): Promise<AppLocale> {
  let locale: AppLocale = DEFAULT_LOCALE;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') locale = stored;
  } catch {
    // storage unavailable: fall back to Arabic
  }
  if (!initialised) {
    await i18n.use(initReactI18next).init({
      resources,
      lng: locale,
      fallbackLng: 'ar',
      interpolation: { escapeValue: false },
      returnNull: false,
    });
    initialised = true;
  }
  applyDirection(locale);
  return locale;
}

/**
 * Native layout direction is fixed at app start, so a mismatch needs a reload.
 * Returns true when a reload was triggered.
 */
export function applyDirection(locale: AppLocale): boolean {
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL(locale) ? 'rtl' : 'ltr';
      document.documentElement.lang = locale;
    }
    return false;
  }
  const wantRTL = isRTL(locale);
  if (I18nManager.isRTL === wantRTL) return false;
  I18nManager.allowRTL(wantRTL);
  I18nManager.forceRTL(wantRTL);
  void reloadApp();
  return true;
}

async function reloadApp(): Promise<void> {
  if (__DEV__) {
    DevSettings.reload();
    return;
  }
  try {
    await Updates.reloadAsync();
  } catch {
    // expo-updates disabled: the new direction applies on next cold start
  }
}

export async function changeLocale(locale: AppLocale): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // non-fatal
  }
  await i18n.changeLanguage(locale);
  applyDirection(locale);
}

/** Current UI locale narrowed to the app's supported set. */
export function useLocale(): AppLocale {
  const { i18n: inst } = useTranslation();
  return inst.language === 'en' ? 'en' : 'ar';
}

export { i18n, useTranslation };
