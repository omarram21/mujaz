import { useState } from 'react';
import { Alert, Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Avatar, Card, DarkHeader, ListRow, Screen, Text, Toggle } from '@/components';
import { useTheme } from '@/theme';
import { changeLocale, useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { cityOfZone, countryName } from '@/lib/countries';
import { utcOffsetLabel } from '@/lib/dates';
import { signOut, updateProfile } from '@/features/auth/api';
import { useRequiredProfile } from '@/features/auth/store';
import { useMyIjazahs } from '@/features/ijazah/api';
import { syncSessionReminders } from '@/services/notifications';
import { deleteMyAccount } from './api';

// TODO(support): replace with the real support address.
const SUPPORT_EMAIL = 'support@mujaz.app';

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text size={12} weight="600" color="textMuted" accessibilityRole="header">
        {title}
      </Text>
      <Card padding={0} radius={16} style={{ overflow: 'hidden' }}>
        {children}
      </Card>
    </View>
  );
}

export function AccountScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const profile = useRequiredProfile();
  const isTeacher = profile.role === 'teacher';
  const ijazahs = useMyIjazahs();
  const [deleting, setDeleting] = useState(false);

  const setPref = async (patch: Parameters<typeof updateProfile>[0]) => {
    try {
      await updateProfile(patch);
      if ('reminders_enabled' in patch) void syncSessionReminders();
    } catch {
      Alert.alert(t('common.errorTitle'), t('auth.errors.generic'));
    }
  };

  const switchLanguage = () => {
    const next = locale === 'ar' ? 'en' : 'ar';
    Alert.alert(t('account.languageTitle'), t('account.languageBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: next === 'ar' ? 'العربية' : 'English',
        onPress: async () => {
          await setPref({ locale: next });
          await changeLocale(next);
        },
      },
    ]);
  };

  const becomeTeacher = () =>
    Alert.alert(t('account.applyTitle'), t('account.applyBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('account.applyConfirm'),
        onPress: async () => {
          await setPref({ role: 'teacher' });
          router.replace('/apply');
        },
      },
    ]);

  const confirmDelete = () =>
    Alert.alert(t('account.deleteTitle'), t('account.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('account.deleteConfirm'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteMyAccount();
          } catch {
            setDeleting(false);
            Alert.alert(t('common.errorTitle'), t('account.deleteFailed'));
          }
        },
      },
    ]);

  const ijazahCount = ijazahs.data?.length ?? 0;
  const place = [
    countryName(profile.country, locale),
    `${cityOfZone(profile.timezone, locale)} (${utcOffsetLabel(profile.timezone)})`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen
      header={
        <DarkHeader>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar
              id={profile.id}
              name={profile.full_name}
              size={60}
              radius={18}
              colors={[colors.cream, colors.ground]}
            />
            <View style={{ flex: 1 }}>
              <Text size={17} weight="600" color="creamBright">
                {profile.full_name}
              </Text>
              <Text size={12} color="onDarkMuted" style={{ marginTop: 2 }}>
                {place}
              </Text>
            </View>
          </View>
        </DarkHeader>
      }
      contentStyle={{ gap: 18 }}
    >
      {isTeacher ? (
        <Group title={t('account.teaching')}>
          <ListRow
            icon="clock"
            label={t('account.availability')}
            onPress={() => router.push('/availability')}
          />
          <ListRow
            icon="document"
            label={t('account.mySanad')}
            onPress={() => router.push('/apply')}
          />
          <ListRow
            icon="shieldCheck"
            label={t('account.verify')}
            onPress={() => router.push('/verify')}
            last
          />
        </Group>
      ) : (
        <Group title={t('account.learning')}>
          <ListRow
            icon="award"
            label={t('account.myIjazahs')}
            value={ijazahs.data ? formatNumber(ijazahCount, locale) : undefined}
            onPress={() => router.push('/my-ijazahs')}
          />
          <ListRow
            icon="book"
            label={t('account.khatmah')}
            onPress={() => router.navigate('/progress')}
          />
          <ListRow
            icon="shieldCheck"
            label={t('account.verify')}
            onPress={() => router.push('/verify')}
            last
          />
        </Group>
      )}

      <Group title={t('account.preferences')}>
        <ListRow
          icon="language"
          label={t('account.language')}
          value={locale === 'ar' ? 'العربية' : 'English'}
          onPress={switchLanguage}
        />
        <ListRow
          icon="bell"
          label={t('account.reminders')}
          trailing={
            <Toggle
              label={t('account.reminders')}
              value={profile.reminders_enabled}
              onValueChange={(v) => void setPref({ reminders_enabled: v })}
            />
          }
          last={isTeacher}
        />
        {!isTeacher ? (
          <ListRow
            icon="users"
            label={t('account.femaleOnly')}
            trailing={
              <Toggle
                label={t('account.femaleOnly')}
                value={profile.female_teachers_only}
                onValueChange={(v) => void setPref({ female_teachers_only: v })}
              />
            }
            last
          />
        ) : null}
      </Group>

      <Group title={t('account.account')}>
        {!isTeacher ? (
          <ListRow icon="cap" label={t('account.applyAsSheikh')} onPress={becomeTeacher} />
        ) : null}
        <ListRow
          icon="help"
          label={t('account.help')}
          onPress={() =>
            void Linking.openURL(
              `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('account.helpSubject'))}`,
            )
          }
        />
        <ListRow icon="logout" label={t('account.logout')} onPress={() => void signOut()} last />
      </Group>

      <Pressable
        onPress={confirmDelete}
        disabled={deleting}
        accessibilityRole="button"
        accessibilityLabel={t('account.delete')}
        style={({ pressed }) => ({
          height: 50,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: '#E8C6C7',
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed || deleting ? 0.7 : 1,
        })}
      >
        <Text size={14} weight="600" color="danger">
          {deleting ? t('common.loading') : t('account.delete')}
        </Text>
      </Pressable>
      <Text size={11} color="textMuted" align="center" relaxed>
        {t('account.deleteNote')}
      </Text>
    </Screen>
  );
}
