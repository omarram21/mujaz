import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Icon, IconButton, Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';

export function fileSizeLabel(bytes: number, locale: 'ar' | 'en', t: TFunction) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1
    ? t('apply.sizeMb', { size: formatNumber(mb, locale, { decimals: 1 }) })
    : t('apply.sizeKb', { size: formatNumber(Math.max(1, Math.round(bytes / 1024)), locale) });
}

export function DocumentRow({
  name,
  size,
  status = 'uploaded',
  onDelete,
}: {
  name: string;
  size: number;
  status?: 'uploaded' | 'uploading';
  onDelete?: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 12,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: colors.successSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="document" size={19} color={colors.success} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text size={13} weight="600" numberOfLines={1}>
          {name}
        </Text>
        <Text
          size={11}
          color={status === 'uploaded' ? 'success' : 'textMuted'}
          style={{ marginTop: 2 }}
        >
          {status === 'uploaded'
            ? `${t('apply.uploaded')} · ${fileSizeLabel(size, locale, t)}`
            : t('apply.uploading')}
        </Text>
      </View>
      {onDelete ? (
        <IconButton
          icon="trash"
          size={30}
          iconColor={colors.danger}
          accessibilityLabel={t('apply.deleteFile', { name })}
          onPress={onDelete}
        />
      ) : null}
    </View>
  );
}
