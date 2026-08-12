'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Search, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  EVENT_CATEGORIES, ANY_VALUE, matchesDate, matchesPrice, sortEvents,
} from '@/lib/event-filters';
import { selectContentFit, selectItemWrap } from '@/lib/utils';
import type { UserEvent } from '@/lib/user-events';
import UserEventCard from './UserEventCard';
import Paginator from './Paginator';

// Leaflet touches `window` on import — keep it out of the server bundle.
const EventsMap = dynamic(() => import('./EventsMap'), { ssr: false });

const PAGE_SIZE = 9;

export default function UserEventsBrowser({
  events,
  initialSavedIds,
}: {
  events: UserEvent[];
  initialSavedIds: number[];
}) {
  const { t } = useLocale();
  const te = t.events;

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState(ANY_VALUE);
  const [date, setDate] = useState('all');
  const [price, setPrice] = useState('all');
  const [sort, setSort] = useState('date');
  const [page, setPage] = useState(1);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set(initialSavedIds));

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
      if (city !== ANY_VALUE && e.city !== city) return false;
      if (!matchesDate(e.date_start, date)) return false;
      if (!matchesPrice(e.categories, price)) return false;
      return true;
    });
    return sortEvents(result, sort);
  }, [events, search, category, city, date, price, sort]);

  // Any filter change invalidates the current page.
  useEffect(() => {
    setPage(1);
  }, [search, category, city, date, price, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilters = !!(
    search || category || city !== ANY_VALUE || date !== 'all' || price !== 'all'
  );

  function resetFilters() {
    setSearch('');
    setCategory('');
    setCity(ANY_VALUE);
    setDate('all');
    setPrice('all');
    setSort('date');
  }

  /** Optimistic save/unsave — rolls back if the request fails. */
  async function toggleSave(id: number, next: boolean) {
    setSavedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });

    try {
      const res = await fetch(`/api/events/${id}/save`, {
        method: next ? 'POST' : 'DELETE',
      });
      if (!res.ok) throw new Error('save failed');
    } catch {
      setSavedIds((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(id);
        else copy.add(id);
        return copy;
      });
    }
  }

  const DATE_OPTIONS = [
    { value: 'all', label: t.dates.all },
    { value: 'month', label: t.dates.month },
    { value: '3months', label: t.dates.threeMonths },
    { value: 'year', label: t.dates.year },
  ];
  const PRICE_OPTIONS = [
    { value: 'all', label: te.allPrices },
    { value: 'free', label: te.priceFree },
    { value: 'under200', label: te.priceUnder200 },
    { value: '200to500', label: te.price200to500 },
    { value: '500plus', label: te.price500plus },
  ];
  const SORT_OPTIONS = [
    { value: 'date', label: te.sortDate },
    { value: 'price', label: te.sortPrice },
    { value: 'title', label: te.sortTitle },
  ];

  return (
    <Tabs defaultValue="grid">
      {/* ── Search ────────────────────────────────────── */}
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
          placeholder={te.searchPlaceholder}
          aria-label={te.searchPlaceholder}
          className="h-11 ps-10"
        />
      </div>

      {/* ── Category chips ────────────────────────────── */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={category === '' ? 'default' : 'outline'}
          className="rounded-full"
          onClick={() => setCategory('')}
        >
          {te.allCategories}
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

      {/* ── Filters + view toggle ─────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-full lg:w-[180px]" aria-label={te.allCities}>
            <SelectValue placeholder={te.allCities} />
          </SelectTrigger>
          <SelectContent position="popper" className={selectContentFit}>
            <SelectItem value={ANY_VALUE} className={selectItemWrap}>{te.allCities}</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c} className={selectItemWrap}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={date} onValueChange={setDate}>
          <SelectTrigger className="w-full lg:w-[180px]" aria-label={t.dates.all}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className={selectContentFit}>
            {DATE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className={selectItemWrap}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={price} onValueChange={setPrice}>
          <SelectTrigger className="w-full lg:w-[180px]" aria-label={te.allPrices}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className={selectContentFit}>
            {PRICE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className={selectItemWrap}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            {te.reset}
          </Button>
        )}

        <TabsList className="lg:ms-auto">
          <TabsTrigger value="grid">
            <LayoutGrid className="size-4" aria-hidden="true" /> {te.gridView}
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapIcon className="size-4" aria-hidden="true" /> {te.mapView}
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ── Count + sort ──────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">
          {filtered.length === events.length
            ? `${events.length} ${events.length === 1 ? te.event : te.events}`
            : `${filtered.length} ${filtered.length === 1 ? te.result : te.results} ${te.of} ${events.length}`}
        </p>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-[180px]" aria-label={te.sortDate}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className={selectContentFit}>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className={selectItemWrap}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Grid ──────────────────────────────────────── */}
      <TabsContent value="grid" className="mt-6">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border px-6 py-20 text-center">
            <p className="ev-h2 mb-2 text-xl">{te.noResults}</p>
            <p className="mb-5 text-sm text-muted-foreground">{te.noResultsHint}</p>
            {hasFilters && (
              <Button type="button" variant="outline" onClick={resetFilters}>
                {te.resetAll}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((event) => (
                <UserEventCard
                  key={event.id}
                  event={event}
                  isSaved={savedIds.has(event.id)}
                  onToggleSave={toggleSave}
                />
              ))}
            </div>
            <Paginator page={page} pageCount={pageCount} onChange={setPage} />
          </>
        )}
      </TabsContent>

      {/* ── Map (all filtered results, not just this page) ─ */}
      <TabsContent value="map" className="mt-6">
        <EventsMap events={filtered} />
      </TabsContent>
    </Tabs>
  );
}
