import { jsPDF } from 'jspdf';
import type { Locale } from '@/lib/i18n/types';
import { messages } from '@/lib/i18n/messages';

export interface CertificatePdfData {
  holderName: string;
  lengthCm: number;
  issuedAt: string;
  inquiryId?: string;
}

const pageW = 210; // A4 mm
const pageH = 297;
const margin = 20;

/** Draw official seal circle and checkmark in PDF (vector) */
function drawSealPdf(doc: jsPDF, cx: number, cy: number, radius: number): void {
  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(0.4);
  doc.setFillColor(240, 253, 250); // teal-50
  doc.circle(cx, cy, radius, 'FD'); // fill + draw
  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(0.25);
  doc.circle(cx, cy, radius - 2, 'S');
  // Checkmark as small lines (jsPDF has no path API like canvas)
  const r = radius * 0.45;
  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(0.5);
  doc.line(cx - r * 0.9, cy, cx - r * 0.2, cy + r * 0.7);
  doc.line(cx - r * 0.2, cy + r * 0.7, cx + r * 0.85, cy - r * 0.7);
}

/** Draw double border for official certificate look */
function drawCertificateBorderPdf(doc: jsPDF): void {
  const inset = 8;
  const inner = 12;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.rect(inset, inset, pageW - inset * 2, pageH - inset * 2, 'S');
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.25);
  doc.rect(inner, inner, pageW - inner * 2, pageH - inner * 2, 'S');
}

export function generateCertificatePdf(data: CertificatePdfData, locale: Locale): void {
  const doc = new jsPDF();
  const dict = messages[locale];

  drawCertificateBorderPdf(doc);

  // Subtle "OFFICIAL" watermark (centered, light gray)
  doc.setTextColor(200, 203, 210);
  doc.setFontSize(48);
  doc.setFont('helvetica', 'bold');
  doc.text('Dick Size Verified', pageW / 2, pageH / 2, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  let y = 28;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(dict['cert.title'] ?? 'Biometric Measurement Certificate', pageW / 2, y, { align: 'center' });
  y += 4;

  // Title underline (teal)
  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(0.5);
  doc.line(margin + 10, y, pageW - margin - 10, y);
  y += 14;

  // Seal (top-right)
  drawSealPdf(doc, pageW - 32, 38, 12);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
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

  y = pageH - 22;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(dict['cert.footer'] ?? 'On-device measurement. Identity verified via Persona.', pageW / 2, y, { align: 'center' });

  doc.save(`certificate-${Date.now()}.pdf`);
}
