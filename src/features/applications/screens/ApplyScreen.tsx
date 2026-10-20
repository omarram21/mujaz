import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as DocumentPicker from 'expo-document-picker';
import {
  BottomBar,
  Button,
  Chip,
  ErrorState,
  Icon,
  Input,
  LightHeader,
  LoadingState,
  Notice,
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
import { updateProfile } from '@/features/auth/api';
import { useRequiredProfile } from '@/features/auth/store';
import {
  ALLOWED_MIME,
  useDeleteDocument,
  useDocuments,
  useDraft,
  useSubmitApplication,
  useUpdateDraft,
  useUploadDocument,
  type Application,
} from '../api';
import { applyErrorKey, applySchema, STEP_FIELDS, type ApplyValues } from '../schema';
import { DocumentRow } from '../components/DocumentRow';
import { SubmittedView } from '../components/SubmittedView';

type Step = 1 | 2 | 3 | 4;

export function ApplyScreen() {
  const draft = useDraft();
  if (draft.isPending) return <LoadingState />;
  if (draft.isError) return <ErrorState onRetry={() => void draft.refetch()} />;
  return <ApplyForm draft={draft.data} />;
}

function ApplyForm({ draft }: { draft: Application }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const profile = useRequiredProfile();
  const riwayat = useRiwayat();
  const docs = useDocuments(draft.id);
  const upload = useUploadDocument(draft.id);
  const remove = useDeleteDocument(draft.id);
  const update = useUpdateDraft();
  const submit = useSubmitApplication();
  const [step, setStep] = useState<Step>(draft.status === 'pending' ? 4 : 1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formError, setFormError] = useState<string>();

  const { control, trigger, getValues, setValue, formState } = useForm<ApplyValues>({
    resolver: zodResolver(applySchema),
    mode: 'onTouched',
    defaultValues: {
      gender: draft.gender ?? profile.gender ?? undefined,
      country: draft.country ?? profile.country ?? undefined,
      timezone: profile.timezone !== 'UTC' ? profile.timezone : deviceTimeZone(),
      teaches: draft.teaches,
      years: draft.years_experience != null ? String(draft.years_experience) : '',
      headline: draft.headline ?? '',
      bio: draft.bio ?? '',
      price30: draft.price_30 != null ? String(draft.price_30) : '',
      price60: draft.price_60 != null ? String(draft.price_60) : '',
      riwayat: draft.riwayat,
      grantingSheikh: draft.granting_sheikh ?? '',
      sanad: draft.sanad_text ?? '',
    },
  });
  const country = useWatch({ control, name: 'country' });
  const timezone = useWatch({ control, name: 'timezone' });

  const toPatch = (v: ApplyValues) => ({
    gender: v.gender,
    country: v.country,
    teaches: v.teaches,
    years_experience: v.years ? Number(v.years) : null,
    headline: v.headline || null,
    bio: v.bio || null,
    price_30: v.price30 ? Number(v.price30) : null,
    price_60: v.price60 ? Number(v.price60) : null,
    riwayat: v.riwayat,
    granting_sheikh: v.grantingSheikh || null,
    sanad_text: v.sanad || null,
  });

  const saveStep = async (s: 1 | 2 | 3) => {
    const ok = await trigger(STEP_FIELDS[s]);
    if (!ok) return false;
    const v = getValues();
    await update.mutateAsync({ id: draft.id, patch: toPatch(v) });
    if (s === 1)
      await updateProfile({ gender: v.gender, country: v.country, timezone: v.timezone });
    return true;
  };

  const next = async () => {
    if (step === 4) return;
    setFormError(undefined);
    try {
      if (!(await saveStep(step))) return;
      if (step < 3) return setStep((step + 1) as Step);
      if (!docs.data?.length) return setFormError(t('apply.errors.documents'));
      await submit.mutateAsync(draft.id);
      setStep(4);
    } catch (e) {
      setFormError(t(applyErrorKey(e)));
    }
  };

  const back = () => {
    setFormError(undefined);
    if (step === 1 || step === 4) router.back();
    else setStep((step - 1) as Step);
  };

  const pickDocument = async () => {
    setFormError(undefined);
    const res = await DocumentPicker.getDocumentAsync({
      type: ALLOWED_MIME,
      copyToCacheDirectory: true,
    });
    const asset = res.canceled ? undefined : res.assets[0];
    if (!asset) return;
    try {
      await upload.mutateAsync({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        size: asset.size ?? 0,
      });
    } catch (e) {
      setFormError(t(applyErrorKey(e)));
    }
  };

  const titles: Record<Step, string> = {
    1: t('apply.step1Title'),
    2: t('apply.step2Title'),
    3: t('apply.step3Title'),
    4: t('apply.step4Title'),
  };
  const fieldError = (k?: string) => (k ? t(k) : undefined);

  return (
    <Screen
      statusBar="dark"
      header={
        <LightHeader
          title={titles[step]}
          subtitle={`${t('common.stepOf', { step: formatNumber(step, locale), total: formatNumber(4, locale) })} · ${t('apply.title')}`}
          back={back}
        >
          <StepProgress step={step} total={4} />
        </LightHeader>
      }
      contentStyle={{ gap: 16 }}
      footer={
        step === 4 ? (
          <BottomBar>
            <Button label={t('apply.backHome')} onPress={() => router.replace('/dashboard')} />
          </BottomBar>
        ) : (
          <BottomBar style={{ flexDirection: 'row' }}>
            {step > 1 ? (
              <Button
                label={t('apply.previous')}
                variant="secondary"
                style={{ width: 100 }}
                height={52}
                onPress={back}
              />
            ) : null}
            <Button
              label={step === 3 ? t('apply.submit') : t('apply.next')}
              style={{ flex: 1 }}
              loading={update.isPending || submit.isPending}
              onPress={next}
            />
          </BottomBar>
        )
      }
    >
      {step === 1 ? (
        <>
          <View>
            <Text size={13} weight="600" style={{ marginBottom: 9 }}>
              {t('setup.gender')}
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
                      {fieldError(fieldState.error.message)}
                    </Text>
                  ) : null}
                </>
              )}
            />
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
                {fieldError(formState.errors.country.message)}
              </Text>
            ) : null}
          </View>
          <View>
            <Text size={13} weight="600" style={{ marginBottom: 9 }}>
              {t('apply.teaches')}
            </Text>
            <Controller
              control={control}
              name="teaches"
              render={({ field }) => (
                <Segmented
                  value={field.value}
                  onChange={field.onChange}
                  height={46}
                  options={[
                    { value: 'male', label: t('apply.teachesMale') },
                    { value: 'female', label: t('apply.teachesFemale') },
                    { value: 'both', label: t('apply.teachesBoth') },
                  ]}
                />
              )}
            />
          </View>
          <Controller
            control={control}
            name="years"
            render={({ field, fieldState }) => (
              <Input
                label={t('apply.years')}
                keyboardType="number-pad"
                maxLength={2}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(fieldState.error?.message)}
              />
            )}
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Controller
            control={control}
            name="headline"
            render={({ field, fieldState }) => (
              <Input
                label={t('apply.headline')}
                placeholder={t('apply.headlinePlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(fieldState.error?.message)}
              />
            )}
          />
          <Controller
            control={control}
            name="bio"
            render={({ field, fieldState }) => (
              <Input
                label={t('apply.bio')}
                multiline
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(fieldState.error?.message)}
              />
            )}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="price30"
                render={({ field, fieldState }) => (
                  <Input
                    label={t('apply.price30')}
                    keyboardType="decimal-pad"
                    ltr
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldError(fieldState.error?.message)}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="price60"
                render={({ field, fieldState }) => (
                  <Input
                    label={t('apply.price60')}
                    keyboardType="decimal-pad"
                    ltr
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldError(fieldState.error?.message)}
                  />
                )}
              />
            </View>
          </View>
          <Text size={11} color="textMuted" relaxed>
            {t('apply.priceNote')}
          </Text>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <View>
            <Text size={13} weight="600" style={{ marginBottom: 9 }}>
              {t('apply.riwayat')}
            </Text>
            <Controller
              control={control}
              name="riwayat"
              render={({ field, fieldState }) => (
                <>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {(riwayat.data ?? []).map((r) => {
                      const sel = field.value.includes(r.code);
                      return (
                        <Chip
                          key={r.code}
                          label={locale === 'ar' ? r.name_ar : r.name_en}
                          selected={sel}
                          icon={sel ? 'check' : undefined}
                          onPress={() =>
                            field.onChange(
                              sel
                                ? field.value.filter((c) => c !== r.code)
                                : [...field.value, r.code],
                            )
                          }
                        />
                      );
                    })}
                  </View>
                  {fieldState.error ? (
                    <Text size={11.5} color="danger" style={{ marginTop: 5 }}>
                      {fieldError(fieldState.error.message)}
                    </Text>
                  ) : null}
                </>
              )}
            />
          </View>
          <Controller
            control={control}
            name="grantingSheikh"
            render={({ field, fieldState }) => (
              <Input
                label={t('apply.grantingSheikh')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(fieldState.error?.message)}
              />
            )}
          />
          <View>
            <Controller
              control={control}
              name="sanad"
              render={({ field, fieldState }) => (
                <Input
                  label={t('apply.sanad')}
                  multiline
                  family="display"
                  multilineHeight={130}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldError(fieldState.error?.message)}
                />
              )}
            />
            <Text size={11} color="textMuted" relaxed style={{ marginTop: 7 }}>
              {t('apply.sanadNote')}
            </Text>
          </View>
          <View style={{ gap: 9 }}>
            <Text size={13} weight="600">
              {t('apply.documents')}
            </Text>
            {(docs.data ?? []).map((d) => (
              <DocumentRow
                key={d.id}
                name={d.file_name}
                size={d.size_bytes}
                onDelete={() => remove.mutate(d)}
              />
            ))}
            {upload.isPending ? (
              <DocumentRow name={t('apply.uploading')} size={0} status="uploading" />
            ) : null}
            <Pressable
              onPress={pickDocument}
              disabled={upload.isPending}
              accessibilityRole="button"
              accessibilityLabel={
                docs.data?.length ? t('apply.addAnother') : t('apply.addDocument')
              }
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 48,
                borderRadius: 13,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: '#B9B0A0',
                opacity: pressed || upload.isPending ? 0.6 : 1,
              })}
            >
              <Icon name="upload" size={17} color={colors.ground} strokeWidth={1.9} />
              <Text size={13} weight="500" color="ground">
                {docs.data?.length ? t('apply.addAnother') : t('apply.addDocument')}
              </Text>
            </Pressable>
          </View>
          <Notice text={t('apply.reviewNotice')} />
        </>
      ) : null}

      {step === 4 ? <SubmittedView /> : null}

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
