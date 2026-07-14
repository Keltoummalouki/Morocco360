import { describe, it, expect } from 'vitest';
import { buildRange, pageCountFor } from './pagination';

describe('buildRange', () => {
  it('lists every page when there are few enough to fit', () => {
    expect(buildRange(1, 1)).toEqual([1]);
    expect(buildRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('collapses the tail when near the start', () => {
    expect(buildRange(2, 20)).toEqual([1, 2, 3, 4, 5, '…', 20]);
  });

  it('collapses the head when near the end', () => {
    expect(buildRange(19, 20)).toEqual([1, '…', 16, 17, 18, 19, 20]);
  });

  it('collapses both sides in the middle', () => {
    expect(buildRange(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20]);
  });

  it('always includes the current page', () => {
    for (let p = 1; p <= 20; p++) {
      expect(buildRange(p, 20)).toContain(p);
    }
  });

  it('never emits a page outside 1..pageCount', () => {
    for (let p = 1; p <= 20; p++) {
      for (const entry of buildRange(p, 20)) {
        if (entry === '…') continue;
        expect(entry).toBeGreaterThanOrEqual(1);
        expect(entry).toBeLessThanOrEqual(20);
      }
    }
  });
});

describe('pageCountFor', () => {
  it('rounds up partial pages', () => {
    expect(pageCountFor(10, 9)).toBe(2);
    expect(pageCountFor(18, 9)).toBe(2);
    expect(pageCountFor(19, 9)).toBe(3);
  });

  it('never returns 0 (an empty list is still "page 1 of 1")', () => {
    expect(pageCountFor(0, 9)).toBe(1);
  });
});
