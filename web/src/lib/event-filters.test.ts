import { describe, it, expect } from 'vitest';
import {
  getMinPrice,
  matchesDate,
  matchesPrice,
  matchesFrom,
  sortEvents,
  categoryColors,
  CATEGORY_COLORS,
} from './event-filters';

const cats = (...prices: number[]) => prices.map((p) => ({ price: String(p) }));

/** Build an ISO date `days` from now. */
function iso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

describe('getMinPrice', () => {
  it('returns the cheapest category', () => {
    expect(getMinPrice(cats(300, 150, 500))).toBe(150);
  });

  it('returns null when there are no categories', () => {
    expect(getMinPrice([])).toBeNull();
  });

  it('treats a free (0) category as 0, not as missing', () => {
    expect(getMinPrice(cats(0, 200))).toBe(0);
  });
});

describe('matchesPrice', () => {
  it('passes everything on "all"', () => {
    expect(matchesPrice(cats(999), 'all')).toBe(true);
  });

  it('matches free only when the minimum is exactly 0', () => {
    expect(matchesPrice(cats(0, 100), 'free')).toBe(true);
    expect(matchesPrice(cats(100), 'free')).toBe(false);
  });

  it('applies the bucket boundaries inclusively where intended', () => {
    expect(matchesPrice(cats(199), 'under200')).toBe(true);
    expect(matchesPrice(cats(200), 'under200')).toBe(false);
    expect(matchesPrice(cats(200), '200to500')).toBe(true);
    expect(matchesPrice(cats(500), '200to500')).toBe(true);
    expect(matchesPrice(cats(501), '500plus')).toBe(true);
    expect(matchesPrice(cats(500), '500plus')).toBe(false);
  });
});

describe('matchesDate', () => {
  it('passes everything on "all"', () => {
    expect(matchesDate(iso(900), 'all')).toBe(true);
  });

  it('"3months" keeps events inside the window and drops ones beyond it', () => {
    expect(matchesDate(iso(30), '3months')).toBe(true);
    expect(matchesDate(iso(200), '3months')).toBe(false);
  });

  it('"3months" drops events already in the past', () => {
    expect(matchesDate(iso(-5), '3months')).toBe(false);
  });
});

describe('matchesFrom', () => {
  it('passes everything when no `from` is set', () => {
    expect(matchesFrom({ date_end: '2020-01-01' }, '')).toBe(true);
  });

  it('keeps an event that is still running on the chosen day', () => {
    expect(matchesFrom({ date_end: '2026-08-10' }, '2026-08-01')).toBe(true);
  });

  it('keeps an event that ends exactly on the chosen day', () => {
    expect(matchesFrom({ date_end: '2026-08-01' }, '2026-08-01')).toBe(true);
  });

  it('drops an event that ended before the chosen day', () => {
    expect(matchesFrom({ date_end: '2026-07-31' }, '2026-08-01')).toBe(false);
  });
});

describe('sortEvents', () => {
  const list = [
    { title: 'B', date_start: '2026-03-01', date_end: '2026-03-02', categories: cats(300) },
    { title: 'A', date_start: '2026-01-01', date_end: '2026-01-02', categories: cats(500) },
    { title: 'C', date_start: '2026-02-01', date_end: '2026-02-02', categories: cats(100) },
  ];

  it('sorts by soonest date by default', () => {
    expect(sortEvents(list, 'date').map((e) => e.title)).toEqual(['A', 'C', 'B']);
  });

  it('sorts by lowest price', () => {
    expect(sortEvents(list, 'price').map((e) => e.title)).toEqual(['C', 'B', 'A']);
  });

  it('sorts by title A–Z', () => {
    expect(sortEvents(list, 'title').map((e) => e.title)).toEqual(['A', 'B', 'C']);
  });

  it('does not mutate the input array', () => {
    const before = list.map((e) => e.title);
    sortEvents(list, 'price');
    expect(list.map((e) => e.title)).toEqual(before);
  });
});

describe('categoryColors', () => {
  it('returns the mapped pair for a known category', () => {
    expect(categoryColors('Musique')).toEqual(CATEGORY_COLORS.Musique);
  });

  it('falls back to the neutral pair for null/unknown categories', () => {
    expect(categoryColors(null)).toEqual(CATEGORY_COLORS.Autre);
    expect(categoryColors('Nope')).toEqual(CATEGORY_COLORS.Autre);
  });
});
