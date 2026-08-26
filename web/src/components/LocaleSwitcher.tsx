'use client';

import { useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLocale } from './LocaleProvider';
import type { Locale } from '@/lib/i18n';
import { LOCALES, isRTL } from '@/lib/i18n';

/** Each language names itself — and labels the trigger in its own words. */
const LOCALE_META: Record<Locale, { name: string; label: string }> = {
  fr: { name: 'Français', label: 'Langue' },
  ar: { name: 'العربية', label: 'اللغة' },
  en: { name: 'English', label: 'Language' },
};

/**
 * Language picker: one icon button that opens a menu, so it takes the same
 * room as <ThemeToggle /> instead of a three-button row.
 */
export default function LocaleSwitcher({ className }: { className?: string }) {
  const { locale } = useLocale();
  const router = useRouter();
  const { name, label } = LOCALE_META[locale];

  // Radix hands back a plain string; narrow it before it reaches the API.
  function switchLocale(next: string) {
    if (next === locale || !LOCALES.includes(next as Locale)) return;
    fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    })
      // Only re-render once the cookie is actually set; on failure the UI just
      // stays in the current language rather than flickering back.
      .then((res) => { if (res.ok) router.refresh(); })
      .catch(() => {});
  }

  return (
    // Radix reads direction from this prop, not from the document's `dir`, so
    // the menu has to be told when the page is Arabic.
    <DropdownMenu dir={isRTL(locale) ? 'rtl' : 'ltr'}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('text-foreground', className)}
          title={label}
          // Icon-only: name the control *and* its current value out loud.
          aria-label={`${label} — ${name}`}
        >
          <Languages className="size-[18px]" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuRadioGroup value={locale} onValueChange={switchLocale}>
          {LOCALES.map((loc) => (
            <DropdownMenuRadioItem
              key={loc}
              value={loc}
              lang={loc}
              className="locale-menu-item cursor-pointer"
            >
              {LOCALE_META[loc].name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
