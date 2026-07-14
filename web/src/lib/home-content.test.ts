import { describe, it, expect } from 'vitest';
import { formatPrice, TRENDING } from './home-content';

describe('formatPrice', () => {
  it('prefixes the localized "from" label and keeps the currency', () => {
    expect(formatPrice(150, 'DH', 'en')).toBe('From 150 DH');
    expect(formatPrice(150, 'DH', 'fr')).toBe('Dès 150 DH');
    expect(formatPrice(150, 'DH', 'ar')).toBe('من 150 DH');
  });

  it('falls back to English for an unknown locale', () => {
    expect(formatPrice(400, 'DH', 'de')).toBe('From 400 DH');
  });
});

describe('TRENDING data integrity', () => {
  it('gives every event a stable id', () => {
    const ids = TRENDING.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only marks `fill` cards as tall (the bento column relies on it)', () => {
    for (const e of TRENDING) {
      if (e.tall) expect(e.variant).toBe('fill');
    }
  });

  it('free events use null price so the card renders the free label, not "From 0"', () => {
    const free = TRENDING.filter((e) => e.price === null);
    expect(free.length).toBeGreaterThan(0);
    for (const e of free) expect(e.price).toBeNull();
  });
});
