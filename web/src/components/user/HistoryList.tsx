'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, MapPin, Ticket } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatEventDateLong } from '@/lib/user-events';
import Paginator from './Paginator';

export interface OrderTicketEvent {
  id: number | null;
  title: string | null;
  date_start: string | null;
  location_name: string | null;
  city: string | null;
}

export interface OrderTicket {
  id: number;
  status: 'VALID' | 'USED' | 'CANCELLED';
  category: string | null;
  event: OrderTicketEvent;
}

export interface Order {
  id: number;
  created_at: string;
  total_amount: string;
  tickets: OrderTicket[];
}

const PAGE_SIZE = 6;

function OrderCard({ order }: { order: Order }) {
  const { t, locale } = useLocale();
  const ta = t.app;
  const te = t.events;

  const event = order.tickets[0]?.event;
  const count = order.tickets.length;
  const amount = Number(order.total_amount);
  const totalLabel = amount === 0 ? te.free : `${amount.toFixed(0)} ${te.currency}`;

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="ev-card-title truncate text-foreground">
            {event?.title ?? te.event}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ta.order} #{order.id}
            {event?.date_start ? ` · ${formatEventDateLong(event.date_start, locale)}` : ''}
          </p>
        </div>

        {/* The PDF route streams a file — a real link, not a fetch. */}
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <a
            href={`/api/payments/order/${order.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="size-4" aria-hidden="true" />
            {ta.downloadPdf}
          </a>
        </Button>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        {event?.location_name && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} aria-hidden="true" />
            {event.city ? `${event.location_name}, ${event.city}` : event.location_name}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Ticket size={14} aria-hidden="true" />
          {count} {count > 1 ? ta.ticketMany : ta.ticketOne} · {totalLabel}
        </span>
      </div>
    </Card>
  );
}

export default function HistoryList({ orders }: { orders: Order[] }) {
  const { t } = useLocale();
  const ta = t.app;
  const [page, setPage] = useState(1);

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <p className="mb-4 text-muted-foreground">{ta.historyEmpty}</p>
        <Button asChild variant="outline">
          <Link href="/user/events">{ta.discover}</Link>
        </Button>
      </div>
    );
  }

  const now = new Date();
  const upcoming: Order[] = [];
  const past: Order[] = [];
  for (const order of orders) {
    const d = order.tickets[0]?.event?.date_start;
    const when = d ? new Date(d) : null;
    if (when && when >= now) upcoming.push(order);
    else past.push(order);
  }

  // Upcoming first, then past — paginated as one stream so paging is simple.
  const ordered = [...upcoming, ...past];
  const pageCount = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  const pageItems = ordered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const upcomingIds = new Set(upcoming.map((o) => o.id));
  const upcomingOnPage = pageItems.filter((o) => upcomingIds.has(o.id));
  const pastOnPage = pageItems.filter((o) => !upcomingIds.has(o.id));

  return (
    <>
      {upcomingOnPage.length > 0 && (
        <section className="mb-8">
          <h2 className="eyebrow mb-4">{ta.upcoming}</h2>
          <div className="flex flex-col gap-4">
            {upcomingOnPage.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}

      {pastOnPage.length > 0 && (
        <section>
          <h2 className="eyebrow mb-4">{ta.past}</h2>
          <div className="flex flex-col gap-4">
            {pastOnPage.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}

      <Paginator page={page} pageCount={pageCount} onChange={setPage} />
    </>
  );
}
