import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EventForm from '@/components/EventForm';

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

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

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
    <div style={{ padding: '40px 48px', maxWidth: '800px' }}>
      <Link
        href="/dashboard/admin/events"
        style={{ fontSize: '0.8125rem', color: 'var(--muted)', display: 'inline-block', marginBottom: '32px' }}
      >
        ← Retour aux événements
      </Link>

      <div style={{ marginBottom: '36px' }}>
        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.2em',
            color: '#C2533A',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Administration
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

      <EventForm initial={initial} eventId={event.id} />
    </div>
  );
}
