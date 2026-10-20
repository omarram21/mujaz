import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BottomBar,
  Button,
  Chip,
  Icon,
  LightHeader,
  Notice,
  OptionCard,
  Screen,
  Segmented,
  StepProgress,
  Text,
} from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { cityOfZone, countryName, zoneForCountry } from '@/lib/countries';
import { deviceTimeZone, utcOffsetLabel } from '@/lib/dates';
import { CountryPicker } from '@/features/profile/CountryPicker';
import { useRiwayat } from '@/features/riwayat/api';
import { signOut, updateProfile } from '../api';
import { useRequiredProfile } from '../store';
import { authErrorKey } from '../schema';

const schema = z.object({
  gender: z.enum(['male', 'female'], { message: 'setup.errors.gender' }),
  country: z.string({ message: 'setup.errors.country' }).length(2, 'setup.errors.country'),
  timezone: z.string().min(1),
  goal: z.enum(['ijazah', 'memorization', 'tajweed'], { message: 'setup.errors.goal' }),
  riwayat: z.array(z.string()),
});
type Values = z.infer<typeof schema>;

export function ProfileSetupScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const profile = useRequiredProfile();
  const riwayat = useRiwayat();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formError, setFormError] = useState<string>();

  const { control, handleSubmit, setValue, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: profile.gender ?? undefined,
      country: profile.country ?? undefined,
      timezone: profile.timezone !== 'UTC' ? profile.timezone : deviceTimeZone(),
      goal: profile.goal ?? 'ijazah',
      riwayat: profile.preferred_riwayat.length ? profile.preferred_riwayat : ['hafs'],
    },
  });
  const country = useWatch({ control, name: 'country' });
  const timezone = useWatch({ control, name: 'timezone' });

  const onSubmit = handleSubmit(async (v) => {
    setFormError(undefined);
    try {
      await updateProfile({
        gender: v.gender,
        country: v.country,
        timezone: v.timezone,
        goal: v.goal,
        preferred_riwayat: v.riwayat,
        female_teachers_only: v.gender === 'female',
        locale,
        onboarded: true,
      });
      // Route guards move the user to the student tabs once `onboarded` is true.
    } catch (e) {
      setFormError(t(authErrorKey(e)));
    }
  });

  const err = (k?: string) => (k ? t(k) : undefined);

  return (
    <Screen
      header={
        <LightHeader
          title={t('setup.title')}
          subtitle={t('common.stepOf', {
            step: formatNumber(2, locale),
            total: formatNumber(3, locale),
          })}
          back={() => void signOut()}
        >
          <StepProgress step={2} total={3} />
        </LightHeader>
      }
      statusBar="dark"
      contentStyle={{ gap: 18, paddingTop: 18 }}
      footer={
        <BottomBar>
          <Button label={t('setup.submit')} onPress={onSubmit} loading={formState.isSubmitting} />
        </BottomBar>
      }
    >
      <View>
        <Text size={13} weight="600" style={{ marginBottom: 9 }}>
          {t('setup.gender')}{' '}
          <Text size={13} color="textMuted">
            {t('setup.genderHint')}
          </Text>
        </Text>
        <Controller
          control={control}
          name="gender"
          render={({ field, fieldState }) => (
            <>
              <Segmented
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'male', label: t('setup.male') },
                  { value: 'female', label: t('setup.female') },
                ]}
              />
              {fieldState.error ? (
                <Text size={11.5} color="danger" style={{ marginTop: 5 }}>
                  {err(fieldState.error.message)}
                </Text>
              ) : null}
            </>
          )}
        />
        <Text size={11} color="textMuted" relaxed style={{ marginTop: 9 }}>
          {t('setup.femaleNote')}
        </Text>
      </View>

      <View>
        <Text size={13} weight="600" style={{ marginBottom: 9 }}>
          {t('setup.countryTz')}
        </Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('setup.countryTz')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            height: 50,
            borderRadius: 13,
            borderWidth: 1,
            borderColor: formState.errors.country ? colors.danger : colors.borderStrong,
            backgroundColor: colors.surface,
            paddingHorizontal: 14,
          }}
        >
          <Icon name="globe" size={18} color={colors.textMuted} />
          <Text
            size={14}
            color={country ? 'text' : 'textDisabled'}
            style={{ flex: 1 }}
            numberOfLines={1}
          >
            {country
              ? `${countryName(country, locale)} · ${cityOfZone(timezone, locale)} (${utcOffsetLabel(timezone)})`
              : t('setup.chooseCountry')}
          </Text>
          <Icon name="chevronDown" size={16} color={colors.textMuted} strokeWidth={2} />
        </Pressable>
        {formState.errors.country ? (
          <Text size={11.5} color="danger" style={{ marginTop: 5 }}>
            {err(formState.errors.country.message)}
          </Text>
        ) : null}
      </View>

      <View>
        <Text size={13} weight="600" style={{ marginBottom: 9 }}>
          {t('setup.goal')}
        </Text>
        <Controller
          control={control}
          name="goal"
          render={({ field }) => (
            <View style={{ gap: 9 }} accessibilityRole="radiogroup">
              <OptionCard
                icon="award"
                title={t('setup.goalIjazah')}
                subtitle={t('setup.goalIjazahHint')}
                selected={field.value === 'ijazah'}
                onPress={() => field.onChange('ijazah')}
              />
              <OptionCard
                icon="bookOpen"
                title={t('setup.goalMemorization')}
                subtitle={t('setup.goalMemorizationHint')}
                selected={field.value === 'memorization'}
                onPress={() => field.onChange('memorization')}
              />
              <OptionCard
                icon="tajweed"
                title={t('setup.goalTajweed')}
                subtitle={t('setup.goalTajweedHint')}
                selected={field.value === 'tajweed'}
                onPress={() => field.onChange('tajweed')}
              />
            </View>
          )}
        />
      </View>

      <View>
        <Text size={13} weight="600" style={{ marginBottom: 9 }}>
          {t('setup.riwayah')}
        </Text>
        <Controller
          control={control}
          name="riwayat"
          render={({ field }) => (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(riwayat.data ?? []).map((r) => {
                const sel = field.value.includes(r.code);
                return (
                  <Chip
                    key={r.code}
                    label={locale === 'ar' ? r.name_ar : r.name_en}
                    selected={sel}
                    onPress={() =>
                      field.onChange(
                        sel ? field.value.filter((c) => c !== r.code) : [...field.value, r.code],
                      )
                    }
                  />
                );
              })}
            </View>
          )}
        />
      </View>

      {formError ? <Notice tone="danger" text={formError} /> : null}

      <CountryPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selected={country}
        onSelect={(c) => {
          setValue('country', c.code, { shouldValidate: true });
          setValue('timezone', zoneForCountry(c, deviceTimeZone()));
        }}
      />
    </Screen>
  );
}
