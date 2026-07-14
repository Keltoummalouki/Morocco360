import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, type Locale } from '@/lib/i18n';
import EventsNav from '@/components/home/EventsNav';
import EventsHero from '@/components/home/EventsHero';
import TrendingSection from '@/components/home/TrendingSection';
import ConfidenceSection from '@/components/home/ConfidenceSection';
import OrganizerSection from '@/components/home/OrganizerSection';
import EventsFooter from '@/components/home/EventsFooter';

/**
 * Morocco360 — events home (Imperial Trinity, matches the Stitch design).
 * Server Component: resolves locale from cookie, renders the six sections.
 * All styling is scoped under `.ev`.
 */
export default async function Home() {
  const raw = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : DEFAULT_LOCALE;

  return (
    <div className="ev">
      <EventsNav locale={locale} active="discover" />
      <main>
        <EventsHero locale={locale} />
        <TrendingSection locale={locale} />
        <ConfidenceSection locale={locale} />
        <OrganizerSection locale={locale} />
      </main>
      <EventsFooter locale={locale} />
    </div>
  );
}
