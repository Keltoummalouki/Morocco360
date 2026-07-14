import 'reflect-metadata';
import { SelectQueryBuilder } from 'typeorm';
import {
  buildMeta,
  clampLimit,
  clampPage,
  normalizeSortOrder,
  paginate,
} from './pagination';
import { PaginationQueryDto } from './dto/pagination-query.dto';

describe('pagination helpers', () => {
  describe('buildMeta', () => {
    it('computes meta for an empty result set', () => {
      expect(buildMeta(0, 1, 20)).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('computes totalPages by rounding up', () => {
      const meta = buildMeta(45, 1, 20);
      expect(meta.totalPages).toBe(3);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPreviousPage).toBe(false);
    });

    it('flags the last page correctly', () => {
      const meta = buildMeta(45, 3, 20);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(true);
    });

    it('flags a middle page correctly', () => {
      const meta = buildMeta(45, 2, 20);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPreviousPage).toBe(true);
    });

    it('does not report a previous page when there is no data', () => {
      // Guards the "page 2 of an empty set" edge case.
      expect(buildMeta(0, 2, 20).hasPreviousPage).toBe(false);
    });
  });

  describe('normalizeSortOrder', () => {
    it('defaults to DESC', () => {
      expect(normalizeSortOrder()).toBe('DESC');
      expect(normalizeSortOrder('nonsense')).toBe('DESC');
    });

    it('accepts asc/ASC case-insensitively', () => {
      expect(normalizeSortOrder('asc')).toBe('ASC');
      expect(normalizeSortOrder('ASC')).toBe('ASC');
    });
  });

  describe('clampPage / clampLimit', () => {
    it('clamps page to a minimum of 1', () => {
      expect(clampPage(0)).toBe(1);
      expect(clampPage(-5)).toBe(1);
      expect(clampPage(undefined)).toBe(1);
      expect(clampPage(4)).toBe(4);
    });

    it('clamps limit into [1, 100]', () => {
      expect(clampLimit(0)).toBe(1);
      expect(clampLimit(500)).toBe(100);
      expect(clampLimit(undefined)).toBe(20);
      expect(clampLimit(50)).toBe(50);
    });
  });

  describe('paginate', () => {
    function mockQb(rows: unknown[], total: number) {
      const qb = {
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([rows, total]),
      };
      return qb as unknown as SelectQueryBuilder<Record<string, unknown>> & {
        orderBy: jest.Mock;
        skip: jest.Mock;
        take: jest.Mock;
      };
    }

    it('applies skip/take from page & limit and returns data + meta', async () => {
      const qb = mockQb([{ id: 1 }, { id: 2 }], 42);
      const dto = Object.assign(new PaginationQueryDto(), {
        page: 2,
        limit: 20,
      });

      const result = await paginate(qb, dto, { defaultSort: 't.id' });

      expect(qb.skip).toHaveBeenCalledWith(20);
      expect(qb.take).toHaveBeenCalledWith(20);
      expect(qb.orderBy).toHaveBeenCalledWith('t.id', 'DESC');
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(42);
      expect(result.meta.totalPages).toBe(3);
    });

    it('only sorts by whitelisted keys, ignoring anything else', async () => {
      const qb = mockQb([], 0);
      const dto = Object.assign(new PaginationQueryDto(), {
        sortBy: 'password; DROP TABLE users',
        sortOrder: 'asc',
      });

      await paginate(qb, dto, {
        sortable: { name: 't.name' },
        defaultSort: 't.created_at',
      });

      // Falls back to defaultSort — the malicious key is never used.
      expect(qb.orderBy).toHaveBeenCalledWith('t.created_at', 'ASC');
    });

    it('uses the mapped expression when sortBy is whitelisted', async () => {
      const qb = mockQb([], 0);
      const dto = Object.assign(new PaginationQueryDto(), {
        sortBy: 'name',
        sortOrder: 'ASC',
      });

      await paginate(qb, dto, { sortable: { name: 't.name' } });

      expect(qb.orderBy).toHaveBeenCalledWith('t.name', 'ASC');
    });
  });
});
