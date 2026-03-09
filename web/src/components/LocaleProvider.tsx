'use client';

import { createContext, useContext } from 'react';
import type { Locale, Translations } from '@/lib/i18n';
import { getTranslations } from '@/lib/i18n';

interface LocaleContextValue {
  locale: Locale;
  t: Translations;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'fr',
  t: getTranslations('fr'),
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ locale, t: getTranslations(locale) }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
