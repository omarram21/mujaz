import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCodeLib from 'qrcode';
import type { TFunction } from 'i18next';
import type { AppLocale } from '@/lib/formatNumber';
import { formatNumber } from '@/lib/formatNumber';
import { formatHijri } from '@/lib/dates';
import { TOTAL_PAGES } from '@/lib/quran';
import { verificationUrl } from '@/lib/verificationCode';
import { light as c } from '@/theme/colors';
import { certificateText } from './wording';
import type { CertificateData } from './Certificate';

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch,
  );

/** A print-ready A5 page mirroring the on-screen certificate. */
export async function certificateHtml(
  data: CertificateData & { code: string; issuedAt: string },
  t: TFunction,
  locale: AppLocale,
) {
  const text = certificateText(t, data);
  const qr = await QRCodeLib.toString(verificationUrl(data.code), {
    type: 'svg',
    margin: 0,
    color: { dark: c.ground, light: c.certificate },
  });
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap" rel="stylesheet">
<style>
@page { size: A5; margin: 0; }
body { margin: 0; background: ${c.certificate}; font-family: 'IBM Plex Sans Arabic', sans-serif; color: #5A6B61; }
.page { position: relative; box-sizing: border-box; width: 148mm; height: 210mm; padding: 16mm 14mm 12mm; display: flex; flex-direction: column; align-items: center; text-align: center; }
.b1 { position: absolute; inset: 5mm; border: 2px solid ${c.goldOnLight}; }
.b2 { position: absolute; inset: 7.5mm; border: 0.8px solid ${c.goldOnLight}; }
.amiri { font-family: Amiri, serif; }
h1 { font-family: Amiri, serif; font-size: 30pt; color: ${c.ground}; margin: 0; line-height: 1.3; }
.name { font-family: Amiri, serif; font-size: 24pt; font-weight: 700; color: ${c.ground}; margin: 8mm 0 0; }
.chip { display: inline-block; background: ${c.successSoft}; color: ${c.success}; font-weight: 600; font-size: 9pt; padding: 2mm 4mm; border-radius: 3mm; margin: 0 1.5mm; }
.foot { margin-top: auto; width: 100%; display: flex; align-items: center; gap: 6mm; border-top: 1px solid #EDE4CC; padding-top: 6mm; text-align: start; }
.foot svg { width: 24mm; height: 24mm; }
.code { font-family: Amiri, serif; font-weight: 700; font-size: 16pt; color: ${c.ground}; letter-spacing: 1.5px; direction: ltr; unicode-bidi: embed; }
</style></head><body><div class="page"><div class="b1"></div><div class="b2"></div>
<p class="amiri" style="font-size:15pt;color:${c.goldText};margin:0">${esc(t('ijazah.basmala'))}</p>
<div style="width:18mm;height:1px;background:#D8C78E;margin:5mm 0"></div>
<h1>${esc(t('ijazah.certTitle'))}</h1>
<p style="font-size:11pt;margin:6mm 0 0">${esc(text.witness)}</p>
<p class="name">${esc(data.studentName)}</p>
<p style="font-size:11pt;line-height:2;max-width:100mm;margin:4mm 0 0">${esc(text.bodyBefore)} <b style="color:${c.ground}">${esc(data.riwayahName)}</b>${esc(text.bodyAfter)}</p>
<p style="margin-top:6mm"><span class="chip">${esc(t('ijazah.pagesChip', { done: formatNumber(data.pages, locale), total: formatNumber(TOTAL_PAGES, locale) }))}</span><span class="chip">${esc(t('ijazah.sessionsChip', { count: data.sessions, n: formatNumber(data.sessions, locale) }))}</span></p>
<div class="foot">${qr}<div><div style="font-size:9pt">${esc(t('ijazah.code'))}</div><div class="code">${esc(data.code)}</div><div style="font-size:9pt;margin-top:2mm">${esc(t('ijazah.issuedOn', { date: formatHijri(data.issuedAt, locale) }))}</div><div style="font-size:8pt;margin-top:1mm;direction:ltr">${esc(verificationUrl(data.code))}</div></div></div>
</div></body></html>`;
}

export async function shareCertificatePdf(
  data: CertificateData & { code: string; issuedAt: string },
  t: TFunction,
  locale: AppLocale,
): Promise<void> {
  const html = await certificateHtml(data, t, locale);
  const { uri } = await Print.printToFileAsync({ html, width: 420, height: 595 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: t('ijazah.downloadPdf'),
    });
  } else {
    await Print.printAsync({ html });
  }
}
