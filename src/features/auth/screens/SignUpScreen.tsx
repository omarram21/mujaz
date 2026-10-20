import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Input, Notice, Screen, Text } from '@/components';
import { useLocale } from '@/i18n';
import { signUpWithEmail } from '../api';
import { authErrorKey, signUpSchema, type SignUpValues } from '../schema';
import { RoleCard } from '../components/RoleCard';
import { AltSignIn } from '../components/AltSignIn';
import { TermsLine } from '../components/TermsLine';

export function SignUpScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const params = useLocalSearchParams<{ role?: string }>();
  const [formError, setFormError] = useState<string>();
  const [info, setInfo] = useState<string>();

  const { control, handleSubmit, setValue, formState } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: params.role === 'teacher' ? 'teacher' : 'student',
      fullName: '',
      email: '',
      password: '',
    },
  });
  const role = useWatch({ control, name: 'role' });
  const fullName = useWatch({ control, name: 'fullName' });

  const onSubmit = handleSubmit(async (v) => {
    setFormError(undefined);
    setInfo(undefined);
    try {
      const res = await signUpWithEmail({ ...v, locale });
      // With email confirmation on, there's no session until the link is clicked.
      if (!res.session) setInfo(t('auth.errors.checkEmail'));
      // Otherwise the auth listener updates the store and the route guards redirect.
    } catch (e) {
      setFormError(t(authErrorKey(e)));
    }
  });

  return (
    <Screen
      contentStyle={{ paddingHorizontal: 24, gap: 20 }}
      footer={
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 26 }}>
          <TermsLine />
        </View>
      }
    >
      <View style={{ flexDirection: 'row' }}>
        <IconButton
          icon="back"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
        />
      </View>
      <View>
        <Text family="display" weight="700" size={32} color="ground" accessibilityRole="header">
          {t('auth.signUpTitle')}
        </Text>
        <Text size={13} color="textMuted" relaxed style={{ marginTop: 4 }}>
          {t('auth.signUpSubtitle')}
        </Text>
      </View>

      <View accessibilityRole="radiogroup">
        <Text size={13} weight="600" style={{ marginBottom: 9 }}>
          {t('auth.registerAs')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <RoleCard
            icon="cap"
            title={t('auth.roleStudent')}
            hint={t('auth.roleStudentHint')}
            selected={role === 'student'}
            onPress={() => setValue('role', 'student')}
          />
          <RoleCard
            icon="sheikh"
            title={t('auth.roleTeacher')}
            hint={t('auth.roleTeacherHint')}
            selected={role === 'teacher'}
            onPress={() => setValue('role', 'teacher')}
          />
        </View>
      </View>

      <View style={{ gap: 13 }}>
        <Controller
          control={control}
          name="fullName"
          render={({ field, fieldState }) => (
            <Input
              label={t('auth.fullName')}
              placeholder={t('auth.fullNamePlaceholder')}
              autoComplete="name"
              textContentType="name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              label={t('auth.email')}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              ltr
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Input
              label={t('auth.password')}
              placeholder={t('auth.passwordPlaceholder')}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
            />
          )}
        />
      </View>

      {formError ? <Notice tone="danger" text={formError} /> : null}
      {info ? <Notice tone="success" icon="mail" text={info} /> : null}

      <Button label={t('auth.continue')} onPress={onSubmit} loading={formState.isSubmitting} />

      <AltSignIn role={role} fullName={fullName} />

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
        <Text size={13} color="textMuted">
          {t('auth.haveAccount')}
        </Text>
        <Pressable onPress={() => router.replace('/sign-in')} accessibilityRole="link" hitSlop={12}>
          <Text size={13} weight="600" color="ground">
            {t('auth.signInTitle')}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
