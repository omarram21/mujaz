import { useState } from 'react';
import { Modal, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Input, Text, IconButton } from '@/components';
import { useTheme } from '@/theme';
import { sendPhoneOtp, verifyPhoneOtp, type SignUpRole } from '../api';
import { authErrorKey, otpSchema, phoneSchema } from '../schema';

export function PhoneAuthModal({
  visible,
  onClose,
  role,
  fullName,
}: {
  visible: boolean;
  onClose: () => void;
  role?: SignUpRole;
  fullName?: string;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const send = async () => {
    const parsed = phoneSchema.safeParse(phone.replace(/\s/g, ''));
    if (!parsed.success)
      return setError(t(parsed.error.issues[0]?.message ?? 'auth.errors.phoneInvalid'));
    setBusy(true);
    setError(undefined);
    try {
      await sendPhoneOtp(parsed.data, { fullName, role });
      setSent(true);
    } catch (e) {
      setError(t(authErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    const parsed = otpSchema.safeParse(code);
    if (!parsed.success) return setError(t('auth.errors.otpInvalid'));
    setBusy(true);
    setError(undefined);
    try {
      await verifyPhoneOtp(phone.replace(/\s/g, ''), parsed.data);
      onClose();
    } catch (e) {
      setError(t(authErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
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
              {t('auth.phone')}
            </Text>
            <IconButton icon="close" accessibilityLabel={t('common.close')} onPress={onClose} />
          </View>
          {!sent ? (
            <>
              <Input
                label={t('auth.phoneNumber')}
                placeholder={t('auth.phonePlaceholder')}
                keyboardType="phone-pad"
                autoComplete="tel"
                ltr
                value={phone}
                onChangeText={setPhone}
                error={error}
              />
              <Button label={t('auth.sendCode')} onPress={send} loading={busy} />
            </>
          ) : (
            <>
              <Text size={13} color="textMuted">
                {t('auth.codeSent', { phone })}
              </Text>
              <Input
                label={t('auth.otp')}
                keyboardType="number-pad"
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                maxLength={6}
                ltr
                value={code}
                onChangeText={setCode}
                error={error}
              />
              <Button label={t('auth.verifyCode')} onPress={verify} loading={busy} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
