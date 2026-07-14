/**
 * Shared event filtering/sorting. Used by both the public /events grid and the
 * signed-in /user/events browser so the two can never drift apart.
 */

export const EVENT_CATEGORIES = [
  'Musique',
  'Sport',
  'Culture',
  'Cinema',
  'Humour',
  'Art',
  'Autre',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/** Radix Select forbids an empty-string value, so "no filter" needs a sentinel. */
export const ANY_VALUE = '__any__';

/**
 * Category label → [light, dark] badge hue.
 * The dark variant is lightened so the label keeps >= 4.5:1 contrast on the
 * dark card surface (a real Lighthouse finding on the public grid).
 */
export const CATEGORY_COLORS: Record<string, [string, string]> = {
  Musique: ['#0055A4', '#8FBCFF'],
  Sport: ['#0E7490', '#6FD8EC'],
  Culture: ['#7B5800', '#FDD589'],
  Cinema: ['#5B21B6', '#CBB4F7'],
  Humour: ['#AA131F', '#FF9B93'],
  Art: ['#9D174D', '#F7A8C9'],
  Autre: ['#424751', '#B8C4D0'],
};

/** Look up a category's [light, dark] hue, falling back to the neutral one. */
export function categoryColors(category: string | null): [string, string] {
  return (category && CATEGORY_COLORS[category]) || CATEGORY_COLORS.Autre;
}

/** Minimal shape the helpers below need. */
export interface FilterableEvent {
  date_start: string;
  date_end: string;
  title: string;
  categories: { price: string }[];
}

export function getMinPrice(categories: { price: string }[]): number | null {
  if (!categories?.length) return null;
  return Math.min(...categories.map((c) => Number(c.price)));
}

/** Preset date ranges: 'all' | 'month' | '3months' | 'year'. */
export function matchesDate(dateStart: string, filter: string): boolean {
  if (filter === 'all') return true;
  const now = new Date();
  const start = new Date(dateStart);
  if (filter === 'month') {
    return start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth();
  }
  if (filter === '3months') {
    const limit = new Date(now);
    limit.setMonth(limit.getMonth() + 3);
    return start >= now && start <= limit;
  }
  if (filter === 'year') return start.getFullYear() === now.getFullYear();
  return true;
}

/** Price buckets: 'all' | 'free' | 'under200' | '200to500' | '500plus'. */
export function matchesPrice(categories: { price: string }[], filter: string): boolean {
  if (filter === 'all') return true;
  const min = getMinPrice(categories);
  if (min === null) return true;
  if (filter === 'free') return min === 0;
  if (filter === 'under200') return min < 200;
  if (filter === '200to500') return min >= 200 && min <= 500;
  if (filter === '500plus') return min > 500;
  return true;
}

/** Keep events still running on/after `from` (ISO YYYY-MM-DD). */
export function matchesFrom(event: { date_end: string }, from: string): boolean {
  if (!from) return true;
  return event.date_end.slice(0, 10) >= from;
}

/** Sort by 'date' (soonest) | 'price' (lowest) | 'title' (A–Z). */
export function sortEvents<T extends FilterableEvent>(list: T[], sort: string): T[] {
  if (sort === 'price') {
    return [...list].sort(
      (a, b) => (getMinPrice(a.categories) ?? Infinity) - (getMinPrice(b.categories) ?? Infinity),
    );
  }
  if (sort === 'title') {
    return [...list].sort((a, b) => a.title.localeCompare(b.title));
  }
  return [...list].sort(
    (a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime(),
  );
}
