import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components';

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
        onPress={() => router.push('/legal/terms')}
      >
        {t('auth.terms')}
      </Text>
      {t('auth.and')}
      <Text
        size={11.5}
        weight="600"
        color="ground"
        accessibilityRole="link"
        onPress={() => router.push('/legal/privacy')}
      >
        {t('auth.privacy')}
      </Text>
    </Text>
  );
}
