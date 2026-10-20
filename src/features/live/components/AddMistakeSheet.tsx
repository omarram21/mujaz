import { useState } from 'react';
import { Modal, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Chip, IconButton, Input, Notice, Text } from '@/components';
import { useTheme } from '@/theme';
import { getSurah, pageOfAyah, pageRangeToAyahs } from '@/lib/quran';
import { MISTAKE_TYPES, type MistakeType, type ReadingPosition } from '../api';

export interface NewMistake {
  type: MistakeType;
  surah?: number;
  ayah?: number;
  page?: number;
  description: string;
}

/** Quick entry of a recitation mistake. The surah defaults to the current reading position. */
export function AddMistakeSheet({
  position,
  saving,
  onSave,
  onClose,
}: {
  position: ReadingPosition;
  saving: boolean;
  onSave: (m: NewMistake) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { from } = pageRangeToAyahs(position.fromPage, position.toPage);
  const [type, setType] = useState<MistakeType>('tajweed');
  const [surah, setSurah] = useState(String(from.surah));
  const [ayah, setAyah] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string>();

  const save = () => {
    const s = Number(surah);
    const a = ayah ? Number(ayah) : undefined;
    const meta = getSurah(s);
    if (!meta || (a !== undefined && (!Number.isInteger(a) || a < 1 || a > meta.ayahs))) {
      return setError(t('live.errors.ayah'));
    }
    if (description.trim().length < 2) return setError(t('live.errors.description'));
    onSave({
      type,
      surah: s,
      ayah: a,
      page: a ? pageOfAyah({ surah: s, ayah: a }) : undefined,
      description,
    });
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
              {t('live.addMistake')}
            </Text>
            <IconButton icon="close" accessibilityLabel={t('common.close')} onPress={onClose} />
          </View>
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
            accessibilityRole="radiogroup"
          >
            {MISTAKE_TYPES.map((k) => (
              <Chip
                key={k}
                label={t(`mistakes.${k}`)}
                selected={type === k}
                onPress={() => setType(k)}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input
                label={t('live.surahNumber')}
                keyboardType="number-pad"
                localizedDigits
                maxLength={3}
                value={surah}
                onChangeText={setSurah}
                ltr
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label={t('live.ayahNumber')}
                keyboardType="number-pad"
                localizedDigits
                maxLength={3}
                value={ayah}
                onChangeText={setAyah}
                ltr
              />
            </View>
          </View>
          <Input
            label={t('live.description')}
            placeholder={t('live.descriptionPlaceholder')}
            value={description}
            onChangeText={setDescription}
          />
          {error ? <Notice tone="danger" text={error} /> : null}
          <Button label={t('common.save')} loading={saving} onPress={save} />
        </View>
      </View>
    </Modal>
  );
}
