import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LightHeader, Screen, Text } from '@/components';
import { useLocale } from '@/i18n';
import { formatDate } from '@/lib/dates';
import { LEGAL_UPDATED, legalText, type LegalDoc } from './content';

export function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const locale = useLocale();
  const text = legalText(doc === 'privacy' ? 'privacy' : ('terms' satisfies LegalDoc), locale);
  const updated = formatDate(`${LEGAL_UPDATED}T12:00:00Z`, 'UTC', locale, {
    weekday: false,
    year: true,
  });
  return (
    <Screen header={<LightHeader title={text.title} />}>
      <Text size={12} color="textMuted">
        {`${text.updated}: ${updated}`}
      </Text>
      <Text size={14} relaxed>
        {text.intro}
      </Text>
      {text.sections.map((s) => (
        <View key={s.heading} style={{ gap: 6 }}>
          <Text size={15} weight="700" accessibilityRole="header">
            {s.heading}
          </Text>
          {s.paragraphs.map((p) => (
            <Text key={p} size={13.5} color="textMuted" relaxed>
              {p}
            </Text>
          ))}
        </View>
      ))}
    </Screen>
  );
}
