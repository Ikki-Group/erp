import type { PgSelect } from 'drizzle-orm/pg-core'

export interface PaginationQuery {
  page: number
  limit: number
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface WithPaginationResult<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Calculates pagination metadata based on current page, limit, and total records
 */
export function calculatePaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    total,
    page,
    limit,
    totalPages,
  }
}

/**
 * Applies pagination to a Drizzle query builder
 * Ensures page and limit are at least 1 to prevent invalid queries
 */
export function withPagination<T extends PgSelect>(qb: T, pq: PaginationQuery) {
  const page = Math.max(1, pq.page)
  const limit = Math.max(1, pq.limit)
  const offset = (page - 1) * limit

  return qb.limit(limit).offset(offset)
}
