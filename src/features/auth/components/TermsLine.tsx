import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components';

// TODO(legal): replace with the published terms / privacy URLs.
const TERMS_URL = 'https://mujaz.app/terms';
const PRIVACY_URL = 'https://mujaz.app/privacy';

export function TermsLine() {
  const { t } = useTranslation();
  return (
    <Text size={11.5} color="textMuted" align="center" relaxed>
      {t('auth.termsPrefix')}{' '}
      <Text
        size={11.5}
        weight="600"
        color="ground"
        accessibilityRole="link"
        onPress={() => void Linking.openURL(TERMS_URL)}
      >
        {t('auth.terms')}
      </Text>
      {t('auth.and')}
      <Text
        size={11.5}
        weight="600"
        color="ground"
        accessibilityRole="link"
        onPress={() => void Linking.openURL(PRIVACY_URL)}
      >
        {t('auth.privacy')}
      </Text>
    </Text>
  );
}
