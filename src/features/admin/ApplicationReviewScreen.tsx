import { useState } from 'react';
import { Alert, Linking, Modal, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { differenceInCalendarDays } from 'date-fns';
import {
  Avatar,
  BottomBar,
  Button,
  Card,
  Checkbox,
  Icon,
  Input,
  Notice,
  QueryView,
  Screen,
  Tag,
  Text,
} from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber, formatPrice } from '@/lib/formatNumber';
import { countryName } from '@/lib/countries';
import { riwayahName, useRiwayat } from '@/features/riwayat/api';
import {
  CHECKLIST_KEYS,
  documentUrl,
  useApplication,
  useDocuments,
  useReviewApplication,
  type ChecklistKey,
} from '@/features/applications/api';
import { AdminHeader } from './AdminHeader';

export function ApplicationReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const query = useApplication(id);
  const docs = useDocuments(id);
  const riwayat = useRiwayat();
  const review = useReviewApplication();
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    certificate: false,
    sanad: false,
    call: false,
  });
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string>();
  const allChecked = CHECKLIST_KEYS.every((k) => checklist[k]);
  const pending = query.data?.status === 'pending';

  const decide = async (approve: boolean) => {
    setError(undefined);
    try {
      await review.mutateAsync({ id, approve, reason: approve ? undefined : reason, checklist });
      setRejectOpen(false);
      router.back();
    } catch {
      setError(t('auth.errors.generic'));
    }
  };

  const openDoc = async (path: string) => {
    try {
      await Linking.openURL(await documentUrl(path));
    } catch {
      Alert.alert(t('common.errorTitle'), t('common.errorBody'));
    }
  };

  return (
    <Screen
      header={<AdminHeader title={t('admin.reviewTitle')} back />}
      footer={
        pending ? (
          <BottomBar style={{ flexDirection: 'row' }}>
            <Button
              label={t('admin.reject')}
              variant="dangerOutline"
              style={{ width: 112 }}
              height={52}
              onPress={() => setRejectOpen(true)}
            />
            <Button
              label={t('admin.approve')}
              style={{ flex: 1, backgroundColor: colors.success }}
              disabled={!allChecked}
              loading={review.isPending && !rejectOpen}
              accessibilityHint={allChecked ? undefined : t('admin.checklistHint')}
              onPress={() => void decide(true)}
            />
          </BottomBar>
        ) : null
      }
    >
      <QueryView query={query}>
        {(a) => {
          const days = a.submitted_at
            ? differenceInCalendarDays(new Date(), new Date(a.submitted_at))
            : 0;
          return (
            <>
              <Card style={{ gap: 14 }} padding={15}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar
                    id={a.teacher_id}
                    name={a.teacher?.full_name ?? ''}
                    size={52}
                    radius={15}
                  />
                  <View style={{ flex: 1 }}>
                    <Text size={15} weight="600">
                      {a.teacher?.full_name}
                    </Text>
                    <Text size={11.5} color="textMuted" style={{ marginTop: 2 }}>
                      {`${countryName(a.country, locale)} · ${t('admin.daysWaiting', { count: days, n: formatNumber(days, locale) })}`}
                    </Text>
                  </View>
                  <Tag
                    label={t(`admin.status_${a.status}`)}
                    tone={
                      a.status === 'approved'
                        ? 'success'
                        : a.status === 'rejected'
                          ? 'danger'
                          : 'gold'
                    }
                  />
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {a.riwayat.map((r) => (
                    <Tag key={r} label={riwayahName(riwayat.data, r, locale)} />
                  ))}
                  {a.years_experience != null ? (
                    <Tag
                      label={t('admin.yearsExperience', {
                        count: a.years_experience,
                        n: formatNumber(a.years_experience, locale),
                      })}
                    />
                  ) : null}
                  <Tag label={t(`admin.teaches_${a.teaches}`)} tone="neutral" />
                </View>

                <View style={{ backgroundColor: colors.bg, borderRadius: 13, padding: 12, gap: 6 }}>
                  <Text size={11} weight="600" color="textMuted">
                    {t('admin.grantingSheikh')}
                  </Text>
                  <Text size={14} weight="500">
                    {a.granting_sheikh}
                  </Text>
                  <Text size={11} weight="600" color="textMuted" style={{ marginTop: 6 }}>
                    {t('admin.enteredSanad')}
                  </Text>
                  <Text family="display" size={14.5} color="textBody" relaxed>
                    {a.sanad_text}
                  </Text>
                </View>

                {a.price_30 != null || a.price_60 != null ? (
                  <Text size={12} color="textMuted">
                    {t('admin.prices', {
                      p30: formatPrice(Number(a.price_30 ?? 0), locale),
                      p60: formatPrice(Number(a.price_60 ?? 0), locale),
                    })}
                  </Text>
                ) : null}

                <View style={{ gap: 8 }}>
                  <Text size={11} weight="600" color="textMuted">
                    {t('admin.attachments')}
                  </Text>
                  {docs.data?.length ? (
                    docs.data.map((d) => (
                      <Pressable
                        key={d.id}
                        onPress={() => void openDoc(d.storage_path)}
                        accessibilityRole="button"
                        accessibilityLabel={`${t('common.view')} ${d.file_name}`}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          borderWidth: 1,
                          borderColor: colors.borderStrong,
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          minHeight: 44,
                        }}
                      >
                        <Icon name="document" size={16} color={colors.textMuted} />
                        <Text size={12.5} style={{ flex: 1 }} numberOfLines={1}>
                          {d.file_name}
                        </Text>
                        <Text size={11} weight="600" color="ground">
                          {t('common.view')}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text size={12} color="textMuted">
                      {docs.isPending ? t('common.loading') : t('admin.noAttachments')}
                    </Text>
                  )}
                </View>

                {pending ? (
                  <View
                    style={{
                      gap: 4,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: colors.divider,
                    }}
                  >
                    <Text size={11} weight="600" color="textMuted">
                      {t('admin.checklist')}
                    </Text>
                    {CHECKLIST_KEYS.map((k) => (
                      <Checkbox
                        key={k}
                        checked={checklist[k]}
                        label={t(`admin.check_${k}`)}
                        onChange={(v) => setChecklist((c) => ({ ...c, [k]: v }))}
                      />
                    ))}
                  </View>
                ) : a.rejection_reason ? (
                  <Notice
                    tone="danger"
                    title={t('admin.rejectionReason')}
                    text={a.rejection_reason}
                  />
                ) : null}
              </Card>
              {pending ? (
                <Notice tone="success" icon="bell" text={t('admin.decisionNotice')} />
              ) : null}
              {error ? <Notice tone="danger" text={error} /> : null}
            </>
          );
        }}
      </QueryView>

      <Modal
        visible={rejectOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }}>
          <View
            style={{
              backgroundColor: colors.bg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 34,
              gap: 14,
            }}
          >
            <Text size={16} weight="600" accessibilityRole="header">
              {t('admin.rejectTitle')}
            </Text>
            <Input
              label={t('admin.rejectReason')}
              multiline
              value={reason}
              onChangeText={setReason}
              placeholder={t('admin.rejectPlaceholder')}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                label={t('common.cancel')}
                variant="secondary"
                style={{ width: 112 }}
                height={52}
                onPress={() => setRejectOpen(false)}
              />
              <Button
                label={t('admin.confirmReject')}
                variant="danger"
                style={{ flex: 1 }}
                disabled={reason.trim().length < 5}
                loading={review.isPending}
                onPress={() => void decide(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
