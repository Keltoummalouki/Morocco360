'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLocale } from './LocaleProvider';
import type { Locale } from '@/lib/i18n';
import { LOCALES } from '@/lib/i18n';

const LOCALE_META: Record<Locale, { label: string; name: string }> = {
  fr: { label: 'FR', name: 'Français'  },
  ar: { label: 'ع',  name: 'العربية'   },
  en: { label: 'EN', name: 'English'   },
};

export default function LocaleSwitcher() {
  const { locale } = useLocale();
  const router = useRouter();

  async function switchLocale(next: Locale) {
    if (next === locale) return;
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
  }

  // Styling lives in globals.css (`.locale-switch*`) so the nav can compact it
  // on small screens.
  return (
    <div className="locale-switch">
      {LOCALES.map((loc) => {
        const active = loc === locale;
        const { label, name } = LOCALE_META[loc];
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchLocale(loc)}
            title={name}
            lang={loc}
            // aria-current, not aria-pressed: these are three mutually
            // exclusive choices, not three independent toggles.
            aria-current={active ? 'true' : undefined}
            className={cn('locale-switch-btn', loc === 'ar' && 'is-ar', active && 'active')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
