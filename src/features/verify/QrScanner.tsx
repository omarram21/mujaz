import { useState } from 'react';
import { Modal, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Text } from '@/components';
import { useTheme } from '@/theme';

/** Full-screen QR scanner; returns the raw scanned text once. */
export function QrScanner({
  visible,
  onClose,
  onScan,
}: {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [permission, request] = useCameraPermissions();
  const [done, setDone] = useState(false);
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => setDone(false)}
    >
      <View style={{ flex: 1, backgroundColor: colors.groundDarkest }}>
        {permission?.granted ? (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={
              done
                ? undefined
                : ({ data }) => {
                    setDone(true);
                    onScan(data);
                  }
            }
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              padding: 28,
            }}
          >
            <Text size={15} color="creamBright" align="center">
              {t('verify.cameraNeeded')}
            </Text>
            <Button
              label={t('verify.allowCamera')}
              variant="gold"
              onPress={() => void request()}
              style={{ alignSelf: 'stretch' }}
            />
          </View>
        )}
        <View style={{ position: 'absolute', top: 54, end: 20 }}>
          <IconButton
            icon="close"
            tone="darkFilled"
            accessibilityLabel={t('common.close')}
            onPress={onClose}
          />
        </View>
        <View style={{ position: 'absolute', bottom: 48, start: 0, end: 0, alignItems: 'center' }}>
          <Text size={13} color="creamBright">
            {t('verify.scanHint')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
