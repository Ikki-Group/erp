import { asc, desc, ilike, type SQL } from 'drizzle-orm'
import type { PgColumn, PgSelect } from 'drizzle-orm/pg-core'

import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

/* -------------------------------------------------------------------------- */
/*                              PAGINATED QUERY                               */
/* -------------------------------------------------------------------------- */

interface PaginateOptions {
  /** The base Drizzle select query (before applying limit/offset). */

  query: PgSelect
  /** Pagination parameters (page, limit). */
  pq: PaginationQuery
  /**
   * A separate count query that returns the total matching rows.
   * Pass a `db.select({ count: count() }).from(table).where(...)` query.
   */
  countQuery: Promise<{ count: number }[]>
}

/**
 * Applies pagination (limit + offset) to a Drizzle query and returns
 * both the data and pagination metadata.
 *
 * @example
 * const where = search ? ilike(users.email, `%${search}%`) : undefined
 *
 * const result = await paginate({
 *   query: db.select().from(users).where(where).orderBy(desc(users.updatedAt)),
 *   pq: { page: 1, limit: 10 },
 *   countQuery: db.select({ count: count() }).from(users).where(where),
 * })
 * // result.data = User[]
 * // result.meta = { total, page, limit, totalPages }
 */
export async function paginate<TResult>({
  query,
  pq,
  countQuery,
}: PaginateOptions): Promise<WithPaginationResult<TResult>> {
  const page = Math.max(1, pq.page)
  const limit = Math.max(1, pq.limit)
  const offset = (page - 1) * limit

  // Run data + count in parallel
  const [data, countResult] = await Promise.all([query.limit(limit).offset(offset), countQuery])

  const total = countResult[0]?.count ?? 0

  return {
    data: data as unknown as TResult[],
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/* -------------------------------------------------------------------------- */
/*                             SORTING HELPERS                                */
/* -------------------------------------------------------------------------- */

export type SortDirection = 'asc' | 'desc'

/**
 * Returns a Drizzle orderBy clause for the given column and direction.
 *
 * @example
 * const orderBy = sortBy(users.updatedAt, 'desc')
 * db.select().from(users).orderBy(orderBy)
 */
export function sortBy(column: PgColumn, direction: SortDirection = 'desc') {
  return direction === 'asc' ? asc(column) : desc(column)
}

/* -------------------------------------------------------------------------- */
/*                            SEARCH / FILTER HELPERS                         */
/* -------------------------------------------------------------------------- */

/**
 * Creates an `ILIKE` filter condition if the search term is non-empty.
 * Returns `undefined` if no search term, safe to pass into `.where()`.
 *
 * @example
 * const where = searchFilter(users.email, query.search)
 * db.select().from(users).where(where)
 */
export function searchFilter(column: PgColumn, search?: string): SQL | undefined {
  if (!search?.trim()) return undefined
  return ilike(column, `%${search.trim()}%`)
}
