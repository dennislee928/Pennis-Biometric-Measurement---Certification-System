import { jsPDF } from 'jspdf';
import type { Locale } from '@/lib/i18n/types';
import { messages } from '@/lib/i18n/messages';

export interface CertificatePdfData {
  holderName: string;
  lengthCm: number;
  issuedAt: string;
  inquiryId?: string;
}

export function generateCertificatePdf(data: CertificatePdfData, locale: Locale): void {
  const doc = new jsPDF();
  const dict = messages[locale];
  const pageW = doc.getPageWidth();
  const margin = 20;
  let y = 25;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(dict['cert.title'] ?? 'Biometric Measurement Certificate', pageW / 2, y, { align: 'center' });
  y += 18;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dict['cert.holder'] ?? 'Holder'}: ${data.holderName || '—'}`, margin, y);
  y += 10;
  doc.text(`${dict['cert.length'] ?? 'Length'}: ${data.lengthCm.toFixed(2)} cm`, margin, y);
  y += 10;
  doc.text(`${dict['cert.issuedAt'] ?? 'Issued at'}: ${data.issuedAt}`, margin, y);
  y += 10;
  if (data.inquiryId) {
    doc.text(`${dict['cert.inquiryId'] ?? 'Inquiry ID'}: ${data.inquiryId}`, margin, y);
    y += 10;
  }

  y = doc.getPageHeight() - 20;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(dict['cert.footer'] ?? 'On-device measurement. Identity verified via Persona.', pageW / 2, y, { align: 'center' });

  doc.save(`certificate-${Date.now()}.pdf`);
}
