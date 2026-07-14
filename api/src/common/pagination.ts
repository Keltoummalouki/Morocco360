import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationQueryDto } from './dto/pagination-query.dto';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginateOptions {
  /**
   * Maps an allowed `sortBy` key to the real ORDER BY expression
   * (e.g. `{ name: 'c.name', createdAt: 'c.created_at' }`). Anything not in
   * this map is ignored — this is the SQL-injection guard for `sortBy`.
   */
  sortable?: Record<string, string>;
  /** ORDER BY expression used when `sortBy` is absent or not whitelisted. */
  defaultSort?: string;
}

const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

export function normalizeSortOrder(order?: string): 'ASC' | 'DESC' {
  return order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
}

export function clampPage(page?: number): number {
  const n = Math.trunc(Number(page ?? 1));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function clampLimit(limit?: number): number {
  const n = Math.trunc(Number(limit ?? 20));
  if (!Number.isFinite(n)) return 20;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, n));
}

export function buildMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && total > 0,
  };
}

/**
 * Applies whitelisted sorting + skip/take to a QueryBuilder and returns
 * `{ data, meta }` in the shape every admin list endpoint promises.
 */
export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  dto: PaginationQueryDto,
  opts: PaginateOptions = {},
): Promise<PaginatedResult<T>> {
  const page = clampPage(dto.page);
  const limit = clampLimit(dto.limit);
  const order = normalizeSortOrder(dto.sortOrder);

  const sortExpr =
    dto.sortBy && opts.sortable?.[dto.sortBy]
      ? opts.sortable[dto.sortBy]
      : opts.defaultSort;
  if (sortExpr) {
    qb.orderBy(sortExpr, order);
  }

  qb.skip((page - 1) * limit).take(limit);

  const [data, total] = await qb.getManyAndCount();
  return { data, meta: buildMeta(total, page, limit) };
}
