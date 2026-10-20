import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Input, Notice, Screen, Text } from '@/components';
import { signInWithEmail } from '../api';
import { authErrorKey, signInSchema, type SignInValues } from '../schema';
import { AltSignIn } from '../components/AltSignIn';
import { TermsLine } from '../components/TermsLine';

export function SignInScreen() {
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string>();
  const { control, handleSubmit, formState } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (v) => {
    setFormError(undefined);
    try {
      await signInWithEmail(v.email, v.password);
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
          {t('auth.signInTitle')}
        </Text>
        <Text size={13} color="textMuted" relaxed style={{ marginTop: 4 }}>
          {t('auth.signInSubtitle')}
        </Text>
      </View>
      <View style={{ gap: 13 }}>
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
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={onSubmit}
              error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
            />
          )}
        />
      </View>
      {formError ? <Notice tone="danger" text={formError} /> : null}
      <Button label={t('auth.continue')} onPress={onSubmit} loading={formState.isSubmitting} />
      <AltSignIn />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
        <Text size={13} color="textMuted">
          {t('auth.noAccount')}
        </Text>
        <Pressable onPress={() => router.replace('/sign-up')} accessibilityRole="link" hitSlop={12}>
          <Text size={13} weight="600" color="ground">
            {t('auth.createAccount')}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
