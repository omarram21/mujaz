import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState, Icon, LightHeader, QueryView, Screen, Tag, Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatHijri } from '@/lib/dates';
import { riwayahName, useRiwayat } from '@/features/riwayat/api';
import { useMyIjazahs } from './api';

export function MyIjazahsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const riwayat = useRiwayat();
  const query = useMyIjazahs();
  return (
    <Screen statusBar="dark" header={<LightHeader title={t('account.myIjazahs')} />}>
      <QueryView
        query={query}
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState
            icon="award"
            title={t('myIjazahs.emptyTitle')}
            body={t('myIjazahs.emptyBody')}
          />
        }
      >
        {(list) =>
          list.map((i) => (
            <Pressable
              key={i.id}
              onPress={() => router.push({ pathname: '/ijazah/[id]', params: { id: i.id } })}
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 14,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  backgroundColor: colors.ground,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="award" size={22} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text size={14} weight="600">
                  {riwayahName(riwayat.data, i.riwayah, locale)}
                </Text>
                <Text size={12} color="textMuted">
                  {`${i.teacher_name} · ${formatHijri(i.issued_at, locale)}`}
                </Text>
              </View>
              {i.revoked_at ? (
                <Tag label={t('myIjazahs.revoked')} tone="danger" />
              ) : (
                <Icon name="forward" size={16} color={colors.textNav} />
              )}
            </Pressable>
          ))
        }
      </QueryView>
    </Screen>
  );
}
