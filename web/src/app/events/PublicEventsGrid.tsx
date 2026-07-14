'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Search, MapPin, CalendarDays, X } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  EVENT_CATEGORIES,
  ANY_VALUE,
  categoryColors,
  getMinPrice,
  matchesDate,
  matchesPrice,
  matchesFrom,
  sortEvents,
} from '@/lib/event-filters';
import { selectContentFit, selectItemWrap } from '@/lib/utils';
import type { InitialFilters, PublicEvent } from './page';

// ── Constants ──────────────────────────────────────────────

/** "No city filter" sentinel — Radix Select forbids an empty-string value. */
const ANY_CITY = ANY_VALUE;


// ── Helpers ────────────────────────────────────────────────
// Filtering/sorting lives in @/lib/event-filters so the public grid and the
// signed-in /user/events browser stay in sync.

/** Update the URL bar without navigating, so filters stay shareable. */
function syncUrl(
  q: string, category: string, city: string,
  date: string, from: string, price: string, sort: string,
) {
  if (typeof window === 'undefined') return;
  const p = new URLSearchParams();
  if (q.trim()) p.set('q', q.trim());
  if (category) p.set('category', category);
  if (city !== ANY_CITY) p.set('city', city);
  if (date !== 'all') p.set('date', date);
  if (from) p.set('from', from);
  if (price !== 'all') p.set('price', price);
  if (sort !== 'date') p.set('sort', sort);
  const qs = p.toString();
  window.history.replaceState(null, '', qs ? `/events?${qs}` : '/events');
}

// ── Event card ─────────────────────────────────────────────

function EventCard({
  event,
  isAuthenticated,
  locale,
}: {
  event: PublicEvent;
  isAuthenticated: boolean;
  locale: string;
}) {
  const { t } = useLocale();
  const min = getMinPrice(event.categories);
  const isFree = min === 0;
  const priceLabel =
    min === null ? '—' : isFree ? t.events.free : `${t.events.from} ${min.toFixed(0)} ${t.events.currency}`;

  const reserveHref = isAuthenticated
    ? `/user/events/${event.id}`
    : `/login?redirect=/user/events/${event.id}`;

  const bcp = locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-GB';
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(bcp, { day: 'numeric', month: 'short', year: 'numeric' });

  const [catLight, catDark] = categoryColors(event.category);

  return (
    <Card className="ev-card relative flex flex-col overflow-hidden p-0 gap-0">
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-muted">
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
          <div className="flex h-full w-full items-center justify-center bg-[var(--surface-3)]">
            <span className="ev-display text-4xl opacity-10">M</span>
          </div>
        )}

        {event.category && (
          <span
            className="ev-cat ev-cat--tint absolute top-3 z-[3]"
            style={
              {
                insetInlineStart: '12px',
                '--cat': catLight,
                '--cat-dark': catDark,
              } as React.CSSProperties
            }
          >
            {event.category}
          </span>
        )}

        {!isFree && min !== null && <span className="ev-price">{priceLabel}</span>}

        {event.is_sold_out && (
          <div className="absolute inset-0 z-[4] flex items-center justify-center bg-black/60">
            <span className="rounded-full border-2 border-white px-4 py-1.5 text-xs font-bold tracking-wider text-white uppercase">
              {t.events.soldOut}
            </span>
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-2 p-5">
        <div className="ev-card-meta text-muted-foreground">
          <MapPin size={14} aria-hidden="true" />
          <span>{event.city ?? event.location_name}</span>
          <span aria-hidden="true">·</span>
          <CalendarDays size={14} aria-hidden="true" />
          <span>{fmt(event.date_start)}</span>
        </div>

        <h3 className="ev-card-title line-clamp-2 text-foreground">{event.title}</h3>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {event.description}
        </p>

        {event.date_end !== event.date_start && (
          <p className="mt-auto pt-1 text-xs text-muted-foreground">
            {t.events.until} {fmt(event.date_end)}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3 border-t border-border p-4">
        <span className="ev-display text-base">{priceLabel}</span>
        {event.is_sold_out ? (
          <span className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
            {t.events.soldOut}
          </span>
        ) : (
          <Button asChild size="sm">
            <Link href={reserveHref}>
              {isAuthenticated ? t.events.reserve : t.events.signInToReserve}
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────

export default function PublicEventsGrid({
  events,
  isAuthenticated,
  initialFilters,
}: {
  events: PublicEvent[];
  isAuthenticated: boolean;
  initialFilters: InitialFilters;
}) {
  const { t, locale } = useLocale();

  const [search, setSearch] = useState(initialFilters.q ?? '');
  const [category, setCategory] = useState(initialFilters.category ?? '');
  const [city, setCity] = useState(initialFilters.city || ANY_CITY);
  const [date, setDate] = useState(initialFilters.date ?? 'all');
  const [from, setFrom] = useState(initialFilters.from ?? '');
  const [price, setPrice] = useState(initialFilters.price ?? 'all');
  const [sort, setSort] = useState(initialFilters.sort ?? 'date');
  const [fromOpen, setFromOpen] = useState(false);

  // Skip the first run — the URL already reflects the initial filters.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    syncUrl(search, category, city, date, from, price, sort);
  }, [search, category, city, date, from, price, sort]);

  const cities = useMemo(() => {
    const set = new Set(events.map((e) => e.city).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    const result = events.filter((e) => {
      if (q) {
        const hit =
          e.title.toLowerCase().includes(q) ||
          (e.city ?? '').toLowerCase().includes(q) ||
          e.location_name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (category && e.category !== category) return false;
      if (city !== ANY_CITY && e.city !== city) return false;
      if (!matchesDate(e.date_start, date)) return false;
      if (!matchesFrom(e, from)) return false;
      if (!matchesPrice(e.categories, price)) return false;
      return true;
    });

    return sortEvents(result, sort);
  }, [events, search, category, city, date, from, price, sort]);

  const hasFilters = !!(
    search || category || city !== ANY_CITY || date !== 'all' || from || price !== 'all'
  );

  function resetFilters() {
    setSearch('');
    setCategory('');
    setCity(ANY_CITY);
    setDate('all');
    setFrom('');
    setPrice('all');
    setSort('date');
  }

  const bcp = locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-GB';
  const fromLabel = from
    ? new Intl.DateTimeFormat(bcp, { day: 'numeric', month: 'short', year: 'numeric' })
        .format(new Date(`${from}T00:00:00`))
    : t.events.from;

  const DATE_OPTIONS = [
    { value: 'all', label: t.dates.all },
    { value: 'month', label: t.dates.month },
    { value: '3months', label: t.dates.threeMonths },
    { value: 'year', label: t.dates.year },
  ];
  const PRICE_OPTIONS = [
    { value: 'all', label: t.events.allPrices },
    { value: 'free', label: t.events.priceFree },
    { value: 'under200', label: t.events.priceUnder200 },
    { value: '200to500', label: t.events.price200to500 },
    { value: '500plus', label: t.events.price500plus },
  ];
  const SORT_OPTIONS = [
    { value: 'date', label: t.events.sortDate },
    { value: 'price', label: t.events.sortPrice },
    { value: 'title', label: t.events.sortTitle },
  ];

  return (
    <>
      {/* ── Search ──────────────────────────────────────── */}
      <div className="relative max-w-lg">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground"
          style={{ insetInlineStart: '12px' }}
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.events.searchPlaceholder}
          aria-label={t.events.searchPlaceholder}
          className="h-11 ps-10"
        />
      </div>

      {/* ── Category chips ──────────────────────────────── */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={category === '' ? 'default' : 'outline'}
          className="rounded-full"
          onClick={() => setCategory('')}
        >
          {t.events.allCategories}
        </Button>
        {EVENT_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            type="button"
            size="sm"
            variant={category === cat ? 'default' : 'outline'}
            className="rounded-full"
            onClick={() => setCategory(category === cat ? '' : cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* ── City / date / price ─────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
        {/* City names come from the data and can be very long, so the panel is
            pinned to the trigger width and long labels wrap. */}
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-full lg:w-[190px]" aria-label={t.events.allCities}>
            <SelectValue placeholder={t.events.allCities} />
          </SelectTrigger>
          <SelectContent position="popper" className={selectContentFit}>
            <SelectItem value={ANY_CITY} className={selectItemWrap}>
              {t.events.allCities}
            </SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c} className={selectItemWrap}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={date} onValueChange={setDate}>
          <SelectTrigger className="w-full lg:w-[190px]" aria-label={t.dates.all}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className={selectContentFit}>
            {DATE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className={selectItemWrap}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* "From" date — this is what the home hero's date picker sends. */}
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={`w-full justify-start font-normal lg:w-[190px] ${from ? '' : 'text-muted-foreground'}`}
            >
              <CalendarDays size={16} aria-hidden="true" />
              <span className="truncate">{fromLabel}</span>
              {from && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={t.events.reset}
                  className="ms-auto rounded p-0.5 hover:bg-accent"
                  onClick={(e) => { e.stopPropagation(); setFrom(''); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setFrom(''); }
                  }}
                >
                  <X size={14} aria-hidden="true" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={from ? new Date(`${from}T00:00:00`) : undefined}
              onSelect={(d) => {
                setFrom(d ? format(d, 'yyyy-MM-dd') : '');
                setFromOpen(false);
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>

        <Select value={price} onValueChange={setPrice}>
          <SelectTrigger className="w-full lg:w-[190px]" aria-label={t.events.allPrices}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className={selectContentFit}>
            {PRICE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className={selectItemWrap}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="justify-self-start">
            {t.events.reset}
          </Button>
        )}
      </div>

      {/* ── Count + sort ────────────────────────────────── */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">
          {filtered.length === events.length
            ? `${events.length} ${events.length === 1 ? t.events.event : t.events.events}`
            : `${filtered.length} ${filtered.length === 1 ? t.events.result : t.events.results} ${t.events.of} ${events.length}`}
        </p>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-[190px]" aria-label={t.events.sortDate}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className={selectContentFit}>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className={selectItemWrap}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Grid ────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border px-6 py-20 text-center">
          <p className="ev-h2 mb-2 text-xl">{t.events.noResults}</p>
          <p className="mb-5 text-sm text-muted-foreground">{t.events.noResultsHint}</p>
          {hasFilters && (
            <Button type="button" variant="outline" onClick={resetFilters}>
              {t.events.resetAll}
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isAuthenticated={isAuthenticated}
              locale={locale}
            />
          ))}
        </div>
      )}

      {/* ── Guest CTA ───────────────────────────────────── */}
      {!isAuthenticated && filtered.length > 0 && (
        <div className="mt-12 flex flex-col items-center gap-4 rounded-xl border border-border bg-muted p-8 text-center">
          <p className="ev-h2 text-xl">{t.events.readyTitle}</p>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {t.events.readyBody}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/register">{t.events.createAccount}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">{t.events.signInCta}</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
