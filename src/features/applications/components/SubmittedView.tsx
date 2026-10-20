import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, Notice, Text } from '@/components';
import { useTheme } from '@/theme';

export function SubmittedView() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 22,
          backgroundColor: colors.successSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="shieldCheck" size={34} color={colors.success} />
      </View>
      <Text size={18} weight="600" align="center" accessibilityRole="header">
        {t('apply.submittedTitle')}
      </Text>
      <Text size={13} color="textMuted" align="center" relaxed style={{ maxWidth: 300 }}>
        {t('apply.submittedBody')}
      </Text>
      <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
        <Notice text={t('apply.reviewNotice')} />
      </View>
    </View>
  );
}
