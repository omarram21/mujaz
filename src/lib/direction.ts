import { I18nManager, Platform } from 'react-native';
import i18n from 'i18next';

/**
 * Whether the current layout is right-to-left. Native apps use the I18nManager flag
 * (fixed at launch); on web the document direction follows the i18n language.
 */
export function isRTLLayout(): boolean {
  return Platform.OS === 'web' ? i18n.language !== 'en' : I18nManager.isRTL;
}
