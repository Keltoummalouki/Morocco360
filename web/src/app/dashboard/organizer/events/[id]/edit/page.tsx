import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EventForm from '@/components/EventForm';
import { decodeJwt } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

interface TicketCategory {
  id: number;
  name: string;
  price: string;
  stock_allocated: number;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date_start: string;
  date_end: string;
  location_name: string;
  city: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  total_stock: number;
  is_active: boolean;
  image_url: string | null;
  categories: TicketCategory[];
  organizer?: { id: number } | null;
}

async function getEvent(id: string): Promise<Event | null> {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const host = headerStore.get('host') ?? 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    const res = await fetch(`${protocol}://${host}/api/events/${id}`, {
      cache: 'no-store',
      headers: { cookie: cookieStore.toString() },
    });
    if (!res.ok) return null;
    return res.json() as Promise<Event>;
  } catch {
    return null;
  }
}

export default async function OrganizerEditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  // Verify the current user owns this event
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const payload = token ? decodeJwt(token) : null;
  const userId = payload?.sub;

  if (event.organizer?.id !== userId) {
    return (
      <div className="dash-page">
        <Link
          href="/dashboard/organizer/events"
          style={{ fontSize: '0.8125rem', color: 'var(--muted)', display: 'inline-block', marginBottom: '24px' }}
        >
          ← Retour aux événements
        </Link>
        <div style={{ padding: '48px 24px', textAlign: 'center', border: '1px solid #dc262630', background: '#dc262608' }}>
          <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>
            Accès refusé
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            Vous ne pouvez modifier que les événements que vous avez créés.
          </p>
        </div>
      </div>
    );
  }

  const initial = {
    title: event.title,
    description: event.description,
    date_start: event.date_start,
    date_end: event.date_end,
    location_name: event.location_name,
    city: event.city ?? '',
    category: event.category ?? '',
    latitude: event.latitude?.toString() ?? '',
    longitude: event.longitude?.toString() ?? '',
    total_stock: event.total_stock.toString(),
    is_active: event.is_active,
    image_url: event.image_url ?? '',
    categories: event.categories.map((c) => ({
      name: c.name,
      price: Number(c.price),
      stock_allocated: c.stock_allocated,
    })),
  };

  return (
    <div className="dash-page" style={{ maxWidth: '800px' }}>
      <Link
        href="/dashboard/organizer/events"
        style={{ fontSize: '0.8125rem', color: 'var(--muted)', display: 'inline-block', marginBottom: '32px' }}
      >
        ← Retour aux événements
      </Link>

      <div style={{ marginBottom: '36px' }}>
        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.2em',
            color: '#B8862D',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Espace Organisateur
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.25rem',
            fontWeight: 700,
            marginBottom: '6px',
          }}
        >
          Modifier l&apos;événement
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>{event.title}</p>
      </div>

      <EventForm initial={initial} eventId={event.id} redirectTo="/dashboard/organizer/events" />
    </div>
  );
}
