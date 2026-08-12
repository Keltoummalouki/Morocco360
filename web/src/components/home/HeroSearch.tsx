'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { MapPin, SlidersHorizontal, CalendarDays, Search } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { EVENT_CATEGORIES, ANY_VALUE } from '@/lib/event-filters';
import { selectContentFit, selectItemWrap } from '@/lib/utils';

/** Borderless control so shadcn sits flush inside the .ev-search bar. */
const FLUSH =
  'h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent';

export default function HeroSearch() {
  const { t, locale } = useLocale();
  const h = t.home;
  const router = useRouter();

  const [where, setWhere] = useState('');
  const [category, setCategory] = useState<string>(ANY_VALUE);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const bcp = locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-GB';
  const dateLabel = date
    ? new Intl.DateTimeFormat(bcp, { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
    : h.searchDate;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (where.trim()) params.set('q', where.trim());
    if (category !== ANY_VALUE) params.set('category', category);
    // `from` = show events still running on/after this day (see PublicEventsGrid).
    if (date) params.set('from', format(date, 'yyyy-MM-dd'));
    const qs = params.toString();
    router.push(`/events${qs ? `?${qs}` : ''}`);
  }

  return (
    <form className="ev-search" onSubmit={submit} role="search">
      {/* Where */}
      <div className="ev-search-field">
        <MapPin size={16} aria-hidden="true" />
        <input
          className="ev-search-input"
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          placeholder={h.searchWhere}
          aria-label={h.searchWhere}
        />
      </div>

      {/* Type / category */}
      <div className="ev-search-field">
        <SlidersHorizontal size={16} aria-hidden="true" />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className={FLUSH} aria-label={h.searchAll}>
            <SelectValue placeholder={h.searchAll} />
          </SelectTrigger>
          <SelectContent position="popper" className={selectContentFit}>
            <SelectItem value={ANY_VALUE} className={selectItemWrap}>
              {h.searchAll}
            </SelectItem>
            {EVENT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className={selectItemWrap}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date */}
      <div className="ev-search-field">
        <CalendarDays size={16} aria-hidden="true" />
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`${FLUSH} flex items-center text-start text-sm ${
                date ? 'text-[var(--foreground)]' : 'text-[var(--muted-dim)]'
              }`}
              aria-label={h.searchDate}
            >
              {dateLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setCalendarOpen(false);
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <button className="ev-search-btn" type="submit">
        <Search size={16} aria-hidden="true" />
        {h.searchBtn}
      </button>
    </form>
  );
}
