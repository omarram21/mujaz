import { useCallback } from 'react';
import { RefreshControl, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Card, DarkHeader, Icon, Notice, Screen, Text } from '@/components';
import { useTheme } from '@/theme';
import { refreshProfile } from '@/features/auth/api';
import { useRequiredProfile } from '@/features/auth/store';
import { useMyApplication } from '@/features/applications/api';

/** Teacher home before approval: explains where the application stands. */
export function ApplicationStatus() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const profile = useRequiredProfile();
  const app = useMyApplication();

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
      void app.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch on focus only
    }, []),
  );

  const status = app.data?.status ?? 'none';
  const view =
    status === 'pending'
      ? {
          icon: 'clock' as const,
          title: t('teacherHome.pendingTitle'),
          body: t('teacherHome.pendingBody'),
          cta: null,
        }
      : status === 'rejected'
        ? {
            icon: 'info' as const,
            title: t('teacherHome.rejectedTitle'),
            body: t('teacherHome.rejectedBody'),
            cta: t('teacherHome.resubmit'),
          }
        : status === 'draft'
          ? {
              icon: 'document' as const,
              title: t('teacherHome.draftTitle'),
              body: t('teacherHome.draftBody'),
              cta: t('teacherHome.continue'),
            }
          : {
              icon: 'shieldCheck' as const,
              title: t('teacherHome.startTitle'),
              body: t('teacherHome.startBody'),
              cta: t('teacherHome.start'),
            };

  return (
    <Screen
      header={
        <DarkHeader>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar
              id={profile.id}
              name={profile.full_name}
              size={56}
              colors={[colors.cream, colors.ground]}
            />
            <View style={{ flex: 1 }}>
              <Text size={12} color="onDarkMuted">
                {t('teacherHome.greeting')}
              </Text>
              <Text size={18} weight="600" color="cream">
                {profile.full_name}
              </Text>
            </View>
          </View>
        </DarkHeader>
      }
      refreshControl={
        <RefreshControl
          refreshing={app.isRefetching}
          onRefresh={() => {
            void refreshProfile();
            void app.refetch();
          }}
        />
      }
    >
      <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            backgroundColor: status === 'rejected' ? colors.dangerSoft : colors.successSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name={view.icon}
            size={28}
            color={status === 'rejected' ? colors.danger : colors.success}
          />
        </View>
        <Text size={16} weight="600" align="center" accessibilityRole="header">
          {view.title}
        </Text>
        <Text size={13} color="textMuted" align="center" relaxed>
          {view.body}
        </Text>
      </Card>
      {status === 'rejected' && app.data?.rejection_reason ? (
        <Notice tone="danger" title={t('admin.rejectionReason')} text={app.data.rejection_reason} />
      ) : null}
      {status === 'pending' ? <Notice text={t('apply.reviewNotice')} /> : null}
      {view.cta ? <Button label={view.cta} onPress={() => router.push('/apply')} /> : null}
    </Screen>
  );
}
