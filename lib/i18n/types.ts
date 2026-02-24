export type Locale = 'en' | 'zh-TW' | 'ja' | 'es';

export const LOCALES: Locale[] = ['en', 'zh-TW', 'ja', 'es'];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'zh-TW': '繁體中文',
  ja: '日本語',
  es: 'Español',
};
