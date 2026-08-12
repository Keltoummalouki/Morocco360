import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, type EventItem } from '@/lib/home-content';

function MetaIcons({ dateLabel, city }: { dateLabel: string; city: string }) {
  return (
    <div className="ev-card-meta">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />
      </svg>
      <span>{dateLabel}</span>
      <span aria-hidden="true">·</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" />
      </svg>
      <span>{city}</span>
    </div>
  );
}

export default function EventCard({
  event,
  freeLabel,
  locale,
}: {
  event: EventItem;
  freeLabel: string;
  locale: string;
}) {
  const price = event.price === null ? null : formatPrice(event.price, event.currency, locale);
  const isFill = event.variant === 'fill';

  /* The badge hue is handed to CSS as a custom property so the stylesheet can
     swap to the lightened variant under [data-theme="dark"] (contrast). */
  const catVars = {
    '--cat': event.categoryColor,
    '--cat-dark': event.categoryColorDark,
  } as React.CSSProperties;

  /* No public /events/[id] route exists yet, so deep-link into the listing
     instead of a 404. Point this at /events/${event.id} once that page lands. */
  const href = `/events?event=${event.id}`;

  /* Badges live inside the media so they always sit over the photo — including
     the `split` variant, whose image is only the leading 42% of the card.
     The gradient `tint` stays as the backdrop while the photo loads. */
  const media = (
    <div className="ev-card-media" style={{ background: event.tint }}>
      {event.image && (
        <Image
          src={event.image}
          alt=""
          fill
          className="ev-card-img"
          sizes="(max-width: 760px) 100vw, 620px"
        />
      )}
      {isFill && <span className="ev-cat ev-cat--glass">{event.category}</span>}
      {price && <span className="ev-price">{price}</span>}
    </div>
  );

  if (isFill) {
    return (
      <Link href={href} className={`ev-card ev-card--fill${event.tall ? ' ev-card--tall' : ''}`}>
        {media}
        <div className="ev-card-body">
          <h3 className="ev-card-title">{event.title}</h3>
          <MetaIcons dateLabel={event.dateLabel} city={event.city} />
        </div>
      </Link>
    );
  }

  if (event.variant === 'stacked') {
    return (
      <Link href={href} className="ev-card ev-card--stacked">
        {media}
        <div className="ev-card-body">
          <span className="ev-cat ev-cat--tint" style={catVars}>{event.category}</span>
          <h3 className="ev-card-title">{event.title}</h3>
          <MetaIcons dateLabel={event.dateLabel} city={event.city} />
        </div>
      </Link>
    );
  }

  // split — image leading, content trailing
  return (
    <Link href={href} className="ev-card ev-card--split">
      {media}
      <div className="ev-card-body">
        <span className="ev-cat ev-cat--tint" style={catVars}>{event.category}</span>
        <h3 className="ev-card-title">{event.title}</h3>
        <MetaIcons dateLabel={event.dateLabel} city={event.city} />
        {!price && (
          <span className="ev-card-free">
            {freeLabel} <span className="ev-arrow" aria-hidden="true">→</span>
          </span>
        )}
      </div>
    </Link>
  );
}
