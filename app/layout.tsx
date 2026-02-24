import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n/context';

export const metadata: Metadata = {
  title: 'Male Penis Length & Size Measurement',
  description: 'On-device male penis length and size measurement. No images leave your device. Identity verification for a digital certificate.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
