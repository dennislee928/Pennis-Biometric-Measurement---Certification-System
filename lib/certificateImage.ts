import type { Locale } from '@/lib/i18n/types';
import { messages } from '@/lib/i18n/messages';

export interface CertificateImageData {
  holderName: string;
  lengthCm: number;
  issuedAt: string;
  inquiryId?: string;
}

const W = 600;
const H = 400;
const PAD = 40;
const LINE = 28;

export function generateCertificatePng(data: CertificateImageData, locale: Locale): string {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const dict = messages[locale];

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, W - 16, H - 16);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(dict['cert.title'] ?? 'Biometric Measurement Certificate', W / 2, PAD + LINE);

  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  let y = PAD + LINE * 2.5;
  ctx.fillText(`${dict['cert.holder'] ?? 'Holder'}: ${data.holderName || '—'}`, PAD, y);
  y += LINE;
  ctx.fillText(`${dict['cert.length'] ?? 'Length'}: ${data.lengthCm.toFixed(2)} cm`, PAD, y);
  y += LINE;
  ctx.fillText(`${dict['cert.issuedAt'] ?? 'Issued at'}: ${data.issuedAt}`, PAD, y);
  if (data.inquiryId) {
    y += LINE;
    ctx.fillText(`${dict['cert.inquiryId'] ?? 'Inquiry ID'}: ${data.inquiryId}`, PAD, y);
  }
  y = H - PAD - LINE;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText(dict['cert.footer'] ?? 'On-device measurement. Identity verified via Persona.', W / 2, y);

  return canvas.toDataURL('image/png');
}

export function downloadCertificatePng(data: CertificateImageData, locale: Locale): void {
  const dataUrl = generateCertificatePng(data, locale);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `certificate-${Date.now()}.png`;
  a.click();
}
