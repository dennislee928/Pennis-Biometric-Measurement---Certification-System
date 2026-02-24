import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Biometric Measurement & Certification',
  description: 'On-device measurement with identity verification. No images leave your device.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
