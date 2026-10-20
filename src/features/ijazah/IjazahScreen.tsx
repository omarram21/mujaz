import { useState } from 'react';
import { Alert, Platform, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { Button, ErrorState, IconButton, LoadingState, Notice, Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { computeProgress } from '@/lib/progress';
import { verificationUrl } from '@/lib/verificationCode';
import { supabase, unwrapMaybe } from '@/services/supabase';
import { riwayahName, useRiwayat } from '@/features/riwayat/api';
import { useMyPrograms, useProgramRecords, type ProgramWithPeople } from '@/features/progress/api';
import { useIjazah, useIjazahForProgram, type Ijazah } from './api';
import { Certificate, type CertificateData } from './Certificate';
import { shareCertificatePdf } from './pdf';

/** id is an ijazah id, or `program-<programId>` to show the issued ijazah or a preview. */
export function IjazahScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const programId = id.startsWith('program-') ? id.slice('program-'.length) : null;
  return programId ? <ByProgram programId={programId} /> : <ById id={id} />;
}

function ById({ id }: { id: string }) {
  const q = useIjazah(id);
  if (q.isPending)
    return (
      <Shell>
        <LoadingState tone="dark" />
      </Shell>
    );
  if (q.isError)
    return (
      <Shell>
        <ErrorState onRetry={() => void q.refetch()} />
      </Shell>
    );
  return <Issued ijazah={q.data} />;
}

function ByProgram({ programId }: { programId: string }) {
  const programs = useMyPrograms();
  const ijazah = useIjazahForProgram(programId);
  const program = programs.data?.find((p) => p.id === programId);
  if (programs.isPending || ijazah.isPending)
    return (
      <Shell>
        <LoadingState tone="dark" />
      </Shell>
    );
  if (programs.isError || ijazah.isError || !program) {
    return (
      <Shell>
        <ErrorState onRetry={() => void Promise.all([programs.refetch(), ijazah.refetch()])} />
      </Shell>
    );
  }
  return ijazah.data ? <Issued ijazah={ijazah.data} /> : <Preview program={program} />;
}

function Shell({
  children,
  footer,
  onShare,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  onShare?: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.groundCertificate, paddingTop: insets.top }}>
      <StatusBar style="light" />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 12,
        }}
      >
        <IconButton
          icon="back"
          tone="dark"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
        />
        <Text size={13} weight="600" color="creamBright" accessibilityRole="header">
          {t('ijazah.title')}
        </Text>
        {onShare ? (
          <IconButton
            icon="upload"
            tone="dark"
            accessibilityLabel={t('ijazah.share')}
            onPress={onShare}
          />
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 }}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 18,
            paddingTop: 14,
            paddingBottom: Math.max(24, insets.bottom + 10),
          }}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

function usePeopleGenders(studentId: string | null, teacherId: string | null) {
  return useQuery({
    queryKey: ['genders', studentId, teacherId],
    queryFn: async () => {
      const [s, tch] = await Promise.all([
        studentId
          ? supabase.from('profiles').select('gender').eq('id', studentId).maybeSingle()
          : null,
        teacherId
          ? supabase.from('public_teachers').select('gender').eq('id', teacherId).maybeSingle()
          : null,
      ]);
      return {
        student: (s ? unwrapMaybe(s)?.gender : null) ?? null,
        teacher: (tch ? unwrapMaybe(tch)?.gender : null) ?? null,
      };
    },
  });
}

function Preview({ program }: { program: ProgramWithPeople }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const riwayat = useRiwayat();
  const records = useProgramRecords(program.id);
  const genders = usePeopleGenders(program.student_id, program.teacher_id);
  const progress = computeProgress(records.data ?? []);
  const data: CertificateData = {
    studentName: program.student_name,
    teacherName: program.teacher_name,
    studentGender: genders.data?.student ?? null,
    teacherGender: genders.data?.teacher ?? null,
    riwayahName: riwayahName(riwayat.data, program.riwayah, locale),
    pages: progress.pagesCount,
    sessions: records.data?.length ?? 0,
    code: null,
    issuedAt: null,
  };
  return (
    <Shell>
      <View style={{ alignItems: 'center', marginBottom: 10 }}>
        <View
          style={{
            backgroundColor: colors.warningBg,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 4,
          }}
        >
          <Text size={11} weight="600" color="warningText">
            {t('ijazah.preview')}
          </Text>
        </View>
      </View>
      <Certificate data={data} />
      <View style={{ marginTop: 14 }}>
        <Notice text={t('ijazah.previewNotice')} />
      </View>
    </Shell>
  );
}

function Issued({ ijazah }: { ijazah: Ijazah }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const riwayat = useRiwayat();
  const [busy, setBusy] = useState(false);
  const data = {
    studentName: ijazah.student_name,
    teacherName: ijazah.teacher_name,
    studentGender: ijazah.student_gender,
    teacherGender: ijazah.teacher_gender,
    riwayahName: riwayahName(riwayat.data, ijazah.riwayah, locale),
    pages: ijazah.pages_count,
    sessions: ijazah.sessions_count,
    code: ijazah.verification_code,
    issuedAt: ijazah.issued_at,
  };
  const url = verificationUrl(ijazah.verification_code);

  const shareLink = async () => {
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(url);
      Alert.alert(t('ijazah.linkCopied'));
      return;
    }
    await Share.share({
      message: t('ijazah.shareMessage', { url, code: ijazah.verification_code }),
      url,
    });
  };

  const pdf = async () => {
    setBusy(true);
    try {
      await shareCertificatePdf(data, t, locale);
    } catch {
      Alert.alert(t('common.errorTitle'), t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      onShare={() => void shareLink()}
      footer={
        <>
          <Button
            label={t('ijazah.downloadPdf')}
            variant="outlineDark"
            icon="download"
            height={50}
            style={{ flex: 1 }}
            loading={busy}
            onPress={() => void pdf()}
          />
          <Button
            label={t('ijazah.verifyLink')}
            variant="gold"
            icon="link"
            height={50}
            style={{ flex: 1 }}
            onPress={() => void shareLink()}
          />
        </>
      }
    >
      <Certificate data={data} />
      {ijazah.revoked_at ? (
        <View style={{ marginTop: 14 }}>
          <Notice
            tone="danger"
            title={t('verify.revokedTitle')}
            text={ijazah.revoke_reason ?? ''}
          />
        </View>
      ) : null}
    </Shell>
  );
}
