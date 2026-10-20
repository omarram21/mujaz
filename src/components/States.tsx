import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Text } from './Text';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

export function LoadingState({
  label,
  tone = 'light',
}: {
  label?: string;
  tone?: 'light' | 'dark';
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        flex: 1,
        minHeight: 200,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 24,
      }}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? t('common.loading')}
    >
      <ActivityIndicator color={tone === 'dark' ? colors.gold : colors.ground} />
      <Text size={13} color={tone === 'dark' ? 'onDarkMuted' : 'textMuted'}>
        {label ?? t('common.loading')}
      </Text>
    </View>
  );
}

export function EmptyState({
  icon = 'book',
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon?: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 36,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: colors.successSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={26} color={colors.success} />
      </View>
      <Text size={15} weight="600" align="center">
        {title}
      </Text>
      {body ? (
        <Text size={12.5} color="textMuted" align="center" relaxed>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          style={{ marginTop: 6, alignSelf: 'stretch' }}
        />
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 36,
        paddingHorizontal: 24,
      }}
      accessibilityLiveRegion="polite"
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: colors.dangerSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="wifiOff" size={26} color={colors.danger} />
      </View>
      <Text size={15} weight="600" align="center">
        {t('common.errorTitle')}
      </Text>
      <Text size={12.5} color="textMuted" align="center" relaxed>
        {message ?? t('common.errorBody')}
      </Text>
      {onRetry ? (
        <Button
          label={t('common.retry')}
          icon="refresh"
          onPress={onRetry}
          variant="secondary"
          style={{ marginTop: 6, alignSelf: 'stretch' }}
        />
      ) : null}
    </View>
  );
}

/** Renders loading / error / empty / content for a TanStack query result. */
export function QueryView<T>({
  query,
  isEmpty,
  empty,
  children,
  tone,
}: {
  query: {
    data: T | undefined;
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => unknown;
  };
  isEmpty?: (data: T) => boolean;
  empty?: React.ReactNode;
  children: (data: T) => React.ReactNode;
  tone?: 'light' | 'dark';
}) {
  if (query.isPending) return <LoadingState tone={tone} />;
  if (query.isError || query.data === undefined) {
    return <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />;
  }
  if (isEmpty?.(query.data)) return <>{empty}</>;
  return <>{children(query.data)}</>;
}

function errorMessage(e: unknown): string | undefined {
  if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string' && __DEV__)
    return e.message;
  return undefined;
}
