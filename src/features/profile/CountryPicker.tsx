import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, IconButton, Input, Text } from '@/components';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { COUNTRIES, type Country } from '@/lib/countries';

export function CountryPicker({
  visible,
  onClose,
  onSelect,
  selected,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (c: Country) => void;
  selected?: string | null;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const sorted = [...COUNTRIES].sort((a, b) => a[locale].localeCompare(b[locale], locale));
    return needle
      ? sorted.filter((c) => c.ar.includes(needle) || c.en.toLowerCase().includes(needle))
      : sorted;
  }, [q, locale]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 20 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 20,
            paddingBottom: 12,
          }}
        >
          <Text size={16} weight="600" style={{ flex: 1 }} accessibilityRole="header">
            {t('setup.chooseCountry')}
          </Text>
          <IconButton icon="close" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <Input
            placeholder={t('common.search')}
            value={q}
            onChangeText={setQ}
            autoCorrect={false}
          />
        </View>
        <FlatList
          data={list}
          keyExtractor={(c) => c.code}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const sel = item.code === selected;
            return (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 50,
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.divider,
                  backgroundColor: pressed ? colors.surface : 'transparent',
                })}
              >
                <Text size={14} weight={sel ? '600' : '400'} style={{ flex: 1 }}>
                  {item[locale]}
                </Text>
                {sel ? (
                  <Icon name="check" size={18} color={colors.success} strokeWidth={2} />
                ) : null}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}
