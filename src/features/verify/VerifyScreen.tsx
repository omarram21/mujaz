import { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  DarkHeader,
  Divider,
  EmptyState,
  Icon,
  IconButton,
  Input,
  LoadingState,
  Logo,
  Notice,
  Screen,
  Text,
} from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { formatHijri } from '@/lib/dates';
import { isValidVerificationCode, normalizeVerificationCode } from '@/lib/verificationCode';
import { verifyIjazah, type VerifiedIjazah } from '@/features/ijazah/api';
import { SUPPORT_EMAIL } from '@/lib/contact';
import { QrScanner } from './QrScanner';

/** Extracts a code from a scanned verification URL or raw text. */
function codeFromScan(data: string): string {
  const m = /MJZ-?[A-Z2-9]{4}-?[A-Z2-9]{4}/i.exec(decodeURIComponent(data));
  return normalizeVerificationCode(m ? m[0] : data);
}

export function VerifyScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const initial = params.code ? normalizeVerificationCode(params.code) : '';
  const [code, setCode] = useState(initial);
  const [scanOpen, setScanOpen] = useState(false);
  const [formatError, setFormatError] = useState<string>();
  // A deep-linked (QR) code is looked up immediately.
  const [submitted, setSubmitted] = useState<string | null>(
    isValidVerificationCode(initial) ? initial : null,
  );
  const lookup = useQuery({
    queryKey: ['verify', submitted],
    enabled: !!submitted,
    queryFn: () => verifyIjazah(submitted!),
  });

  const run = (raw: string) => {
    const c = normalizeVerificationCode(raw);
    setCode(c);
    if (!isValidVerificationCode(c)) {
      setFormatError(t('verify.invalidFormat'));
      setSubmitted(null);
      return;
    }
    setFormatError(undefined);
    setSubmitted(c);
  };

  return (
    <Screen
      header={
        <DarkHeader back={router.canGoBack()} style={{ alignItems: 'center', paddingBottom: 24 }}>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <Logo size={46} />
            <Text size={17} weight="600" color="creamBright" accessibilityRole="header">
              {t('verify.title')}
            </Text>
            <Text size={12} color="onDarkMuted" align="center" relaxed style={{ maxWidth: 270 }}>
              {t('verify.subtitle')}
            </Text>
          </View>
        </DarkHeader>
      }
      contentStyle={{ gap: 16 }}
    >
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Input
            accessibilityLabel={t('verify.codeLabel')}
            placeholder="MJZ-XXXX-XXXX"
            autoCapitalize="characters"
            autoCorrect={false}
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            onSubmitEditing={() => run(code)}
            returnKeyType="search"
            family="display"
            error={formatError}
            style={{
              height: 52,
              textAlign: 'center',
              letterSpacing: 1.5,
              fontSize: 18,
              writingDirection: 'ltr',
            }}
          />
        </View>
        {Platform.OS !== 'web' ? (
          <IconButton
            icon="qr"
            size={52}
            accessibilityLabel={t('verify.scan')}
            onPress={() => setScanOpen(true)}
          />
        ) : null}
      </View>
      <Button
        label={t('verify.check')}
        onPress={() => run(code)}
        loading={lookup.isPending}
        disabled={!code}
      />

      {submitted && lookup.isPending ? <LoadingState /> : null}
      {lookup.isError ? <Notice tone="danger" text={t('common.errorBody')} /> : null}
      {lookup.isSuccess && !lookup.data ? (
        <EmptyState icon="info" title={t('verify.notFoundTitle')} body={t('verify.notFoundBody')} />
      ) : null}
      {lookup.data ? <Result r={lookup.data} /> : null}

      {lookup.data ? (
        <Button
          label={t('verify.report')}
          variant="secondary"
          icon="flag"
          onPress={() =>
            void Linking.openURL(
              `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${t('verify.reportSubject')} ${lookup.data!.verification_code}`)}`,
            )
          }
        />
      ) : null}
      <QrScanner
        visible={scanOpen}
        onClose={() => setScanOpen(false)}
        onScan={(data) => {
          setScanOpen(false);
          run(codeFromScan(data));
        }}
      />
      <View style={{ height: 1, backgroundColor: colors.bg }} />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <Text size={12} color="textMuted">
        {label}
      </Text>
      <Text size={13.5} weight="600" style={{ flexShrink: 1 }} align="left">
        {value}
      </Text>
    </View>
  );
}

function Result({ r }: { r: VerifiedIjazah }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const valid = !r.revoked;
  return (
    <>
      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 18,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            backgroundColor: valid ? colors.success : colors.danger,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
          accessibilityLiveRegion="polite"
        >
          <Icon name={valid ? 'shieldCheck' : 'info'} size={24} color="#FFFFFF" />
          <View style={{ flex: 1 }}>
            <Text size={14} weight="600" color="#FFFFFF">
              {valid ? t('verify.validTitle') : t('verify.revokedTitle')}
            </Text>
            <Text size={11} color="#E3F1EA">
              {valid ? t('verify.validSubtitle') : (r.revoke_reason ?? '')}
            </Text>
          </View>
        </View>
        <View style={{ padding: 16, gap: 13 }}>
          <Row label={t('verify.holder')} value={r.student_name} />
          <Divider />
          <Row label={t('verify.grantingSheikh')} value={r.teacher_name} />
          <Divider />
          <Row
            label={t('verify.riwayah')}
            value={locale === 'ar' ? r.riwayah_name_ar : r.riwayah_name_en}
          />
          <Divider />
          <Row label={t('verify.issued')} value={formatHijri(r.issued_at, locale)} />
          <Divider />
          <Row
            label={t('verify.reading')}
            value={t('verify.readingValue', {
              pages: formatNumber(r.pages_count, locale),
              sessions: t('ijazah.sessionsChip', {
                count: r.sessions_count,
                n: formatNumber(r.sessions_count, locale),
              }),
            })}
          />
        </View>
        <View
          style={{
            backgroundColor: colors.bg,
            borderTopWidth: 1,
            borderTopColor: colors.divider,
            paddingVertical: 13,
            paddingHorizontal: 16,
          }}
        >
          <Text size={11} weight="600" color="textMuted" style={{ marginBottom: 7 }}>
            {t('verify.sanadAtIssue')}
          </Text>
          <Text family="display" size={14} color="textBody" relaxed>
            {r.sanad_snapshot}
          </Text>
        </View>
      </View>
      <Notice text={t('verify.limitsNotice')} />
    </>
  );
}
