'use client';

import Link from 'next/link';
import { Bookmark, MapPin, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/LocaleProvider';
import { categoryColors, getMinPrice } from '@/lib/event-filters';
import { formatEventDate, type UserEvent } from '@/lib/user-events';

export default function UserEventCard({
  event,
  isSaved,
  onToggleSave,
}: {
  event: UserEvent;
  isSaved: boolean;
  onToggleSave: (id: number, next: boolean) => void;
}) {
  const { t, locale } = useLocale();
  const te = t.events;

  const min = getMinPrice(event.categories);
  const isFree = min === 0;
  const priceLabel =
    min === null ? '—' : isFree ? te.free : `${te.from} ${min.toFixed(0)} ${te.currency}`;

  const [catLight, catDark] = categoryColors(event.category);
  const catVars = { '--cat': catLight, '--cat-dark': catDark } as React.CSSProperties;

  return (
    <Card className="ev-card ev-card--stacked relative gap-0 overflow-hidden p-0">
      <div className="ev-card-media aspect-[16/10]">
        {event.image_url ? (
          /* Remote API images — next/image would need remotePatterns config. */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={event.image_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="ev-card-img h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-accent">
            <span className="ev-display text-4xl opacity-10">M</span>
          </div>
        )}

        {!isFree && min !== null && <span className="ev-price">{priceLabel}</span>}

        {/* Save toggle */}
        <button
          type="button"
          onClick={() => onToggleSave(event.id, !isSaved)}
          aria-pressed={isSaved}
          aria-label={isSaved ? t.app.unsave : t.app.save}
          title={isSaved ? t.app.unsave : t.app.save}
          className="absolute top-3 z-3 grid size-8 place-items-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          style={{ insetInlineStart: '12px' }}
        >
          <Bookmark className="size-4" fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>

        {event.is_sold_out && (
          <div className="absolute inset-0 z-4 flex items-center justify-center bg-black/60">
            <span className="rounded-full border-2 border-white px-4 py-1.5 text-xs font-bold tracking-wider text-white uppercase">
              {te.soldOut}
            </span>
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-2 p-5">
        {event.category && (
          <span className="ev-cat ev-cat--tint" style={catVars}>
            {event.category}
          </span>
        )}
        <h3 className="ev-card-title line-clamp-2 text-foreground">{event.title}</h3>
        <div className="ev-card-meta text-muted-foreground">
          <MapPin size={14} aria-hidden="true" />
          <span>{event.city ?? event.location_name}</span>
          <span aria-hidden="true">·</span>
          <CalendarDays size={14} aria-hidden="true" />
          <span>{formatEventDate(event.date_start, locale)}</span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3 border-t border-border p-4">
        <span className="ev-display text-base">{priceLabel}</span>
        {event.is_sold_out ? (
          <span className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
            {te.soldOut}
          </span>
        ) : (
          <Button asChild size="sm">
            <Link href={`/user/events/${event.id}`}>{te.reserve}</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
