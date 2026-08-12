import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  getTranslations,
  type Locale,
} from '@/lib/i18n';
import type { UserEvent } from '@/lib/user-events';
import SavedGrid from '@/components/user/SavedGrid';

export const metadata: Metadata = { title: 'Saved' };
export const dynamic = 'force-dynamic';

async function getSaved(host: string, cookieHeader: string): Promise<UserEvent[]> {
  try {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const res = await fetch(`${protocol}://${host}/api/events/saved`, {
      cache: 'no-store',
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return [];
    return (await res.json()) as UserEvent[];
  } catch {
    return [];
  }
}

export default async function UserSavedPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get('host') ?? 'localhost:4001';

  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : DEFAULT_LOCALE;
  const t = getTranslations(locale);

  const events = await getSaved(host, cookieStore.toString());

  return (
    <div className="ev-container py-8 sm:py-12">
      <header className="mb-8">
        <div className="eyebrow mb-3">{t.app.tabSaved}</div>
        <h1 className="ev-display text-[clamp(1.7rem,4.5vw,2.6rem)]">{t.app.savedTitle}</h1>
        <p className="ev-sub">{t.app.savedSubtitle}</p>
      </header>

      <SavedGrid initialEvents={events} />
    </div>
  );
}
