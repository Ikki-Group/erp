import { record } from '@elysiajs/opentelemetry'
import { asc, desc, ilike, type SQL } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'

import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

/* -------------------------------------------------------------------------- */
/*                              PAGINATED QUERY                               */
/* -------------------------------------------------------------------------- */

interface PaginateOptions<TResult> {
  /**
   * A function that receives `{ limit, offset }` and returns the data query promise.
   * This allows the caller to apply limit/offset directly on any Drizzle query type
   * (select, relational, etc.) without type compatibility issues.
   *
   * @example
   * data: ({ limit, offset }) =>
   *   db.select().from(users).where(where).orderBy(...).limit(limit).offset(offset)
   */
  data: (params: { limit: number; offset: number }) => Promise<TResult[]>

  /** Pagination parameters (page, limit). */
  pq: PaginationQuery

  /**
   * A separate count query that returns the total matching rows.
   * Pass a `db.select({ count: count() }).from(table).where(...)` query.
   */
  countQuery: Promise<{ count: number }[]>
}

/**
 * Runs data + count queries in parallel and returns paginated result.
 *
 * @example
 * const result = await paginate({
 *   data: ({ limit, offset }) =>
 *     db.select().from(users).where(where).orderBy(desc(users.updatedAt)).limit(limit).offset(offset),
 *   pq: { page: 1, limit: 10 },
 *   countQuery: db.select({ count: count() }).from(users).where(where),
 * })
 * // result.data = User[]
 * // result.meta = { total, page, limit, totalPages }
 */
export async function paginate<TResult>({
  data: dataFn,
  pq,
  countQuery,
}: PaginateOptions<TResult>): Promise<WithPaginationResult<TResult>> {
  return record('db.paginate', async () => {
    const page = Math.max(1, pq.page)
    const limit = Math.max(1, pq.limit)
    const offset = (page - 1) * limit

    // Run data + count in parallel
    const [data, countResult] = await Promise.all([dataFn({ limit, offset }), countQuery])

    const total = countResult[0]?.count ?? 0

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  })
}

/* -------------------------------------------------------------------------- */
/*                             SORTING HELPERS                                */
/* -------------------------------------------------------------------------- */

type SortDirection = 'asc' | 'desc'

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
