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
import UserEventsBrowser from '@/components/user/UserEventsBrowser';

export const metadata: Metadata = { title: 'Events' };
export const dynamic = 'force-dynamic';

async function getJson<T>(host: string, cookieHeader: string, path: string, fallback: T): Promise<T> {
  try {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const res = await fetch(`${protocol}://${host}${path}`, {
      cache: 'no-store',
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export default async function UserEventsPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get('host') ?? 'localhost:4001';
  const cookieHeader = cookieStore.toString();

  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : DEFAULT_LOCALE;
  const t = getTranslations(locale);

  const [events, saved] = await Promise.all([
    getJson<UserEvent[]>(host, cookieHeader, '/api/events', []),
    getJson<{ id: number }[]>(host, cookieHeader, '/api/events/saved', []),
  ]);

  return (
    <div className="ev-container py-8 sm:py-12">
      <header className="mb-8">
        <div className="eyebrow mb-3">{t.events.discover}</div>
        <h1 className="ev-display text-[clamp(1.7rem,4.5vw,2.6rem)]">{t.events.title}</h1>
        <p className="ev-sub">{t.events.subtitle}</p>
      </header>

      <UserEventsBrowser events={events} initialSavedIds={saved.map((e) => e.id)} />
    </div>
  );
}
