import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, type Locale } from '@/lib/i18n';
import EventsNav from '@/components/home/EventsNav';
import EventsFooter from '@/components/home/EventsFooter';

/**
 * Shell for the simple standalone pages linked from the footer
 * (About / Support / Privacy / Terms). Keeps those links real instead of 404s.
 */
export default async function InfoPage({
  title,
  intro,
  children,
  navActive,
}: {
  title: string;
  intro: string;
  children?: React.ReactNode;
  /** Highlight a nav entry (e.g. "about"); omit for footer-only pages. */
  navActive?: 'discover' | 'events' | 'about';
}) {
  const raw = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : DEFAULT_LOCALE;

  return (
    <div className="ev min-h-screen">
      <EventsNav locale={locale} active={navActive} />
      <main className="ev-container ev-section min-h-[52vh] max-w-3xl">
        <h1 className="ev-display text-[clamp(1.9rem,5vw,3rem)]">{title}</h1>
        <p className="ev-sub mt-3 text-base">{intro}</p>
        {children && (
          <div className="mt-8 flex flex-col gap-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
            {children}
          </div>
        )}
      </main>
      <EventsFooter locale={locale} />
    </div>
  );
}
