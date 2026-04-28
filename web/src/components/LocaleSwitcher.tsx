'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from './LocaleProvider';
import type { Locale } from '@/lib/i18n';
import { LOCALES } from '@/lib/i18n';

const LOCALE_META: Record<Locale, { label: string; name: string }> = {
  fr: { label: 'FR', name: 'Français'  },
  ar: { label: 'ع',  name: 'العربية'   },
  en: { label: 'EN', name: 'English'   },
};

const ACCENT = '#4A7C6F';

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

  return (
    <div
      style={{
        display: 'flex',
        gap: '2px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: '2px',
      }}
    >
      {LOCALES.map((loc) => {
        const active = loc === locale;
        const { label, name } = LOCALE_META[loc];
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchLocale(loc)}
            title={name}
            style={{
              padding: '4px 9px',
              fontSize: loc === 'ar' ? '0.9375rem' : '0.6875rem',
              fontWeight: active ? 700 : 400,
              color: active ? ACCENT : 'var(--muted)',
              background: active ? 'var(--background)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              letterSpacing: loc !== 'ar' ? '0.05em' : '0',
              fontFamily:
                loc === 'ar'
                  ? 'var(--font-arabic), system-ui'
                  : 'var(--font-inter), system-ui, sans-serif',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
