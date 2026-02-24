'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/types';
import type { Locale } from '@/lib/i18n/types';

export default function WelcomePage() {
  const { locale, setLocale, t } = useI18n();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 flex flex-col items-center justify-center">
      <div className="mx-auto max-w-lg w-full text-center space-y-8">
        <div className="flex flex-wrap justify-center gap-2">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocale(loc as Locale)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                locale === loc
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {LOCALE_LABELS[loc as Locale]}
            </button>
          ))}
        </div>
        <header>
          <h1 className="text-3xl font-bold text-slate-900">{t('welcome.title')}</h1>
          <p className="mt-4 text-slate-600">{t('welcome.subtitle')}</p>
        </header>
        <Link
          href="/measure"
          className="inline-block rounded-lg bg-emerald-600 px-8 py-3 text-lg font-medium text-white hover:bg-emerald-700 transition"
        >
          {t('welcome.start')}
        </Link>
      </div>
    </main>
  );
}
