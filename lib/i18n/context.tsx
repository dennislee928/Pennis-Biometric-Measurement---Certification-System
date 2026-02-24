'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { messages } from './messages';
import type { Locale } from './types';

const COOKIE_NAME = 'locale';

function getLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : '';
  if (value === 'zh-TW' || value === 'ja' || value === 'es' || value === 'en') return value;
  return 'en';
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(locale)};path=/;max-age=31536000`;
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getLocaleFromCookie());
    setMounted(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setLocaleCookie(next);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const dict = messages[locale];
      return dict?.[key] ?? key;
    },
    [locale]
  );

  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;
    document.documentElement.lang =
      locale === 'zh-TW' ? 'zh-TW' : locale === 'ja' ? 'ja' : locale === 'es' ? 'es' : 'en';
  }, [locale, mounted]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
