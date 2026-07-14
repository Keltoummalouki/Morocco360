import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  getTranslations,
  type Locale,
} from '@/lib/i18n';
import { formatEventDateLong, type EventTicketCategory } from '@/lib/user-events';
import { Button } from '@/components/ui/button';
import BookingPanel from '@/components/user/BookingPanel';
import SaveEventButton from '@/components/user/SaveEventButton';

export const dynamic = 'force-dynamic';

interface Organizer {
  id: number;
  username?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
}

interface EventDetail {
  id: number;
  title: string;
  description: string;
  date_start: string;
  date_end: string;
  location_name: string;
  city: string | null;
  category: string | null;
  image_url: string | null;
  total_stock: number;
  is_active: boolean;
  organizer: Organizer | null;
  categories: EventTicketCategory[];
}

async function getJson<T>(host: string, cookieHeader: string, path: string): Promise<T | null> {
  try {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const res = await fetch(`${protocol}://${host}${path}`, {
      cache: 'no-store',
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** The API may expose the organizer as full_name, first/last, or just email. */
function organizerName(o: Organizer): string {
  if (o.full_name) return o.full_name;
  const both = [o.first_name, o.last_name].filter(Boolean).join(' ').trim();
  if (both) return both;
  return o.username ?? o.email;
}

export default async function UserEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get('host') ?? 'localhost:4001';
  const cookieHeader = cookieStore.toString();

  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : DEFAULT_LOCALE;
  const t = getTranslations(locale);

  const [event, saved] = await Promise.all([
    getJson<EventDetail>(host, cookieHeader, `/api/events/${id}`),
    getJson<{ id: number }[]>(host, cookieHeader, '/api/events/saved'),
  ]);

  if (!event) notFound();

  const isSaved = (saved ?? []).some((e) => e.id === event.id);

  return (
    <div className="ev-container py-6 sm:py-10">
      <Button asChild variant="ghost" size="sm" className="mb-5 -ms-2">
        <Link href="/user/events">
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t.app.back}
        </Link>
      </Button>

      {/* Hero */}
      <div className="relative mb-8 h-56 overflow-hidden rounded-2xl bg-accent sm:h-72">
        {event.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={event.image_url}
            alt=""
            className="h-full w-full object-cover"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="ev-display text-6xl opacity-10">M</span>
          </div>
        )}
        {event.is_active && (
          <span className="absolute top-4 z-3 rounded-full bg-[var(--success-bg)] px-3 py-1 text-xs font-semibold text-[var(--success)]" style={{ insetInlineEnd: '16px' }}>
            {t.app.available}
          </span>
        )}
      </div>

      <div className="flex flex-col items-start gap-8 lg:flex-row">
        {/* Main */}
        <article className="min-w-0 flex-1">
          <p className="ev-card-meta mb-2 text-muted-foreground">
            <MapPin size={14} aria-hidden="true" />
            {event.city ? `${event.location_name}, ${event.city}` : event.location_name}
          </p>

          <h1 className="ev-display text-[clamp(1.6rem,4vw,2.4rem)]">{event.title}</h1>

          <div className="mt-5 flex flex-wrap gap-3">
            <SaveEventButton eventId={event.id} initialSaved={isSaved} />
          </div>

          <section className="mt-8 border-t border-border pt-6">
            <h2 className="eyebrow mb-3">{t.app.datesSection}</h2>
            <p className="font-medium">{formatEventDateLong(event.date_start, locale)}</p>
            {event.date_end !== event.date_start && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t.events.until} {formatEventDateLong(event.date_end, locale)}
              </p>
            )}
          </section>

          <section className="mt-7">
            <h2 className="eyebrow mb-3">{t.app.aboutSection}</h2>
            <p className="text-[0.9375rem] leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </section>

          {event.organizer && (
            <section className="mt-7">
              <h2 className="eyebrow mb-3">{t.app.organizerSection}</h2>
              <p className="font-medium">{organizerName(event.organizer)}</p>
              <p className="text-sm text-muted-foreground">{event.organizer.email}</p>
            </section>
          )}
        </article>

        <BookingPanel
          eventId={event.id}
          categories={event.categories}
          dateStart={event.date_start}
          dateEnd={event.date_end}
          totalStock={event.total_stock}
        />
      </div>
    </div>
  );
}
