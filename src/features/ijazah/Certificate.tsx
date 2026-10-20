import { View } from 'react-native';
import Svg, { G, Rect } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components';
import { hiddenSvg } from '@/components/a11y';
import { useTheme } from '@/theme';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/lib/formatNumber';
import { formatHijri } from '@/lib/dates';
import { TOTAL_PAGES } from '@/lib/quran';
import { verificationUrl } from '@/lib/verificationCode';
import { certificateText } from './wording';

export interface CertificateData {
  studentName: string;
  teacherName: string;
  studentGender: 'male' | 'female' | null;
  teacherGender: 'male' | 'female' | null;
  riwayahName: string;
  pages: number;
  sessions: number;
  code: string | null; // null = preview
  issuedAt: string | null;
}

function CornerMark({ side }: { side: 'left' | 'right' }) {
  const { colors } = useTheme();
  return (
    <Svg
      width={76}
      height={76}
      viewBox="0 0 76 76"
      style={{ position: 'absolute', top: 22, [side]: 22, opacity: 0.5 }}
      {...hiddenSvg}
    >
      <G fill="none" stroke={colors.goldOnLight} strokeWidth={1}>
        <Rect x={side === 'right' ? 8 : 24} y={8} width={44} height={44} />
        <Rect
          x={side === 'right' ? 8 : 24}
          y={8}
          width={44}
          height={44}
          transform={side === 'right' ? 'rotate(45 30 30)' : 'rotate(45 46 30)'}
        />
      </G>
    </Svg>
  );
}

/** Cream certificate with double gold border and corner motifs (screen 11). */
export function Certificate({ data }: { data: CertificateData }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const text = certificateText(t, data);
  const preview = !data.code;
  return (
    <View
      style={{
        backgroundColor: colors.certificate,
        borderRadius: 18,
        overflow: 'hidden',
        minHeight: 560,
      }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 354 600"
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        {...hiddenSvg}
      >
        <Rect
          x={10}
          y={10}
          width={334}
          height={580}
          fill="none"
          stroke={colors.goldOnLight}
          strokeWidth={2}
        />
        <Rect
          x={18}
          y={18}
          width={318}
          height={564}
          fill="none"
          stroke={colors.goldOnLight}
          strokeWidth={0.8}
        />
      </Svg>
      <CornerMark side="right" />
      <CornerMark side="left" />
      <View
        style={{
          alignItems: 'center',
          paddingTop: 42,
          paddingHorizontal: 30,
          paddingBottom: 24,
          flex: 1,
        }}
      >
        <Text family="display" size={17} color="goldText" align="center">
          {t('ijazah.basmala')}
        </Text>
        <View style={{ width: 54, height: 1, backgroundColor: '#D8C78E', marginVertical: 14 }} />
        <Text
          family="display"
          weight="700"
          size={34}
          color="ground"
          align="center"
          style={{ lineHeight: 44 }}
          accessibilityRole="header"
        >
          {t('ijazah.certTitle')}
        </Text>
        <Text size={12.5} color="#5A6B61" align="center" relaxed style={{ marginTop: 16 }}>
          {text.witness}
        </Text>
        <Text
          family="display"
          weight="700"
          size={27}
          color="ground"
          align="center"
          style={{ marginTop: 10, lineHeight: 40 }}
        >
          {data.studentName}
        </Text>
        <Text
          size={12.5}
          color="#5A6B61"
          align="center"
          style={{ marginTop: 12, maxWidth: 268, lineHeight: 26 }}
        >
          {text.bodyBefore}{' '}
          <Text size={12.5} weight="600" color="ground">
            {data.riwayahName}
          </Text>
          {text.bodyAfter}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          <View
            style={{
              backgroundColor: colors.successSoft,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 9,
            }}
          >
            <Text size={11} weight="600" color="success">
              {t('ijazah.pagesChip', {
                done: formatNumber(data.pages, locale),
                total: formatNumber(TOTAL_PAGES, locale),
              })}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.successSoft,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 9,
            }}
          >
            <Text size={11} weight="600" color="success">
              {t('ijazah.sessionsChip', {
                count: data.sessions,
                n: formatNumber(data.sessions, locale),
              })}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1, minHeight: 24 }} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            alignSelf: 'stretch',
            paddingTop: 18,
            borderTopWidth: 1,
            borderTopColor: '#EDE4CC',
          }}
        >
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={t('ijazah.qrLabel')}
            style={{
              width: 74,
              height: 74,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: preview ? 0.25 : 1,
            }}
          >
            <QRCode
              value={verificationUrl(data.code ?? 'MJZ-PREVIEW')}
              size={74}
              color={colors.ground}
              backgroundColor={colors.certificate}
              ecl="M"
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text size={10.5} color="#5A6B61">
              {t('ijazah.code')}
            </Text>
            <Text
              family="display"
              weight="700"
              size={19}
              color={preview ? 'textDisabled' : 'ground'}
              letterSpacing={1.5}
              style={{ marginTop: 4, writingDirection: 'ltr' }}
              selectable
            >
              {data.code ?? 'MJZ-••••-••••'}
            </Text>
            <Text size={10.5} color="#5A6B61" style={{ marginTop: 6 }}>
              {data.issuedAt
                ? t('ijazah.issuedOn', { date: formatHijri(data.issuedAt, locale) })
                : t('ijazah.issuedWhenComplete')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
