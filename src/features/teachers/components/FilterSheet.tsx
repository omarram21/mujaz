import { Modal, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Chip, IconButton, Text, Toggle } from '@/components';
import { useTheme } from '@/theme';

export type SortKey = 'rating' | 'price' | 'soonest';
export interface TeacherFilters {
  sort: SortKey;
  availableThisWeek: boolean;
}

export function FilterSheet({
  visible,
  value,
  onChange,
  onClose,
}: {
  visible: boolean;
  value: TeacherFilters;
  onChange: (v: TeacherFilters) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const sorts: SortKey[] = ['rating', 'soonest', 'price'];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }}>
        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: 34,
            gap: 16,
          }}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text size={16} weight="600" accessibilityRole="header">
              {t('teachers.filter')}
            </Text>
            <IconButton icon="close" accessibilityLabel={t('common.close')} onPress={onClose} />
          </View>
          <View style={{ gap: 9 }}>
            <Text size={13} weight="600">
              {t('teachers.sortBy')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {sorts.map((s) => (
                <Chip
                  key={s}
                  label={t(`teachers.sort_${s}`)}
                  selected={value.sort === s}
                  onPress={() => onChange({ ...value, sort: s })}
                />
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text size={14} style={{ flex: 1 }}>
              {t('teachers.availableThisWeek')}
            </Text>
            <Toggle
              label={t('teachers.availableThisWeek')}
              value={value.availableThisWeek}
              onValueChange={(v) => onChange({ ...value, availableThisWeek: v })}
            />
          </View>
          <Button label={t('common.done')} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
