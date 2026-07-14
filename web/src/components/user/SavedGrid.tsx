'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/LocaleProvider';
import { Button } from '@/components/ui/button';
import type { UserEvent } from '@/lib/user-events';
import UserEventCard from './UserEventCard';
import Paginator from './Paginator';

const PAGE_SIZE = 9;

export default function SavedGrid({ initialEvents }: { initialEvents: UserEvent[] }) {
  const { t } = useLocale();
  const [events, setEvents] = useState(initialEvents);
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(events.length / PAGE_SIZE));

  // Removing the last item on a page would strand us past the end.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageItems = events.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /** Only "unsave" is meaningful here — drop the card, restore it if it fails. */
  async function toggleSave(id: number, next: boolean) {
    if (next) return;
    const previous = events;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/events/${id}/save`, { method: 'DELETE' });
      if (!res.ok) throw new Error('unsave failed');
    } catch {
      setEvents(previous);
    }
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <p className="mb-4 text-muted-foreground">{t.app.savedEmpty}</p>
        <Button asChild variant="outline">
          <Link href="/user/events">{t.app.discover}</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((event) => (
          <UserEventCard key={event.id} event={event} isSaved onToggleSave={toggleSave} />
        ))}
      </div>
      <Paginator page={page} pageCount={pageCount} onChange={setPage} />
    </>
  );
}
