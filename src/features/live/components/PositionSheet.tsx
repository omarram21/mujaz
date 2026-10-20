import { useState } from 'react';
import { Modal, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Input, Notice, Text } from '@/components';
import { useTheme } from '@/theme';
import { TOTAL_PAGES } from '@/lib/quran';
import type { ReadingPosition } from '../api';

export function PositionSheet({
  value,
  onSave,
  onClose,
}: {
  value: ReadingPosition;
  onSave: (p: ReadingPosition) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [from, setFrom] = useState(String(value.fromPage));
  const [to, setTo] = useState(String(value.toPage));
  const [error, setError] = useState<string>();
  const save = () => {
    const f = Number(from);
    const tt = Number(to);
    if (!Number.isInteger(f) || !Number.isInteger(tt) || f < 1 || tt > TOTAL_PAGES || tt < f) {
      return setError(t('sessionNotes.errors.pages'));
    }
    onSave({ fromPage: f, toPage: tt });
  };
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
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
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text size={16} weight="600" accessibilityRole="header">
              {t('live.position')}
            </Text>
            <IconButton icon="close" accessibilityLabel={t('common.close')} onPress={onClose} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input
                label={t('sessionNotes.fromPage')}
                keyboardType="number-pad"
                localizedDigits
                maxLength={3}
                value={from}
                onChangeText={setFrom}
                ltr
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label={t('sessionNotes.toPage')}
                keyboardType="number-pad"
                localizedDigits
                maxLength={3}
                value={to}
                onChangeText={setTo}
                ltr
              />
            </View>
          </View>
          {error ? <Notice tone="danger" text={error} /> : null}
          <Button label={t('common.save')} onPress={save} />
        </View>
      </View>
    </Modal>
  );
}
